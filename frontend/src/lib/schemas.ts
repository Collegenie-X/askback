// Claude API 구조화 출력 스키마 (설계서 v3 §9의 출력 명세)
import { z } from "zod";

const level = z.union([z.literal(0), z.literal(0.5), z.literal(1)]);

export const AnswerSchema = z.object({
  openness: z.enum(["O1", "O2", "O3", "O4", "O5", "NA"]),
  six: z.object({ why: level, context: level, constraint: level, criteria: level, verify: level, discard: level }),
  stage: z.enum(["탐색", "설계", "구현", "검증"]),
  concepts: z.array(z.string()),
  emotional: z.boolean(),
  answer_md: z.string(),
  assumptions: z.array(z.string()),
  your_call: z.array(z.string()),
  risk_note: z.string().nullable(),
  role_reason: z.string(),
});

export const RQSchema = z.object({
  question: z.string(),
  options: z.array(z.object({ label: z.string(), score: z.number() })),
  hint: z.string(),
  example: z.string(),
  coach_view: z.string(),
  expected_points: z.array(z.string()),
});

export const FeedbackSchema = z.object({
  score: z.number(),
  reason_one_line: z.string(),
  feedback_md: z.string(),
});

export const DeepSchema = z.object({
  reply_md: z.string(),
  next_question: z.string(),
});

export type AnswerOut = z.infer<typeof AnswerSchema>;
export type RQOut = z.infer<typeof RQSchema>;
export type FeedbackOut = z.infer<typeof FeedbackSchema>;
export type DeepOut = z.infer<typeof DeepSchema>;
