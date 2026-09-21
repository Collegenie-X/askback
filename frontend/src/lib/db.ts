"use client";

// localStorage를 작은 DB처럼 쓴다. 테이블 하나가 키 하나(JSON).
// 나중에 서버 DB로 옮길 때는 이 파일의 read/write만 바꾸면 된다.
import { useSyncExternalStore } from "react";
import type { AppState, Message, Note, Profile, Project, ReverseQuestion, SpacePrefs, Turn, WindowReport } from "./types";

const PREFIX = "askback:v1:";

export interface Tables {
  profile: Profile | null;
  state: AppState;
  projects: Project[];
  messages: Message[];
  turns: Turn[];
  rqs: ReverseQuestion[];
  notes: Note[];
  reports: WindowReport[];
  goals: Record<string, string>; // "2026-09" → 다음 달 목표
  introSeen: boolean; // 온보딩 소개는 한 번만 보여준다
  space: SpacePrefs; // 우주 배경 꾸미기
}

const DEFAULTS: Tables = {
  profile: null,
  state: { currentProjectId: null, validCount: 0, windowCount: 0, idkCount: 0, demoStep: null, demoProjectId: null },
  projects: [],
  messages: [],
  turns: [],
  rqs: [],
  notes: [],
  reports: [],
  goals: {},
  introSeen: false,
  space: { mood: "normal", speed: "normal", motion: true, shooting: true, hidden: [] },
};
const KEEP = new Set<keyof Tables>(["space"]); // 기록이 아니라 기기 취향 — clearAll 에도 남긴다

const cache = new Map<string, unknown>();
const listeners = new Set<() => void>();

export function read<K extends keyof Tables>(key: K): Tables[K] {
  if (typeof window === "undefined") return DEFAULTS[key];
  if (cache.has(key)) return cache.get(key) as Tables[K];
  let value = DEFAULTS[key];
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw) value = JSON.parse(raw) as Tables[K];
  } catch {
    value = DEFAULTS[key];
  }
  cache.set(key, value);
  return value;
}

export function write<K extends keyof Tables>(key: K, value: Tables[K]) {
  cache.set(key, value);
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // 저장 공간이 꽉 찼을 때도 화면은 계속 동작해야 한다.
  }
  listeners.forEach((l) => l());
}

export function update<K extends keyof Tables>(key: K, fn: (prev: Tables[K]) => Tables[K]) {
  write(key, fn(read(key)));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useTable<K extends keyof Tables>(key: K): Tables[K] {
  return useSyncExternalStore(
    subscribe,
    () => read(key),
    () => DEFAULTS[key],
  );
}

export function exportAll(): string {
  const out: Record<string, unknown> = {};
  (Object.keys(DEFAULTS) as (keyof Tables)[]).forEach((k) => (out[k] = read(k)));
  return JSON.stringify(out, null, 2);
}

export function clearAll() {
  (Object.keys(DEFAULTS) as (keyof Tables)[]).filter((k) => !KEEP.has(k)).forEach((k) => {
    window.localStorage.removeItem(PREFIX + k);
    cache.delete(k);
  });
  listeners.forEach((l) => l());
}

let seq = 0;
export function uid(prefix: string) {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}${seq.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
