// 관리자 — 회원 관리 · Claude 모델 설정 · 호출 기록
import { Router } from "express";
import { z } from "zod";
import { auth, db, FieldValue, kstDay, paths, serialize } from "../lib/firebase";
import { ApiError, notFound, ok, parse } from "../lib/http";
import { deleteUserCompletely, Grade, Nickname, publicUser, ROLES, type UserDoc } from "../lib/users";
import { askClaude, listModels } from "../llm/claude";
import { getLlmSettings, KNOWN_MODELS, LlmSettingsPatch, resetLlmSettings, updateLlmSettings } from "../llm/settings";

export function adminRouter(getKey: () => string | undefined) {
  const r = Router();

  /* ---------- 회원 관리 ---------- */

  r.get("/users", async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    let q: FirebaseFirestore.Query = db.collection("users");
    if (typeof req.query.email === "string" && req.query.email) q = q.where("email", "==", req.query.email.trim().toLowerCase());
    if (typeof req.query.role === "string" && req.query.role) q = q.where("role", "==", req.query.role);
    if (typeof req.query.status === "string" && req.query.status) q = q.where("status", "==", req.query.status);
    q = q.orderBy("createdAt", "desc").limit(limit);
    if (typeof req.query.cursor === "string" && req.query.cursor) {
      const after = await paths.user(req.query.cursor).get();
      if (after.exists) q = q.startAfter(after);
    }
    const snap = await q.get();
    const [total] = await Promise.all([db.collection("users").count().get()]);
    ok(res, {
      items: snap.docs.map((d) => publicUser(d.id, d.data() as UserDoc)),
      nextCursor: snap.size === limit ? snap.docs[snap.size - 1].id : null,
      total: total.data().count,
    });
  });

  r.get("/users/:uid", async (req, res) => {
    const snap = await paths.user(req.params.uid).get();
    if (!snap.exists) throw notFound("회원");
    const days = Array.from({ length: 7 }, (_, i) => kstDay(Date.now() - i * 86400_000));
    const usage = await Promise.all(days.map((d) => paths.usage(req.params.uid, d).get()));
    ok(res, {
      ...publicUser(snap.id, snap.data() as UserDoc),
      consent: serialize((snap.data() as UserDoc).consent),
      last7Days: usage.map((u, i) => ({ day: days[i], turns: u.data()?.turns ?? 0, inputTokens: u.data()?.inputTokens ?? 0, outputTokens: u.data()?.outputTokens ?? 0 })),
    });
  });

  const PatchUser = z
    .object({
      role: z.enum(ROLES),
      status: z.enum(["active", "suspended"]),
      dailyLimit: z.number().int().min(0).max(10_000).nullable(),
      nickname: Nickname,
      grade: Grade,
    })
    .partial()
    .refine((v) => Object.keys(v).length > 0, "바꿀 항목을 하나 이상 보내 주세요.");

  r.patch("/users/:uid", async (req, res) => {
    const body = parse(PatchUser, req.body);
    const uid = req.params.uid;
    const ref = paths.user(uid);
    if (!(await ref.get()).exists) throw notFound("회원");
    if (uid === req.user!.uid && (body.role && body.role !== "admin" || body.status === "suspended")) {
      throw new ApiError(400, "self_lockout", "자기 자신의 관리자 권한을 빼거나 정지할 수는 없어요.");
    }
    if (body.role) await auth.setCustomUserClaims(uid, { role: body.role });
    if (body.status) {
      await auth.updateUser(uid, { disabled: body.status === "suspended" });
      if (body.status === "suspended") await auth.revokeRefreshTokens(uid); // 바로 로그아웃
    }
    if (body.nickname) await auth.updateUser(uid, { displayName: body.nickname });
    await ref.update({ ...body, updatedAt: FieldValue.serverTimestamp() });
    ok(res, publicUser(uid, (await ref.get()).data() as UserDoc));
  });

  r.delete("/users/:uid", async (req, res) => {
    if (req.params.uid === req.user!.uid) throw new ApiError(400, "self_delete", "자기 계정은 /me 에서 탈퇴해 주세요.");
    if (!(await paths.user(req.params.uid).get()).exists) throw notFound("회원");
    await deleteUserCompletely(req.params.uid);
    ok(res, { deleted: true });
  });

  /* ---------- Claude 모델 설정 ---------- */

  r.get("/settings/llm", async (_req, res) => {
    const settings = await getLlmSettings(true);
    ok(res, { ...settings, apiKeyConfigured: Boolean(getKey()) });
  });

  r.patch("/settings/llm", async (req, res) => {
    const patch = parse(LlmSettingsPatch, req.body);
    ok(res, await updateLlmSettings(patch, req.user!.uid));
  });

  r.post("/settings/llm/reset", async (req, res) => {
    ok(res, await resetLlmSettings(req.user!.uid));
  });

  r.get("/models", async (_req, res) => {
    const key = getKey();
    if (key) {
      try {
        ok(res, { source: "anthropic", items: await listModels(key) });
        return;
      } catch (e) {
        console.warn("models.list failed", e);
      }
    }
    ok(res, { source: "builtin", items: KNOWN_MODELS });
  });

  /** 저장하지 않고 지금 설정(또는 보낸 설정)으로 한 번 답해 보기 — 모델을 바꾸기 전에 확인용 */
  r.post("/settings/llm/test", async (req, res) => {
    const body = parse(z.object({ text: z.string().trim().min(1).max(2000), override: LlmSettingsPatch.optional() }), req.body);
    const current = await getLlmSettings(true);
    const settings = {
      ...current,
      ...(body.override ?? {}),
      enabled: true,
      tasks: { ...current.tasks, answer: { ...current.tasks.answer, ...(body.override?.tasks?.answer ?? {}) } },
    };
    const result = await askClaude({ apiKey: getKey(), settings, question: body.text, context: "관리자 시험 질문", history: [] });
    await paths.llmCalls().add({
      uid: req.user!.uid,
      task: "admin-test",
      model: result.ok ? result.model : settings.tasks.answer.model,
      ok: result.ok,
      reason: result.ok ? null : result.reason,
      ...(result.ok ? result.usage : {}),
      ms: result.ms,
      createdAt: FieldValue.serverTimestamp(),
    });
    ok(res, { settings: settings.tasks.answer, result });
  });

  /* ---------- 기록 ---------- */

  r.get("/llm-calls", async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    let q: FirebaseFirestore.Query = paths.llmCalls();
    if (typeof req.query.uid === "string" && req.query.uid) q = q.where("uid", "==", req.query.uid);
    const snap = await q.orderBy("createdAt", "desc").limit(limit).get();
    ok(res, snap.docs.map((d) => serialize({ id: d.id, ...d.data() })));
  });

  r.get("/stats", async (_req, res) => {
    const today = kstDay();
    const [users, admins, suspended, todayUsage] = await Promise.all([
      db.collection("users").count().get(),
      db.collection("users").where("role", "==", "admin").count().get(),
      db.collection("users").where("status", "==", "suspended").count().get(),
      db.collectionGroup("usage").where("day", "==", today).get(),
    ]);
    const sum = (k: string) => todayUsage.docs.reduce((a, d) => a + ((d.data()[k] as number) ?? 0), 0);
    ok(res, {
      users: users.data().count,
      admins: admins.data().count,
      suspended: suspended.data().count,
      today: { day: today, activeUsers: todayUsage.size, turns: sum("turns"), inputTokens: sum("inputTokens"), outputTokens: sum("outputTokens") },
    });
  });

  return r;
}
