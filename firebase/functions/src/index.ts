// Cloud Functions 진입점
//   api      — 틴스파크AI REST API 전체 (/v1/...)
//   cleanup  — 매일 새벽 4시(KST): 5일 지난 보호자 동의 요청 · 1년 지난 AI 호출 기록 지우기
import { setGlobalOptions } from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";
import { createApp } from "./app";
import { cleanupExpired } from "./routes/guardian";

setGlobalOptions({ region: process.env.FUNCTION_REGION || "asia-northeast3", maxInstances: 10 });

/** firebase functions:secrets:set ANTHROPIC_API_KEY 로 넣는다 (로컬은 functions/.secret.local) */
const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");

/** 아직 키를 넣지 않았을 때 비밀값 자리에 두는 표시 — 이 값이면 "키 없음"으로 보고 로컬 답 카드로 답한다 */
const PLACEHOLDER = "NOT_SET";

/** firebase functions:secrets:set RESEND_API_KEY — 만 14세 미만 가입 때 보호자에게 동의 확인 메일을 보낸다 */
const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

function read(secret: ReturnType<typeof defineSecret>, env: string): string | undefined {
  let value: string | undefined;
  try {
    value = secret.value() || process.env[env];
  } catch {
    value = process.env[env];
  }
  value = value?.trim();
  return value && value !== PLACEHOLDER ? value : undefined;
}
const apiKey = () => read(ANTHROPIC_API_KEY, "ANTHROPIC_API_KEY");
const mailKey = () => read(RESEND_API_KEY, "RESEND_API_KEY");

export const api = onRequest(
  { secrets: [ANTHROPIC_API_KEY, RESEND_API_KEY], timeoutSeconds: 180, memory: "512MiB", concurrency: 40 },
  createApp(apiKey, mailKey),
);

export const cleanup = onSchedule({ schedule: "0 4 * * *", timeZone: "Asia/Seoul", timeoutSeconds: 300 }, async () => {
  const r = await cleanupExpired();
  console.info("cleanup", r);
});
