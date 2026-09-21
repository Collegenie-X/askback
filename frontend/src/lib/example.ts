"use client";

// 예시 프로젝트 불러오기 — 시나리오 JSON 한 장(src/data/scenarios/*.json)을 클릭 없이 한꺼번에 대화로 펼친다.
// 질문 · 답(+열린 되묻기) · 역질문과 학생의 답 · 심화 · 기획서 · 10문 리포트가 전부 채워진 채로 열린다.
import { answerMarkdown, planMarkdown, type Scenario, type Turn as ScriptTurn } from "@/components/demo/types";
import { clearAll, write } from "./db";
import { buildTextStats } from "./report";
import type { Analysis, Form, LensKey, Message, Mission, Note, Openness, PackKey, Project, ReverseQuestion, RoleKey, SixKey, Turn, WindowReport } from "./types";

const MIN = 60000;
const PACK_OF: Record<string, PackKey> = { M: "maker", S: "share", C: "collab", A: "ai" };
const ROLE_OF: Record<string, RoleKey> = { O1: "typist", O2: "coder", O3: "engineer", O4: "architect", O5: "encyclopedia" };
const SIX: SixKey[] = ["why", "context", "constraint", "criteria", "verify", "discard"];
const LEVEL_OF: Record<string, number> = { L1: 0, L2: 1, L3: 2, 확장: 3 };

function analysisOf(t: ScriptTurn): Analysis {
  const six = Object.fromEntries(SIX.map((k) => [k, t.six?.[k] ? 1 : 0])) as Record<SixKey, number>;
  return {
    valid: true,
    six,
    openness: t.openness as Openness,
    contextLoad: SIX.filter((k) => six[k]).length,
    stage: t.openness === "O1" || t.openness === "O2" ? "구현" : t.openness === "O5" ? "탐색" : "설계",
    urgent: false,
    signals: [],
    concepts: [],
  };
}

export function loadExample(s: Scenario) {
  clearAll();
  const count = s.turns.length;
  const start = Date.now() - (count * 9 + 20) * MIN;
  const projectId = `prj_example_${s.id}`;
  const reportSpan = Math.max(0, s.window.size - s.window.startCount); // 리포트는 답 10개가 쌓였을 때 1장 — 그 뒤 질문은 다음 판
  const windowOf = (i: number) => 1 + (i >= reportSpan ? 1 : 0); // 리포트는 프로젝트마다 1번째부터 — 예시도 1번째 리포트다
  const rqCount = s.turns.filter((t) => t.reverseQuestion).length;

  const messages: Message[] = [];
  const turns: Turn[] = [];
  const rqs: ReverseQuestion[] = [];
  let clock = start;
  let seq = 0;
  const push = (m: Record<string, unknown>) => {
    seq += 1;
    clock += 20000;
    messages.push({ ...m, id: `m_ex_${seq}`, projectId, createdAt: clock } as Message);
  };

  push({
    kind: "coach",
    md: [
      `📂 **예시 프로젝트**야 — ${s.student.name}(${s.student.grade})의 질문 ${count}개를 **한꺼번에** 펼쳐 놨어. 누를 것 없이 위에서 아래로 읽으면 돼.`,
      ``,
      `- 답에는 **코드가 없어.** 순서도 · 규칙표 · 비교표 · 차별점만 있어 — 코드는 다른 도구로 뽑으면 돼`,
      `- 답마다 끝에 **🙋 열린 되묻기**가 있고, 다음 질문은 거기에 답하면서 시작해`,
      `- 두 번 묻고 나면 한 번 **🧭 되묻기** — 순서도와 핵심을 진짜 아는지 확인해 (${rqCount}번)`,
      ...(count > reportSpan ? [`- 답이 **10개** 쌓였을 때 📄 리포트 1장이 나왔어. ${reportSpan + 1}번째 질문부터는 그 리포트의 **미션을 해내는** 구간이야`] : []),
      `- 위의 **📝** 을 누르면 지금까지 쌓인 **${s.planDoc.filename}** 이 열려`,
    ].join("\n"),
  });

  s.turns.forEach((t, i) => {
    clock = start + (i * 9 + 1) * MIN;
    const turnId = `t_ex_${t.id}`;
    const analysis = analysisOf(t);
    const role = ROLE_OF[t.openness] ?? null;
    const chip = t.fromChip && t.fromChip.kind !== "expand" ? t.fromChip.kind : undefined;
    turns.push({ id: turnId, projectId, n: i + 1, windowIndex: windowOf(i), barIndex: Math.floor(i / s.project.rhythm), question: t.question, analysis, role, chipUsed: chip ?? null, source: "local", createdAt: clock });
    push({ kind: "user", text: t.question, chip });
    push({
      kind: "answer", md: answerMarkdown(t), turnId, role, roleReason: t.answer.roleReason, riskNote: t.answer.riskNote,
      assumptions: t.answer.assumptions, yourCall: [], chips: [], analysis, source: "local",
      planNote: t.plan ? `기획서에 「${t.plan.section}」 칸을 담았어` : t.planSkip,
    });

    const q = t.reverseQuestion;
    if (!q) return;
    const picked = q.form === "F1" ? q.options?.[q.demoOptionIndex ?? 0] : undefined;
    const hintStage = q.demoUsesHint ? 1 : 0;
    const dontKnow = Boolean(picked?.dontKnow);
    const feedback = picked ? picked.feedback : q.demoFeedback ?? "";
    const rqId = `rq_ex_${t.id}`;
    rqs.push({
      id: rqId, projectId, turnId, windowIndex: windowOf(i), barIndex: Math.floor(i / s.project.rhythm),
      element: q.element, pack: PACK_OF[q.element[0]] ?? null, form: q.form as Form,
      question: q.benefit ? `${q.question}\n\n${q.benefit}` : q.question,
      options: q.options?.filter((o) => !o.dontKnow).map((o) => ({ label: o.label, score: o.score })),
      hint: q.hints.hint, example: q.hints.example, coachView: q.hints.coachView, expectedPoints: [], selectionScores: {},
      status: "answered", hintStage,
      answer: dontKnow ? "잘 모르겠어" : picked ? picked.label : q.demoAnswer,
      score: picked ? picked.score : q.demoScore ?? (hintStage ? 1 : 2),
      reason: q.scoreReason, feedback, createdAt: clock + 2 * MIN, answeredAt: clock + 4 * MIN,
    });
    push({ kind: "rq", rqId });
    push({ kind: "coach", md: feedback });
  });

  // 🔭 심화 — 학생이 연 대화 한 번. 생각 노트에 문장 하나가 남는다.
  const lens = s.deep.demoLens as LensKey;
  clock = start + (count * 9 + 3) * MIN;
  let deepLevel = 0;
  let deepQuestion = "";
  s.deep.messages.forEach((m) => {
    if (m.from === "student") push({ kind: "user", text: m.text, deep: true });
    else if (m.level) {
      deepLevel = LEVEL_OF[m.level] ?? deepLevel;
      deepQuestion = deepQuestion || m.text;
      push({ kind: "deepQ", lens, level: deepLevel, md: `**${m.level === "확장" ? "확장 질문" : m.level}**\n\n${m.text}` });
    } else push({ kind: "coach", md: m.text });
  });
  const notes: Note[] = [{ id: `note_ex_${s.id}`, projectId, lens, level: 1, question: deepQuestion, text: s.deep.note, createdAt: clock }];

  // 📄 10문 리포트 — 답이 10개 쌓였을 때만 나온다
  const full = s.window.startCount + count >= s.window.size;
  const windowIndex = 1;
  const counted = turns.slice(0, reportSpan);
  const reports: WindowReport[] = [];
  if (full) {
    const mix = { O1: 0, O2: 0, O3: 0, O4: 0, O5: 0, NA: 0 } as Record<Openness, number>;
    const roles = { typist: 0, coder: 0, engineer: 0, architect: 0, encyclopedia: 0 } as Record<RoleKey, number>;
    const six = Object.fromEntries(SIX.map((k) => [k, 0])) as Record<SixKey, number>;
    counted.forEach((t) => {
      mix[t.analysis.openness] += 1;
      if (t.role) roles[t.role] += 1;
      SIX.forEach((k) => (six[k] += t.analysis.six[k]));
    });
    // 예시가 판의 중간에서 시작하면(startCount > 0) 앞선 질문의 집계는 JSON의 리포트 숫자를 쓴다
    if (s.window.startCount > 0) {
      s.report.mix.forEach((m) => {
        roles[m.role] = m.count;
        const o = (Object.keys(ROLE_OF) as Openness[]).find((k) => ROLE_OF[k] === m.role);
        if (o) mix[o] = m.count;
      });
      s.report.six.forEach((x, i) => SIX[i] && (six[SIX[i]] = x.value));
    } else six.discard = s.report.six[5]?.value ?? 0;
    const bestTurn = s.turns.slice(0, reportSpan).find((t) => t.question.includes(s.report.best.question.replace(/^…/, "").slice(0, 24))) ?? s.turns[reportSpan - 1];
    const nextMission: Mission = { key: "example", text: s.report.nextMission.text, basis: s.report.nextMission.basis, check: { type: "rq", key: "answered", target: 1 }, editedByStudent: false };
    reports.push({
      index: windowIndex, projectId, seq: 1, text: buildTextStats(counted), createdAt: start + ((reportSpan - 1) * 9 + 7) * MIN, from: start, to: start + ((reportSpan - 1) * 9 + 7) * MIN, turnRange: [1, reportSpan],
      projects: [s.project.name], stage: "설계", mix, roles, six,
      elements: rqs.filter((r) => r.windowIndex === windowIndex).map((r) => ({ element: r.element, form: r.form, score: r.score ?? null, hintStage: r.hintStage, status: r.status })),
      stuck: s.report.stuckItem ? [{ concept: s.report.stuckItem.concept, countInWindow: s.report.stuckItem.count, countTotal: s.report.stuckItem.total }] : [],
      lastMission: null, // 1번째 리포트엔 지난 미션이 없다
      mixComment: s.report.mixComment,
      best: { turnN: s.turns.indexOf(bestTurn) + 1, text: s.report.best.question, reason: s.report.best.comment },
      nextMission, opened: false,
    });
  }

  const project: Project = {
    id: projectId, name: s.project.name, desc: `예시 — ${s.student.name}의 ${s.project.desc}`, emoji: s.project.emoji,
    packs: (s.packs ?? ["maker"]) as PackKey[], rhythm: s.project.rhythm as 2 | 3 | 4, answerOnly: false, counter: 0, barIndex: rqCount, laterStreak: 0,
    format: s.format ?? "product", checks: {}, plan: { filename: s.planDoc.filename, md: planMarkdown(s, count) }, createdAt: start, updatedAt: clock,
  };

  write("profile", { name: s.student.name, grade: s.student.grade, interests: s.card.tags.slice(0, 3), createdAt: start });
  write("projects", [project]);
  write("messages", messages);
  write("turns", turns);
  write("rqs", rqs);
  write("notes", notes);
  write("reports", reports);
  write("state", {
    currentProjectId: projectId, validCount: count, windowCount: (s.window.startCount + count) % s.window.size,
    idkCount: rqs.filter((r) => r.score === 0).length, demoStep: null, demoProjectId: projectId,
  });
}
