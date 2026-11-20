// 만 14세 미만 가입 — 보호자(법정대리인) 이메일 동의 확인
// 개인정보 보호법 제22조의2 · 시행령 제17조의2 ①: "동의 내용을 적은 전자우편을 발송하고 법정대리인으로부터 동의의 의사표시가 적힌 전자우편을 받는 방법"에 준해,
// 보호자 메일의 링크에서 보호자가 직접 "동의합니다"를 누르는 것으로 확인한다.
//
//   학생  POST /auth/google/signup (under14, guardianEmail)  → guardianRequests/{uid} 저장 + 보호자에게 메일   (202 pending)
//   학생  POST /auth/google                                  → 가입 전이면 { registered:false, profile, pending }  (팝업이 기다리는 화면을 띄움)
//   보호자 GET  /guardian/:token                              → 학생 · 수집 항목 확인
//   보호자 POST /guardian/:token { decision }                 → approve: users/{uid} 생성 · decline: 학생 정보 지우고 결과만 남김
//   매일   cleanupGuardianRequests()                          → 5일 지난 요청과 가입 안 된 로그인 기록 삭제
//
// 학생 정보(닉네임 · 학년 · 이메일)는 보호자 확인 전까지 이 요청 문서에만 두고, 5일 안에 동의가 없으면 지운다.
import { createHash, randomBytes } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { auth, db, isEmulator, paths, serialize, Timestamp } from "../lib/firebase";
import { ApiError, ok, parse } from "../lib/http";
import { guardianDoneMail, guardianMail, maskEmail, sendMail } from "../lib/mail";
import { adminEmails, type Role, type UserDoc } from "../lib/users";

export const GUARDIAN_TTL_MS = 5 * 24 * 3600_000; // 시행령 제17조의2 ②: 동의를 확인하지 못하면 5일 안에 파기
const RESEND_COOLDOWN_MS = 60_000;
const MAX_SENDS = 5;

export interface GuardianForm {
  nickname: string;
  grade: string;
  interests: string[];
}

interface GuardianRequest {
  uid: string;
  status: "pending" | "approved" | "declined";
  tokenHash: string;
  guardianEmail: string;
  expiresAt: Timestamp;
  createdAt: Timestamp;
  // 아래는 pending 동안만 — 결정이 나면 지운다
  childEmail?: string;
  form?: GuardianForm;
  sends?: number;
  lastSentAt?: Timestamp;
  decidedAt?: Timestamp;
}

/** 학생 화면에 보여 줄 대기 상태 */
export interface GuardianPending {
  status: "pending" | "declined";
  guardianEmail: string; // 가린 주소
  expiresAt: string;
  lastSentAt: string | null;
  sends: number;
  canResendAt: string | null;
  devLink?: string; // 메일 키가 없을 때(에뮬레이터 · 설정 전) 시험용 링크
}

const ref = (uid: string) => db.doc(`guardianRequests/${uid}`);
const hash = (token: string) => createHash("sha256").update(token).digest("hex");
const appUrl = () => (process.env.APP_URL || (isEmulator() ? "http://localhost:3000" : "https://www.teensparkai.com")).replace(/\/$/, "");

let mailKey: () => string | undefined = () => undefined;
export const useMailKey = (getter: () => string | undefined) => {
  mailKey = getter;
};

function toPending(r: GuardianRequest, devLink?: string): GuardianPending {
  const last = r.lastSentAt?.toMillis() ?? null;
  return {
    status: r.status === "declined" ? "declined" : "pending",
    guardianEmail: maskEmail(r.guardianEmail),
    expiresAt: serialize(r.expiresAt) as unknown as string,
    lastSentAt: last ? new Date(last).toISOString() : null,
    sends: r.sends ?? 0,
    canResendAt: last ? new Date(last + RESEND_COOLDOWN_MS).toISOString() : null,
    devLink,
  };
}

/** 학생의 대기 중인 요청 (없거나 만료면 null) */
export async function pendingOf(uid: string): Promise<GuardianPending | null> {
  const snap = await ref(uid).get();
  if (!snap.exists) return null;
  const r = snap.data() as GuardianRequest;
  if (r.expiresAt.toMillis() < Date.now() || r.status === "approved") return null;
  return toPending(r);
}

/** 보호자에게 동의 요청 메일 보내기 — 같은 학생이 다시 부르면 다시 보내기(주소를 바꿔도 된다) */
export async function requestGuardianConsent(p: { uid: string; childEmail: string; guardianEmail: string; form: GuardianForm }): Promise<GuardianPending> {
  const guardianEmail = p.guardianEmail.trim().toLowerCase();
  if (guardianEmail === p.childEmail) throw new ApiError(400, "guardian_email_same", "보호자의 이메일을 적어 주세요. (내 이메일과 같아요)", [{ field: "guardianEmail", message: "보호자의 이메일이 아니에요." }]);

  const now = Date.now();
  const prev = (await ref(p.uid).get()).data() as GuardianRequest | undefined;
  const live = prev && prev.status !== "approved" && prev.expiresAt.toMillis() > now ? prev : undefined; // 거부된 요청도 같은 5일 · 같은 횟수 안에서 다시 보낸다
  if (live?.lastSentAt && now - live.lastSentAt.toMillis() < RESEND_COOLDOWN_MS) {
    throw new ApiError(429, "guardian_resend_wait", "방금 보냈어요. 1분 뒤에 다시 보낼 수 있어요.", toPending(live));
  }
  if ((live?.sends ?? 0) >= MAX_SENDS) throw new ApiError(429, "guardian_too_many", `메일은 ${MAX_SENDS}번까지 보낼 수 있어요. 보호자 메일함(스팸함 포함)을 확인해 주세요.`, toPending(live!));

  const token = randomBytes(24).toString("base64url");
  const expiresAt = live?.expiresAt ?? Timestamp.fromMillis(now + GUARDIAN_TTL_MS); // 다시 보내도 5일은 처음 요청부터 센다
  const doc: GuardianRequest = {
    uid: p.uid,
    status: "pending",
    tokenHash: hash(token), // 링크의 토큰 원문은 저장하지 않는다
    guardianEmail,
    childEmail: p.childEmail,
    form: p.form,
    expiresAt,
    createdAt: live?.createdAt ?? Timestamp.now(),
    sends: (live?.sends ?? 0) + 1,
    lastSentAt: Timestamp.now(),
  };

  const link = `${appUrl()}/guardian?t=${token}`;
  const mail = await sendMail(mailKey(), guardianMail({ to: guardianEmail, nickname: p.form.nickname, childEmail: p.childEmail, grade: p.form.grade, link, expiresAt: expiresAt.toDate() }));
  if (!mail.sent && mail.reason === "failed") throw new ApiError(502, "mail_failed", `보호자에게 메일을 보내지 못했어요. 주소를 확인하고 다시 해 주세요. (${mail.message})`);
  if (!mail.sent && !isEmulator()) throw new ApiError(503, "mail_not_configured", "지금은 보호자 확인 메일을 보낼 수 없어요. 잠시 뒤 다시 해 주세요.");

  await ref(p.uid).set(doc);
  return toPending(doc, mail.sent ? undefined : link);
}

/** 다시 보내기 · 보호자 주소 바꾸기 — 처음 요청에 담긴 학생 정보를 그대로 쓴다 (거부된 뒤에도 5일 안이면 다시 보낼 수 있다) */
export async function resendGuardianRequest(uid: string, guardianEmail?: string): Promise<GuardianPending> {
  const r = (await ref(uid).get()).data() as GuardianRequest | undefined;
  if (!r || r.status === "approved" || !r.form || !r.childEmail || r.expiresAt.toMillis() < Date.now()) {
    throw new ApiError(404, "guardian_not_found", "보낼 요청이 없어요. 처음부터 다시 가입해 주세요.");
  }
  return requestGuardianConsent({ uid, childEmail: r.childEmail, guardianEmail: guardianEmail ?? r.guardianEmail, form: r.form });
}

export async function cancelGuardianRequest(uid: string) {
  await ref(uid).delete();
}

async function byToken(token: string) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) throw new ApiError(404, "guardian_not_found", "올바른 링크가 아니에요. 메일의 버튼을 다시 눌러 주세요.");
  const q = await db.collection("guardianRequests").where("tokenHash", "==", hash(token)).limit(1).get();
  if (q.empty) throw new ApiError(404, "guardian_not_found", "요청을 찾을 수 없어요. 학생이 다시 보냈다면 가장 최근 메일의 링크를 눌러 주세요.");
  return q.docs[0].ref;
}

/** 가입하지 않은 Google 로그인 기록(이메일 · 이름 · 사진)을 지운다 — 가입 문서가 있으면 건드리지 않는다 */
async function dropUnregisteredLogin(uid: string) {
  if ((await paths.user(uid).get()).exists) return;
  await auth.deleteUser(uid).catch((e) => {
    if ((e as { code?: string }).code !== "auth/user-not-found") throw e;
  });
}

// ── 보호자가 여는 공개 주소 (토큰이 곧 권한) ─────────────────────
export const guardianRouter = Router();

guardianRouter.get("/:token", async (req, res) => {
  const r = (await (await byToken(req.params.token)).get()).data() as GuardianRequest;
  const expired = r.status === "pending" && r.expiresAt.toMillis() < Date.now();
  ok(res, {
    status: expired ? "expired" : r.status,
    child: r.form ? { nickname: r.form.nickname, grade: r.form.grade, email: maskEmail(r.childEmail ?? "") } : null,
    guardianEmail: maskEmail(r.guardianEmail),
    expiresAt: serialize(r.expiresAt),
    decidedAt: r.decidedAt ? serialize(r.decidedAt) : null,
  });
});

const Decision = z.object({
  decision: z.enum(["approve", "decline"], { message: "동의 여부를 골라 주세요." }),
  isGuardian: z.boolean().optional(), // approve 일 때 true 여야 한다
  agreed: z.boolean().optional(), // approve 일 때 true 여야 한다
});

guardianRouter.post("/:token", async (req, res) => {
  const body = parse(Decision, req.body);
  if (body.decision === "approve" && !(body.isGuardian && body.agreed)) {
    throw new ApiError(400, "guardian_confirm_required", "법정대리인 확인과 동의 항목에 모두 체크해 주세요.");
  }
  const docRef = await byToken(req.params.token);

  const result = await db.runTransaction(async (tx) => {
    const r = (await tx.get(docRef)).data() as GuardianRequest | undefined;
    if (!r) throw new ApiError(404, "guardian_not_found", "요청을 찾을 수 없어요.");
    if (r.status !== "pending") throw new ApiError(409, "guardian_decided", r.status === "approved" ? "이미 동의하셨어요." : "이미 동의하지 않음으로 처리됐어요.");
    if (r.expiresAt.toMillis() < Date.now()) throw new ApiError(410, "guardian_expired", "링크가 만료됐어요. 학생에게 다시 요청해 달라고 해 주세요.");
    const now = Timestamp.now();
    const decided: GuardianRequest = { uid: r.uid, status: body.decision === "approve" ? "approved" : "declined", tokenHash: r.tokenHash, guardianEmail: r.guardianEmail, expiresAt: r.expiresAt, createdAt: r.createdAt, decidedAt: now };
    // 거부: 학생이 다른 보호자 주소로 다시 보낼 수 있게 학생 정보는 만료일(최대 5일)까지 둔다

    if (body.decision === "approve") {
      const userRef = paths.user(r.uid);
      if ((await tx.get(userRef)).exists) throw new ApiError(409, "already_registered", "이미 가입된 학생이에요.");
      const email = r.childEmail ?? "";
      const role: Role = adminEmails().includes(email) ? "admin" : "student";
      const doc: UserDoc = {
        email,
        nickname: r.form!.nickname,
        grade: r.form!.grade,
        interests: r.form!.interests,
        role,
        status: "active",
        dailyLimit: null,
        consent: { termsAt: r.createdAt, privacyAt: r.createdAt, under14: true, guardianAt: now, guardianEmail: r.guardianEmail, guardianMethod: "email" },
        stats: { projects: 0, turns: 0 },
        createdAt: now,
        updatedAt: now,
        lastLoginAt: null,
      };
      tx.set(userRef, doc);
      tx.set(docRef, decided); // 학생 정보는 지우고 결과만 남긴다 (만료일에 정리)
      return { uid: r.uid, role, approved: true, guardianEmail: r.guardianEmail, nickname: r.form!.nickname, at: now.toDate() };
    }
    tx.set(docRef, { ...decided, childEmail: r.childEmail, form: r.form, sends: r.sends, lastSentAt: r.lastSentAt });
    return { uid: r.uid, role: null, approved: false, guardianEmail: r.guardianEmail, nickname: "", at: now.toDate() };
  });

  // 거부: 학생 화면이 "보호자가 동의하지 않았어요"를 볼 수 있게 결과만 남기고, 로그인 기록은 만료일 정리 때 지운다
  if (result.approved) {
    await auth.setCustomUserClaims(result.uid, { role: result.role });
    // 동의를 확인했다고 보호자에게 알린다 — 실패해도 동의 자체는 이미 처리됐으므로 로그만 남긴다
    await sendMail(mailKey(), guardianDoneMail({ to: result.guardianEmail, nickname: result.nickname, at: result.at, contact: process.env.PRIVACY_CONTACT || "privacy@teensparkai.com" }));
  }
  ok(res, { status: result.approved ? "approved" : "declined" });
});

/** 매일 정리 — 만료된 보호자 요청 · 그 학생의 가입 안 된 로그인 기록 · 1년 지난 AI 호출 기록 */
export async function cleanupExpired() {
  const now = Timestamp.now();
  const expired = await db.collection("guardianRequests").where("expiresAt", "<", now).limit(500).get();
  for (const d of expired.docs) {
    const r = d.data() as GuardianRequest;
    if (r.status !== "approved") await dropUnregisteredLogin(r.uid);
    await d.ref.delete();
  }
  const yearAgo = Timestamp.fromMillis(Date.now() - 365 * 24 * 3600_000);
  let calls = 0;
  for (;;) {
    const old = await paths.llmCalls().where("createdAt", "<", yearAgo).limit(400).get();
    if (old.empty) break;
    const batch = db.batch();
    old.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    calls += old.size;
  }
  return { guardianRequests: expired.size, llmCalls: calls };
}
