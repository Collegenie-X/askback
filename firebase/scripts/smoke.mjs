// 에뮬레이터에 대고 REST API 전체를 한 바퀴 돌려 본다.
//   npm run emulators   (다른 터미널)
//   npm run smoke
// API 주소를 바꾸려면: API=https://asia-northeast3-<프로젝트>.cloudfunctions.net/api/v1 npm run smoke
// (운영 주소에 돌리면 실제 계정이 만들어지므로 에뮬레이터에서만 쓰세요)
const API = process.env.API ?? "http://127.0.0.1:5001/demo-teenspark/asia-northeast3/api/v1";
const ADMIN = process.env.ADMIN_EMAIL ?? "admin@teenspark.test"; // functions/.env.local 의 ADMIN_EMAILS
const stamp = Date.now().toString(36);

let failed = 0;
async function call(method, path, { token, body, expect } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  const okStatus = expect === "any" ? true : expect ? res.status === expect : res.ok;
  console.log(`${okStatus ? "✅" : "❌"} ${method} ${path} → ${res.status}${json.error ? ` ${json.error.code}` : ""}`);
  if (!okStatus) {
    failed++;
    console.log("   ", JSON.stringify(json).slice(0, 400));
  }
  return json;
}

const signup = (email, extra = {}) =>
  call("POST", "/auth/signup", {
    body: { email, password: "teenspark123", nickname: "서연", grade: "중2", interests: ["로봇", "환경"], under14: false, agreeTerms: true, agreePrivacy: true, ...extra },
    expect: 201,
  });

console.log(`API = ${API}\n`);
await call("GET", "/health");

console.log("\n— 회원가입 · 로그인");
const studentEmail = `student-${stamp}@teenspark.test`;
const s = await signup(studentEmail);
await call("POST", "/auth/signup", { body: { email: `kid-${stamp}@teenspark.test`, password: "teenspark123", nickname: "하린", grade: "초5", under14: true, agreeTerms: true, agreePrivacy: true }, expect: 400 }); // 보호자 동의 없음
await call("POST", "/auth/signup", { body: { email: studentEmail, password: "teenspark123", nickname: "x", grade: "중2", under14: false, agreeTerms: true, agreePrivacy: true }, expect: 409 }); // 중복
await call("POST", "/auth/login", { body: { email: studentEmail, password: "wrong-pass1" }, expect: 401 });
const login = await call("POST", "/auth/login", { body: { email: studentEmail, password: "teenspark123" } });
let token = login.data?.tokens?.idToken ?? s.data?.tokens?.idToken;
const refreshed = await call("POST", "/auth/refresh", { body: { refreshToken: login.data?.tokens?.refreshToken } });
token = refreshed.data?.tokens?.idToken ?? token;

console.log("\n— 내 정보");
await call("GET", "/me", { token });
await call("PATCH", "/me", { token, body: { nickname: "서연이", interests: ["스마트팜"] } });
await call("GET", "/me", { expect: 401 });

console.log("\n— 질문하기");
const project = await call("POST", "/projects", { token, body: { name: "스마트 화분", desc: "흙이 마르면 자동으로 물 주기", emoji: "🌱", format: "product" }, expect: 201 });
const pid = project.data?.id;
const turn = await call("POST", `/projects/${pid}/turns`, { token, body: { text: "흙 센서값이 400 밑이면 펌프를 켜고 싶은데, 물을 너무 많이 주지 않으려면 어떤 방식이 좋을까? 아두이노 우노를 쓰고 있어." }, expect: 201 });
console.log(`    outcome=${turn.data?.outcome} source=${turn.data?.source} openness=${turn.data?.turn?.analysis?.openness} role=${turn.data?.answer?.roleLabel}`);
if (turn.data?.fallbackReason) console.log(`    (Claude 대신 로컬 답 카드: ${turn.data.fallbackReason.reason})`);
console.log("    답 앞부분:", (turn.data?.answer?.md ?? "").slice(0, 120).replace(/\n/g, " "), "…");
const gated = await call("POST", `/projects/${pid}/turns`, { token, body: { text: "고마워" } });
console.log(`    잡담 → outcome=${gated.data?.outcome}`);
const quick = await call("POST", "/ask", { token, body: { text: "발표 자료를 어떤 순서로 짜면 좋을까?" }, expect: 201 });
console.log(`    /ask → projectId=${quick.data?.projectId} source=${quick.data?.source}`);
await call("GET", `/projects/${pid}/messages`, { token });
await call("GET", `/projects/${pid}/turns`, { token });
await call("GET", "/projects", { token });
await call("GET", "/me/usage", { token });

console.log("\n— 관리자");
let adminLogin = await call("POST", "/auth/login", { body: { email: ADMIN, password: "teenspark123" }, expect: "any" }); // 첫 실행이면 401 → 아래에서 가입
if (!adminLogin?.data) adminLogin = await signup(ADMIN, { nickname: "관리자", grade: "교사" });
const admin = adminLogin.data?.tokens?.idToken;
console.log(`    관리자 role=${adminLogin.data?.user?.role}`);
await call("GET", "/admin/users", { token, expect: 403 }); // 학생은 못 들어온다
const users = await call("GET", "/admin/users?limit=5", { token: admin });
console.log(`    회원 ${users.data?.total}명`);
const studentUid = login.data?.user?.uid;
await call("GET", `/admin/users/${studentUid}`, { token: admin });
await call("PATCH", `/admin/users/${studentUid}`, { token: admin, body: { dailyLimit: 2 } }); // 오늘 이미 2문
await call("POST", `/projects/${pid}/turns`, { token, body: { text: "펌프를 끄는 기준은 몇으로 잡는 게 좋을까? 화분은 작은 편이야." }, expect: 429 });
await call("PATCH", `/admin/users/${studentUid}`, { token: admin, body: { dailyLimit: null } });
await call("PATCH", "/admin/settings/llm", { token: admin, body: { fallbackToLocal: false } });
await call("POST", `/projects/${pid}/turns`, { token, body: { text: "물 주는 간격은 어떻게 정하는 게 좋을까? 여름이랑 겨울이 달라." }, expect: 503 });
await call("GET", "/admin/settings/llm", { token: admin });
const changed = await call("PATCH", "/admin/settings/llm", { token: admin, body: { tasks: { answer: { model: "claude-sonnet-5-5", effort: "low" } }, dailyTurnLimit: 80 } });
console.log(`    모델 → ${changed.data?.tasks?.answer?.model} / effort ${changed.data?.tasks?.answer?.effort}`);
await call("PATCH", "/admin/settings/llm", { token: admin, body: { tasks: { answer: { model: "gpt-4o" } } }, expect: 400 });
await call("GET", "/admin/models", { token: admin });
await call("POST", "/admin/settings/llm/reset", { token: admin });
await call("GET", "/admin/stats", { token: admin });
await call("GET", "/admin/llm-calls", { token: admin });

console.log("\n— 정지 · 탈퇴");
await call("PATCH", `/admin/users/${studentUid}`, { token: admin, body: { status: "suspended" } });
await call("GET", "/me", { token, expect: 403 }); // 정지되면 바로 막힌다
await call("POST", "/auth/login", { body: { email: studentEmail, password: "teenspark123" }, expect: 403 });
await call("PATCH", `/admin/users/${studentUid}`, { token: admin, body: { status: "active" } });
const back = await call("POST", "/auth/login", { body: { email: studentEmail, password: "teenspark123" } });
await call("DELETE", "/me", { token: back.data?.tokens?.idToken, body: { password: "teenspark123" } });
await call("POST", "/auth/login", { body: { email: studentEmail, password: "teenspark123" }, expect: 401 });

console.log(failed ? `\n❌ ${failed}개 실패` : "\n✅ 전부 통과");
process.exit(failed ? 1 : 0);
