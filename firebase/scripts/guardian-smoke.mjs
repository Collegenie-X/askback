// 만 14세 미만 가입 — 보호자 이메일 동의를 에뮬레이터에서 한 바퀴 돌려 본다.
//   npm run emulators        (다른 터미널 — 메일 키가 없으면 메일 대신 devLink 를 돌려준다)
//   npm run smoke:guardian
// 가짜 Google 로그인은 Auth 에뮬레이터의 signInWithIdp(서명 없는 id_token)로 만든다.
const API = process.env.API ?? "http://127.0.0.1:5001/demo-teenspark/asia-northeast3/api/v1";
const AUTH = process.env.AUTH ?? "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1";
const stamp = Date.now().toString(36);

let failed = 0;
async function call(method, path, { token, body, expect } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  const good = expect ? res.status === expect : res.ok;
  console.log(`${good ? "✅" : "❌"} ${method} ${path.replace(/[A-Za-z0-9_-]{30,}/, "<token>")} → ${res.status}${json.error ? ` ${json.error.code}` : ""}`);
  if (!good) {
    failed++;
    console.log("   ", JSON.stringify(json).slice(0, 400));
  }
  return json;
}

async function googleLogin(email, name) {
  const idToken = JSON.stringify({ sub: `g-${email}`, email, email_verified: true, name });
  const res = await fetch(`${AUTH}/accounts:signInWithIdp?key=fake`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestUri: "http://localhost", postBody: `id_token=${encodeURIComponent(idToken)}&providerId=google.com`, returnSecureToken: true }),
  });
  const json = await res.json();
  if (!json.idToken) throw new Error(`가짜 Google 로그인 실패: ${JSON.stringify(json)}`);
  return json.idToken;
}

const form = { nickname: "하린", grade: "중1", interests: [], under14: true, agreeTerms: true, agreePrivacy: true };
const tokenOf = (link) => new URL(link).searchParams.get("t");

console.log(`API = ${API}\n\n— 만 14세 미만: 요청 → 보호자 동의`);
const kid = await googleLogin(`kid-${stamp}@teenspark.test`, "하린");
await call("POST", "/auth/google/signup", { token: kid, body: form, expect: 400 }); // 보호자 이메일 없음
await call("POST", "/auth/google/signup", { token: kid, body: { ...form, guardianEmail: `kid-${stamp}@teenspark.test` }, expect: 400 }); // 내 이메일
const sent = await call("POST", "/auth/google/signup", { token: kid, body: { ...form, guardianEmail: `mom-${stamp}@teenspark.test` }, expect: 202 });
const link = sent.data?.pending?.devLink;
console.log(`    pending → ${sent.data?.pending?.guardianEmail} · 만료 ${sent.data?.pending?.expiresAt}`);
if (!link) { failed++; console.log("❌ devLink 없음 (메일 키가 설정돼 있으면 이 시험은 메일함에서 링크를 꺼내야 해요)"); }
await call("POST", "/auth/google/signup", { token: kid, body: { ...form, guardianEmail: `mom-${stamp}@teenspark.test` }, expect: 429 }); // 1분 안에 다시 보내기
const check = await call("POST", "/auth/google", { token: kid });
console.log(`    /auth/google → registered=${check.data?.registered} pending.status=${check.data?.pending?.status}`);
if (check.data?.registered !== false || check.data?.pending?.status !== "pending") failed++;
await call("GET", "/me", { token: kid, expect: 403 }); // 아직 회원 아님

const t = link && tokenOf(link);
await call("GET", "/guardian/not-a-real-token-xxxxxxxxxxxxxx", { expect: 404 });
const info = await call("GET", `/guardian/${t}`);
console.log(`    보호자 화면 → ${info.data?.child?.nickname} ${info.data?.child?.grade} ${info.data?.child?.email} · ${info.data?.status}`);
await call("POST", `/guardian/${t}`, { body: { decision: "approve" }, expect: 400 }); // 체크 안 함
await call("POST", `/guardian/${t}`, { body: { decision: "approve", isGuardian: true, agreed: true } });
await call("POST", `/guardian/${t}`, { body: { decision: "approve", isGuardian: true, agreed: true }, expect: 409 }); // 두 번
const after = await call("GET", `/guardian/${t}`);
console.log(`    보호자 화면(동의 뒤) → status=${after.data?.status} child=${after.data?.child}`);
const me = await call("GET", "/me", { token: kid });
console.log(`    회원 → ${me.data?.nickname} ${me.data?.grade} under14=${me.data?.under14}`);
if (me.data?.under14 !== true) failed++;

console.log("\n— 보호자가 거부");
const kid2 = await googleLogin(`kid2-${stamp}@teenspark.test`, "도윤");
const sent2 = await call("POST", "/auth/google/signup", { token: kid2, body: { ...form, nickname: "도윤", guardianEmail: `dad-${stamp}@teenspark.test` }, expect: 202 });
const t2 = tokenOf(sent2.data?.pending?.devLink ?? "http://x/?t=");
await call("POST", `/guardian/${t2}`, { body: { decision: "decline" } });
const check2 = await call("POST", "/auth/google", { token: kid2 });
console.log(`    학생 화면 → pending.status=${check2.data?.pending?.status}`);
if (check2.data?.pending?.status !== "declined") failed++;
await call("GET", "/me", { token: kid2, expect: 403 });
const again = await call("POST", "/auth/google/guardian/resend", { token: kid2, body: { guardianEmail: `mom2-${stamp}@teenspark.test` }, expect: 429 }); // 거부 뒤 다시 보내기 — 학생 정보가 남아 있고, 1분 쿨다운이 이어진다
console.log(`    다시 보내기 → ${again.error?.message}`);

console.log("\n— 학생이 취소");
const kid3 = await googleLogin(`kid3-${stamp}@teenspark.test`, "서아");
await call("POST", "/auth/google/signup", { token: kid3, body: { ...form, nickname: "서아", guardianEmail: `g3-${stamp}@teenspark.test` }, expect: 202 });
await call("DELETE", "/auth/google/guardian", { token: kid3 });
const check3 = await call("POST", "/auth/google", { token: kid3 });
if (check3.data?.pending !== null) { failed++; console.log("❌ 취소했는데 pending 이 남음"); }

console.log("\n— 만 14세 이상은 바로 가입");
const teen = await googleLogin(`teen-${stamp}@teenspark.test`, "민준");
await call("POST", "/auth/google/signup", { token: teen, body: { ...form, nickname: "민준", grade: "중3", under14: false }, expect: 201 });

console.log(failed ? `\n❌ ${failed}개 실패` : "\n✅ 모두 통과");
process.exit(failed ? 1 : 0);
