// Claude 모델 설정 — Firestore config/llm 한 문서. 관리자가 REST 로 바꾸면 배포 없이 바로 반영된다.
import { z } from "zod";
import { FieldValue, paths } from "../lib/firebase";

export const EFFORTS = ["low", "medium", "high", "xhigh", "max"] as const;

/** 관리자 화면에 보여 줄 기본 목록 — API 키가 있으면 /admin/models 가 Anthropic Models API 에서 최신 목록을 읽는다 */
export const KNOWN_MODELS = [
  { id: "claude-opus-5-5", name: "Claude Opus 5.5", note: "기본값 · 품질과 비용의 균형" },
  { id: "claude-sonnet-5-5", name: "Claude Sonnet 5.5", note: "더 빠르고 저렴" },
  { id: "claude-haiku-5-5", name: "Claude Haiku 5.5", note: "가장 빠르고 저렴" },
  { id: "claude-fable-5-2", name: "Claude Fable 5.2", note: "가장 뛰어나지만 비쌈" },
  { id: "claude-opus-5", name: "Claude Opus 5", note: "이전 세대" },
  { id: "claude-sonnet-5", name: "Claude Sonnet 5", note: "이전 세대" },
];

/** 서버 측 거절 대체(fallbacks: "default")를 받는 모델 */
export const FALLBACK_MODELS = new Set(["claude-fable-5-2", "claude-fable-5-1", "claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5"]);

const TaskSettings = z.object({
  model: z.string().regex(/^claude-[a-z0-9.-]+$/, "모델 ID 형식이 아니에요. 예: claude-opus-5-5"),
  effort: z.enum(EFFORTS),
  maxTokens: z.number().int().min(1024).max(32000),
  timeoutMs: z.number().int().min(5_000).max(300_000),
});

export const LlmSettings = z.object({
  /** false 면 Claude 를 부르지 않고 로컬 답 카드로만 답한다 */
  enabled: z.boolean(),
  /** Claude 가 실패하면(키 없음 · 시간 초과 · 거절) 로컬 답 카드로 대신 답할지 */
  fallbackToLocal: z.boolean(),
  /** 거절 시 Anthropic 서버가 다른 모델로 이어서 답하게 할지 (지원 모델만) */
  refusalFallback: z.boolean(),
  /** 회원 한 명이 하루에 할 수 있는 질문 수 (회원별 dailyLimit 이 있으면 그쪽이 우선) */
  dailyTurnLimit: z.number().int().min(0).max(10_000),
  /** Claude 에게 함께 보내는 이전 대화 수 (질문 + 답 한 쌍이 2) */
  historyMessages: z.number().int().min(0).max(40),
  /** 작업별 모델 — answer: 질문에 답하기 · coach: 되묻기 다듬기(rq) · 학생 답 채점(feedback) */
  tasks: z.object({ answer: TaskSettings, coach: TaskSettings }),
});
export type LlmSettings = z.infer<typeof LlmSettings>;

export const DEFAULT_SETTINGS: LlmSettings = {
  enabled: true,
  fallbackToLocal: true,
  refusalFallback: true,
  dailyTurnLimit: 60,
  historyMessages: 12,
  tasks: {
    answer: {
      model: process.env.ASKBACK_MODEL || "claude-opus-5-5",
      effort: (EFFORTS as readonly string[]).includes(process.env.ASKBACK_EFFORT ?? "") ? (process.env.ASKBACK_EFFORT as (typeof EFFORTS)[number]) : "medium",
      maxTokens: 16000,
      timeoutMs: 60_000,
    },
    // 짧은 JSON 하나만 만드는 일이라 빠르고 저렴한 모델로 충분하다
    coach: {
      model: process.env.ASKBACK_COACH_MODEL || "claude-sonnet-5-5",
      effort: "low",
      maxTokens: 4000,
      timeoutMs: 30_000,
    },
  },
};

/** 부분 수정용 — 보낸 칸만 바뀐다 */
export const LlmSettingsPatch = z
  .object({
    enabled: LlmSettings.shape.enabled,
    fallbackToLocal: LlmSettings.shape.fallbackToLocal,
    refusalFallback: LlmSettings.shape.refusalFallback,
    dailyTurnLimit: LlmSettings.shape.dailyTurnLimit,
    historyMessages: LlmSettings.shape.historyMessages,
    tasks: z.object({ answer: TaskSettings.partial(), coach: TaskSettings.partial() }).partial(),
  })
  .partial()
  .strict();

let cache: { at: number; value: LlmSettings } | null = null;
const TTL = 15_000; // 인스턴스마다 15초 캐시 — 바꾸면 늦어도 15초 안에 모든 인스턴스에 반영

export async function getLlmSettings(fresh = false): Promise<LlmSettings> {
  if (!fresh && cache && Date.now() - cache.at < TTL) return cache.value;
  const snap = await paths.llmSettings().get();
  const stored = (snap.data() ?? {}) as Partial<LlmSettings>;
  const merged = LlmSettings.safeParse({
    ...DEFAULT_SETTINGS,
    ...stored,
    tasks: {
      answer: { ...DEFAULT_SETTINGS.tasks.answer, ...(stored.tasks?.answer ?? {}) },
      coach: { ...DEFAULT_SETTINGS.tasks.coach, ...(stored.tasks?.coach ?? {}) },
    },
  });
  const value = merged.success ? merged.data : DEFAULT_SETTINGS;
  cache = { at: Date.now(), value };
  return value;
}

export async function updateLlmSettings(patch: z.infer<typeof LlmSettingsPatch>, by: string): Promise<LlmSettings> {
  const current = await getLlmSettings(true);
  const next = LlmSettings.parse({
    ...current,
    ...patch,
    tasks: {
      answer: { ...current.tasks.answer, ...(patch.tasks?.answer ?? {}) },
      coach: { ...current.tasks.coach, ...(patch.tasks?.coach ?? {}) },
    },
  });
  await paths.llmSettings().set({ ...next, updatedAt: FieldValue.serverTimestamp(), updatedBy: by });
  cache = { at: Date.now(), value: next };
  return next;
}

export async function resetLlmSettings(by: string) {
  await paths.llmSettings().set({ ...DEFAULT_SETTINGS, updatedAt: FieldValue.serverTimestamp(), updatedBy: by });
  cache = null;
  return getLlmSettings(true);
}
