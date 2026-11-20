// 질문 하나가 지나가는 길 — 관문(분석기) → 하루 한도 → Claude(실패 시 로컬 답 카드) → 저장
// 브라우저 쪽 원본: frontend/src/lib/actions.ts 의 runTurn
import roles from "@front/data/roles.json";
import { analyze } from "@front/lib/analyzer";
import { applyRQ, rqInput } from "@front/lib/grade";
import { buildWindowReport } from "@front/lib/report";
import { applyReport, reportInput } from "@front/lib/reportAi";
import { buildRQ, elementById, pickElement } from "@front/lib/rq";
import type { Analysis, Openness, Project, ReverseQuestion, RoleKey, Turn, WindowReport } from "@front/lib/types";
import formats from "@front/data/formats.json";
import { db, FieldValue, kstDay, paths } from "../lib/firebase";
import { ApiError, notFound } from "../lib/http";
import type { AuthedUser } from "../lib/users";
import { askClaude, askCoach, type ClaudeResult, type CoachResult } from "../llm/claude";
import { localAnswer } from "../llm/local";
import { getLlmSettings, type LlmSettings } from "../llm/settings";
import type { ProjectDoc } from "./projects";

// actions.ts 의 INVALID_REPLY 와 같은 말
const INVALID_REPLY: Record<NonNullable<Analysis["invalidReason"]>, string> = {
  smalltalk: "응! 또 궁금한 게 생기면 바로 물어봐.",
  howto: "리포트 · 우주 배경 · 설정은 왼쪽 위 **☰ 메뉴**에 있어. 생각 노트와 가이드는 **설정** 안에 있어.",
  duplicate: "방금이랑 같은 질문이네. 답이 아쉬웠다면 **어디가** 아쉬웠는지 한 줄만 보태 줄래? 그러면 다른 답을 할 수 있어.",
  emotional:
    "말해줘서 고마워. 그런 마음이 드는 건 이상한 게 아니야. 여기서는 평가도 질문도 잠깐 내려놓을게.\n\n혼자 감당하기 버거우면 믿을 만한 어른이나 **청소년상담전화 1388**(24시간, 문자·전화)에 얘기해 봐. 나도 여기 있을게.",
};

export const roleOf = (o: Openness): RoleKey | null => (o === "NA" ? null : (roles.openness[o].role as RoleKey));

interface StoredMessage {
  kind: string;
  text?: string;
  md?: string;
  deep?: boolean;
  createdAt: number;
}

function historyOf(messages: StoredMessage[], max: number) {
  const out: { role: "user" | "assistant"; content: string }[] = [];
  for (const m of messages) {
    if (m.kind === "user" && !m.deep && m.text) out.push({ role: "user", content: m.text });
    if (m.kind === "answer" && m.md) out.push({ role: "assistant", content: m.md });
  }
  const tail = max > 0 ? out.slice(-max) : [];
  while (tail.length && tail[0].role !== "user") tail.shift(); // API 규칙: 첫 메시지는 user
  return tail;
}

export function contextOf(user: AuthedUser, project: ProjectDoc) {
  const d = user.doc;
  const f = project.format ? (formats.formats as Record<string, { emoji: string; name: string }>)[project.format] : null;
  return [
    `학생: ${d.nickname} (${d.grade || "학년 모름"}) · 관심: ${d.interests.join(", ") || "없음"}`,
    `프로젝트: ${project.name}${project.desc ? ` — ${project.desc}` : ""}`,
    f ? `형식: ${f.emoji} ${f.name}` : "",
    project.checks && Object.keys(project.checks).length
      ? `학생이 정한 것: ${Object.entries(project.checks).map(([k, v]) => `${k}=${v}`).join(" · ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function reserveTurn(uid: string, limit: number) {
  const ref = paths.usage(uid, kstDay());
  await db.runTransaction(async (tx) => {
    const used = ((await tx.get(ref)).data()?.turns as number) ?? 0;
    if (used >= limit) throw new ApiError(429, "daily_limit", `오늘 질문 ${limit}개를 다 썼어요. 내일 다시 만나요!`, { limit, used });
    tx.set(ref, { day: kstDay(), turns: used + 1, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });
}

/** 코치 작업(되묻기 · 채점) 토큰도 그날 사용량에 더한다 */
export async function addTokens(uid: string, r: CoachResult<unknown>) {
  if (!r.ok) return;
  await paths.usage(uid, kstDay()).set({ inputTokens: FieldValue.increment(r.usage.inputTokens), outputTokens: FieldValue.increment(r.usage.outputTokens) }, { merge: true });
}

export async function logCall(uid: string, projectId: string, model: string, r: ClaudeResult | CoachResult<unknown>, task: "answer" | "rq" | "feedback" | "report" | "deep" = "answer") {
  if (!r.ok && (r.reason === "disabled" || r.reason === "no_key")) return; // 실제로 부르지 않은 것은 남기지 않는다
  await paths.llmCalls().add({
    uid,
    projectId,
    task,
    model: r.ok ? r.model : model,
    ok: r.ok,
    reason: r.ok ? null : r.reason,
    message: r.ok ? null : r.message,
    ...(r.ok ? r.usage : {}),
    ms: r.ms,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export interface TurnInput {
  user: AuthedUser;
  projectId: string;
  text: string;
  images: string[];
  apiKey: string | undefined;
  /** 즉답 스트리밍 — analysis(분석) → delta(답 글자 조각) … 순서로 불린다. 최종 결과는 함수가 돌려주는 값 */
  onEvent?: (event: "analysis" | "delta", data: unknown) => void;
}

export async function runTurn({ user, projectId, text, images, apiKey, onEvent }: TurnInput) {
  const { uid } = user;
  const projectRef = paths.project(uid, projectId);
  const pSnap = await projectRef.get();
  if (!pSnap.exists) throw notFound("프로젝트");
  const project = pSnap.data() as ProjectDoc;
  const settings = await getLlmSettings();

  const [turnSnap, msgSnap] = await Promise.all([
    paths.turns(uid, projectId).orderBy("createdAt", "desc").limit(4).get(),
    paths.messages(uid, projectId).orderBy("createdAt", "desc").limit(Math.max(settings.historyMessages * 2, 4)).get(),
  ]);
  const recentTurns = turnSnap.docs.map((d) => d.data() as Turn).reverse();
  const recentMessages = msgSnap.docs.map((d) => d.data() as StoredMessage).reverse();

  const now = Date.now();
  const userMessage = { kind: "user", text, imageCount: images.length || undefined, createdAt: now };
  const analysis = analyze(text, recentTurns, project.desc ?? "");

  // 1) 관문 — 잡담 · 사용법 · 같은 질문 · 마음이 힘든 신호는 Claude 를 부르지 않고 코치가 짧게 답한다
  if (!analysis.valid) {
    const reason = analysis.invalidReason ?? "smalltalk";
    const coach = { kind: "coach", md: INVALID_REPLY[reason], createdAt: now + 1 };
    const batch = db.batch();
    batch.set(paths.messages(uid, projectId).doc(), userMessage);
    const coachRef = paths.messages(uid, projectId).doc();
    batch.set(coachRef, coach);
    batch.update(projectRef, { updatedAt: now });
    await batch.commit();
    return { outcome: reason === "emotional" ? "emotional" : "gated", reason, coachMessage: { id: coachRef.id, ...coach } };
  }

  // 2) 하루 한도
  await reserveTurn(uid, user.doc.dailyLimit ?? settings.dailyTurnLimit);
  const hadOpen = await skipOpenAskbacks(uid, projectId);
  onEvent?.("analysis", { analysis, model: settings.enabled && apiKey ? settings.tasks.answer.model : null });

  // 3) Claude → 실패하면 로컬 답 카드
  const claude = await askClaude({
    apiKey,
    settings,
    question: text,
    context: contextOf(user, project),
    history: historyOf(recentMessages, settings.historyMessages),
    images,
    onText: onEvent ? (piece) => onEvent("delta", { text: piece }) : undefined,
  });
  await logCall(uid, projectId, settings.tasks.answer.model, claude);

  let answer: { md: string; assumptions: string[]; yourCall: string[]; riskNote?: string; roleReason: string };
  let merged: Analysis = analysis;
  let source: "claude" | "local";
  if (claude.ok) {
    const out = claude.out;
    if (out.emotional) {
      const coach = { kind: "coach", md: out.answer_md, createdAt: now + 1 };
      const batch = db.batch();
      batch.set(paths.messages(uid, projectId).doc(), userMessage);
      const coachRef = paths.messages(uid, projectId).doc();
      batch.set(coachRef, coach);
      await batch.commit();
      return { outcome: "emotional", reason: "emotional", coachMessage: { id: coachRef.id, ...coach } };
    }
    merged = { ...analysis, openness: out.openness, six: out.six, stage: out.stage, concepts: out.concepts.length ? out.concepts.slice(0, 3) : analysis.concepts };
    answer = { md: out.answer_md, assumptions: out.assumptions, yourCall: out.your_call, riskNote: out.risk_note ?? undefined, roleReason: out.role_reason };
    source = "claude";
  } else if (settings.fallbackToLocal) {
    const local = await localAnswer(text, analysis, project);
    const role = roleOf(analysis.openness);
    answer = { ...local, roleReason: role ? roles.roles[role].reason : "" };
    if (images.length) answer.assumptions = ["사진 속 내용은 보지 못했어 — 글로 쓴 것만 읽었어", ...answer.assumptions];
    source = "local";
    onEvent?.("delta", { text: answer.md });
  } else {
    throw new ApiError(503, "llm_unavailable", claude.message, { reason: claude.reason });
  }

  // 4) 저장 — 턴 번호는 프로젝트 문서를 잠그고 매긴다
  const role = roleOf(merged.openness);
  const turnRef = paths.turns(uid, projectId).doc();
  const answerRef = paths.messages(uid, projectId).doc();
  const turn = await db.runTransaction(async (tx) => {
    const p = (await tx.get(projectRef)).data() as ProjectDoc;
    const n = (p.turnCount ?? 0) + 1;
    const t = {
      n,
      windowIndex: Math.floor((n - 1) / 10) + 1, // 10문마다 리포트 1장
      barIndex: p.barIndex ?? 0,
      question: text,
      analysis: merged,
      role,
      chipUsed: null,
      source,
      model: claude.ok ? claude.model : null,
      createdAt: now,
    };
    tx.set(paths.messages(uid, projectId).doc(), userMessage);
    tx.set(turnRef, t);
    tx.set(answerRef, {
      kind: "answer",
      md: answer.md,
      turnId: turnRef.id,
      role,
      roleReason: answer.roleReason,
      riskNote: answer.riskNote,
      assumptions: answer.assumptions,
      yourCall: answer.yourCall,
      chips: [],
      analysis: merged,
      source,
      createdAt: now + 1,
    });
    tx.update(projectRef, { turnCount: n, counter: (p.counter ?? 0) + 1, updatedAt: now });
    tx.update(paths.user(uid), { "stats.turns": FieldValue.increment(1) });
    if (claude.ok) {
      tx.set(
        paths.usage(uid, kstDay()),
        { inputTokens: FieldValue.increment(claude.usage.inputTokens), outputTokens: FieldValue.increment(claude.usage.outputTokens) },
        { merge: true },
      );
    }
    return { id: turnRef.id, ...t };
  });

  // 5) 리듬 — 유효 질문이 rhythm 개(기본 2) 쌓이면 되묻기 1개 (브라우저 actions.ts 의 runTurn 과 같은 규칙)
  const askback = await rhythmStep({ user, projectId, turn, analysis: merged, hadOpen, now, apiKey, settings });

  // 6) 10문 리포트 — 이 프로젝트의 질문이 10개 쌓일 때마다 한 장 (숫자는 규칙, 문장 세 개만 Claude)
  const report = turn.n % 10 === 0 ? await reportStep({ user, projectId, windowIndex: turn.windowIndex, now, apiKey, settings }) : null;

  return {
    outcome: "answered",
    turn,
    answer: { id: answerRef.id, ...answer, role, roleLabel: role ? roles.roles[role].name : null },
    askback,
    report,
    source,
    model: claude.ok ? claude.model : null,
    usage: claude.ok ? claude.usage : null,
    timing: { totalMs: Date.now() - now, firstTextMs: claude.ok ? claude.firstTextMs : null },
    fallbackReason: claude.ok ? null : { reason: claude.reason, message: claude.message },
  };
}

/** 새 질문이 오면 아직 답하지 않은 되묻기는 [나중에]로 넘긴다 (설계서 §3.3) */
async function skipOpenAskbacks(uid: string, projectId: string) {
  const open = await paths.askbacks(uid, projectId).where("status", "==", "open").get();
  if (open.empty) return false;
  const batch = db.batch();
  open.docs.forEach((d) => batch.update(d.ref, { status: "later" }));
  await batch.commit();
  return true;
}

/**
 * 2문 1역 — counter 가 rhythm 에 닿으면 되묻기를 고른다.
 *   [⚡ 답만] · 급하다는 신호 → 묻지 않고 적립(status: later)
 *   물을 게 마땅치 않으면 → 카운터만 리셋 (억지 질문 금지)
 * 되묻기 문장은 요소 템플릿(elements.json · formats.json)으로 만든다.
 */
interface RhythmInput {
  user: AuthedUser;
  projectId: string;
  turn: { id: string; n: number; windowIndex: number; question: string; createdAt: number };
  analysis: Analysis;
  hadOpen: boolean;
  now: number;
  apiKey: string | undefined;
  settings: LlmSettings;
}

async function rhythmStep({ user, projectId, turn, analysis, hadOpen, now, apiKey, settings }: RhythmInput) {
  const { uid } = user;
  const projectRef = paths.project(uid, projectId);
  const p = (await projectRef.get()).data() as ProjectDoc;
  const rhythm = p.rhythm ?? 2;
  const laterStreak = hadOpen ? (p.laterStreak ?? 0) + 1 : p.laterStreak ?? 0;
  if ((p.counter ?? 0) < rhythm) {
    if (laterStreak !== p.laterStreak) await projectRef.update({ laterStreak });
    return null;
  }

  const [tSnap, rSnap] = await Promise.all([paths.turns(uid, projectId).orderBy("createdAt", "asc").get(), paths.askbacks(uid, projectId).orderBy("createdAt", "asc").get()]);
  const allTurns = tSnap.docs.map((d) => ({ id: d.id, projectId, ...d.data() }) as Turn);
  const rqs = rSnap.docs.map((d) => ({ id: d.id, projectId, ...d.data() }) as ReverseQuestion);
  const project = { id: projectId, ...p } as unknown as Project;
  const picked = pickElement(allTurns.slice(-rhythm), project, allTurns, rqs, turn.windowIndex);

  const batch = db.batch();
  batch.update(projectRef, { counter: 0, barIndex: (p.barIndex ?? 0) + 1, laterStreak });
  let out: (ReverseQuestion & { delivered: boolean }) | null = null;
  if (picked) {
    const ref = paths.askbacks(uid, projectId).doc();
    const last = { ...(allTurns.find((t) => t.id === turn.id) ?? allTurns[allTurns.length - 1]), projectId };
    let rq = buildRQ(picked, last, { id: ref.id, now: now + 2 }, turn.windowIndex, p.barIndex ?? 0);
    const deposit = Boolean(p.answerOnly || analysis.urgent);
    let source: "claude" | "local" = "local";
    let model: string | null = null;
    // 띄울 되묻기만 Claude 로 다듬는다 (적립은 나중에 꺼낼 때 템플릿으로 충분) — 실패하면 템플릿 그대로
    if (!deposit) {
      const bar = allTurns.slice(-rhythm);
      const answers = await paths.messages(uid, projectId).where("turnId", "in", bar.map((t) => t.id)).get();
      const pairs = bar.map((t) => ({ q: t.question, a: String(answers.docs.find((d) => d.get("turnId") === t.id)?.get("md") ?? "").slice(0, 1200) }));
      const r = await askCoach("rq", { apiKey, settings, input: rqInput(rq, pairs, elementById(rq.element)?.name ?? ""), context: contextOf(user, p) });
      await Promise.all([logCall(uid, projectId, settings.tasks.coach.model, r, "rq"), addTokens(uid, r)]);
      if (r.ok) {
        rq = applyRQ(rq, r.out);
        source = "claude";
        model = r.model;
      }
    }
    const saved = { ...rq, status: deposit ? ("later" as const) : ("open" as const), source, model };
    const { id: _id, projectId: _pid, ...doc } = saved;
    batch.set(ref, doc);
    batch.update(paths.user(uid), { "stats.askbacks": FieldValue.increment(1) });
    if (!deposit) batch.set(paths.messages(uid, projectId).doc(), { kind: "rq", rqId: ref.id, createdAt: now + 2 });
    out = { ...saved, delivered: !deposit };
  }
  await batch.commit();
  return out;
}

/**
 * 10문 리포트 한 장 — report.ts 의 buildWindowReport(규칙) 로 숫자를 만들고,
 * 제목 · 베스트 질문 이유 · 다음 미션 문장만 Claude(report 태스크) 가 다시 쓴다. 실패하면 규칙 문장 그대로.
 * 문서 id 는 seq(그 프로젝트의 몇 번째 리포트) — 같은 리포트를 두 번 만들지 않는다.
 */
async function reportStep({ user, projectId, windowIndex, now, apiKey, settings }: { user: AuthedUser; projectId: string; windowIndex: number; now: number; apiKey: string | undefined; settings: LlmSettings }) {
  const { uid } = user;
  const ref = paths.reports(uid, projectId).doc(String(windowIndex));
  if ((await ref.get()).exists) return null;
  const [pSnap, tSnap, rSnap, prevSnap] = await Promise.all([
    paths.project(uid, projectId).get(),
    paths.turns(uid, projectId).orderBy("createdAt", "asc").get(),
    paths.askbacks(uid, projectId).where("windowIndex", "==", windowIndex).get(),
    windowIndex > 1 ? paths.reports(uid, projectId).doc(String(windowIndex - 1)).get() : null,
  ]);
  const project = { id: projectId, ...pSnap.data() } as unknown as Project;
  const all = tSnap.docs.map((d) => ({ id: d.id, projectId, ...d.data() }) as Turn);
  const inWindow = all.filter((t) => t.windowIndex === windowIndex);
  const rqs = rSnap.docs.map((d) => ({ id: d.id, projectId, ...d.data() }) as ReverseQuestion).sort((a, b) => a.createdAt - b.createdAt);
  const prev = prevSnap?.exists ? (prevSnap.data() as WindowReport) : null;

  // index — 회원 전체에서 유일한 리포트 번호 (브라우저의 "여는 열쇠"와 같은 뜻)
  const index = await db.runTransaction(async (tx) => {
    const u = await tx.get(paths.user(uid));
    const n = ((u.get("stats.reports") as number) ?? 0) + 1;
    tx.update(paths.user(uid), { "stats.reports": n });
    return n;
  });
  let report: WindowReport = { ...buildWindowReport(index, windowIndex, projectId, inWindow, rqs, all, [project], prev, now + 3), writtenBy: "local" };
  let model: string | null = null;

  const r = await askCoach("report", { apiKey, settings, input: reportInput(report, inWindow, project), context: contextOf(user, pSnap.data() as ProjectDoc) });
  await Promise.all([logCall(uid, projectId, settings.tasks.coach.model, r, "report"), addTokens(uid, r)]);
  if (r.ok) {
    report = applyReport(report, r.out);
    model = r.model;
  }

  const saved = { ...report, model };
  const batch = db.batch();
  batch.set(ref, saved);
  batch.set(paths.messages(uid, projectId).doc(), { kind: "coach", md: `📄 **${project.name} · ${windowIndex}번째 리포트**가 나왔어 — “${report.headline}”`, reportSeq: windowIndex, createdAt: now + 3 });
  await batch.commit();
  return { seq: windowIndex, ...saved };
}
