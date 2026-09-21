"use client";

// 한 턴의 파이프라인 (설계서 v3 §8): 관문 → 답변기 → 코치(배지·칩·역질문) → 기록·리포트
import { analyze } from "./analyzer";
import { read, uid, update, write } from "./db";
import { chipsFor, deepQuestion, deepReply, generateAnswer, gradeAnswer, refineRQ, roleOf } from "./engine";
import { formatIntro } from "./draft";
import { buildWindowReport, reportsOf } from "./report";
import { buildRQ, elementAdd, elementById, pickElement } from "./rq";
import { seedReports } from "./seed";
import type { ChipKind, FormatKey, LensKey, Message, PackKey, Project, ReverseQuestion, TurnScript } from "./types";

type NewMessage = Message extends infer M ? (M extends Message ? Omit<M, "id" | "createdAt"> : never) : never;

export function pushMessage(m: NewMessage): string {
  const id = uid("m");
  update("messages", (prev) => [...prev, { ...m, id, createdAt: Date.now() } as Message]);
  return id;
}

export function createProject(input: { name: string; desc: string; emoji: string; packs: PackKey[]; format?: FormatKey }): Project {
  const now = Date.now();
  const project: Project = { id: uid("prj"), ...input, rhythm: 2, answerOnly: false, counter: 0, barIndex: 0, laterStreak: 0, createdAt: now, updatedAt: now };
  update("projects", (prev) => [...prev, project]);
  update("state", (s) => ({ ...s, currentProjectId: project.id }));
  const name = read("profile")?.name ?? "";
  pushMessage({
    projectId: project.id,
    kind: "coach",
    md: `안녕${name ? `, ${name}` : ""}! **${project.name}** 얘기를 같이 해보자.${project.format ? `\n\n${formatIntro(project.format)}` : ""}\n\n뭐든 물어봐. 먼저 최선의 답을 줄게. 그리고 두 번 묻고 나면 내가 한 번 되물을게 — 입력창 옆 점 ●○ 이 그 리듬이야.`,
  });
  return project;
}

export function patchProject(id: string, patch: Partial<Project>) {
  update("projects", (prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
}

function patchRQ(id: string, patch: Partial<ReverseQuestion>) {
  update("rqs", (prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
}

const INVALID_REPLY = {
  smalltalk: "응! 또 궁금한 게 생기면 바로 물어봐.",
  howto: "리포트 · 우주 배경 · 설정은 왼쪽 위 **☰ 메뉴**에 있어. 생각 노트와 가이드는 **설정** 안에 있어.",
  duplicate: "방금이랑 같은 질문이네. 답이 아쉬웠다면 **어디가** 아쉬웠는지 한 줄만 보태 줄래? 그러면 다른 답을 할 수 있어.",
  emotional: "말해줘서 고마워. 그런 마음이 드는 건 이상한 게 아니야. 여기서는 평가도 질문도 잠깐 내려놓을게.\n\n혼자 감당하기 버거우면 믿을 만한 어른이나 **청소년상담전화 1388**(24시간, 문자·전화)에 얘기해 봐. 나도 여기 있을게.",
};

export async function runTurn(projectId: string, text: string, chipUsed: ChipKind | null, onAnswer: (messageId: string) => void, script?: TurnScript, images: string[] = []) {
  const project = read("projects").find((p) => p.id === projectId);
  if (!project) return;
  const profile = read("profile");
  const before = read("messages").filter((m) => m.projectId === projectId);
  const projectTurns = read("turns").filter((t) => t.projectId === projectId);

  pushMessage({ projectId, kind: "user", text, chip: chipUsed ?? undefined, images: images.length ? images : undefined });
  const analysis = analyze(text, projectTurns, project.desc);

  if (!analysis.valid) {
    pushMessage({ projectId, kind: "coach", md: INVALID_REPLY[analysis.invalidReason ?? "smalltalk"] });
    return;
  }

  // 역질문을 보는 중 새 질문 → 미응답은 [나중에]로 넘긴다 (§3.3)
  const hadOpen = read("rqs").some((r) => r.projectId === projectId && r.status === "open");
  if (hadOpen) update("rqs", (prev) => prev.map((r) => (r.projectId === projectId && r.status === "open" ? { ...r, status: "later" } : r)));

  const result = await generateAnswer(text, analysis, project, profile, before, script, images);
  if (result.emotional) {
    pushMessage({ projectId, kind: "coach", md: result.md });
    return;
  }

  const state = read("state");
  const windowIndex = reportsOf(read("reports"), projectId, project.name).length + 1; // 리포트는 프로젝트마다 1번째부터 센다
  const now = Date.now();
  const role = roleOf(result.analysis.openness);
  const turn = {
    id: uid("t"), projectId, n: state.validCount + 1, windowIndex, barIndex: project.barIndex,
    question: text, analysis: result.analysis, role, chipUsed, source: result.source, createdAt: now,
  };
  update("turns", (prev) => [...prev, turn]);

  const answerId = pushMessage({
    projectId, kind: "answer", md: result.md, turnId: turn.id, role, roleReason: result.roleReason, riskNote: result.riskNote,
    assumptions: result.assumptions, yourCall: result.yourCall, chips: script?.chips ?? chipsFor(result.analysis, projectTurns.slice(-4), project), analysis: result.analysis, source: result.source,
  });
  onAnswer(answerId);

  // 리듬 (§3.1) — 유효 질문이 rhythm개 쌓이면 역질문 1개
  let counter = project.counter + 1;
  let barIndex = project.barIndex;
  const laterStreak = hadOpen ? project.laterStreak + 1 : project.laterStreak;
  if (counter >= project.rhythm) {
    const allTurns = read("turns");
    const bar = allTurns.filter((t) => t.projectId === projectId).slice(-project.rhythm);
    let picked = pickElement(bar, project, allTurns, read("rqs"), windowIndex);
    const forced = script?.rq ? elementById(script.rq.element) : undefined;
    if (script?.rq && forced) picked = { element: forced, form: script.rq.form, pack: null, scores: { [forced.id]: 1 } };
    counter = 0;
    barIndex += 1;
    if (picked) {
      let rq = buildRQ(picked, turn, { id: uid("rq"), now }, windowIndex, project.barIndex);
      const deposit = project.answerOnly || result.analysis.urgent; // [⚡ 답만] · 급하다는 신호 → 적립
      if (deposit) {
        update("rqs", (prev) => [...prev, { ...rq, status: "later" }]);
      } else {
        const msgs = read("messages").filter((m) => m.projectId === projectId);
        const pairs = bar.map((t) => {
          const a = msgs.find((m) => m.kind === "answer" && m.turnId === t.id);
          return { q: t.question, a: a && a.kind === "answer" ? a.md.slice(0, 1200) : "" };
        });
        if (script?.rq) rq = { ...rq, question: script.rq.question, hint: script.rq.hint ?? rq.hint, options: script.rq.options ?? rq.options };
        else rq = await refineRQ(rq, pairs, project, profile, picked.element.name);
        update("rqs", (prev) => [...prev, rq]);
        pushMessage({ projectId, kind: "rq", rqId: rq.id });
      }
    }
    // 물을 게 마땅치 않으면 그 마디는 건너뛴다 — 카운터만 리셋 (§4.4)
  }
  patchProject(projectId, { counter, barIndex, laterStreak, updatedAt: now });

  if (laterStreak >= 3) {
    patchProject(projectId, { laterStreak: 0 });
    pushMessage({
      projectId, kind: "coach", md: "요즘 바쁜 것 같아. 되묻는 간격을 좀 늦출까?",
      actions: [{ label: "2문 1역 그대로", action: "rhythm:2" }, { label: "3문 1역", action: "rhythm:3" }, { label: "4문 1역", action: "rhythm:4" }],
    });
  }

  // 10문 리포트 (§7) — 이 프로젝트의 질문이 10개 쌓일 때마다 한 장
  const allTurns = read("turns");
  const mine = allTurns.filter((t) => t.projectId === projectId);
  const inWindow = mine.filter((t) => t.windowIndex === windowIndex);
  const bump = { validCount: state.validCount + 1, windowCount: inWindow.length % 10 };
  if (script?.report === "seed7") {
    const seeded = seedReports(Date.now())[6];
    write("reports", [...read("reports"), { ...seeded, opened: false }]);
    write("state", { ...read("state"), ...bump, windowCount: 0 });
  } else if (inWindow.length >= 10) {
    const reports = read("reports");
    const prev = reportsOf(reports, projectId, project.name).pop() ?? null;
    const index = Math.max(0, ...reports.map((r) => r.index)) + 1;
    const report = buildWindowReport(index, windowIndex, projectId, inWindow, read("rqs").filter((r) => r.projectId === projectId && r.windowIndex === windowIndex), mine, read("projects"), prev, Date.now());
    write("reports", [...reports, report]);
    write("state", { ...read("state"), ...bump });
  } else {
    write("state", { ...read("state"), ...bump });
  }
}

/* ---------- 역질문에 답하기 ---------- */

export async function answerRQ(rqId: string, text: string, optionScore: number | null, inChat: boolean, scripted?: { score: number; reason: string; feedback: string }) {
  const rq = read("rqs").find((r) => r.id === rqId);
  if (!rq) return;
  const project = read("projects").find((p) => p.id === rq.projectId);
  if (!project) return;
  const answerMsg = read("messages").find((m) => m.kind === "answer" && m.turnId === rq.turnId);
  const lastMd = answerMsg && answerMsg.kind === "answer" ? answerMsg.md : "";
  const fb = scripted ?? await gradeAnswer(rq, text, optionScore, lastMd, elementAdd(rq.element), project, read("profile"));
  patchRQ(rqId, { status: "answered", answer: text, score: fb.score, reason: fb.reason, feedback: fb.feedback, answeredAt: Date.now() });
  patchProject(project.id, { laterStreak: 0 });
  if (inChat) pushMessage({ projectId: project.id, kind: "coach", md: fb.feedback });
}

export function idkRQ(rqId: string, inChat: boolean) {
  const rq = read("rqs").find((r) => r.id === rqId);
  if (!rq) return;
  const feedback = `괜찮아, 모른다고 말하는 게 제일 정직한 재료야. ${elementById(rq.element)?.coachView ?? rq.coachView} 거기서부터 생각해 보면 돼.`;
  patchRQ(rqId, { status: "answered", answer: "잘 모르겠어", score: 0, reason: "'잘 모르겠어'를 고름", feedback, answeredAt: Date.now() });
  update("state", (s) => ({ ...s, idkCount: s.idkCount + 1 }));
  patchProject(rq.projectId, { laterStreak: 0 });
  if (inChat) pushMessage({ projectId: rq.projectId, kind: "coach", md: feedback });
}

export function laterRQ(rqId: string) {
  const rq = read("rqs").find((r) => r.id === rqId);
  if (!rq) return;
  patchRQ(rqId, { status: "later" });
  const project = read("projects").find((p) => p.id === rq.projectId);
  if (project) patchProject(project.id, { laterStreak: project.laterStreak + 1 });
}

export function hintRQ(rqId: string) {
  update("rqs", (prev) => prev.map((r) => (r.id === rqId ? { ...r, hintStage: Math.min(3, r.hintStage + 1) } : r)));
}

// [🙋 나한테 물어봐] — 리듬과 무관하게 역질문 1개. 카운터는 그대로 (§3.3)
export async function askMe(projectId: string): Promise<boolean> {
  const project = read("projects").find((p) => p.id === projectId);
  const allTurns = read("turns");
  const bar = allTurns.filter((t) => t.projectId === projectId).slice(-2);
  if (!project || !bar.length) return false;
  const windowIndex = reportsOf(read("reports"), projectId, project.name).length + 1;
  const picked = pickElement(bar, project, allTurns, read("rqs"), windowIndex);
  if (!picked) {
    pushMessage({ projectId, kind: "coach", md: "지금은 억지로 물을 게 없어. 조금 더 진행하고 다시 눌러 줘." });
    return false;
  }
  const rq = buildRQ(picked, bar[bar.length - 1], { id: uid("rq"), now: Date.now() }, windowIndex, project.barIndex);
  update("rqs", (prev) => [...prev, rq]);
  pushMessage({ projectId, kind: "rq", rqId: rq.id });
  return true;
}

/* ---------- 심화 (§5) — 2문 1역 카운터에 들어가지 않는다 ---------- */

export function deepOpen(projectId: string) {
  pushMessage({ projectId, kind: "deepPick" });
}

export function deepAsk(project: Project, lens: LensKey, level: number, customQuestion?: string | null) {
  pushMessage({ projectId: project.id, kind: "deepQ", lens, level, md: customQuestion ? `**${level >= 3 ? "확장 질문" : `L${level + 1}`}**\n\n${customQuestion}` : deepQuestion(lens, level, project) });
}

export async function deepAnswer(project: Project, lens: LensKey, level: number, text: string): Promise<string | null> {
  pushMessage({ projectId: project.id, kind: "user", text, deep: true });
  const question = [...read("messages")].reverse().find((m) => m.kind === "deepQ" && m.projectId === project.id);
  update("notes", (prev) => [...prev, { id: uid("note"), projectId: project.id, lens, level, question: question && question.kind === "deepQ" ? question.md : "", text, createdAt: Date.now() }]);
  const { reply, next } = await deepReply(lens, level, text, project, read("profile"));
  const done = level >= 3;
  pushMessage({
    projectId: project.id, kind: "coach",
    md: done ? `${reply}\n\n이 생각은 **생각 노트**에 모아 뒀어. 이제 하던 걸로 돌아가자.` : reply,
    actions: done ? undefined : [{ label: level >= 2 ? "🔁 프로젝트로 돌려놓기" : "⬇️ 한 단 더 깊이", action: "deep:next" }, { label: "🔄 다른 렌즈로", action: "deep:lens" }, { label: "✋ 여기까지", action: "deep:stop" }],
  });
  return next;
}
