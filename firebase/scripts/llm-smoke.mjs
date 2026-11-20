// 브라우저 답변 엔진이 빌려 쓰는 Claude 길(POST /v1/llm/:task)을 에뮬레이터에 대고 시험한다.
//   npm run emulators   (다른 터미널)
//   node scripts/llm-smoke.mjs
// 확인하는 것: 로그인 없으면 401 · 없는 작업 404 · 빈 질문 422 · answer 가 질문에 맞는 답(answer_md)을 돌려주거나 키가 없으면 503 no_key
const API = process.env.API ?? "http://127.0.0.1:5001/demo-teenspark/asia-northeast3/api/v1";
const stamp = Date.now().toString(36);
let failed = 0;

async function call(method, path, { token, body } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}
const check = (label, cond, extra = "") => {
  console.log(`${cond ? "✅" : "❌"} ${label}${extra ? ` — ${extra}` : ""}`);
  if (!cond) failed++;
};

console.log(`API = ${API}\n`);
const signup = await call("POST", "/auth/signup", {
  body: { email: `llm-${stamp}@teenspark.test`, password: "teenspark123", nickname: "llm", grade: "중2", interests: ["드라마"], under14: false, agreeTerms: true, agreePrivacy: true },
});
check("가입", signup.status === 201, String(signup.status));
const token = signup.json.data?.tokens?.idToken;

const question = "먼저 마음씬에 사이코 드라마 형식으로 대본을 만드는 과정을 유저 시나리오로 만들어 주세요.";
const body = { input: question, context: "학생: llm (중2)\n프로젝트: 마음씬 — 내 마음을 들여다 보면서 대본을 만드는 것", history: [] };

const noAuth = await call("POST", "/llm/answer", { body });
check("로그인 없으면 401", noAuth.status === 401, String(noAuth.status));
const bad = await call("POST", "/llm/nope", { token, body });
check("없는 작업 404", bad.status === 404, String(bad.status));
const empty = await call("POST", "/llm/answer", { token, body: { input: "" } });
check("빈 질문 422/400", empty.status === 422 || empty.status === 400, String(empty.status));

const t0 = Date.now();
const r = await call("POST", "/llm/answer", { token, body });
const secs = ((Date.now() - t0) / 1000).toFixed(1);
if (r.status === 503) {
  check("키 없음 → 503 no_key (브라우저는 로컬 카드로)", r.json.error?.code === "no_key" || r.json.error?.code === "disabled", r.json.error?.code);
} else {
  const out = r.json.data?.data;
  check(`answer 200 (${secs}s, ${r.json.data?.model})`, r.status === 200 && typeof out?.answer_md === "string", r.status === 200 ? "" : JSON.stringify(r.json).slice(0, 300));
  if (out?.answer_md) {
    check("데모 카드가 아닌 실제 답", !out.answer_md.includes("로컬 데모 엔진"));
    console.log("\n--- answer_md 앞부분 ---\n" + out.answer_md.slice(0, 600) + "\n---");
  }
}

console.log(failed ? `\n❌ ${failed}개 실패` : "\n✅ 모두 통과");
process.exit(failed ? 1 : 0);
