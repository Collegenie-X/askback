// 화면 시뮬레이터의 화면 명세 생성 — 기획서(학생이 정한 칸)를 받아 코드가 아니라 화면 명세 JSON만 돌려준다.
// current + request 가 오면 "말로 고치기": 지금 명세를 요청대로 조금만 고치고, 정해지지 않은 것은 되묻는다.
// 자격 증명이 없으면 503 — 클라이언트가 예시 틀 · 손으로 고치기로 폴백한다. (호출 방식은 /api/turn 과 같다)
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { AiSpecSchema, fromAi } from "@/lib/sim";

const MODEL = process.env.ASKBACK_MODEL ?? "claude-opus-5";
type Effort = "low" | "medium" | "high" | "xhigh" | "max";
const EFFORT = (process.env.ASKBACK_EFFORT ?? "medium") as Effort;

const SYSTEM = [
  "너는 청소년 프로젝트 코치의 '화면 설계도' 담당이다. 학생의 기획서를 읽고 앱 화면을 **흰 종이 와이어프레임 명세 JSON**으로만 그린다.",
  "코드 · HTML · CSS · 색 꾸미기는 쓰지 않는다. UI · UX(무엇이 어디에 있고 누르면 어디로 가는지)만 그린다.",
  "",
  "## 원칙 — 되묻지 말고 알아서, 가장 좋은 경우로",
  "- 모든 화면을 **가장 잘 된 날(최상의 조건)** 의 더미 데이터로 꽉 채운다. 숫자 · 이름 · 날짜 · 기록을 그럴듯하게 지어 넣는다.",
  "- 예외 처리는 그리지 않는다 — 막힌 버튼(disabledIf) · 경고 알림 · 빈 화면 · 오류 화면 없이 잘 되는 길만.",
  "- 기록 · 통계가 있는 앱이면 차트 · 막대 기록 · 표를 꼭 넣는다.",
  "",
  "## 부품 (blocks[].type)",
  "- big: 화면의 주인공 숫자. val = 크게 보일 값(\"4:12:30\", \"A+\", \"1등\"), sub = 아래 설명.",
  "- stat: 이름과 숫자 한 줄. text = 이름, val = 값(또는 bind = state key), unit.",
  "- chart: chart = bar | line | donut, text = 제목, data = [{label, value, value2(목표 · 반 평균, 없으면 null), note}], unit, sub.",
  "- progress: 막대 기록 줄들. text = 제목, data = [{label, value, value2 = 최대 · 목표, note = 오른쪽 글}].",
  "- table: text = 제목, cols = 머리, rows = 줄들(3~6줄).",
  "- chips: items = 짧은 칩들 (탭 · 기간 · 태그).",
  "- text · notice(tone good) · list(items) · image(text = 무엇의 그림) · button(text, go = 넘어갈 화면 id).",
  "- 쓰지 않는 칸은 null, 배열은 빈 배열.",
  "",
  "## 지킬 것",
  "- 화면은 4~10개. 앱의 큰 메뉴가 보이면 화면을 그 메뉴 순서로 둔다. 화면마다 칸은 5~9개, 맨 위에 big 또는 chart 하나.",
  "- screen id 는 영어 소문자, block id 는 겹치지 않게, rule id 는 R1, R2 … 순서. 규칙은 기획서에 있는 것만 옮긴다.",
  "- 모든 화면은 버튼으로 이어진다 (go). 버튼 글자는 12자 이내, 말투는 중학생에게 하는 반말.",
  "- note: 이번에 만든 것을 한두 문장으로. ask: 빈 문자열.",
].join("\n");

function hasCredentials() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export async function GET() {
  return Response.json({ live: hasCredentials(), model: MODEL });
}

interface Body {
  id?: string;
  name?: string;
  plan?: string; // 기획서.md — 학생이 정한 칸
  current?: unknown; // 지금 화면 명세 (말로 고치기)
  request?: string; // 학생의 고치기 요청
}

export async function POST(request: Request) {
  if (!hasCredentials()) return Response.json({ error: "no_credentials" }, { status: 503 });

  const body = (await request.json()) as Body;
  const plan = typeof body.plan === "string" ? body.plan : "";
  const ask = typeof body.request === "string" ? body.request.trim() : "";
  if (!plan && !body.current && !ask) return Response.json({ error: "bad_request" }, { status: 400 });

  const parts = [`<project>${body.name ?? "이름 없는 프로젝트"}</project>`, `<plan>\n${plan || "(기획서가 아직 비어 있다)"}\n</plan>`];
  if (body.current) parts.push(`<current>\n${JSON.stringify(body.current)}\n</current>`);
  parts.push(ask ? `<request>\n${ask}\n</request>` : "기획서대로 화면 명세를 처음 그려 줘.");

  try {
    const client = new Anthropic();
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: parts.join("\n\n") }],
      output_config: { effort: EFFORT, format: zodOutputFormat(AiSpecSchema) },
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return Response.json({ error: "no_output", stop_reason: response.stop_reason }, { status: 502 });
    }
    const spec = response.parsed_output;
    return Response.json({ project: fromAi(spec, body.id ?? "ai"), note: spec.note, ask: spec.ask, model: response.model });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) return Response.json({ error: "auth" }, { status: 401 });
    if (error instanceof Anthropic.RateLimitError) return Response.json({ error: "rate_limit" }, { status: 429 });
    if (error instanceof Anthropic.APIError) return Response.json({ error: "api", message: error.message }, { status: 502 });
    return Response.json({ error: "unknown" }, { status: 500 });
  }
}
