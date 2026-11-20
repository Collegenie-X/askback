// 회원 계정 — Google 로그인 → 서버(/api/v1/auth/google)에 가입 여부를 묻는다.
//
//   signedOut ──(Google로 시작하기)──▶ 가입했나?
//                                     ├─ 예  ▶ signedIn
//                                     └─ 아니오 ▶ needsSignup ──(학년 · 동의)──▶ signedIn
//                                                    └─ 만 14세 미만 ──(보호자 이메일)──▶ needsSignup + pending
//                                                                     ──(보호자가 메일 링크에서 동의)──▶ signedIn
//
// 화면 여러 곳(서랍 · 계정 화면)이 같은 상태를 보도록 모듈 하나에 둔다.
"use client";

import { GoogleAuthProvider, onAuthStateChanged, reauthenticateWithPopup, signInWithPopup, signOut as fbSignOut } from "firebase/auth";
import { useSyncExternalStore } from "react";
import { write } from "./db";
import { firebaseAuth } from "./firebase";

export interface Member {
  uid: string;
  email: string;
  nickname: string;
  grade: string;
  interests: string[];
  role: "student" | "teacher" | "admin";
  under14: boolean;
  createdAt: string;
}

export interface GoogleProfile {
  email: string;
  name: string;
  picture: string | null;
}

/** 만 14세 미만 — 보호자 동의를 기다리는 중 */
export interface GuardianPending {
  status: "pending" | "declined";
  guardianEmail: string; // 가린 주소 (mo****@gmail.com)
  expiresAt: string;
  lastSentAt: string | null;
  sends: number;
  canResendAt: string | null;
  devLink?: string; // 메일 키가 없는 개발 환경에서만 — 메일 대신 이 링크로 시험한다
}

export type AccountState =
  | { status: "loading" }
  | { status: "signedOut"; error?: string }
  | { status: "needsSignup"; profile: GoogleProfile; pending: GuardianPending | null; error?: string }
  | { status: "signedIn"; user: Member; picture: string | null };

export interface SignupForm {
  nickname: string;
  grade: string;
  interests: string[];
  under14: boolean;
  guardianEmail?: string; // 만 14세 미만이면 꼭 — 서버가 보호자에게 동의 확인 메일을 보낸다
  agreeTerms: boolean;
  agreePrivacy: boolean;
}

/** 서버 오류를 한 줄 문장으로 */
export class ApiFailure extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
  }
}

// ── 상태 보관 ──────────────────────────────────────────────
let state: AccountState = { status: "loading" };
const listeners = new Set<() => void>();
const set = (next: AccountState) => {
  state = next;
  listeners.forEach((l) => l());
};

let started = false;
function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  onAuthStateChanged(firebaseAuth(), (fbUser) => {
    if (!fbUser) return set({ status: "signedOut" });
    void check();
  });
}

const SERVER: AccountState = { status: "loading" };
export function useAccount(): AccountState {
  return useSyncExternalStore(
    (l) => {
      start();
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => SERVER,
  );
}

// ── 서버 호출 (/api/v1 → next.config.ts rewrite → Cloud Functions) ──
export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const user = firebaseAuth().currentUser;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;
  let res: Response;
  try {
    res = await fetch(`/api/v1${path}`, { method: init.method ?? "GET", headers, body: init.body === undefined ? undefined : JSON.stringify(init.body) });
  } catch {
    throw new ApiFailure("network", "서버에 닿지 못했어요. 인터넷 연결을 확인해 주세요.", 0);
  }
  const json = (await res.json().catch(() => null)) as { data?: T; error?: { code: string; message: string } } | null;
  if (!res.ok || !json || json.error) throw new ApiFailure(json?.error?.code ?? "server", json?.error?.message ?? `서버 오류 (${res.status})`, res.status);
  return json.data as T;
}

type GoogleCheck = { registered: true; user: Member } | { registered: false; profile: GoogleProfile; pending: GuardianPending | null };

/** 로그인한 Google 계정이 가입돼 있는지 서버에 묻는다 — 보호자 동의를 기다리는 동안 팝업이 몇 초마다 다시 부른다 */
export async function check() {
  const picture = firebaseAuth().currentUser?.photoURL ?? null;
  try {
    const r = await api<GoogleCheck>("/auth/google", { method: "POST" });
    if (r.registered) {
      mirror(r.user);
      set({ status: "signedIn", user: r.user, picture });
    } else set({ status: "needsSignup", profile: { ...r.profile, picture: r.profile.picture ?? picture }, pending: r.pending ?? null });
  } catch (e) {
    await fbSignOut(firebaseAuth()).catch(() => undefined);
    set({ status: "signedOut", error: (e as Error).message });
  }
}

/** 회원 정보를 이 기기의 프로필(이름 · 학년 · 관심사)에도 맞춘다 — 코치가 부르는 이름이 같아지게 */
function mirror(u: Member) {
  write("profile", { name: u.nickname, grade: u.grade, interests: u.interests, createdAt: Date.parse(u.createdAt) || Date.now() });
}

const provider = () => {
  const p = new GoogleAuthProvider();
  p.setCustomParameters({ prompt: "select_account" }); // 같은 기기를 여러 학생이 쓸 수 있으니 매번 계정을 고르게
  return p;
};

/** "Google로 시작하기" — Google 창에서 계정을 골랐으면 true */
export async function signInWithGoogle(): Promise<boolean> {
  try {
    await signInWithPopup(firebaseAuth(), provider());
    // 다음 단계(가입 여부 확인)는 onAuthStateChanged → check() 가 이어서 한다
    return true;
  } catch (e) {
    const code = (e as { code?: string }).code ?? "";
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return false;
    const msg =
      code === "auth/popup-blocked" ? "팝업이 막혔어요. 브라우저에서 팝업을 허용하고 다시 눌러 주세요."
      : code === "auth/unauthorized-domain" ? "이 주소는 아직 로그인이 허용되지 않았어요. (Firebase 승인된 도메인)"
      : code === "auth/operation-not-allowed" ? "Google 로그인이 아직 켜져 있지 않아요. (Firebase 콘솔)"
      : "Google 로그인에 실패했어요. 잠시 뒤 다시 해 주세요.";
    set({ status: "signedOut", error: msg });
    return false;
  }
}

/** 가입 마치기 — 동의 · 닉네임 · 학년. 만 14세 미만이면 회원이 되지 않고 보호자 동의 대기(pending)로 간다 */
export async function completeSignup(form: SignupForm) {
  const r = await api<{ registered: true; user: Member } | { registered: false; pending: GuardianPending }>("/auth/google/signup", { method: "POST", body: form });
  if (r.registered) {
    mirror(r.user);
    set({ status: "signedIn", user: r.user, picture: firebaseAuth().currentUser?.photoURL ?? null });
  } else setPending(r.pending);
  return r;
}

/** 보호자 동의를 기다리는 동안 몇 초마다 — 실패해도 로그아웃하지 않고 다음에 다시 묻는다 */
export async function pollSignup() {
  try {
    const r = await api<GoogleCheck>("/auth/google", { method: "POST" });
    if (r.registered) {
      mirror(r.user);
      set({ status: "signedIn", user: r.user, picture: firebaseAuth().currentUser?.photoURL ?? null });
    } else setPending(r.pending ?? null);
  } catch {
    // 잠깐 끊겨도 기다리는 화면을 그대로 둔다
  }
}

function setPending(pending: GuardianPending | null) {
  if (state.status !== "needsSignup") return;
  // 개발용 devLink 는 보낸 그 응답에만 온다 — 몇 초마다 묻는 응답으로 덮어써도 남겨 둔다
  const devLink = pending && (pending.devLink ?? state.pending?.devLink);
  set({ ...state, pending: pending && { ...pending, devLink: devLink ?? undefined }, error: undefined });
}

/** 보호자에게 다시 보내기 — 주소를 주면 그 주소로 바꿔 보낸다 */
export async function resendGuardian(guardianEmail?: string) {
  const r = await api<{ pending: GuardianPending }>("/auth/google/guardian/resend", { method: "POST", body: guardianEmail ? { guardianEmail } : {} });
  setPending(r.pending);
}

/** 보호자 동의 요청 취소 — 가입 화면(학년 · 동의)으로 돌아간다 */
export async function cancelGuardian() {
  await api("/auth/google/guardian", { method: "DELETE" });
  setPending(null);
}

export async function updateMe(patch: Partial<Pick<Member, "nickname" | "grade" | "interests">>) {
  const user = await api<Member>("/me", { method: "PATCH", body: patch });
  mirror(user);
  if (state.status === "signedIn") set({ ...state, user });
  return user;
}

export async function signOut() {
  // 못 올린 기록을 마저 올리고 나간다 — 나가면 토큰이 없어 올릴 수 없다 (lib/sync.ts)
  await (await import("./sync")).flushBeforeSignOut();
  await fbSignOut(firebaseAuth());
}

/** 탈퇴 — Google 로 한 번 더 로그인해서 본인인지 확인한 뒤 지운다 */
export async function deleteAccount() {
  const user = firebaseAuth().currentUser;
  if (!user) return;
  try {
    await reauthenticateWithPopup(user, provider());
  } catch (e) {
    const code = (e as { code?: string }).code ?? "";
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return false;
    if (code === "auth/user-mismatch") throw new ApiFailure("user_mismatch", "가입한 Google 계정으로 다시 로그인해 주세요.", 400);
    throw e;
  }
  await user.getIdToken(true); // 방금 로그인한 시각(auth_time)이 담긴 새 토큰으로
  await api("/me", { method: "DELETE", body: {} });
  await fbSignOut(firebaseAuth()).catch(() => undefined);
  return true;
}
