import type { ReactNode } from "react";
import { FLAME_IN, FLAME_OUT } from "./ladder";

// 7단계 · 네 층 전용 아이콘 한 벌 — 이모지 대신 직접 그린다.
// 모두 24×24 격자, 색은 currentColor 를 따른다.

// ── 일곱 단계 — 선으로 그린다 ────────────────────────────────
const STEPS: ReactNode[] = [
  // 1 한 줄로 던진다 — 말풍선 안의 한 줄
  <>
    <path d="M4 5.5h16A1.5 1.5 0 0 1 21.5 7v8.5A1.5 1.5 0 0 1 20 17h-8.5L7 20.5V17H4a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 4 5.5Z" />
    <path d="M6.8 11.2h10.4" />
  </>,
  // 2 누구의 무엇인지 — 한 사람을 고른다
  <>
    <circle cx="9.8" cy="7.8" r="3.3" />
    <path d="M3.4 19.4c0-3.4 2.9-5.7 6.4-5.7 1 0 2 .2 2.9.5" />
    <path d="M14.6 17.4l2.3 2.3 4.4-4.8" />
  </>,
  // 3 순서도 세 칸 — 입력 → 판단(마름모) → 출력
  <>
    <rect x="1.3" y="8.8" width="5.8" height="6.6" rx="1" />
    <path d="M12 8.4l3.6 3.7-3.6 3.7-3.6-3.7z" />
    <rect x="16.9" y="8.8" width="5.8" height="6.6" rx="1" />
    <path d="M7.1 12.1h1.1M15.8 12.1h1.1" />
  </>,
  // 4 숫자를 직접 재 온다 — 눈금자
  <>
    <rect x="1.8" y="7.6" width="20.4" height="8.8" rx="2" />
    <path d="M6.4 7.6v3.2M10 7.6v4.6M13.6 7.6v3.2M17.2 7.6v4.6" />
  </>,
  // 5 다른 길과 견줘 본다 — 갈림길
  <>
    <path d="M12 21.4v-7.2" />
    <path d="M12 14.2 6.4 8.6M12 14.2l5.6-5.6" />
    <circle cx="4.6" cy="6.8" r="2.4" />
    <circle cx="19.4" cy="6.8" r="2.4" />
  </>,
  // 6 화이트보드로 설명해 본다 — 칠판과 받침
  <>
    <rect x="2.4" y="3.4" width="19.2" height="12.4" rx="2" />
    <path d="M12 15.8v4.8M8.4 20.6h7.2" />
    <path d="M6 7.6h5.4M6 11.4h8.6" />
  </>,
  // 7 남에게 넘길 수 있게 — 한 장을 건넨다
  <>
    <path d="M15.4 2.6H6.4a2 2 0 0 0-2 2v14.8a2 2 0 0 0 2 2h7.8a2 2 0 0 0 2-2v-2.6" />
    <path d="M8 7.2h5M8 10.8h5" />
    <path d="M13.8 13.8h7.8M17.8 10.4l3.8 3.4-3.8 3.4" />
  </>,
];

export function StepIcon({ n, size = 24 }: { n: number; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0"
    >
      {STEPS[n] ?? STEPS[0]}
    </svg>
  );
}

// ── 네 층 — 불씨에서 봉화까지. 같은 불꽃이 자란다 ──────────────
// 불꽃 본체는 파비콘(src/app/icon.svg)과 같은 64 격자 한 송이를 가져다 쓴다.
function Flame({ cx, cy, k, inner = true }: { cx: number; cy: number; k: number; inner?: boolean }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${k}) translate(-31 -28)`}>
      <path d={FLAME_OUT} fill="currentColor" />
      {inner && <path d={FLAME_IN} fill="#fff7ed" opacity="0.55" />}
    </g>
  );
}

const LEVELS: Record<string, ReactNode> = {
  // 불씨 — 아직 작다. 옆에 불티가 튄다
  ember: (
    <>
      <Flame cx={12} cy={15} k={0.28} inner={false} />
      <path d="M5.4 7.6l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6z" fill="currentColor" opacity="0.7" />
      <path d="M18.4 4.6l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5z" fill="currentColor" opacity="0.5" />
    </>
  ),
  // 불꽃 — 제 크기로 탄다
  flame: <Flame cx={12} cy={13} k={0.44} />,
  // 횃불 — 손잡이가 생긴다. 들고 다닐 수 있다
  torch: (
    <>
      <Flame cx={12} cy={8.4} k={0.3} />
      <path d="M8.8 13.6h6.4l-1 2.4H9.8z" fill="currentColor" />
      <path d="M10.2 16.6h3.6l-.5 5.2h-2.6z" fill="currentColor" opacity="0.75" />
    </>
  ),
  // 봉화 — 받침 위에서 멀리까지 보인다
  beacon: (
    <>
      <Flame cx={12} cy={8} k={0.28} />
      <path d="M6.4 13.4h11.2l-2 3.4H8.4z" fill="currentColor" />
      <path d="M10.4 18.4h3.2l.8 3.2H9.6z" fill="currentColor" opacity="0.75" />
      <path
        d="M2.6 9.6h2M19.4 9.6h2M4.4 4.4l1.5 1.4M19.6 4.4l-1.5 1.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.6"
      />
    </>
  ),
};

export function LevelIcon({ lvl, size = 24 }: { lvl: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0">
      {LEVELS[lvl] ?? LEVELS.flame}
    </svg>
  );
}
