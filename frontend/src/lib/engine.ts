"use client";

// 답변 엔진. ① Claude API(/api/turn, JSON 구조화 출력) → ② 실패하면 로컬 JSON + .md 카드.
import answers from "@/data/answers.json";
import roles from "@/data/roles.json";
import lenses from "@/data/lenses.json";
import { draftContext, formatOf } from "./draft";
import type { AnswerOut, DeepOut, FeedbackOut, RQOut } from "./schemas";
import type { Analysis, Chip, TurnScript, LensKey, Message, Openness, Profile, Project, ReverseQuestion, RoleKey, Turn } from "./types";
import { similarity } from "./analyzer";

type Task = "answer" | "rq" | "feedback" | "deep";
let live: boolean | null = null;

export async function checkLive(): Promise<boolean> {
  if (live !== null) return live;
  // 기본은 서버 없이 로컬 JSON·MD 엔진. Claude API는 NEXT_PUBLIC_ASKBACK_LIVE=1 일 때만 시도한다.
  if (process.env.NEXT_PUBLIC_ASKBACK_LIVE !== "1") return (live = false);
  try {
    const res = await fetch("/api/turn");
    live = Boolean((await res.json()).live);
  } catch {
    live = false;
  }
  return live;
}

async function callClaude<T>(task: Task, input: string, context: string, history?: { role: "user" | "assistant"; content: string }[], images?: string[]): Promise<T | null> {
  if (!(await checkLive())) return null;
  try {
    const res = await fetch("/api/turn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task, input, context, history, images }),
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 503) live = false;
      return null;
    }
    return (await res.json()).data as T;
  } catch {
    return null;
  }
}

function contextOf(project: Project, profile: Profile | null) {
  return [
    `학생: ${profile?.name ?? "학생"} (${profile?.grade ?? "학년 모름"}) · 관심: ${profile?.interests.join(", ") || "없음"}`,
    `프로젝트: ${project.name}${project.desc ? ` — ${project.desc}` : ""}`,
    draftContext(project),
  ].filter(Boolean).join("\n");
}

export function historyOf(messages: Message[]) {
  const out: { role: "user" | "assistant"; content: string }[] = [];
  messages.forEach((m) => {
    if (m.kind === "user" && !m.deep) out.push({ role: "user", content: m.text });
    if (m.kind === "answer") out.push({ role: "assistant", content: m.md });
  });
  // API 규칙: 첫 메시지는 user
  while (out.length && out[0].role !== "user") out.shift();
  return out.slice(-12);
}

export function roleOf(o: Openness): RoleKey | null {
  return o === "NA" ? null : (roles.openness[o].role as RoleKey);
}

export function isWritingProject(p: Project) {
  return /(보고서|독후감|글|에세이|소설|기사|발표문)/.test(p.name + p.desc);
}

export function roleLabel(role: RoleKey, project: Project) {
  const r = roles.roles[role];
  return `${r.emoji} ${isWritingProject(project) ? r.writing : r.name}`;
}

/* ---------- 답 ---------- */

export interface AnswerResult {
  md: string;
  assumptions: string[];
  yourCall: string[];
  riskNote?: string;
  roleReason: string;
  analysis: Analysis;
  source: "claude" | "local";
  emotional: boolean;
}

function fill(md: string, vars: Record<string, string>) {
  return md.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}

async function localAnswer(question: string, analysis: Analysis, project: Project, script?: TurnScript): Promise<AnswerResult> {
  if (script?.file) {
    const a: Analysis = { ...analysis, openness: script.openness ?? analysis.openness, stage: script.stage ?? analysis.stage, six: script.six ?? analysis.six, concepts: script.concepts ?? analysis.concepts };
    const role = roleOf(a.openness);
    let text = "답 카드를 불러오지 못했어.";
    try {
      const res = await fetch(`/answers/${script.file}`);
      if (res.ok) text = await res.text();
    } catch {
      // 오프라인
    }
    return { md: text, assumptions: script.assumptions ?? [], yourCall: script.yourCall ?? [], riskNote: script.risk, roleReason: script.roleReason ?? (role ? roles.roles[role].reason : ""), analysis: a, source: "local", emotional: false };
  }
  const hay = (question + " " + project.name + " " + project.desc).toLowerCase();
  let best: { score: number; card: (typeof answers.cards)[number] } | null = null;
  for (const card of answers.cards) {
    if (!card.openness.includes(analysis.openness)) continue;
    const inQuestion = card.keywords.filter((k) => question.toLowerCase().includes(k.toLowerCase())).length;
    if (!inQuestion) continue;
    const score = inQuestion + card.keywords.filter((k) => hay.includes(k.toLowerCase())).length * 0.5 - card.openness.indexOf(analysis.openness) * 0.3;
    if (!best || score > best.score) best = { score, card };
  }
  const file = best ? best.card.file : answers.fallback[analysis.openness];
  let md = "답 카드를 불러오지 못했어. 잠시 뒤에 다시 물어봐 줄래?";
  try {
    const res = await fetch(`/answers/${file}`);
    if (res.ok) md = await res.text();
  } catch {
    // 오프라인이어도 대화는 이어진다
  }
  const role = roleOf(analysis.openness);
  // 답한 뒤에는 열린 질문으로 되묻는다 — 서버 없이 돌 때도 같은 모양으로 끝난다
  const asks = (answers.asks as Record<string, string[]>)[analysis.openness] ?? [];
  if (asks.length && !md.includes("되물을게")) md = `${md.trimEnd()}\n\n---\n\n🙋 **하나만 되물을게** — ${asks[question.length % asks.length]}`;
  return {
    md: fill(md, { question: question.replace(/\n/g, " "), project: project.name }),
    assumptions: best ? best.card.assumptions : answers.fallbackAssumptions,
    yourCall: best && "yourCall" in best.card ? (best.card.yourCall as string[]) : [],
    riskNote: best?.card.risk ?? undefined,
    roleReason: role ? roles.roles[role].reason : "",
    analysis,
    source: "local",
    emotional: false,
  };
}

export async function generateAnswer(question: string, analysis: Analysis, project: Project, profile: Profile | null, messages: Message[], script?: TurnScript, images: string[] = []): Promise<AnswerResult> {
  if (script?.file) return localAnswer(question, analysis, project, script);
  const out = await callClaude<AnswerOut>("answer", question, contextOf(project, profile), historyOf(messages), images);
  if (!out) {
    const local = await localAnswer(question, analysis, project);
    if (!images.length) return local;
    // 서버 없이 돌 때는 사진 속을 읽지 못한다 — 읽은 척하지 않고 그대로 말한다
    const note = `> 📷 사진 ${images.length}장 받았어. 지금은 서버 없이 도는 중이라 **사진 속 내용은 읽지 못해** (Claude API를 연결하면 사진을 보고 답해). 사진에서 봐줬으면 하는 걸 글로 한 줄만 보태 줄래?\n\n`;
    const body = local.md.includes("로컬 데모 엔진") ? "" : local.md; // 맞는 답 카드가 없으면 안내만 — 장황한 틀은 빼낸다
    return { ...local, md: note + body, assumptions: ["사진 속 내용은 보지 못했어 — 글로 쓴 것만 읽었어", ...local.assumptions] };
  }
  const merged: Analysis = {
    ...analysis,
    openness: out.openness,
    six: out.six,
    stage: out.stage,
    concepts: out.concepts.length ? out.concepts.slice(0, 3) : analysis.concepts,
  };
  return {
    md: out.answer_md,
    assumptions: out.assumptions,
    yourCall: out.your_call,
    riskNote: out.risk_note ?? undefined,
    roleReason: out.role_reason,
    analysis: merged,
    source: "claude",
    emotional: out.emotional,
  };
}

/* ---------- 칩 (§6.1) ---------- */

export function chipsFor(analysis: Analysis, recentTurns: Turn[], project: Project): Chip[] {
  const chips: Chip[] = [];
  const o = analysis.openness;
  const tail = [...recentTurns.map((t) => t.analysis.openness), o];
  const threshold = analysis.stage === "구현" ? 5 : 3; // 구현 단계에선 넓히기 문턱을 높인다 (§11)
  const narrowRun = tail.slice(-threshold);
  const goal = project.desc || "___";
  // 코드·완성본으로 달려가는 중이면 설계(알고리즘·구조)로 돌아가는 질문을 먼저 권한다
  const design = formatOf(project)?.design;
  if (design && (analysis.stage === "구현" || o === "O1" || o === "O2")) chips.push({ kind: "widen", draft: design.back });
  if (narrowRun.length >= threshold && narrowRun.every((x) => x === "O1" || x === "O2")) {
    chips.push({ kind: "widen", draft: `지금 내가 짜고 있는 이 구조 자체가 맞는 방향일까? 내 목표는 ${goal}이고 제약은 ___야.` });
  }
  if (o === "O5" || o === "O3") {
    chips.push({ kind: "narrow", draft: `그중에서 ___ 부분을 내 상황(${project.desc || "___"})에 맞게 구체적으로 알려줘.` });
  }
  if (o === "O3") {
    chips.push({ kind: "alt", draft: "이 방식 말고 다른 방식 2개와, 각각 잃는 걸 알려줘. 내 제약은 ___야." });
  }
  return chips.slice(0, 2);
}

/* ---------- 역질문 생성 · 피드백 ---------- */

export async function refineRQ(base: ReverseQuestion, bar: { q: string; a: string }[], project: Project, profile: Profile | null, elementName: string): Promise<ReverseQuestion> {
  const input = JSON.stringify({ 마디: bar, 평가요소: `${base.element} ${elementName}`, 형태: base.form });
  const out = await callClaude<RQOut>("rq", input, contextOf(project, profile));
  if (!out) return base;
  return {
    ...base,
    question: out.question,
    options: base.form === "F1" && out.options.length >= 2 ? out.options.slice(0, 3) : base.options,
    hint: out.hint,
    example: out.example,
    coachView: out.coach_view,
    expectedPoints: out.expected_points,
  };
}

const JOKE = /^(몰라|모름|ㅁㄹ|글쎄|아무거나|ㅋ+|ㅎ+|\.+|\?+)[\sㅋㅎ~!.]*$/;
const REASON = /(때문|니까|라서|해서|으면|면 |왜냐|그래서|대신)/;

export interface FeedbackResult {
  score: number;
  reason: string;
  feedback: string;
}

export async function gradeAnswer(
  rq: ReverseQuestion,
  answer: string,
  optionScore: number | null,
  lastAnswerMd: string,
  add: { good: string; weak: string },
  project: Project,
  profile: Profile | null,
): Promise<FeedbackResult> {
  if (optionScore === null) {
    const input = JSON.stringify({ 역질문: rq.question, expected_points: rq.expectedPoints, 학생의_답: answer, hint_stage: rq.hintStage, 직전_AI_답: lastAnswerMd.slice(0, 1500) });
    const out = await callClaude<FeedbackOut>("feedback", input, contextOf(project, profile));
    if (out) return { score: Math.max(0, Math.min(3, Math.round(out.score))), reason: out.reason_one_line, feedback: out.feedback_md };
  }

  const text = answer.trim();
  const quote = text.length > 28 ? text.slice(0, 28) + "…" : text;
  if (optionScore === null && JOKE.test(text)) {
    return { score: 0, reason: "가볍게 넘긴 답", feedback: "ㅋㅋ 알겠어. 하던 거 하자." };
  }
  let score = optionScore ?? (text.length >= 18 && REASON.test(text) ? 3 : text.length >= 8 ? 2 : 1);
  let reason = optionScore !== null ? "보기에서 고름" : score === 3 ? "자기 말로 이유까지 말함" : score === 2 ? "자기 말로 대체로 답함" : "짧게 방향만 말함";
  const copied = optionScore === null && similarity(text, lastAnswerMd.slice(0, 400)) > 0.55;
  if (copied) {
    score = Math.min(score, 1);
    reason = "직전 답과 표현이 거의 같음";
  }
  if (rq.hintStage > 0) {
    score = Math.min(score, 1);
    reason += " · 힌트 후";
  }
  const receive = `"${quote}" — 그렇게 봤구나.`;
  const plus = copied ? "이번엔 네 말로 한 줄만 다시 말해 볼래?" : score >= 2 ? add.good : add.weak;
  return { score, reason, feedback: `${receive} ${plus} 계속 갈래, 이걸 먼저 볼래?` };
}

/* ---------- 심화 (§5) ---------- */

export function deepQuestion(lens: LensKey, level: number, project: Project) {
  const L = lenses[lens];
  if (level >= 3) return `**확장 질문**\n\n${fill(L.extension, { project: project.name })}`;
  const item = L.levels[level];
  return `**${L.emoji} ${L.name} · L${level + 1}**\n\n${item.q}\n\n> ${fill(item.coach, { project: project.name })}`;
}

export async function deepReply(lens: LensKey, level: number, studentText: string, project: Project, profile: Profile | null): Promise<{ reply: string; next: string | null }> {
  const L = lenses[lens];
  const nextLabel = level >= 2 ? "확장" : `L${level + 2}`;
  const input = JSON.stringify({ 렌즈: L.name, 지금_깊이: level >= 3 ? "확장" : `L${level + 1}`, 다음_깊이: nextLabel, 학생의_말: studentText });
  const out = await callClaude<DeepOut>("deep", input, contextOf(project, profile));
  if (out) return { reply: out.reply_md, next: out.next_question };
  const quote = studentText.length > 30 ? studentText.slice(0, 30) + "…" : studentText;
  return { reply: `"${quote}" — ${L.receive} 생각 노트에 적어 뒀어.`, next: null };
}
