// Cloud Functions 진입점
//   api — 틴스파크AI REST API 전체 (/v1/...)
import { setGlobalOptions } from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { createApp } from "./app";

setGlobalOptions({ region: process.env.FUNCTION_REGION || "asia-northeast3", maxInstances: 10 });

/** firebase functions:secrets:set ANTHROPIC_API_KEY 로 넣는다 (로컬은 functions/.secret.local) */
const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");

/** 아직 키를 넣지 않았을 때 비밀값 자리에 두는 표시 — 이 값이면 "키 없음"으로 보고 로컬 답 카드로 답한다 */
const PLACEHOLDER = "NOT_SET";

function apiKey(): string | undefined {
  let value: string | undefined;
  try {
    value = ANTHROPIC_API_KEY.value() || process.env.ANTHROPIC_API_KEY;
  } catch {
    value = process.env.ANTHROPIC_API_KEY;
  }
  value = value?.trim();
  return value && value !== PLACEHOLDER ? value : undefined;
}

export const api = onRequest(
  { secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 180, memory: "512MiB", concurrency: 40 },
  createApp(apiKey),
);
