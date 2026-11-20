// 프로젝트 · 질문(턴) · 대화 REST
import { Router } from "express";
import { z } from "zod";
import formats from "@front/data/formats.json";
import { db, FieldValue, paths } from "../lib/firebase";
import type { Response } from "express";
import { ApiError, notFound, ok, parse } from "../lib/http";
import { runTurn } from "./turn";

export const FORMAT_KEYS = Object.keys(formats.formats) as [string, ...string[]];

export interface ProjectDoc {
  name: string;
  desc: string;
  emoji: string;
  format?: string;
  packs: string[];
  rhythm: 2 | 3 | 4;
  answerOnly: boolean;
  counter: number;
  barIndex: number;
  laterStreak: number;
  checks?: Record<string, string>;
  isDefault?: boolean;
  turnCount: number;
  createdAt: number;
  updatedAt: number;
}

const ProjectBody = z.object({
  name: z.string().trim().min(1, "프로젝트 이름을 적어 주세요.").max(40),
  desc: z.string().trim().max(300).default(""),
  emoji: z.string().trim().min(1).max(8).default("💡"),
  format: z.enum(FORMAT_KEYS).optional(),
  rhythm: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(2),
});
const ProjectPatch = ProjectBody.partial().extend({ checks: z.record(z.string().max(40), z.string().max(200)).optional(), answerOnly: z.boolean().optional() });

const DataUrl = z.string().regex(/^data:image\/(jpeg|png|webp|gif);base64,/, "사진은 data:image/...;base64, 형식이어야 해요.").max(4_000_000);
export const TurnBody = z.object({
  text: z.string().trim().min(1, "질문을 적어 주세요.").max(2000, "질문은 2000자 이하로 적어 주세요."),
  images: z.array(DataUrl).max(3).default([]),
});

const view = (id: string, d: ProjectDoc) => ({ id, ...d });

export async function createProject(uid: string, body: z.infer<typeof ProjectBody>, isDefault = false) {
  const now = Date.now();
  const doc: ProjectDoc = {
    name: body.name,
    desc: body.desc,
    emoji: body.emoji,
    format: body.format,
    packs: body.format ? ((formats.formats as Record<string, { defaultPacks?: string[] }>)[body.format]?.defaultPacks ?? []) : [],
    rhythm: body.rhythm,
    answerOnly: false,
    counter: 0,
    barIndex: 0,
    laterStreak: 0,
    isDefault,
    turnCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  const ref = paths.projects(uid).doc();
  const batch = db.batch();
  batch.set(ref, doc);
  batch.set(ref.collection("messages").doc(), {
    kind: "coach",
    md: `**${doc.emoji} ${doc.name}** 프로젝트를 시작했어! 지금 가장 궁금한 걸 한 줄로 물어봐. 목표 · 지금 상황 · 제약을 같이 적으면 더 나한테 맞는 답을 줄 수 있어.`,
    createdAt: now,
  });
  batch.update(paths.user(uid), { "stats.projects": FieldValue.increment(1) });
  await batch.commit();
  return view(ref.id, doc);
}

export function projectsRouter(getKey: () => string | undefined) {
  const r = Router();

  r.get("/", async (req, res) => {
    const snap = await paths.projects(req.user!.uid).orderBy("updatedAt", "desc").limit(100).get();
    ok(res, snap.docs.map((d) => view(d.id, d.data() as ProjectDoc)));
  });

  r.post("/", async (req, res) => {
    ok(res, await createProject(req.user!.uid, parse(ProjectBody, req.body)), 201);
  });

  r.get("/:id", async (req, res) => {
    const snap = await paths.project(req.user!.uid, req.params.id).get();
    if (!snap.exists) throw notFound("프로젝트");
    ok(res, view(snap.id, snap.data() as ProjectDoc));
  });

  r.patch("/:id", async (req, res) => {
    const body = parse(ProjectPatch, req.body);
    const ref = paths.project(req.user!.uid, req.params.id);
    if (!(await ref.get()).exists) throw notFound("프로젝트");
    await ref.update({ ...body, updatedAt: Date.now() });
    ok(res, view(ref.id, (await ref.get()).data() as ProjectDoc));
  });

  r.delete("/:id", async (req, res) => {
    const ref = paths.project(req.user!.uid, req.params.id);
    if (!(await ref.get()).exists) throw notFound("프로젝트");
    await db.recursiveDelete(ref);
    await paths.user(req.user!.uid).update({ "stats.projects": FieldValue.increment(-1) });
    ok(res, { deleted: true });
  });

  /** 질문하기 — 이 API 의 핵심 */
  r.post("/:id/turns", async (req, res) => {
    const body = parse(TurnBody, req.body);
    const result = await runTurn({ user: req.user!, projectId: req.params.id, text: body.text, images: body.images, apiKey: getKey() });
    ok(res, result, result.outcome === "answered" ? 201 : 200);
  });

  /** 즉답 — 같은 질문하기를 Server-Sent Events 로. 답 글자가 생기는 대로 delta 이벤트가 온다 */
  r.post("/:id/turns/stream", async (req, res) => {
    const body = parse(TurnBody, req.body);
    await streamTurn(res, (onEvent) => runTurn({ user: req.user!, projectId: req.params.id, text: body.text, images: body.images, apiKey: getKey(), onEvent }));
  });

  r.get("/:id/turns", async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const snap = await paths.turns(req.user!.uid, req.params.id).orderBy("createdAt", "desc").limit(limit).get();
    ok(res, snap.docs.map((d) => ({ id: d.id, ...d.data() })).reverse());
  });

  /** 대화 — ?before=<createdAt ms> 로 더 오래된 것을 이어 읽는다 */
  r.get("/:id/messages", async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    let q = paths.messages(req.user!.uid, req.params.id).orderBy("createdAt", "desc").limit(limit);
    const before = Number(req.query.before);
    if (Number.isFinite(before) && before > 0) q = q.where("createdAt", "<", before);
    const snap = await q.get();
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() })).reverse();
    ok(res, { items, nextBefore: snap.size === limit ? (items[0] as { createdAt?: number }).createdAt ?? null : null });
  });

  return r;
}

/**
 * SSE 로 한 턴을 흘려보낸다.
 *   event: analysis  { analysis, model }          관문을 지나 답을 만들기 시작
 *   event: delta     { text }                      답(md) 조각 — 이어 붙이면 전체 답
 *   event: done      { …POST /turns 와 같은 결과 }  저장까지 끝난 최종 결과 (이걸 기준으로 화면을 확정)
 *   event: error     { code, message }             시작한 뒤에 실패
 * 시작 전 오류(입력 · 404 · 하루 한도)는 보통 JSON 오류로 온다.
 */
export async function streamTurn(res: Response, run: (onEvent: (event: "analysis" | "delta", data: unknown) => void) => Promise<unknown>) {
  let started = false;
  const send = (event: string, data: unknown) => {
    if (!started) {
      started = true;
      res.status(200);
      res.set({ "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" });
      res.flushHeaders();
    }
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };
  const ping = setInterval(() => started && res.write(": ping\n\n"), 10_000);
  try {
    const result = await run(send);
    send("done", result);
    res.end();
  } catch (e) {
    if (!started) throw e;
    const err = e instanceof ApiError ? { code: e.code, message: e.message } : { code: "internal", message: "서버에서 문제가 생겼어요." };
    if (!(e instanceof ApiError)) console.error("stream turn failed", e);
    send("error", err);
    res.end();
  } finally {
    clearInterval(ping);
  }
}

/** POST /ask — 프로젝트를 고르지 않고 바로 묻기. 처음 부르면 "빠른 질문" 프로젝트를 만들어 쓴다. */
export function askHandler(getKey: () => string | undefined, stream = false) {
  const Body = TurnBody.extend({ projectId: z.string().min(1).optional() });
  return async (req: import("express").Request, res: import("express").Response) => {
    const body = parse(Body, req.body);
    const uid = req.user!.uid;
    let projectId = body.projectId;
    if (!projectId) {
      const existing = await paths.projects(uid).where("isDefault", "==", true).limit(1).get();
      projectId = existing.empty
        ? (await createProject(uid, { name: "빠른 질문", desc: "", emoji: "💬", rhythm: 2 }, true)).id
        : existing.docs[0].id;
    }
    if (stream) {
      await streamTurn(res, async (onEvent) => ({ projectId, ...(await runTurn({ user: req.user!, projectId: projectId!, text: body.text, images: body.images, apiKey: getKey(), onEvent })) }));
      return;
    }
    const result = await runTurn({ user: req.user!, projectId, text: body.text, images: body.images, apiKey: getKey() });
    ok(res, { projectId, ...result }, result.outcome === "answered" ? 201 : 200);
  };
}
