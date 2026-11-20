// 학생 기록 저장 — 질문 · 답 · 되묻기를 회원별 Firestore 에 쌓는다.
//
//   users/{uid}
//     └ projects/{pid}              프로젝트
//         ├ turns/{tid}             질문 하나 (분석 · 열림 · 6요소 · 국면)
//         ├ messages/{mid}          대화 한 줄 (user · answer · coach · rq …)
//         └ askbacks/{rid}          되묻기 — 코치가 물은 것 + 학생이 답한 것 + 점수
//
// 브라우저는 지금처럼 localStorage 에 먼저 쓰고, 로그인했으면 바뀐 기록만 POST /me/sync 로 올린다.
// 같은 id 로 다시 보내면 덮어쓴다(멱등) — 몇 번을 보내도 DB 는 같은 모양이 된다.
import type { Request, Response, Router } from "express";
import { z } from "zod";
import { db, FieldValue, paths } from "../lib/firebase";
import { ApiError, notFound, ok, parse } from "../lib/http";
import { publicUser } from "../lib/users";
import { feedbackInput, fromFeedback, idkFeedback, localGrade, type FeedbackResult } from "@front/lib/grade";
import { reportToMd } from "@front/lib/report";
import { elementAdd, elementById } from "@front/lib/rq";
import type { ReverseQuestion, WindowReport } from "@front/lib/types";
import { askCoach } from "../llm/claude";
import { getLlmSettings } from "../llm/settings";
import type { ProjectDoc } from "./projects";
import { addTokens, contextOf, logCall } from "./turn";

// ── 입력 모양 ────────────────────────────────────────────────
const Id = z.string().regex(/^[A-Za-z0-9_-]{1,80}$/, "id 는 영문 · 숫자 · _ · - 로 80자 이하예요.");
const Ms = z.number().int().nonnegative(); // 밀리초 시각 (Date.now())
const MAX_RECORD = 200_000; // 기록 한 개의 JSON 크기 상한 (Firestore 문서 한도 1MB 보다 넉넉히 작게)

const small = <S extends z.ZodType>(s: S) =>
  s.refine((v) => JSON.stringify(v).length <= MAX_RECORD, "기록 하나가 너무 커요 (200KB 이하).");

const ProjectRec = small(z.looseObject({ id: Id, name: z.string().trim().min(1).max(80), createdAt: Ms, updatedAt: Ms.optional() }));
const TurnRec = small(z.looseObject({ id: Id, projectId: Id, question: z.string().min(1).max(4000), createdAt: Ms }));
const MessageRec = small(
  z.looseObject({ id: Id, projectId: Id, kind: z.enum(["user", "answer", "coach", "rq", "deepPick", "deepQ"]), createdAt: Ms }),
);
const AskbackRec = small(
  z.looseObject({ id: Id, projectId: Id, turnId: z.string().max(80), question: z.string().min(1).max(4000), status: z.enum(["open", "answered", "later"]), createdAt: Ms }),
);

// 리포트는 id 가 없고 (프로젝트, 몇 번째) 로 찾는다 — 문서 id = seq
const ReportRec = small(z.looseObject({ projectId: Id, seq: z.number().int().min(1).max(10_000), index: z.number().int(), createdAt: Ms }));

const MAX_BATCH = 400; // Firestore 배치 한 번에 500 쓰기 — 통계 갱신 몫을 남긴다
const SyncBody = z
  .object({
    projects: z.array(ProjectRec).default([]),
    turns: z.array(TurnRec).default([]),
    messages: z.array(MessageRec).default([]),
    askbacks: z.array(AskbackRec).default([]),
    reports: z.array(ReportRec).default([]),
  })
  .refine((b) => b.projects.length + b.turns.length + b.messages.length + b.askbacks.length + b.reports.length <= MAX_BATCH, `한 번에 ${MAX_BATCH}개까지 보낼 수 있어요.`);

type Kind = "turns" | "messages" | "askbacks";
const SCHEMA: Record<Kind, z.ZodType> = { turns: TurnRec, messages: MessageRec, askbacks: AskbackRec };

/** 저장할 모양 — id · projectId 는 경로에 있으니 빼고, 사진 원본은 크니까 장 수만 남긴다 */
function stored(rec: Record<string, unknown>, now: number) {
  const { id: _id, projectId: _pid, images, ...rest } = rec;
  const out: Record<string, unknown> = { ...rest, syncedAt: now };
  if (Array.isArray(images) && images.length) out.imageCount = images.length;
  return out;
}

// ── POST /me/sync — 바뀐 기록 묶음 올리기 ───────────────────────
export async function syncHandler(req: Request, res: Response) {
  const body = parse(SyncBody, req.body);
  const uid = req.user!.uid;
  const now = Date.now();

  // 부모 프로젝트가 있어야 기록을 받는다 (이번 묶음에 같이 왔거나, 이미 DB 에 있거나)
  const incoming = new Set(body.projects.map((p) => p.id));
  const referenced = [...new Set([...body.turns, ...body.messages, ...body.askbacks, ...body.reports].map((r) => r.projectId))].filter((p) => !incoming.has(p));
  if (referenced.length) {
    const snaps = await db.getAll(...referenced.map((p) => paths.project(uid, p)));
    const missing = snaps.filter((s) => !s.exists).map((s) => s.id);
    if (missing.length) throw new ApiError(422, "unknown_project", "없는 프로젝트의 기록이 섞여 있어요. 프로젝트를 먼저 보내 주세요.", { projectIds: missing });
  }

  // 새로 생기는 것만 통계에 더한다 — 다시 보낸 기록은 세지 않는다
  const projectRefs = body.projects.map((p) => paths.project(uid, p.id));
  const turnRefs = body.turns.map((t) => paths.turns(uid, t.projectId).doc(t.id));
  const askbackRefs = body.askbacks.map((a) => paths.askbacks(uid, a.projectId).doc(a.id));
  const [pSnaps, tSnaps, aSnaps] = await Promise.all([
    projectRefs.length ? db.getAll(...projectRefs) : [],
    turnRefs.length ? db.getAll(...turnRefs) : [],
    askbackRefs.length ? db.getAll(...askbackRefs) : [],
  ]);
  const newProjects = pSnaps.filter((s) => !s.exists).length;
  const newTurnsByProject = new Map<string, number>();
  tSnaps.forEach((s, i) => {
    if (!s.exists) newTurnsByProject.set(body.turns[i].projectId, (newTurnsByProject.get(body.turns[i].projectId) ?? 0) + 1);
  });
  const newTurns = [...newTurnsByProject.values()].reduce((a, b) => a + b, 0);
  const newAskbacks = aSnaps.filter((s) => !s.exists).length;
  const answeredAskbacks = body.askbacks.filter((a) => a.status === "answered").length;

  const batch = db.batch();
  body.projects.forEach((p, i) => {
    const { id: _id, ...rest } = p;
    // merge — 서버만 아는 칸(turnCount · isDefault)은 지우지 않는다
    batch.set(projectRefs[i], { ...rest, ...(pSnaps[i].exists ? {} : { turnCount: 0 }), syncedAt: now }, { merge: true });
  });
  body.turns.forEach((t, i) => batch.set(turnRefs[i], stored(t, now)));
  body.messages.forEach((m) => batch.set(paths.messages(uid, m.projectId).doc(m.id), stored(m, now)));
  body.askbacks.forEach((a, i) => batch.set(askbackRefs[i], stored(a, now)));
  body.reports.forEach((r) => {
    const { projectId: _pid, ...rest } = r;
    batch.set(paths.reports(uid, r.projectId).doc(String(r.seq)), { ...rest, syncedAt: now });
  });
  newTurnsByProject.forEach((n, pid) => batch.set(paths.project(uid, pid), { turnCount: FieldValue.increment(n) }, { merge: true }));
  if (newProjects || newTurns || newAskbacks) {
    batch.update(paths.user(uid), {
      "stats.projects": FieldValue.increment(newProjects),
      "stats.turns": FieldValue.increment(newTurns),
      "stats.askbacks": FieldValue.increment(newAskbacks),
    });
  }
  await batch.commit();

  ok(res, {
    saved: { projects: body.projects.length, turns: body.turns.length, messages: body.messages.length, askbacks: body.askbacks.length, reports: body.reports.length },
    created: { projects: newProjects, turns: newTurns, askbacks: newAskbacks },
    answeredAskbacks,
    syncedAt: now,
  });
}

// ── GET /me/records — 브라우저가 저장하는 모양 그대로 내려준다 (로그인한 기기에서 합치기용) ──
/** 서버에만 있는 칸(syncedAt)은 빼고, 경로에 있던 id · projectId 를 되돌려 놓는다 */
const back = (pid: string) => (d: FirebaseFirestore.QueryDocumentSnapshot) => {
  const { syncedAt: _s, ...rest } = d.data();
  return { id: d.id, projectId: pid, ...rest };
};

export async function recordsHandler(req: Request, res: Response) {
  const { uid } = req.user!;
  const pSnap = await paths.projects(uid).get();
  const out = { projects: [] as Doc[], turns: [] as Doc[], messages: [] as Doc[], askbacks: [] as Doc[], reports: [] as Record<string, unknown>[] };
  await Promise.all(
    pSnap.docs.map(async (p) => {
      const { syncedAt: _s, turnCount: _t, isDefault: _d, ...project } = p.data();
      out.projects.push({ id: p.id, ...project });
      const [t, m, a, r] = await Promise.all([paths.turns(uid, p.id).get(), paths.messages(uid, p.id).get(), paths.askbacks(uid, p.id).get(), paths.reports(uid, p.id).get()]);
      out.turns.push(...t.docs.map(back(p.id)));
      out.messages.push(...m.docs.map(back(p.id)));
      out.askbacks.push(...a.docs.map(back(p.id)));
      out.reports.push(...r.docs.map((d) => {
        const { syncedAt: _x, model: _m, ...rest } = d.data();
        return { ...rest, projectId: p.id, seq: Number(d.id) };
      }));
    }),
  );
  for (const k of ["projects", "turns", "messages", "askbacks", "reports"] as const) out[k].sort((x, y) => Number(x.createdAt ?? 0) - Number(y.createdAt ?? 0));
  ok(res, { ...out, serverTime: Date.now() });
}

// ── GET /me/export — 내 기록 전부를 구조화된 JSON 하나로 ─────────────
interface Doc {
  id: string;
  [k: string]: unknown;
}
const docs = (snap: FirebaseFirestore.QuerySnapshot): Doc[] => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
const byTime = (a: Doc, b: Doc) => Number(a.createdAt ?? 0) - Number(b.createdAt ?? 0);

/** 질문 하나 = 질문 + 분석 + 답 + 그 질문에서 나온 되묻기들 */
function qaOf(turns: Doc[], messages: Doc[], askbacks: Doc[]) {
  const answers = new Map(messages.filter((m) => m.kind === "answer").map((m) => [String(m.turnId), m]));
  const asks = new Map<string, Doc[]>();
  for (const a of askbacks) asks.set(String(a.turnId), [...(asks.get(String(a.turnId)) ?? []), a]);
  return turns.sort(byTime).map((t, i) => {
    const a = answers.get(t.id);
    return {
      n: (t.n as number) ?? i + 1,
      turnId: t.id,
      askedAt: new Date(Number(t.createdAt)).toISOString(),
      question: t.question,
      analysis: t.analysis ?? null,
      role: t.role ?? null,
      source: t.source ?? null,
      answer: a
        ? { md: a.md, role: a.role ?? null, roleReason: a.roleReason ?? "", assumptions: a.assumptions ?? [], yourCall: a.yourCall ?? [], riskNote: a.riskNote ?? null }
        : null,
      askbacks: (asks.get(t.id) ?? []).sort(byTime).map((r) => ({
        id: r.id,
        question: r.question,
        element: r.element ?? null,
        axis: r.axis ?? null,
        status: r.status,
        answer: r.answer ?? null,
        score: r.score ?? null,
        feedback: r.feedback ?? null,
        answeredAt: r.answeredAt ? new Date(Number(r.answeredAt)).toISOString() : null,
      })),
    };
  });
}

/** 리포트 응답 모양 — 숫자 칸 + 문장 칸 + 누가 썼나 */
function reportView(r: WindowReport & { model?: string | null }) {
  return {
    seq: r.seq ?? 1,
    index: r.index,
    headline: r.headline ?? null,
    writtenBy: r.writtenBy ?? "local",
    model: r.model ?? null,
    turnRange: r.turnRange,
    stage: r.stage,
    mix: r.mix,
    six: r.six,
    roles: r.roles,
    elements: r.elements,
    stuck: r.stuck,
    best: r.best,
    lastMission: r.lastMission,
    nextMission: r.nextMission,
    mixComment: r.mixComment,
    opened: r.opened,
    createdAt: new Date(Number(r.createdAt)).toISOString(),
  };
}

export async function exportHandler(req: Request, res: Response) {
  const { uid, doc } = req.user!;
  const only = typeof req.query.projectId === "string" ? req.query.projectId : null;
  const pSnap = only ? [await paths.project(uid, only).get()].filter((s) => s.exists) : (await paths.projects(uid).orderBy("updatedAt", "desc").get()).docs;
  if (only && !pSnap.length) throw notFound("프로젝트");

  const projects = await Promise.all(
    pSnap.map(async (p) => {
      const [t, m, a, rp] = await Promise.all([paths.turns(uid, p.id).get(), paths.messages(uid, p.id).get(), paths.askbacks(uid, p.id).get(), paths.reports(uid, p.id).get()]);
      const data = p.data()!;
      const qa = qaOf(docs(t), docs(m), docs(a));
      return {
        id: p.id,
        name: data.name,
        emoji: data.emoji ?? null,
        desc: data.desc ?? "",
        format: data.format ?? null,
        checks: data.checks ?? {},
        createdAt: new Date(Number(data.createdAt)).toISOString(),
        counts: { questions: qa.length, askbacks: a.size, answeredAskbacks: qa.reduce((s, q) => s + q.askbacks.filter((r) => r.status === "answered").length, 0), reports: rp.size },
        qa,
        reports: rp.docs.map((d) => reportView(d.data() as WindowReport)).sort((x, y) => x.seq - y.seq),
      };
    }),
  );

  const out = { schema: "teenspark.export/v1", exportedAt: new Date().toISOString(), user: publicUser(uid, doc), projects };
  if (req.query.download === "1") {
    res.set("Content-Disposition", `attachment; filename="teenspark-${new Date().toISOString().slice(0, 10)}.json"`);
    res.type("application/json").send(JSON.stringify(out, null, 2));
    return;
  }
  ok(res, out);
}

// ── /projects/{id}/… — 기록 하나씩 (REST 자원) ──────────────────────
const AnswerBody = z
  .object({
    text: z.string().trim().min(1, "답을 적어 주세요.").max(1000).optional(),
    option: z.number().int().min(0).max(5).optional(), // F1 보기 번호 (0부터)
    idk: z.literal(true).optional(), // '잘 모르겠어'
  })
  .refine((b) => [b.text !== undefined && b.option === undefined, b.option !== undefined, b.idk].filter(Boolean).length === 1, "text · option · idk 중 하나만 보내 주세요.");

export function recordRoutes(r: Router, getKey: () => string | undefined) {
  const project = async (uid: string, pid: string) => {
    if (!(await paths.project(uid, pid).get()).exists) throw notFound("프로젝트");
  };

  /** 질문 하나와 그 답 · 되묻기를 한 번에 */
  r.get("/:id/turns/:tid", async (req, res) => {
    const { uid } = req.user!;
    const pid = String(req.params.id);
    const tid = String(req.params.tid);
    const t = await paths.turns(uid, pid).doc(tid).get();
    if (!t.exists) throw notFound("질문");
    const [m, a] = await Promise.all([
      paths.messages(uid, pid).where("turnId", "==", tid).get(),
      paths.askbacks(uid, pid).where("turnId", "==", tid).get(),
    ]);
    ok(res, qaOf([{ id: t.id, ...t.data() }], docs(m), docs(a))[0]);
  });

  r.get("/:id/askbacks", async (req, res) => {
    const { uid } = req.user!;
    const pid = String(req.params.id);
    await project(uid, pid);
    let q: FirebaseFirestore.Query = paths.askbacks(uid, pid);
    const status = req.query.status;
    if (status === "open" || status === "answered" || status === "later") q = q.where("status", "==", status);
    ok(res, docs(await q.get()).sort(byTime));
  });

  r.get("/:id/askbacks/:rid", async (req, res) => {
    const s = await paths.askbacks(req.user!.uid, String(req.params.id)).doc(String(req.params.rid)).get();
    if (!s.exists) throw notFound("되묻기");
    ok(res, { id: s.id, ...s.data() });
  });

  /**
   * 되묻기에 답하기 — 채점해서 저장하고 코치 피드백을 대화에 남긴다.
   *   글로 답함  → Claude feedback 태스크 (실패하면 규칙 채점)
   *   보기 고름  → 보기 점수 · 규칙 피드백
   *   잘 모르겠어 → 0점 · 받아 주는 말
   * 이미 답한 되묻기는 409 — 다시 고치려면 PUT 으로 통째로 저장한다.
   */
  r.post("/:id/askbacks/:rid/answer", async (req, res) => {
    const body = parse(AnswerBody, req.body);
    const user = req.user!;
    const pid = String(req.params.id);
    const rid = String(req.params.rid);
    const [pSnap, aSnap] = await Promise.all([paths.project(user.uid, pid).get(), paths.askbacks(user.uid, pid).doc(rid).get()]);
    if (!pSnap.exists) throw notFound("프로젝트");
    if (!aSnap.exists) throw notFound("되묻기");
    const rq = { id: rid, projectId: pid, ...aSnap.data() } as ReverseQuestion & { source?: string };
    if (rq.status === "answered") throw new ApiError(409, "already_answered", "이미 답한 되묻기예요.", { answer: rq.answer, score: rq.score });

    let text = body.text ?? "";
    let fb: FeedbackResult;
    let gradedBy: "claude" | "local" = "local";
    if (body.idk) {
      text = "잘 모르겠어";
      fb = idkFeedback(elementById(rq.element)?.coachView ?? rq.coachView);
    } else if (body.option !== undefined) {
      const opt = rq.options?.[body.option];
      if (!opt) throw new ApiError(400, "invalid_input", "없는 보기예요.", [{ field: "option", message: `보기는 0~${(rq.options?.length ?? 1) - 1} 이에요.` }]);
      text = opt.label;
      fb = localGrade(rq, text, opt.score, "", elementAdd(rq.element));
    } else {
      const last = await paths.messages(user.uid, pid).where("turnId", "==", rq.turnId).get();
      const lastMd = String(last.docs.find((d) => d.get("kind") === "answer")?.get("md") ?? "");
      const settings = await getLlmSettings();
      const c = await askCoach("feedback", { apiKey: getKey(), settings, input: feedbackInput(rq, text, lastMd), context: contextOf(user, pSnap.data() as ProjectDoc) });
      await Promise.all([logCall(user.uid, pid, settings.tasks.coach.model, c, "feedback"), addTokens(user.uid, c)]);
      if (c.ok) {
        fb = fromFeedback(c.out);
        gradedBy = "claude";
      } else fb = localGrade(rq, text, null, lastMd, elementAdd(rq.element));
    }

    const now = Date.now();
    const patch = { status: "answered" as const, answer: text, score: fb.score, reason: fb.reason, feedback: fb.feedback, gradedBy, answeredAt: now };
    const coachRef = paths.messages(user.uid, pid).doc();
    const coach = { kind: "coach", md: fb.feedback, rqId: rid, createdAt: now };
    const batch = db.batch();
    batch.update(aSnap.ref, patch);
    batch.set(coachRef, coach);
    batch.update(paths.project(user.uid, pid), { laterStreak: 0, updatedAt: now });
    await batch.commit();
    ok(res, { askback: { ...rq, ...patch }, coachMessage: { id: coachRef.id, ...coach } });
  });

  // ── 10문 리포트 ──
  const reportsOf = async (uid: string, pid: string) => (await paths.reports(uid, pid).get()).docs.map((d) => d.data() as WindowReport & { model?: string | null }).sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));

  r.get("/:id/reports", async (req, res) => {
    const { uid } = req.user!;
    const pid = String(req.params.id);
    await project(uid, pid);
    ok(res, (await reportsOf(uid, pid)).map((x) => ({ seq: x.seq, headline: x.headline ?? null, turnRange: x.turnRange, writtenBy: x.writtenBy ?? "local", opened: x.opened, createdAt: new Date(Number(x.createdAt)).toISOString() })));
  });

  /** 리포트 한 장 — Accept: text/markdown 이거나 ?format=md 이면 .md 로 (화면과 같은 8칸) */
  r.get("/:id/reports/:seq", async (req, res) => {
    const { uid, doc } = req.user!;
    const pid = String(req.params.id);
    const all = await reportsOf(uid, pid);
    const one = all.find((x) => String(x.seq) === String(req.params.seq));
    if (!one) throw notFound("리포트");
    if (req.query.format === "md" || req.accepts(["application/json", "text/markdown"]) === "text/markdown") {
      const name = String(doc.nickname ?? "학생");
      res.set("Content-Disposition", `inline; filename="report-${one.seq}.md"`);
      res.type("text/markdown; charset=utf-8").send(reportToMd(one, all, name));
      return;
    }
    ok(res, reportView(one));
  });

  /** 학생이 리포트를 열었음 · 다음 미션을 자기 말로 고침 */
  const ReportPatch = z
    .object({ opened: z.boolean().optional(), missionText: z.string().trim().min(1).max(80).optional() })
    .refine((v) => Object.keys(v).length > 0, "바꿀 항목을 하나 이상 보내 주세요.");
  r.patch("/:id/reports/:seq", async (req, res) => {
    const body = parse(ReportPatch, req.body);
    const { uid } = req.user!;
    const ref = paths.reports(uid, String(req.params.id)).doc(String(req.params.seq));
    const snap = await ref.get();
    if (!snap.exists) throw notFound("리포트");
    const cur = snap.data() as WindowReport;
    await ref.update({
      ...(body.opened !== undefined ? { opened: body.opened } : {}),
      ...(body.missionText ? { nextMission: { ...cur.nextMission, text: body.missionText, editedByStudent: true } } : {}),
    });
    ok(res, reportView((await ref.get()).data() as WindowReport));
  });

  /** PUT = 이 id 로 통째로 저장 (없으면 만들고 201, 있으면 바꾸고 200) */
  for (const kind of ["turns", "messages", "askbacks"] as Kind[]) {
    r.put(`/:id/${kind}/:rid`, async (req, res) => {
      const { uid } = req.user!;
      const pid = String(req.params.id);
      const rid = String(req.params.rid);
      const body = parse(SCHEMA[kind], { ...req.body, id: rid, projectId: pid }) as Record<string, unknown>;
      await project(uid, pid);
      const ref = paths[kind](uid, pid).doc(rid);
      const existed = (await ref.get()).exists;
      await ref.set(stored(body, Date.now()));
      if (!existed && kind !== "messages") {
        await paths.user(uid).update({ [`stats.${kind}`]: FieldValue.increment(1) });
        if (kind === "turns") await paths.project(uid, pid).update({ turnCount: FieldValue.increment(1) });
      }
      res.location(`${req.baseUrl}/${pid}/${kind}/${rid}`);
      ok(res, { id: rid, ...(await ref.get()).data() }, existed ? 200 : 201);
    });
  }
}

