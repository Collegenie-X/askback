export type RoleKey = "typist" | "coder" | "engineer" | "architect" | "encyclopedia";
export type ChipKind = "widen" | "narrow" | "alt" | "expand";

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

// 답이 끝날 때마다 기획서.md에 한 칸씩 쌓인다. 코드가 아니라 알고리즘 · 기획 · 차별점이 남는다.
export interface PlanAdd {
  section: string;
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
    assumptions: string[];
    riskNote?: string;
    role: RoleKey;
    roleReason: string;
  };
  six: Record<string, boolean> | null;
  chips: ChipKind[];
  review?: { carried: string; missing: string; because: string[] };
  plan?: PlanAdd;
  planSkip?: string; // 기획서에 보탤 게 없었던 답 — 왜 없었는지 한 줄
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

export const planMarkdown = (s: Scenario, uptoTurn: number) =>
  [s.planDoc.base, ...s.turns.slice(0, uptoTurn).flatMap((t) => (t.plan ? [`## ${t.plan.section}\n\n${t.plan.md}`] : []))].join("\n\n");

// 답은 언제나 열린 되묻기 한 줄로 끝난다 — 답하고, 되묻고, 다음 단으로
export const answerMarkdown = (t: Turn) => (t.answer.ask ? `${t.answer.md}\n\n---\n\n🙋 **하나만 되물을게** — ${t.answer.ask}` : t.answer.md);
