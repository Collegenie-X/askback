// POST /v1/llm/:task — 브라우저 답변 엔진(frontend/src/lib/engine.ts)이 Claude 를 한 번 빌려 쓰는 길.
//
//   브라우저 ── { input, context, history, images } ──▶ 이 라우트 ── Claude ──▶ { data: 구조화 출력 }
//
// 판단 · 저장 · 리듬(2문 1역) · 리포트 숫자는 브라우저가 지금처럼 하고, 여기서는 Claude 호출만 대신한다.
// 키는 서버 비밀값에만 있다. 프런트의 /api/turn 과 요청 · 응답 모양이 같다.
// 실패하면 503/502 — 브라우저가 로컬 답 카드로 폴백한다.
import { Router } from "express";
import { z } from "zod";
import { addTokens, logCall, reserveTurn } from "../coach/turn";
import { ApiError, ok, parse } from "../lib/http";
import { askClaude, askCoach, type ClaudeResult, type CoachResult, type CoachTask } from "../llm/claude";
import { getLlmSettings } from "../llm/settings";

const TASKS = ["answer", "rq", "feedback", "deep", "report"] as const;
type Task = (typeof TASKS)[number];

const DataUrl = z.string().regex(/^data:image\/(jpeg|png|webp|gif);base64,/).max(4_000_000);
const Body = z.object({
  input: z.string().trim().min(1, "질문을 적어 주세요.").max(20_000),
  context: z.string().max(8_000).default(""),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(40_000) })).max(40).default([]),
  images: z.array(DataUrl).max(3).default([]),
  projectId: z.string().max(200).optional(),
});

function failStatus(r: Extract<ClaudeResult, { ok: false }>) {
  if (r.reason === "no_key" || r.reason === "disabled") return 503;
  if (r.reason === "rate_limit") return 429;
  return 502;
}

export function llmRouter(getKey: () => string | undefined) {
  const r = Router();

  r.post("/:task", async (req, res) => {
    const task = req.params.task as Task;
    if (!TASKS.includes(task)) throw new ApiError(404, "not_found", "없는 작업이에요.");
    const body = parse(Body, req.body);
    const uid = req.user!.uid;
    const settings = await getLlmSettings();
    const apiKey = getKey();
    const projectId = body.projectId ?? "browser";

    let result: ClaudeResult | CoachResult<unknown>;
    let model: string;
    if (task === "answer") {
      // 질문 하나 = 하루 한도 하나 (서버 /turns 와 같은 규칙)
      if (settings.enabled && apiKey) await reserveTurn(uid, req.user!.doc.dailyLimit ?? settings.dailyTurnLimit);
      const history = settings.historyMessages > 0 ? body.history.slice(-settings.historyMessages) : [];
      while (history.length && history[0].role !== "user") history.shift(); // API 규칙: 첫 메시지는 user
      result = await askClaude({ apiKey, settings, question: body.input, context: body.context, history, images: body.images });
      model = settings.tasks.answer.model;
    } else {
      result = await askCoach(task as CoachTask, { apiKey, settings, input: body.input, context: body.context });
      model = settings.tasks.coach.model;
    }

    await Promise.all([logCall(uid, projectId, model, result, task), addTokens(uid, result)]);
    if (!result.ok) {
      res.status(failStatus(result)).json({ error: { code: result.reason, message: result.message } });
      return;
    }
    ok(res, { data: result.out, model: result.model, usage: result.usage });
  });

  return r;
}
