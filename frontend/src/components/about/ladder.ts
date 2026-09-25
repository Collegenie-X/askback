import about from "@/data/about.json";

// 7단계 한 벌 — 불씨 🕯 → 불꽃 🔥 → 횃불 🔦 → 봉화 🚀.
// 히어로(AboutHero)와 전용 섹션(AboutLadder)이 이 한 벌을 같이 읽는다.
// 컴포넌트와 같은 파일에 두지 않는다 — "use client" 파일이 값까지 내보내면 번들이 갈린다.

export const ladder = about.ladder;

export type LadderStep = (typeof ladder.steps)[number];
export type LadderLevel = (typeof ladder.levels)[number];

export const LADDER_STEPS = ladder.steps;
export const LADDER_LEVELS = ladder.levels;

export const levelOf = (s: LadderStep): LadderLevel =>
  ladder.levels.find((l) => l.key === s.lvl) ?? ladder.levels[0];

// 불꽃 한 송이 — src/app/icon.svg(파비콘)와 같은 모양. 64 격자, 가운데는 (31, 28).
export const FLAME_OUT = "M31 6c7 11 14 19 14 30a14 14 0 0 1-28 0c0-9 4-14 7-21 1 7 4 6 7-9z";
export const FLAME_IN = "M30.5 29c3 5 6 7 6 11.5a6 6 0 0 1-12 0c0-4 3-6.5 6-11.5z";

// 계단 한 칸 — 가로 58 · 세로 50. 왼쪽 아래에서 오른쪽 위로 일곱 칸.
export const TREAD_W = 58;
export const TREAD_H = 50;
export const X0 = 24;
export const Y0 = 462;
export const treadY = (i: number) => Y0 - i * TREAD_H;
export const nodeX = (i: number) => X0 + i * TREAD_W + TREAD_W / 2;
export const nodeY = (i: number) => treadY(i) - 28;
