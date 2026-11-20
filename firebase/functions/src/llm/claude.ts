// Claude 로 질문에 답하기 — 시스템 프롬프트(틴스파크 코치 규칙)와 출력 스키마는 프런트의 파일을 그대로 쓴다.
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import prompts from "@front/data/prompts.json";
import { AnswerSchema, type AnswerOut } from "@front/lib/schemas";
import { FALLBACK_MODELS, type LlmSettings } from "./settings";
import { JsonStringFieldStream } from "./stream-json";

const SYSTEM = prompts.answer.system.join("\n");

export interface ClaudeUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

export type ClaudeResult =
  | { ok: true; out: AnswerOut; model: string; usage: ClaudeUsage; firstTextMs: number | null; ms: number }
  | { ok: false; reason: "no_key" | "disabled" | "refusal" | "max_tokens" | "no_output" | "auth" | "billing" | "rate_limit" | "timeout" | "bad_request" | "api" | "unknown"; message: string; ms: number };

export interface AskInput {
  apiKey: string | undefined;
  settings: LlmSettings;
  question: string;
  context: string;
  history: { role: "user" | "assistant"; content: string }[];
  images?: string[];
  /** 답 글자가 생기는 대로 불린다 (즉답 스트리밍) */
  onText?: (piece: string) => void;
}

type ImageMedia = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

export async function askClaude(input: AskInput): Promise<ClaudeResult> {
  const started = Date.now();
  const fail = (reason: Extract<ClaudeResult, { ok: false }>["reason"], message: string): ClaudeResult => ({ ok: false, reason, message, ms: Date.now() - started });
  if (!input.settings.enabled) return fail("disabled", "관리자가 Claude 사용을 꺼 두었어요.");
  if (!input.apiKey) return fail("no_key", "서버에 ANTHROPIC_API_KEY 가 없어요.");

  const task = input.settings.tasks.answer;
  const text = input.context ? `<context>\n${input.context}\n</context>\n\n${input.question}` : input.question;
  const imageBlocks: Anthropic.Beta.BetaImageBlockParam[] = [];
  for (const url of (input.images ?? []).slice(0, 3)) {
    const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/.exec(url);
    if (m) imageBlocks.push({ type: "image", source: { type: "base64", media_type: m[1] as ImageMedia, data: m[2] } });
  }
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    ...input.history,
    { role: "user", content: imageBlocks.length ? [...imageBlocks, { type: "text", text }] : text },
  ];
  const useFallback = input.settings.refusalFallback && FALLBACK_MODELS.has(task.model);

  try {
    const client = new Anthropic({ apiKey: input.apiKey, timeout: task.timeoutMs, maxRetries: 1 });
    // 스트리밍으로 받는다 — 답(answer_md) 글자가 생기는 대로 onText 로 흘려보내 학생이 바로 읽기 시작한다
    const stream = client.beta.messages.stream({
      model: task.model,
      max_tokens: task.maxTokens,
      thinking: { type: "adaptive" },
      // 시스템 프롬프트는 학생마다 같다 → 캐시. 학생 · 프로젝트 맥락은 마지막 user 메시지의 <context> 에.
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages,
      output_config: { effort: task.effort, format: betaZodOutputFormat(AnswerSchema) },
      ...(useFallback ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
    });
    const md = new JsonStringFieldStream("answer_md");
    let firstTextMs: number | null = null;
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        const piece = md.push(event.delta.text);
        if (piece) {
          firstTextMs ??= Date.now() - started;
          input.onText?.(piece);
        }
      }
    }
    const response = await stream.finalMessage();

    if (response.stop_reason === "refusal") return fail("refusal", "Claude 가 이 질문에 답하지 않았어요.");
    if (response.stop_reason === "max_tokens") return fail("max_tokens", "답이 너무 길어 잘렸어요. maxTokens 를 늘려 보세요.");
    const raw = response.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    let parsed: ReturnType<typeof AnswerSchema.safeParse>;
    try {
      parsed = AnswerSchema.safeParse(JSON.parse(raw));
    } catch {
      return fail("no_output", "Claude 의 답을 읽지 못했어요.");
    }
    if (!parsed.success) return fail("no_output", "Claude 의 답 형식이 맞지 않아요.");
    const u = response.usage;
    return {
      ok: true,
      out: parsed.data,
      model: response.model,
      usage: {
        inputTokens: u.input_tokens,
        outputTokens: u.output_tokens,
        cacheReadTokens: u.cache_read_input_tokens ?? 0,
        cacheWriteTokens: u.cache_creation_input_tokens ?? 0,
      },
      firstTextMs,
      ms: Date.now() - started,
    };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) return fail("auth", "ANTHROPIC_API_KEY 가 올바르지 않아요.");
    if (error instanceof Anthropic.RateLimitError) return fail("rate_limit", "Claude 사용량 한도에 걸렸어요.");
    if (error instanceof Anthropic.APIConnectionTimeoutError) return fail("timeout", `Claude 가 ${task.timeoutMs / 1000}초 안에 답하지 않았어요.`);
    if (error instanceof Anthropic.BadRequestError && /credit balance/i.test(error.message)) {
      return fail("billing", "Anthropic 크레딧이 부족해요. Claude Console → Plans & Billing 에서 충전해 주세요.");
    }
    if (error instanceof Anthropic.BadRequestError || error instanceof Anthropic.NotFoundError) return fail("bad_request", `요청이 거절됐어요 (모델 설정을 확인하세요): ${error.message}`);
    if (error instanceof Anthropic.APIError) return fail("api", error.message);
    console.error("claude unknown error", error);
    return fail("unknown", "Claude 호출 중 알 수 없는 오류가 났어요.");
  }
}

/** API 키가 있으면 Anthropic Models API 에서 쓸 수 있는 모델 목록을 읽는다 */
export async function listModels(apiKey: string) {
  const client = new Anthropic({ apiKey, timeout: 10_000, maxRetries: 1 });
  const out: { id: string; name: string }[] = [];
  for await (const m of client.models.list()) out.push({ id: m.id, name: m.display_name });
  return out;
}
