export type RoleKey = "typist" | "coder" | "engineer" | "architect" | "encyclopedia";
// 앞의 넷은 답을 넓히고 좁히는 칩, 뒤의 셋은 📐 설계 묻기 — 기획 · 알고리즘 · 전체 구조를 학생이 직접 묻게 하는 빈칸 초안
export type ChipKind = "widen" | "narrow" | "alt" | "expand" | "plan" | "algo" | "arch";

export interface Guide {
  title: string;
  body: string;
  ref?: string;
}

// 확장 사다리 — 프로젝트는 작게 시작해서 한 단씩 자란다 (센서 → 서버 → AI → 공유)
export interface Stage {
  emoji: string;
  label: string;
  desc: string;
}

// 🔥 7단계 기획 가이드 — 불씨에서 봉화까지. 대화가 도는 동안 기획서의 일곱 칸이 하나씩 찬다.
export interface SparkStep {
  no: number;
  emoji: string;
  name: string;
  /** 이 칸의 목표 한 줄 */
  goal: string;
  /** 스파크 체크 — 무엇이 되면 이 칸이 찬 건가 */
  check: string;
  /** 빈칸일 때 코치가 건네는 열린 질문 — 누르면 입력창 초안이 된다 */
  opens: string[];
  /** 몇 번째 질문에서 찼나 */
  filledBy: number;
  /** 찼을 때 그 칸에 적힌 한 줄 */
  line: string;
}

export interface SparkLevel {
  emoji: string;
  name: string;
  range: string;
  color: string;
  done: string;
}

export interface Spark {
  title: string;
  caption: string;
  rule: string;
  levels: SparkLevel[];
  steps: SparkStep[];
}

/** 턴 하나가 7단계 중 어디에 있는지 — 지금 채운 것과 다음에 열 칸 */
export interface TurnSpark {
  step: number;
  /** 이 턴에서 그 칸이 찼는가 */
  fills: boolean;
  now: string;
  next: string;
}

// 기획서는 쌓이기만 하지 않는다 — 같은 칸을 다시 연다.
// add: 새 칸이 생김 · revise: 있던 칸을 고쳐 씀 · fill: 비워 둔 ___ 를 학생의 말로 채움
export type PlanOp = "add" | "revise" | "fill";

export interface PlanChange {
  op: PlanOp;
  /** 칸 ID — v1 · v2 · v3가 같은 칸임을 이걸로 안다 */
  slot: string;
  section: string;
  /** 무엇이 무엇으로 바뀌었나 — 한 줄씩 */
  changed?: string[];
  /** 무엇을 보고 바꿨나 — 고쳐 쓰게 만든 것 */
  why?: string;
  /** 이 판을 정한 사람 — 학생 이름이면 학생이 정한 칸 */
  from?: string;
  md: string;
}

export interface RoleMeta {
  emoji: string;
  label: string;
  desc: string;
  color: string;
}

export interface RqOption {
  label: string;
  dontKnow?: boolean;
  score: number;
  feedback: string;
}

export interface ReverseQuestion {
  element: string;
  elementIcon: string;
  elementLabel: string;
  /** 이 되묻기가 확인하는 축 — 🧭 기획 · 🔀 알고리즘 · 🏗 전체 구조 */
  axis?: "plan" | "algo" | "arch";
  form: "F1" | "F3";
  formLabel: string;
  question: string;
  benefit?: string;
  options?: RqOption[];
  demoOptionIndex?: number;
  hints: { hint: string; example: string; coachView: string };
  demoUsesHint?: boolean;
  demoAnswer?: string;
  demoFeedback?: string;
  demoScore?: number;
  scoreReason: string;
  dontKnowFeedback: string;
}

export interface Turn {
  id: string;
  number: number;
  time: string;
  stage: number; // scenario.stages 의 몇 번째 단인가
  scene: string; // 가이드 패널 위 장면 이름
  openness: string;
  opennessLabel: string;
  question: string;
  fromChip?: { kind: ChipKind; draft: string };
  answer: {
    md: string;
    ask?: string; // 답한 뒤 코치가 던지는 열린 되묻기 — 다음 질문은 여기서 자란다
    /** 답 안에 함께 놓이는 열린 질문 — 코치가 정하지 않고 학생에게 남긴 판단 */
    yourCall?: string[];
    assumptions: string[];
    riskNote?: string;
    role: RoleKey;
    roleReason: string;
  };
  six: Record<string, boolean> | null;
  chips: ChipKind[];
  review?: { carried: string; missing: string; because: string[] };
  plan?: PlanChange;
  planSkip?: string; // 기획서에 보탤 게 없었던 답 — 왜 없었는지 한 줄
  spark?: TurnSpark; // 7단계 기획 가이드에서 지금 어디쯤인가
  reverseQuestion?: ReverseQuestion;
  guide: Partial<Record<"ask" | "answer" | "rq" | "hint" | "feedback", Guide>>;
}

export interface DeepMessage {
  showAt: number;
  from: "coach" | "student";
  level?: string;
  text: string;
  actions?: boolean;
  final?: boolean;
}

export interface Scenario {
  id: string;
  format?: "paper" | "research" | "campaign" | "service" | "product"; // 메인 앱에 불러올 때의 초안 형식
  packs?: ("maker" | "share" | "collab" | "ai")[];
  turnGuides?: Partial<Record<"ask" | "answer" | "rq" | "hint" | "feedback", Guide>>; // 턴에 guide가 없을 때 쓰는 공통 안내 (common.json)
  card: { emoji: string; title: string; oneLine: string; origin: string; tags: string[] };
  stages: Stage[];
  spark?: Spark; // 🔥 7단계 기획 가이드 — 불씨 → 불꽃 → 횃불 → 봉화
  planDoc: { filename: string; base: string };
  meta: { title: string; subtitle: string; note: string };
  student: { name: string; grade: string };
  project: { emoji: string; name: string; desc: string; rhythm: number };
  window: { index: number; startCount: number; size: number };
  roles: Record<RoleKey, RoleMeta>;
  chips: Record<ChipKind, { emoji: string; label: string }>;
  guides: Record<string, Guide>;
  turns: Turn[];
  deep: {
    lenses: { key: string; emoji: string; label: string; preview: string }[];
    demoLens: string;
    origin: string;
    messages: DeepMessage[];
    note: string;
  };
  /** 2번째 리포트(질문 11~20)의 글 — 숫자는 턴에서 직접 센다 */
  report2?: {
    title: string;
    headline: string;
    range: string;
    lastMission: { text: string; result: string };
    /** 질문 하나씩 — 원문 전체와 그 질문이 한 일 */
    questions?: { n: number; question: string; comment: string }[];
    mixComment: string;
    best: { question: string; comment: string };
    nextMission: { text: string; basis: string };
    stuckItem?: { concept: string; count: number; total: number };
  };
  report: {
    title: string;
    headline: string; // 리포트 제목 — 이 10문을 한 줄로
    range: string;
    lastMission: { text: string; result: string };
    /** 질문 하나씩 — 원문 전체와 그 질문이 한 일 */
    questions?: { n: number; question: string; comment: string }[];
    mix: { role: RoleKey; label: string; count: number; note?: string }[];
    mixReference: string;
    mixComment: string;
    six: { label: string; value: number }[];
    elementsBefore: { icon: string; label: string; score: number; form: string }[];
    stuck: string;
    stuckItem?: { concept: string; count: number; total: number };
    best: { question: string; comment: string };
    nextMission: { text: string; basis: string };
  };
}

export interface RqRecord {
  status: "answered" | "later" | "dontknow";
  score: number | null;
  hintStage: number;
  answer?: string;
  feedback?: string;
}

export type Phase = "intro" | "ask" | "thinking" | "streaming" | "extras" | "rq" | "feedback" | "afterTurns";

export const scoreDot = (score: number | null) =>
  score === null ? "🧺" : score >= 2 ? "🟢" : score === 1 ? "🟡" : "⚪";

// 부가물이 도착하는 순서 — 답이 끝난 뒤에만, 하나씩 (화면 설계서 P1)
export const extrasOrder = (t: Turn): string[] =>
  ["badge", t.plan || t.planSkip ? "plan" : null, t.chips.length ? "chips" : null, t.review ? "review" : null, "deep", t.answer.riskNote ? "risk" : null].filter(
    Boolean,
  ) as string[];

/** 기획서의 한 칸과, 그 칸이 지금까지 고쳐진 자취 */
export interface PlanSlot {
  id: string;
  /** 칸 번호 — 처음 생긴 순서 */
  no: number;
  section: string;
  /** 이 칸이 열린 모든 판. 마지막이 지금 모습 */
  history: { turnNumber: number; version: number; change: PlanChange }[];
}

/** uptoTurn번째 답까지 진행했을 때의 기획서 — 칸마다 고쳐진 자취를 묶는다 */
export const planSlots = (s: Scenario, uptoTurn: number): PlanSlot[] => {
  const slots: PlanSlot[] = [];
  s.turns.slice(0, uptoTurn).forEach((t) => {
    if (!t.plan) return;
    let slot = slots.find((x) => x.id === t.plan!.slot);
    if (!slot) {
      slot = { id: t.plan.slot, no: slots.length + 1, section: t.plan.section, history: [] };
      slots.push(slot);
    }
    slot.section = t.plan.section;
    slot.history.push({ turnNumber: t.number, version: slot.history.length + 1, change: t.plan });
  });
  return slots;
};

/** 그 칸이 몇 번째 판인지 — 답 아래 배지와 타임라인이 같은 숫자를 쓴다 */
export const planVersionOf = (s: Scenario, turn: Turn): number =>
  turn.plan ? s.turns.filter((t) => t.number <= turn.number && t.plan?.slot === turn.plan!.slot).length : 0;

export const PLAN_OP_LABEL: Record<PlanOp, string> = {
  add: "새 칸이 생김",
  revise: "고쳐 씀",
  fill: "빈칸을 내 말로",
};

/** 내보내는 .md — 칸마다 지금 모습만, 고쳐 쓴 자취는 제목 옆에 */
export const planMarkdown = (s: Scenario, uptoTurn: number) =>
  [
    s.planDoc.base,
    ...planSlots(s, uptoTurn).map((slot) => {
      const last = slot.history[slot.history.length - 1];
      const trail = slot.history.map((h) => `v${h.version}·Q${h.turnNumber}`).join(" → ");
      return `## ${slot.no}. ${slot.section}\n\n*${trail}*\n\n${last.change.md}`;
    }),
  ].join("\n\n");

// 답은 언제나 열린 되묻기 한 줄로 끝난다 — 답하고, 되묻고, 다음 단으로
export const answerMarkdown = (t: Turn) => (t.answer.ask ? `${t.answer.md}\n\n---\n\n🙋 **하나만 되물을게** — ${t.answer.ask}` : t.answer.md);

/** 7단계 기획 가이드 — uptoTurn번째 답까지 왔을 때 어느 칸이 찼나 */
export interface SparkState {
  /** 칸마다: 찼으면 그 칸을 채운 질문 번호, 아직이면 null */
  filled: (number | null)[];
  /** 찬 칸 수 */
  count: number;
  /** 지금 레벨 (0부터) — 칸 2개마다 한 단 */
  level: number;
  levelMeta: SparkLevel | null;
  /** 아직 비어 있는 칸 중 첫 칸 */
  nextStep: SparkStep | null;
}

/** 칸 수 → 레벨 (1–2칸 불씨 · 3–4칸 불꽃 · 5–6칸 횃불 · 7칸 봉화) */
export const sparkLevelOf = (count: number) => (count <= 0 ? 0 : Math.min(3, Math.ceil(count / 2) - 1));

export const sparkStateOf = (s: Scenario, uptoTurn: number): SparkState | null => {
  if (!s.spark) return null;
  const filled = s.spark.steps.map((st) => {
    const hit = s.turns.findIndex((t, i) => i < uptoTurn && t.spark?.fills && t.spark.step === st.no);
    return hit < 0 ? null : hit + 1;
  });
  const count = filled.filter((x) => x !== null).length;
  const level = sparkLevelOf(count);
  const nextIndex = filled.findIndex((x) => x === null);
  return { filled, count, level, levelMeta: count ? s.spark.levels[level] : null, nextStep: nextIndex < 0 ? null : s.spark.steps[nextIndex] };
};

/** 그 턴이 서 있는 칸 */
export const sparkStepOf = (s: Scenario, t: Turn): SparkStep | null =>
  (t.spark && s.spark?.steps.find((x) => x.no === t.spark!.step)) || null;
