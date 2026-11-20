// 이 기기의 기록을 "가입한 계정"에 묶는다 — 올리기 · 내려받기 · 계정이 바뀔 때 치우기.
//
//   localStorage 에 먼저 쓴다 (지금처럼, 오프라인에서도 동작)
//        │  write() 가 일어나면 2초 기다렸다가
//        ▼
//   바뀐 기록만 ── POST /api/v1/me/sync ──▶ users/{uid}/projects/{pid}/{turns · messages · askbacks · reports}
//   로그인하면 ◀── GET /api/v1/me/records ── 서버 기록을 내려받아 이 기기 기록과 합친다
//
// 기록 주인(owner) — 이 기기의 기록이 누구 것인지 localStorage 에 적어 둔다.
//   로그인 안 한 채 쓴 기록(주인 없음) → 처음 로그인한 계정 것이 된다
//   같은 계정                          → 내려받아 합치기
//   다른 계정 · 로그아웃                → 앞 사람 기록을 화면에서 치운다
//                                       (서버에 다 올라갔으면 지우고, 못 올린 게 있으면 그 사람 몫으로 따로 보관)
//
// "바뀐 기록"은 기록마다 지문(JSON 해시)을 기억해 두고 비교해서 고른다.
// 같은 id 로 다시 보내도 서버는 덮어쓰기만 하므로(멱등) 실패하면 다음 번에 그대로 다시 보내면 된다.
"use client";

import { api, ApiFailure } from "./account";
import { putRecords, read, resetRecords, subscribe, takeRecords, update, write } from "./db";
import type { Message, Project, ReverseQuestion, Turn, WindowReport } from "./types";

const CHUNK = 300; // 서버 한도 400 보다 작게
const WAIT_MS = 2000;
const PRINTS = (uid: string) => `askback:sync:${uid}`;
const STASH = (uid: string) => `askback:stash:${uid}`;
const OWNER = "askback:owner";
const EXAMPLE = "prj_example_"; // 예시 프로젝트 — 누구의 기록도 아니다

type Kind = "projects" | "turns" | "messages" | "askbacks" | "reports";
const KINDS: Kind[] = ["projects", "turns", "messages", "askbacks", "reports"];
const TABLE = { projects: "projects", turns: "turns", messages: "messages", askbacks: "rqs", reports: "reports" } as const;
type Rec = Record<string, unknown>;
type Prints = Record<string, string>; // "turns:t_abc" → 지문

/** 리포트는 id 가 없어서 (프로젝트, 몇 번째) 로 가린다 */
const keyOf = (kind: Kind, rec: Rec) => (kind === "reports" ? `reports:${String(rec.projectId)}:${String(rec.seq)}` : `${kind}:${String(rec.id)}`);
const projectOf = (kind: Kind, rec: Rec) => String(kind === "projects" ? rec.id : rec.projectId);
const isExample = (pid: string) => pid.startsWith(EXAMPLE);

/** 짧은 문자열 해시 (FNV-1a) — 내용이 바뀌었는지만 알면 된다 */
function print(value: unknown): string {
  const s = JSON.stringify(value);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return `${s.length}.${(h >>> 0).toString(36)}`;
}

// ── localStorage 작은 칸들 (모두 try — 막힌 브라우저에서도 앱은 돈다) ──
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 공간이 꽉 차도 다음 번에 다시 하면 된다
  }
}
const ownerNow = () => load<string | null>(OWNER, null);

/** 서버로 보낼 모양 — 사진 원본은 빼고 장 수만 */
function toOut(kind: Kind, rec: Rec): Rec {
  if (kind !== "messages" || rec.kind !== "user" || !Array.isArray(rec.images) || !rec.images.length) return rec;
  const { images, ...rest } = rec;
  return { ...rest, imageCount: (images as unknown[]).length };
}

/** 이 기기에서 계정에 올릴 기록 — 예시 · 예전 형식 리포트는 빼고 */
function localRecords(): Record<Kind, Rec[]> {
  const projects = read("projects").filter((p) => !isExample(p.id));
  const ids = new Set(projects.map((p) => p.id));
  const mine = <T extends { projectId: string }>(list: T[]) => list.filter((x) => ids.has(x.projectId)) as unknown as Rec[];
  return {
    projects: projects as unknown as Rec[],
    turns: mine(read("turns")),
    messages: mine(read("messages")),
    askbacks: mine(read("rqs")),
    reports: read("reports").filter((r) => r.projectId && ids.has(r.projectId) && r.seq && !r.example && !r.seed) as unknown as Rec[],
  };
}

/** 아직 서버에 못 올린(지문이 다른) 기록 */
function pendingOf(uid: string) {
  const prints = load<Prints>(PRINTS(uid), {});
  const all = localRecords();
  const queue: { kind: Kind; rec: Rec; key: string; fp: string }[] = [];
  KINDS.forEach((kind) =>
    all[kind].forEach((rec) => {
      const out = toOut(kind, rec);
      const key = keyOf(kind, rec);
      const fp = print(out);
      if (prints[key] !== fp) queue.push({ kind, rec: out, key, fp });
    }),
  );
  return { prints, queue };
}

// ── 올리기 ────────────────────────────────────────────────
let current: string | null = null; // 지금 가입까지 마치고 로그인한 계정
let ready = false; // 내려받아 합치기를 마쳤나 — 마치기 전에는 올리지 않는다 (서버 것을 덮지 않게)
let running = false;
let again = false;

/** 지금 바로 올린다. 올린 기록 수를 돌려준다 */
export async function syncNow(): Promise<number> {
  const uid = current;
  if (!uid || !ready) return 0;
  if (running) {
    again = true;
    return 0;
  }
  running = true;
  let sent = 0;
  try {
    const { prints, queue } = pendingOf(uid);
    // 프로젝트가 먼저 — 서버는 부모 프로젝트가 있어야 기록을 받는다 (KINDS 순서)
    for (let i = 0; i < queue.length; i += CHUNK) {
      if (current !== uid) break; // 올리는 사이 계정이 바뀌면 멈춘다
      const part = queue.slice(i, i + CHUNK);
      const body: Record<Kind, Rec[]> = { projects: [], turns: [], messages: [], askbacks: [], reports: [] };
      part.forEach((q) => body[q.kind].push(q.rec));
      await api("/me/sync", { method: "POST", body });
      part.forEach((q) => (prints[q.key] = q.fp));
      save(PRINTS(uid), prints);
      sent += part.length;
    }
  } catch (e) {
    if (!(e instanceof ApiFailure && (e.status === 401 || e.status === 403))) console.warn("기록 올리기 실패 — 다음에 다시 시도해요", e);
  } finally {
    running = false;
  }
  if (again) {
    again = false;
    sent += await syncNow();
  }
  return sent;
}

// ── 내려받아 합치기 ───────────────────────────────────────
type Remote = Record<Kind, Rec[]>;

/**
 * 서버 기록과 이 기기 기록을 합친다.
 *   이 기기에서 바꾸고 아직 못 올린 기록 → 이 기기 것
 *   그 밖에 양쪽에 다 있는 기록          → 서버 것 (다른 기기에서 고쳤을 수 있다) · 사진은 이 기기 것을 살린다
 *   서버에만 있는 기록                   → 가져온다
 *   이 기기에만 있는 기록                → 남겨 두고 다음 올리기 때 올린다
 */
function merge(uid: string, remote: Remote) {
  const { prints, queue } = pendingOf(uid);
  const dirty = new Set(queue.map((q) => q.key));
  const next: Partial<Record<Kind, Rec[]>> = {};

  KINDS.forEach((kind) => {
    const local = read(TABLE[kind]) as unknown as Rec[];
    const byKey = new Map(local.map((r) => [keyOf(kind, r), r]));
    const out: Rec[] = [];
    const seen = new Set<string>();
    for (const r of local) {
      const key = keyOf(kind, r);
      seen.add(key);
      const server = remote[kind].find((x) => keyOf(kind, x) === key);
      if (!server || dirty.has(key)) out.push(r);
      else out.push(kind === "messages" && Array.isArray(r.images) ? { ...server, images: r.images } : server);
    }
    for (const r of remote[kind]) {
      const key = keyOf(kind, r);
      if (seen.has(key) || isExample(projectOf(kind, r))) continue;
      out.push(r);
    }
    // 내려받은 그대로인 기록은 "이미 올라간 것"으로 적어 둔다 — 다시 올리지 않게
    out.forEach((r) => {
      const key = keyOf(kind, r);
      if (!dirty.has(key) && (remote[kind].some((x) => keyOf(kind, x) === key) || !byKey.has(key))) prints[key] = print(toOut(kind, r));
    });
    next[kind] = kind === "projects" ? out : out.sort((a, b) => Number(a.createdAt ?? 0) - Number(b.createdAt ?? 0));
  });

  // 리포트 index 는 화면에서 여는 열쇠 — 서로 다른 기기에서 만든 번호가 겹치면 뒤의 것을 새 번호로
  const used = new Set<number>();
  let max = Math.max(0, ...(next.reports ?? []).map((r) => Number(r.index) || 0));
  next.reports = (next.reports ?? []).map((r) => {
    const i = Number(r.index) || 0;
    if (i && !used.has(i)) {
      used.add(i);
      return r;
    }
    max += 1;
    used.add(max);
    return { ...r, index: max };
  });

  putRecords({
    projects: next.projects as unknown as Project[],
    turns: next.turns as unknown as Turn[],
    messages: next.messages as unknown as Message[],
    rqs: next.askbacks as unknown as ReverseQuestion[],
    reports: next.reports as unknown as WindowReport[],
  });
  save(PRINTS(uid), prints);

  // 보던 프로젝트가 없으면 가장 최근 것으로 · 전체 질문 수는 합친 기록 기준
  const projects = read("projects");
  update("state", (s) => ({
    ...s,
    currentProjectId: projects.some((p) => p.id === s.currentProjectId) ? s.currentProjectId : ([...projects].sort((a, b) => b.updatedAt - a.updatedAt)[0]?.id ?? null),
    validCount: Math.max(s.validCount, read("turns").length),
  }));
}

async function pull(uid: string) {
  try {
    const remote = await api<Remote>("/me/records");
    if (current !== uid) return; // 받는 사이 계정이 바뀌었다
    merge(uid, remote);
  } catch (e) {
    // 내려받지 못해도 이 기기 기록은 그대로 쓴다 — 올리기는 계속한다
    console.warn("기록 내려받기 실패", e);
  }
}

// ── 계정이 바뀔 때 ─────────────────────────────────────────
/** 앞 사람 기록을 화면에서 치운다. 못 올린 게 있으면 그 사람 몫으로 보관해 두고, 다 올라갔으면 지운다 */
function putAway(owner: string) {
  const { queue } = pendingOf(owner);
  save(STASH(owner), queue.length ? takeRecords() : null);
  resetRecords();
  write("profile", { name: "친구", grade: "중3", interests: [], createdAt: Date.now() });
}

/** 보관해 둔 내 기록이 있으면 되돌린다 (다음에 합치기 · 올리기로 이어진다) */
function bringBack(uid: string) {
  const stash = load<ReturnType<typeof takeRecords> | null>(STASH(uid), null);
  if (!stash) return;
  putRecords(stash);
  save(STASH(uid), null);
}

let lastSeen: string | null | undefined; // 같은 상태로 두 번 불려도 한 번만

/**
 * 계정 상태가 바뀔 때마다 App 이 부른다.
 *   uid    — 가입까지 마치고 로그인한 계정 (아니면 null)
 *   settled — 로그인 확인이 끝났나 (확인 중이면 아무것도 하지 않는다)
 */
export async function syncAccount(uid: string | null, settled: boolean) {
  if (!settled || typeof window === "undefined" || uid === lastSeen) return;
  lastSeen = uid;
  const owner = ownerNow();
  current = uid;
  ready = false;

  if (!uid) {
    // 로그아웃 · 가입 전 계정 — 앞 사람(주인) 기록을 치운다. 주인 없는 기록(로그인 안 하고 쓴 것)은 그대로
    if (owner) {
      putAway(owner);
      save(OWNER, null);
    }
    return;
  }
  if (owner && owner !== uid) putAway(owner); // 다른 사람 기록이 떠 있었다
  if (owner !== uid) {
    bringBack(uid);
    save(OWNER, uid); // 주인 없던 기록은 이 계정 것이 된다
  }
  await pull(uid);
  if (current !== uid) return;
  ready = true;
  await syncNow();
}

/** 로그아웃 전에 못 올린 것을 마저 올린다 (토큰이 있을 때만 올릴 수 있으니까) */
export async function flushBeforeSignOut() {
  await syncNow().catch(() => 0);
}

let started = false;
let timer: ReturnType<typeof setTimeout> | null = null;

/** 앱이 뜰 때 한 번 — 기록이 바뀔 때마다 2초 모아서 올린다 */
export function startSync() {
  if (started || typeof window === "undefined") return;
  started = true;
  subscribe(() => {
    if (!current || !ready) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void syncNow(), WAIT_MS);
  });
}
