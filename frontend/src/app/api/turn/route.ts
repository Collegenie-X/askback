// 한 턴의 Claude API 호출. 역할(task)마다 시스템 프롬프트(prompts.json)와 JSON 스키마가 다르다.
// 자격 증명이 없거나 호출이 실패하면 클라이언트가 로컬 JSON/MD 엔진으로 폴백한다.
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import prompts from "@/data/prompts.json";
import { AnswerSchema, DeepSchema, FeedbackSchema, RQSchema } from "@/lib/schemas";

const MODEL = process.env.ASKBACK_MODEL ?? "claude-opus-5";
type Effort = "low" | "medium" | "high" | "xhigh" | "max";
const EFFORT = (process.env.ASKBACK_EFFORT ?? "medium") as Effort;

const TASKS = {
  answer: { schema: AnswerSchema, system: prompts.answer.system, maxTokens: 16000 },
  rq: { schema: RQSchema, system: prompts.rq.system, maxTokens: 4000 },
  feedback: { schema: FeedbackSchema, system: prompts.feedback.system, maxTokens: 4000 },
  deep: { schema: DeepSchema, system: prompts.deep.system, maxTokens: 4000 },
} as const;

function hasCredentials() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export async function GET() {
  return Response.json({ live: hasCredentials(), model: MODEL });
}

interface Body {
  task: keyof typeof TASKS;
  history?: { role: "user" | "assistant"; content: string }[];
  input: string; // 이번 요청의 본문 (JSON 문자열 또는 학생 질문)
  images?: string[]; // data URL (image/jpeg·png·webp·gif) — 이번 질문에 붙인 사진
  context?: string; // 프로젝트·학생 메모 — 캐시가 깨지지 않게 시스템 프롬프트 뒤, 메시지 쪽에 싣는다
}

export async function POST(request: Request) {
  if (!hasCredentials()) return Response.json({ error: "no_credentials" }, { status: 503 });

  const body = (await request.json()) as Body;
  const task = TASKS[body.task];
  if (!task || typeof body.input !== "string") return Response.json({ error: "bad_request" }, { status: 400 });

  const text = body.context ? `<context>\n${body.context}\n</context>\n\n${body.input}` : body.input;
  const imageBlocks: Anthropic.ImageBlockParam[] = [];
  for (const url of (body.images ?? []).slice(0, 3)) {
    const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/.exec(url);
    if (match) imageBlocks.push({ type: "image", source: { type: "base64", media_type: match[1] as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: match[2] } });
  }
  const messages: Anthropic.MessageParam[] = [
    ...(body.history ?? []).slice(-12),
    { role: "user", content: imageBlocks.length ? [...imageBlocks, { type: "text", text }] : text },
  ];

  try {
    const client = new Anthropic();
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: task.maxTokens,
      thinking: { type: "adaptive" },
      system: [{ type: "text", text: task.system.join("\n"), cache_control: { type: "ephemeral" } }],
      messages,
      output_config: { effort: EFFORT, format: zodOutputFormat(task.schema) },
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return Response.json({ error: "no_output", stop_reason: response.stop_reason }, { status: 502 });
    }
    return Response.json({ data: response.parsed_output, model: response.model, usage: response.usage });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) return Response.json({ error: "auth" }, { status: 401 });
    if (error instanceof Anthropic.RateLimitError) return Response.json({ error: "rate_limit" }, { status: 429 });
    if (error instanceof Anthropic.APIError) return Response.json({ error: "api", message: error.message }, { status: 502 });
    return Response.json({ error: "unknown" }, { status: 500 });
  }
}
