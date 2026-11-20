// 회원가입 · 로그인 · 토큰 갱신 · 로그아웃 · 비밀번호 재설정
import { Router } from "express";
import { z } from "zod";
import { auth, FieldValue, paths, Timestamp } from "../lib/firebase";
import { ApiError, ok, parse } from "../lib/http";
import { refreshIdToken, sendPasswordReset, signInWithPassword } from "../lib/identity";
import { cancelGuardianRequest, pendingOf, requestGuardianConsent, resendGuardianRequest } from "./guardian";
import { adminEmails, ensureUserDoc, Grade, Interests, Nickname, Password, publicUser, requireUser, type Role, type UserDoc } from "../lib/users";

export const authRouter = Router();

const Email = z.string().trim().toLowerCase().email("이메일 형식이 아니에요.");

const SignupBody = z.object({
  email: Email,
  password: Password,
  nickname: Nickname,
  grade: Grade,
  interests: Interests.default([]),
  under14: z.boolean({ message: "만 14세 미만인지 알려 주세요." }),
  guardianConsent: z.boolean().default(false),
  agreeTerms: z.literal(true, { message: "이용약관에 동의해야 가입할 수 있어요." }),
  agreePrivacy: z.literal(true, { message: "개인정보 수집 · 이용에 동의해야 가입할 수 있어요." }),
});

authRouter.post("/signup", async (req, res) => {
  const body = parse(SignupBody, req.body);
  // 개인정보 보호법: 만 14세 미만은 법정대리인 동의를 회사가 확인해야 한다 — 이메일 가입에는 그 확인 절차가 없으므로 받지 않는다
  if (body.under14) {
    throw new ApiError(400, "guardian_consent_required", "만 14세 미만은 Google로 가입해 주세요. 보호자에게 동의 확인 메일을 보내 드려요.", [{ field: "under14", message: "보호자 확인이 필요해요." }]);
  }

  let uid: string;
  try {
    uid = (await auth.createUser({ email: body.email, password: body.password, displayName: body.nickname })).uid;
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "auth/email-already-exists") throw new ApiError(409, "email_taken", "이미 가입한 이메일이에요. 로그인해 주세요.");
    if (code === "auth/invalid-password") throw new ApiError(400, "weak_password", "비밀번호가 너무 약해요.");
    throw e;
  }

  const role: Role = adminEmails().includes(body.email) ? "admin" : "student";
  const now = Timestamp.now();
  const doc: UserDoc = {
    email: body.email,
    nickname: body.nickname,
    grade: body.grade,
    interests: body.interests,
    role,
    status: "active",
    dailyLimit: null,
    consent: { termsAt: now, privacyAt: now, under14: body.under14, guardianAt: body.under14 ? now : null },
    stats: { projects: 0, turns: 0 },
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  };
  try {
    await auth.setCustomUserClaims(uid, { role });
    await paths.user(uid).set(doc);
  } catch (e) {
    await auth.deleteUser(uid).catch(() => undefined); // 반쯤 만들어진 계정을 남기지 않는다
    throw e;
  }

  const tokens = await signInWithPassword(body.email, body.password);
  ok(res, { user: publicUser(uid, doc), tokens: strip(tokens) }, 201);
});

const LoginBody = z.object({ email: Email, password: z.string().min(1, "비밀번호를 적어 주세요.") });

authRouter.post("/login", async (req, res) => {
  const body = parse(LoginBody, req.body);
  const tokens = await signInWithPassword(body.email, body.password);
  const doc = await ensureUserDoc(tokens.uid);
  if (doc.status === "suspended") throw new ApiError(403, "account_suspended", "이용이 정지된 계정이에요.");
  await paths.user(tokens.uid).update({ lastLoginAt: FieldValue.serverTimestamp() });
  ok(res, { user: publicUser(tokens.uid, doc), tokens: strip(tokens) });
});

authRouter.post("/refresh", async (req, res) => {
  const body = parse(z.object({ refreshToken: z.string().min(1) }), req.body);
  ok(res, { tokens: strip(await refreshIdToken(body.refreshToken)) });
});

/** 모든 기기에서 로그아웃 — 지금까지 받은 토큰을 전부 무효로 만든다 */
authRouter.post("/logout", requireUser, async (req, res) => {
  await auth.revokeRefreshTokens(req.user!.uid);
  ok(res, { loggedOut: true });
});

authRouter.post("/password-reset", async (req, res) => {
  const body = parse(z.object({ email: Email }), req.body);
  await sendPasswordReset(body.email);
  ok(res, { sent: true, message: "가입한 이메일이라면 비밀번호 재설정 메일을 보냈어요." });
});

// ── Google 로그인 ─────────────────────────────────────────────
// 브라우저가 Firebase JS SDK(signInWithPopup)로 Google 로그인을 하고, 받은 ID 토큰을 Bearer 로 보낸다.
//   POST /auth/google          이미 가입했으면 회원 정보, 아니면 { registered: false, profile } → 가입 화면
//   POST /auth/google/signup   동의 · 닉네임 · 학년을 받아 회원 문서를 만든다

async function googleToken(authorization: string | undefined) {
  const m = /^Bearer\s+(.+)$/i.exec(authorization ?? "");
  if (!m) throw new ApiError(401, "unauthenticated", "Google 로그인 토큰이 필요해요.");
  let decoded;
  try {
    decoded = await auth.verifyIdToken(m[1], true);
  } catch {
    throw new ApiError(401, "invalid_token", "Google 로그인이 만료됐어요. 다시 로그인해 주세요.");
  }
  if (decoded.firebase?.sign_in_provider !== "google.com") throw new ApiError(400, "not_google", "Google 계정으로 로그인한 토큰이 아니에요.");
  return decoded;
}

authRouter.post("/google", async (req, res) => {
  const t = await googleToken(req.headers.authorization);
  const snap = await paths.user(t.uid).get();
  if (!snap.exists) {
    // 만 14세 미만이 보호자 동의를 기다리는 중이면 pending 을 함께 준다 → 팝업이 "기다리는 중" 화면을 띄운다
    ok(res, { registered: false, profile: { email: (t.email ?? "").toLowerCase(), name: (t.name as string | undefined) ?? "", picture: (t.picture as string | undefined) ?? null }, pending: await pendingOf(t.uid) });
    return;
  }
  const doc = snap.data() as UserDoc;
  if (doc.status === "suspended") throw new ApiError(403, "account_suspended", "이용이 정지된 계정이에요.");
  await paths.user(t.uid).update({ lastLoginAt: FieldValue.serverTimestamp() });
  ok(res, { registered: true, user: publicUser(t.uid, doc) });
});

const GoogleSignupBody = SignupBody.omit({ email: true, password: true, guardianConsent: true }).extend({
  guardianEmail: Email.optional(), // 만 14세 미만이면 꼭 — 보호자에게 동의 확인 메일을 보낸다
});

authRouter.post("/google/signup", async (req, res) => {
  const t = await googleToken(req.headers.authorization);
  const body = parse(GoogleSignupBody, req.body);
  const ref = paths.user(t.uid);
  if ((await ref.get()).exists) throw new ApiError(409, "already_registered", "이미 가입했어요. 바로 시작하면 돼요.");

  // 만 14세 미만: 회원 문서를 바로 만들지 않고, 보호자가 메일 링크에서 동의하면 그때 만든다 (routes/guardian.ts)
  if (body.under14) {
    if (!body.guardianEmail) throw new ApiError(400, "guardian_email_required", "보호자의 이메일을 적어 주세요.", [{ field: "guardianEmail", message: "보호자에게 동의 확인 메일을 보내요." }]);
    const pending = await requestGuardianConsent({
      uid: t.uid,
      childEmail: (t.email ?? "").toLowerCase(),
      guardianEmail: body.guardianEmail,
      form: { nickname: body.nickname, grade: body.grade, interests: body.interests },
    });
    ok(res, { registered: false, pending }, 202);
    return;
  }

  const email = (t.email ?? "").toLowerCase();
  const role: Role = email && t.email_verified && adminEmails().includes(email) ? "admin" : "student";
  const now = Timestamp.now();
  const doc: UserDoc = {
    email,
    nickname: body.nickname,
    grade: body.grade,
    interests: body.interests,
    role,
    status: "active",
    dailyLimit: null,
    consent: { termsAt: now, privacyAt: now, under14: body.under14, guardianAt: body.under14 ? now : null },
    stats: { projects: 0, turns: 0 },
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  };
  await ref.set(doc);
  await auth.setCustomUserClaims(t.uid, { role });
  ok(res, { registered: true, user: publicUser(t.uid, doc) }, 201);
});

/** 보호자 동의 요청 다시 보내기 — guardianEmail 을 주면 그 주소로 바꿔 보낸다 */
authRouter.post("/google/guardian/resend", async (req, res) => {
  const t = await googleToken(req.headers.authorization);
  const body = parse(z.object({ guardianEmail: Email.optional() }), req.body);
  ok(res, { pending: await resendGuardianRequest(t.uid, body.guardianEmail) });
});

/** 보호자 동의 요청 취소 — 학생이 "취소"를 누르거나 다른 계정으로 바꿀 때 */
authRouter.delete("/google/guardian", async (req, res) => {
  const t = await googleToken(req.headers.authorization);
  await cancelGuardianRequest(t.uid);
  ok(res, { cancelled: true });
});

function strip(t: { idToken: string; refreshToken: string; expiresIn: number }) {
  return { idToken: t.idToken, refreshToken: t.refreshToken, expiresIn: t.expiresIn, tokenType: "Bearer" };
}
