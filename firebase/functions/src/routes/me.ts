// 내 정보 · 고치기 · 비밀번호 바꾸기 · 사용량 · 탈퇴
import { Router } from "express";
import { z } from "zod";
import { auth, FieldValue, kstDay, paths } from "../lib/firebase";
import { ApiError, ok, parse } from "../lib/http";
import { signInWithPassword } from "../lib/identity";
import { deleteUserCompletely, Grade, Interests, Nickname, Password, publicUser, type UserDoc } from "../lib/users";
import { exportHandler, recordsHandler, syncHandler } from "../coach/records";
import { getLlmSettings } from "../llm/settings";

export const meRouter = Router();

meRouter.get("/", (req, res) => ok(res, publicUser(req.user!.uid, req.user!.doc)));

const PatchMe = z
  .object({ nickname: Nickname, grade: Grade, interests: Interests })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "바꿀 항목을 하나 이상 보내 주세요.");

meRouter.patch("/", async (req, res) => {
  const body = parse(PatchMe, req.body);
  const { uid } = req.user!;
  await paths.user(uid).update({ ...body, updatedAt: FieldValue.serverTimestamp() });
  if (body.nickname) await auth.updateUser(uid, { displayName: body.nickname });
  const fresh = (await paths.user(uid).get()).data() as UserDoc;
  ok(res, publicUser(uid, fresh));
});

/** 브라우저에 쌓인 질문 · 답 · 되묻기를 올린다 (바뀐 것만, 같은 id 는 덮어쓰기) */
meRouter.post("/sync", syncHandler);

/** 내 기록 전부를 브라우저 저장 모양 그대로 — 로그인한 기기가 내려받아 화면에 합친다 */
meRouter.get("/records", recordsHandler);

/** 내 기록 전부를 구조화된 JSON 하나로 (?projectId= 하나만 · ?download=1 파일로) */
meRouter.get("/export", exportHandler);

meRouter.post("/password", async (req, res) => {
  const body = parse(z.object({ currentPassword: z.string().min(1), newPassword: Password }), req.body);
  const { uid, email } = req.user!;
  await signInWithPassword(email, body.currentPassword).catch((e) => {
    if (e instanceof ApiError && e.code === "invalid_credentials") throw new ApiError(400, "wrong_password", "지금 비밀번호가 맞지 않아요.");
    throw e;
  });
  await auth.updateUser(uid, { password: body.newPassword });
  await auth.revokeRefreshTokens(uid); // 다른 기기는 로그아웃
  const tokens = await signInWithPassword(email, body.newPassword);
  ok(res, { changed: true, tokens: { idToken: tokens.idToken, refreshToken: tokens.refreshToken, expiresIn: tokens.expiresIn, tokenType: "Bearer" } });
});

meRouter.get("/usage", async (req, res) => {
  const { uid, doc } = req.user!;
  const settings = await getLlmSettings();
  const days = Array.from({ length: 7 }, (_, i) => kstDay(Date.now() - i * 86400_000));
  const snaps = await Promise.all(days.map((d) => paths.usage(uid, d).get()));
  const history = snaps.map((s, i) => ({ day: days[i], turns: (s.data()?.turns as number) ?? 0 }));
  const limit = doc.dailyLimit ?? settings.dailyTurnLimit;
  ok(res, { today: history[0].turns, limit, remaining: Math.max(0, limit - history[0].turns), last7Days: history });
});

/** 탈퇴 — 이메일 회원은 비밀번호를 한 번 더, Google 회원은 5분 안에 다시 로그인했는지 확인한다 */
meRouter.delete("/", async (req, res) => {
  const { uid, email, provider, authTime } = req.user!;
  if (provider === "google.com") {
    if (Date.now() / 1000 - authTime > 5 * 60) throw new ApiError(401, "recent_login_required", "탈퇴하려면 Google 로 한 번 더 로그인해 주세요.");
  } else {
    const body = parse(z.object({ password: z.string().min(1, "비밀번호를 한 번 더 적어 주세요.") }), req.body);
    await signInWithPassword(email, body.password).catch((e) => {
      if (e instanceof ApiError && e.code === "invalid_credentials") throw new ApiError(400, "wrong_password", "비밀번호가 맞지 않아요.");
      throw e;
    });
  }
  await deleteUserCompletely(uid);
  ok(res, { deleted: true });
});
