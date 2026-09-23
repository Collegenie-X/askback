export type Openness = "O1" | "O2" | "O3" | "O4" | "O5" | "NA";
export type RoleKey = "typist" | "coder" | "engineer" | "architect" | "encyclopedia";
export type SixKey = "why" | "context" | "constraint" | "criteria" | "verify" | "discard";
export type Stage = "탐색" | "설계" | "구현" | "검증";
export type PackKey = "maker" | "share" | "collab" | "ai";
export type Form = "F1" | "F2" | "F3";
export type ChipKind = "widen" | "narrow" | "alt";
export type FormatKey = "paper" | "research" | "campaign" | "service" | "product";
export type LensKey = "philosophy" | "psychology" | "sociology";

export interface Profile {
  name: string;
  grade: string;
  interests: string[];
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  packs: PackKey[];
  rhythm: 2 | 3 | 4;
  answerOnly: boolean;
  counter: number; // 이번 마디에서 쌓인 유효 질문 수
  barIndex: number;
  laterStreak: number;
  format?: FormatKey; // 아이템 초안의 형식 — 질문 버튼과 체크 칸이 달라진다
  checks?: Record<string, string>; // 체크 칸 key → 학생이 정한 한 줄
  plan?: { filename: string; md: string }; // 기획서.md — 예시 프로젝트는 시나리오 JSON에서 쌓인 채로 온다
  createdAt: number;
  updatedAt: number;
}

export interface Analysis {
  valid: boolean;
  invalidReason?: "smalltalk" | "duplicate" | "howto" | "emotional";
  six: Record<SixKey, number>;
  openness: Openness;
  contextLoad: number;
  stage: Stage;
  urgent: boolean;
  signals: string[];
  concepts: string[];
}

export interface Turn {
  id: string;
  projectId: string;
  n: number; // 학생 전체 기준 유효 질문 번호
  windowIndex: number;
  barIndex: number;
  question: string;
  analysis: Analysis;
  role: RoleKey | null;
  chipUsed: ChipKind | null;
  source: "claude" | "local";
  createdAt: number;
}

export interface Chip {
  kind: ChipKind;
  draft: string;
}

export interface RQOption {
  label: string;
  score: number;
}

export interface ReverseQuestion {
  id: string;
  projectId: string;
  turnId: string;
  windowIndex: number;
  barIndex: number;
  element: string;
  pack: PackKey | null;
  form: Form;
  question: string;
  /** 이 되묻기가 확인하는 축 — 기획 · 알고리즘 · 전체 구조 */
  axis?: "plan" | "algo" | "arch";
  /** 답하면 내 아이템이 뭐가 세지는지 한 줄 */
  benefit?: string;
  options?: RQOption[];
  hint: string;
  example: string;
  coachView: string;
  expectedPoints: string[];
  selectionScores: Record<string, number>;
  status: "open" | "answered" | "later";
  hintStage: number;
  answer?: string;
  score?: number;
  reason?: string;
  feedback?: string;
  createdAt: number;
  answeredAt?: number;
}

export interface CoachAction {
  label: string;
  action: string;
}

export type Message = {
  id: string;
  projectId: string;
  createdAt: number;
} & (
  | { kind: "user"; text: string; chip?: ChipKind; deep?: boolean; images?: string[] } // images: 줄여서 저장한 data URL
  | {
      kind: "answer";
      md: string;
      turnId: string;
      role: RoleKey | null;
      roleReason: string;
      riskNote?: string;
      assumptions: string[];
      yourCall: string[]; // 답의 경계 — AI가 정하지 않고 학생에게 남긴 판단
      chips: Chip[];
      planNote?: string; // 이 답이 기획서.md에 남긴 것 한 줄
      analysis: Analysis;
      source: "claude" | "local";
    }
  | { kind: "coach"; md: string; actions?: CoachAction[] }
  | { kind: "rq"; rqId: string }
  | { kind: "deepPick" }
  | { kind: "deepQ"; lens: LensKey; level: number; md: string }
);

export interface Note {
  id: string;
  projectId: string;
  lens: LensKey;
  level: number;
  question: string;
  text: string;
  createdAt: number;
}

export interface Mission {
  key: string;
  text: string;
  basis: string;
  check: { type: "openness" | "six" | "rq" | "axis"; key: string; target: number };
  editedByStudent: boolean;
}

// 질문 글자 수 분석 — 짧은 · 보통 · 긴 질문이 각각 몇 개였고, 그때 6요소를 몇 개씩 실었나
export type LengthKey = "short" | "mid" | "long";
export interface TextStats {
  count: number;
  avg: number;
  min: number;
  max: number;
  buckets: Record<LengthKey, { count: number; avgSix: number; open: number }>;
  longest: { n: number; chars: number } | null;
  shortest: { n: number; chars: number } | null;
}

export interface WindowReport {
  index: number; // 전체에서 유일한 번호 (여는 열쇠) — 화면에는 프로젝트별 seq를 쓴다
  projectId?: string;
  headline?: string; // 리포트 제목 — 이 10문을 한 줄로 (예시는 JSON의 report.headline)
  seq?: number; // 그 프로젝트의 몇 번째 리포트인가 (1부터)
  text?: TextStats;
  createdAt: number;
  from: number;
  to: number;
  turnRange: [number, number];
  projects: string[];
  stage: Stage;
  mix: Record<Openness, number>;
  roles: Record<RoleKey, number>;
  six: Record<SixKey, number>;
  elements: { element: string; form: Form; score: number | null; hintStage: number; status: string }[];
  stuck: { concept: string; countInWindow: number; countTotal: number }[];
  lastMission: { text: string; result: "done" | "partial" | "missed"; detail: string } | null;
  mixComment: string;
  best: { turnN: number; text: string; reason: string } | null;
  nextMission: Mission;
  opened: boolean;
  seed?: boolean;
  example?: boolean; // 불러오지 않은 예시의 리포트 — 목록에만 보이고 저장되지 않는다
}

export interface AppState {
  currentProjectId: string | null;
  validCount: number; // 전체 유효 질문 수
  windowCount: number; // 이번 판에서 쌓인 유효 질문 수 (0~9)
  idkCount: number;
  demoStep: number | null; // (예전 한 걸음씩 시연의 위치 — 지금은 쓰지 않는다)
  demoProjectId: string | null; // 한꺼번에 불러온 예시 프로젝트
}

// 우주 배경 꾸미기 — 기기에 남는 취향이라 [전부 지우기] · 예시 불러오기에도 지워지지 않는다
export type SpaceObjectKey = "giant" | "ocean" | "candy" | "ring" | "solar" | "galaxy" | "probe";
export interface SpacePrefs {
  mood: "calm" | "normal" | "vivid"; // 배경 밝기
  speed: "slow" | "normal" | "fast"; // 공전 · 자전 빠르기
  motion: boolean; // 끄면 전부 멈춘다
  shooting: boolean; // 별똥별
  hidden: SpaceObjectKey[]; // 꺼 둔 천체
}

// 대본이 한 턴을 고정할 때 쓰는 값 — 답 카드 파일과 분석 결과를 미리 정해 둔다
export interface TurnScript {
  openness?: Openness;
  stage?: Stage;
  six?: Record<SixKey, number>;
  concepts?: string[];
  file?: string;
  assumptions?: string[];
  yourCall?: string[];
  risk?: string;
  roleReason?: string;
  chips?: Chip[];
  rq?: { element: string; form: Form; question: string; hint?: string; options?: RQOption[] } | null;
  report?: "seed7";
}
