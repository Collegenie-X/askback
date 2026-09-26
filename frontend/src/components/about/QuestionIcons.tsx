import type { ReactNode } from "react";
import { FLAME_IN, FLAME_OUT } from "./question";

// 여섯 축 아이콘 — 이모지 대신 직접 그린다. 24×24 격자, currentColor 를 따른다.
const AXIS: Record<string, ReactNode> = {
  // 왜 — 수단 너머의 과녁
  why: (
    <>
      <circle cx="13.6" cy="11.2" r="8.4" />
      <circle cx="13.6" cy="11.2" r="3.4" />
      <path d="M13.6 11.2L3.4 21.4M3.4 21.4l.4-4.2M3.4 21.4l4.2-.4" />
    </>
  ),
  // 맥락 — 그 일이 벌어지는 자리
  context: (
    <>
      <path d="M12 21.4s6.6-6.2 6.6-11A6.6 6.6 0 0 0 5.4 10.4c0 4.8 6.6 11 6.6 11z" />
      <circle cx="12" cy="10.2" r="2.4" />
      <path d="M2.6 17.6h3M18.4 17.6h3" />
    </>
  ),
  // 제약 — 울타리 안에서만
  constraint: (
    <>
      <path d="M4.4 6.6V3.4h3.2M19.6 6.6V3.4h-3.2M4.4 17.4v3.2h3.2M19.6 17.4v3.2h-3.2" />
      <rect x="8.2" y="8.2" width="7.6" height="7.6" rx="1.8" />
      <path d="M2.6 2.6l18.8 18.8" opacity="0.001" />
    </>
  ),
  // 기준 — 눈금 위에 꽂은 깃발
  criteria: (
    <>
      <path d="M2.6 17.4h18.8" />
      <path d="M6 17.4v-2.6M10 17.4v-2.6M14 17.4v-2.6M18 17.4v-2.6" />
      <path d="M15.4 14.6V3.4l5.6 2.6-5.6 2.8" />
    </>
  ),
  // 검증 — 두 쪽을 견주는 저울
  verify: (
    <>
      <path d="M12 3.4v17.2M7.4 20.6h9.2" />
      <path d="M4.2 7.4h15.6M12 7.4" />
      <path d="M1.6 13.2l2.6-5.8 2.6 5.8a2.9 2.9 0 0 1-5.2 0z" />
      <path d="M17.2 13.2l2.6-5.8 2.6 5.8a2.9 2.9 0 0 1-5.2 0z" />
    </>
  ),
  // 버릴 것 — 일부러 지운 한 줄
  discard: (
    <>
      <rect x="3.4" y="3.4" width="17.2" height="17.2" rx="3" />
      <path d="M7 8.6h10M7 15.4h10" />
      <path d="M6 12h12" strokeWidth="2.2" />
      <path d="M9.4 9.6l5.2 4.8" opacity="0.001" />
    </>
  ),
};

export function AxisIcon({ k, size = 24 }: { k: string; size?: number }) {
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
      {AXIS[k] ?? AXIS.why}
    </svg>
  );
}

// 브랜드 불꽃 — 로고·파비콘과 같은 한 송이
export function SparkMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <g transform="translate(12 13) scale(0.44) translate(-31 -28)">
        <path d={FLAME_OUT} fill="currentColor" />
        <path d={FLAME_IN} fill="#fff7ed" opacity="0.55" />
      </g>
    </svg>
  );
}
