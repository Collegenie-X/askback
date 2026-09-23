"use client";

// 예시 프로젝트 불러오기 — 시나리오 JSON 한 장(src/data/scenarios/*.json)을 클릭 없이 한꺼번에 대화로 펼친다.
// 질문 · 답(+열린 되묻기) · 역질문과 학생의 답 · 심화 · 기획서 · 10문 리포트가 전부 채워진 채로 열린다.
import { answerMarkdown, planMarkdown, type Scenario, type Turn as ScriptTurn } from "@/components/demo/types";
import { clearAll, write } from "./db";
import { buildTextStats } from "./report";
import type { Analysis, ChipKind, Form, LensKey, Message, Mission, Note, Openness, PackKey, Project, ReverseQuestion, RoleKey, SixKey, Turn, WindowReport } from "./types";

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

/** 예시 JSON 한 장에서 리포트들을 만든다 (질문 10개마다 1장) — 불러오지 않은 예시도 리포트 목록에 같은 모양으로 보여 주려고 따로 뺐다.
 *  1번째는 s.report, 2번째는 s.report2의 글을 쓰고 숫자(질문 유형 · 실은 것 · 글자 수 · 돌아보기)는 그 구간의 턴에서 직접 센다. */
export function exampleReports(s: Scenario, start = Date.now() - (s.turns.length * 9 + 20) * MIN): WindowReport[] {
  const projectId = `prj_example_${s.id}`;
  const size = s.window.size;
  const out: WindowReport[] = [];
  for (let w = 0; (w + 1) * size <= s.window.startCount + s.turns.length; w++) {
    const src = w === 0 ? s.report : s.report2;
    if (!src) break;
    const from = Math.max(0, w * size - s.window.startCount);
    const counted = s.turns.slice(from, (w + 1) * size - s.window.startCount);
    const turns = counted.map((t, i) => ({ id: `t_ex_${t.id}`, projectId, n: from + i + 1, windowIndex: w + 1, barIndex: 0, question: t.question, analysis: analysisOf(t), role: ROLE_OF[t.openness] ?? null, chipUsed: null, source: "local", createdAt: start + ((from + i) * 9 + 1) * MIN }) as Turn);
    const mix = { O1: 0, O2: 0, O3: 0, O4: 0, O5: 0, NA: 0 } as Record<Openness, number>;
    const roles = { typist: 0, coder: 0, engineer: 0, architect: 0, encyclopedia: 0 } as Record<RoleKey, number>;
    const six = Object.fromEntries(SIX.map((k) => [k, 0])) as Record<SixKey, number>;
    turns.forEach((t) => {
      mix[t.analysis.openness] += 1;
      if (t.role) roles[t.role] += 1;
      SIX.forEach((k) => (six[k] += t.analysis.six[k]));
    });
    // 예시가 중간에서 시작하면(startCount > 0) 앞선 질문의 집계는 JSON의 리포트 숫자를 쓴다
    if (w === 0 && s.window.startCount > 0) {
      s.report.mix.forEach((m) => {
        roles[m.role] = m.count;
        const o = (Object.keys(ROLE_OF) as Openness[]).find((k) => ROLE_OF[k] === m.role);
        if (o) mix[o] = m.count;
      });
      s.report.six.forEach((x, i) => SIX[i] && (six[SIX[i]] = x.value));
    } else if (w === 0) six.discard = s.report.six[5]?.value ?? 0;
    const elements = counted.flatMap((t) => {
      const q = t.reverseQuestion;
      if (!q) return [];
      const picked = q.form === "F1" ? q.options?.[q.demoOptionIndex ?? 0] : undefined;
      const hintStage = q.demoUsesHint ? 1 : 0;
      return [{ element: q.element, form: q.form as Form, score: picked ? picked.score : q.demoScore ?? (hintStage ? 1 : 2), hintStage, status: "answered" }];
    });
    const bestTurn = counted.find((t) => t.question.includes(src.best.question.replace(/^…/, "").slice(0, 24))) ?? counted[counted.length - 1];
    const nextMission: Mission = { key: "example", text: src.nextMission.text, basis: src.nextMission.basis, check: { type: "rq", key: "answered", target: 1 }, editedByStudent: false };
    const last = from + counted.length - 1;
    out.push({
      index: w + 1, projectId, seq: w + 1, headline: src.headline, text: buildTextStats(turns, (_, i) => from + i + 1),
      createdAt: start + (last * 9 + 7) * MIN, from: start + (from * 9 + 1) * MIN, to: start + (last * 9 + 7) * MIN, turnRange: [from + 1, last + 1],
      projects: [s.project.name], stage: w === 0 ? "설계" : "검증", mix, roles, six, elements,
      stuck: src.stuckItem ? [{ concept: src.stuckItem.concept, countInWindow: src.stuckItem.count, countTotal: src.stuckItem.total }] : [],
      lastMission: w === 0 ? null : { text: src.lastMission.text, result: "done", detail: src.lastMission.result }, // 1번째 리포트엔 지난 미션이 없다
      mixComment: src.mixComment,
      best: { turnN: s.turns.indexOf(bestTurn) + 1, text: src.best.question, reason: src.best.comment },
      nextMission, opened: false,
    });
  }
  return out;
}

export function loadExample(s: Scenario) {
  clearAll();
  const count = s.turns.length;
  const start = Date.now() - (count * 9 + 20) * MIN;
  const projectId = `prj_example_${s.id}`;
  const reportSpan = Math.max(0, s.window.size - s.window.startCount); // 1번째 리포트가 세는 질문 수
  const windowOf = (i: number) => Math.floor((i + s.window.startCount) / s.window.size) + 1; // 리포트는 프로젝트마다 1번째부터 — 예시도 1번째 리포트다
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
      ...(count > reportSpan ? [`- 답이 **10개** 쌓일 때마다 📄 리포트가 1장씩 나와 (지금 ${Math.floor((s.window.startCount + count) / s.window.size)}장). ${reportSpan + 1}번째 질문부터는 1번째 리포트의 **미션을 해내는** 구간이야`] : []),
      `- 위의 **📝** 을 누르면 지금까지 쌓인 **${s.planDoc.filename}** 이 열려`,
    ].join("\n"),
  });

  s.turns.forEach((t, i) => {
    clock = start + (i * 9 + 1) * MIN;
    const turnId = `t_ex_${t.id}`;
    const analysis = analysisOf(t);
    const role = ROLE_OF[t.openness] ?? null;
    // 넓히기 · 좁히기 · 대안만 질문 분석에 남는다. 한 단 키우기와 📐 설계 묻기(기획 · 알고리즘 · 구조)는 다른 묶음의 칩이다
    const chip = t.fromChip && (["widen", "narrow", "alt"] as string[]).includes(t.fromChip.kind) ? (t.fromChip.kind as ChipKind) : undefined;
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
      question: q.question, axis: q.axis, benefit: q.benefit,
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
  const reports = exampleReports(s, start);

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
