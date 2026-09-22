// 흐름 다섯 칸의 전용 그림 — 각 칸이 "무슨 일이 일어나는지"를 계속 움직여서 보여준다.
// 이모지 대신 쓴다. 색은 칸의 색(c)을 그대로 받아 한 화면 안에서 같은 팔레트로 묶인다.

import type { ReactElement } from "react";

type P = { c: string; size?: number };

const wrap = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 64 64",
  fill: "none",
  "aria-hidden": true as const,
});

// ① 던진다 — 한 줄이 말풍선 안으로 떨어져 들어간다
export function IcoThrow({ c, size = 56 }: P) {
  return (
    <svg {...wrap(size)}>
      <rect x="8" y="16" width="48" height="30" rx="10" stroke={c} strokeWidth="2.2" opacity="0.5" />
      <path d="M20 46 L20 55 L29 46" fill="none" stroke={c} strokeWidth="2.2" strokeLinejoin="round" opacity="0.5" />
      <g className="fx-throw">
        <rect x="17" y="27" width="22" height="3.4" rx="1.7" fill={c} />
      </g>
      <g className="fx-throw" style={{ animationDelay: "0.9s" }}>
        <rect x="17" y="34" width="14" height="3.4" rx="1.7" fill={c} opacity="0.55" />
      </g>
      <circle cx="49" cy="22" r="3" fill={c} className="ab-pulse" />
    </svg>
  );
}

// ② 답하고 되묻는다 — 답풍선이 차오르고, 그 끝에서 물음표 풍선이 한 번 더 튀어나온다
export function IcoAnswerAsk({ c, size = 56 }: P) {
  return (
    <svg {...wrap(size)}>
      <rect x="4" y="10" width="36" height="24" rx="9" stroke={c} strokeWidth="2.2" opacity="0.45" />
      <path d="M13 34 L13 41 L20 34" fill="none" stroke={c} strokeWidth="2.2" strokeLinejoin="round" opacity="0.45" />
      <g className="fx-fill">
        <rect x="11" y="17" width="22" height="3" rx="1.5" fill={c} />
        <rect x="11" y="23" width="17" height="3" rx="1.5" fill={c} opacity="0.7" />
      </g>
      {/* 답 끝에 붙는 되묻기 */}
      <g className="fx-back">
        <rect x="26" y="30" width="34" height="26" rx="10" fill="none" stroke={c} strokeWidth="2.6" />
        <path d="M52 56 L52 62 L45 56" fill="none" stroke={c} strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M38 40.5c0-2.6 2.1-4.5 4.8-4.5 2.6 0 4.7 1.7 4.7 4.2 0 3.4-4.6 3.6-4.6 6.6" stroke={c} strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="42.9" cy="51.4" r="1.9" fill={c} />
      </g>
    </svg>
  );
}

// ③ 화이트보드 테스트 — 순서도 세 칸이 손으로 그려지고, 체크가 찍힌다
export function IcoBoard({ c, size = 56 }: P) {
  return (
    <svg {...wrap(size)}>
      <rect x="5" y="9" width="54" height="36" rx="6" stroke={c} strokeWidth="2.2" opacity="0.45" />
      <path d="M32 45 L32 56 M24 56 L40 56" stroke={c} strokeWidth="2.2" strokeLinecap="round" opacity="0.45" />
      <g className="fx-board">
        <rect x="11" y="19" width="13" height="10" rx="3" stroke={c} strokeWidth="2.4" />
        <path d="M24 24 H30" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
        <rect x="30" y="19" width="13" height="10" rx="3" stroke={c} strokeWidth="2.4" />
        <path d="M43 24 H49" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="52" cy="24" r="3.4" stroke={c} strokeWidth="2.4" />
      </g>
      <path d="M14 36 l5 5 l10 -11" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="fx-check" />
    </svg>
  );
}

// ④ 리포트 — 여덟 칸이 차례로 채워진다
export function IcoReport({ c, size = 56 }: P) {
  const cells = [0, 1, 2, 3, 4, 5, 6, 7];
  return (
    <svg {...wrap(size)}>
      <rect x="9" y="6" width="46" height="52" rx="7" stroke={c} strokeWidth="2.2" opacity="0.5" />
      <rect x="15" y="12" width="20" height="3.4" rx="1.7" fill={c} />
      {cells.map((n) => (
        <rect
          key={n}
          x={15 + (n % 2) * 18}
          y={21 + Math.floor(n / 2) * 9}
          width="16"
          height="7"
          rx="2.4"
          fill={c}
          className="fx-cell"
          style={{ animationDelay: `${n * 0.16}s` }}
        />
      ))}
    </svg>
  );
}

// ⑤ .md로 남는다 — 한 장이 건너가고, 다음이 그 자리에서 이어진다
export function IcoMd({ c, size = 56 }: P) {
  return (
    <svg {...wrap(size)}>
      <g opacity="0.4">
        <rect x="6" y="14" width="26" height="34" rx="5" stroke={c} strokeWidth="2.2" />
        <path d="M12 23h13M12 30h14M12 37h9" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
      </g>
      <g className="fx-hand">
        <rect x="6" y="14" width="26" height="34" rx="5" fill="#0b0a12" stroke={c} strokeWidth="2.4" />
        <path d="M12 23h13M12 30h14M12 37h9" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
      </g>
      <path d="M36 31 h16" stroke={c} strokeWidth="2.4" strokeLinecap="round" className="ab-dash" opacity="0.7" />
      <circle cx="56" cy="31" r="4" stroke={c} strokeWidth="2.4" className="ab-pulse" />
    </svg>
  );
}

export const FLOW_ICONS: Record<string, (p: P) => ReactElement> = {
  "01": IcoThrow,
  "02": IcoAnswerAsk,
  "03": IcoBoard,
  "04": IcoReport,
  "05": IcoMd,
};

// 과정 → 결과로 넘어가는 이음매 — 세 칸이 한 장으로 접힌다
export function FlowJoin() {
  return (
    <svg viewBox="0 0 320 54" className="h-[54px] w-full max-w-[320px]" fill="none" aria-hidden>
      <path d="M40 2 C40 30, 160 22, 160 50" stroke="#fbbf24" strokeWidth="2" opacity="0.55" className="ab-dash" />
      <path d="M160 2 C160 28, 160 24, 160 50" stroke="#f472b6" strokeWidth="2" opacity="0.55" className="ab-dash" />
      <path d="M280 2 C280 30, 160 22, 160 50" stroke="#a78bfa" strokeWidth="2" opacity="0.55" className="ab-dash" />
      <path d="M153 42 L160 52 L167 42" stroke="#67e8f9" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
