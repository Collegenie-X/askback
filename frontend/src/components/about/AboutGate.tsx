"use client";

import { useEffect, useState, type CSSProperties } from "react";

// 몰래 쓰는 AI → 설명하고 인정받는 AI.
// 특성화고의 '화이트보드 검문'(순서도 · 핵심 · 차별점 · 실패 조건)을 AskBack의 역질문이 매일 대신한다.

const FONT = { fontFamily: "inherit" } as const;
const at = (s: number): CSSProperties => ({ animationDelay: `${s}s` });
const SUB = "#a8a8c0";
const GLASS = "#0d0d18";
const LINE = "#2c2c46";
const GOLD = "#fbbf24";
const PINK = "#f472b6";
const MINT = "#34d399";
const ROSE = "#fb7185";
const VIOLET = "#a78bfa";

const GATES = [
  { key: "flow", color: GOLD, name: "순서도", teacher: "화면 닫고, 순서도를 그려 보세요.", lines: ["화면 닫고,", "순서도를 그려 보세요."], app: "센서값이 380이 들어왔어. 네 순서도에서 어느 상자를 지나가?", proves: "구조를 머릿속에 갖고 있다", why: "화면을 못 보는 상태에서 나오는 건 이해뿐이다" },
  { key: "core", color: VIOLET, name: "핵심", teacher: "핵심 한 곳에 동그라미. 왜 거기예요?", lines: ["핵심 한 곳에 동그라미.", "왜 거기예요?"], app: "이 규칙에서 한 줄만 남긴다면 어느 줄이야? 왜?", proves: "무엇이 중요한지 판단했다", why: "“전부 중요해요”라고 답하면 아무것도 모르는 것이다" },
  { key: "diff", color: PINK, name: "차별점", teacher: "고친 곳은? 고치기 전엔 어땠어요?", lines: ["고친 곳은?", "고치기 전엔 어땠어요?"], app: "타이머로 3초 주는 것과 뭐가 달라? 네 방식이 나은 점을 한 문장으로.", proves: "대안을 비교하고 골랐다", why: "왜 그 대안을 버렸는지는 본인만 안다" },
  { key: "fail", color: ROSE, name: "실패 조건", teacher: "이거 언제 안 돌아가요?", lines: ["이거 언제", "안 돌아가요?"], app: "센서가 빠져서 0이 되면 화분에 어떤 일이 벌어질까?", proves: "시스템 전체를 본다", why: "안 돌아가는 조건을 아는 사람이 진짜 만든 사람이다" },
];

// 지금 — 책상 밑에서 몰래 쓴다
export function SecretArt() {
  return (
    <svg viewBox="0 0 320 190" role="img" aria-label="학생이 책상 아래에서 AI를 몰래 쓰고, 결과물에는 출처를 적지 못한다" className="h-auto w-full" style={FONT}>
      <defs><radialGradient id="sec-glow"><stop offset="0" stopColor="#60a5fa" stopOpacity="0.55" /><stop offset="1" stopColor="#60a5fa" stopOpacity="0" /></radialGradient></defs>
      {/* 책상 */}
      <rect x="40" y="104" width="200" height="10" rx="4" fill="#2c2c46" /><path d="M58 114v66M222 114v66" stroke="#2c2c46" strokeWidth="8" strokeLinecap="round" />
      {/* 책상 위 — 깨끗한 결과물 */}
      <g className="stg" style={at(0.3)}><path d="M150 62h52l12 12v30h-64z" fill={GLASS} stroke={SUB} strokeWidth="1.500" strokeLinejoin="round" />{[0, 1, 2].map((i) => <path key={i} d={`M158 ${80 + i * 8}h${[44, 36, 40][i]}`} stroke={SUB} strokeWidth="2" strokeLinecap="round" />)}<text x="182" y="56" textAnchor="middle" fill={SUB} fontSize="10" fontWeight="700">출처: ( 빈칸 )</text></g>
      {/* 학생 — 곁눈질 */}
      <g className="stg" style={at(0.1)}>
        <path d="M70 104c0-24 12-36 28-36s28 12 28 36z" fill="#4f46e5" />
        <circle cx="98" cy="50" r="22" fill="#ffd9b8" /><path d="M76 48a22 22 0 0 1 44 0c-9-2-18-7-23-14-5 7-12 12-21 14z" fill="#3b2a1e" />
        <g className="sec-eyes"><circle cx="92" cy="54" r="2.200" fill="#2a1a4a" /><circle cx="108" cy="54" r="2.200" fill="#2a1a4a" /></g>
        <path d="M94 64h10" stroke="#2a1a4a" strokeWidth="1.600" strokeLinecap="round" />
        <path d="M122 40c-3 5-3 8 0 10 3-2 3-5 0-10z" fill="#67e8f9" className="fa-drop" />
      </g>
      {/* 책상 밑 — 숨긴 화면 */}
      <circle cx="120" cy="150" r="46" fill="url(#sec-glow)" className="ab-pulse" />
      <g className="stg-pop" style={at(0.8)}><rect x="96" y="132" width="48" height="34" rx="5" fill="#0b1220" stroke="#60a5fa" strokeWidth="1.800" /><text x="120" y="154" textAnchor="middle" fill="#93c5fd" fontSize="13" fontWeight="800">AI</text></g>
      {/* 쉿 */}
      <g className="stg-pop" style={at(1.3)}><rect x="12" y="10" width="54" height="28" rx="14" fill={GLASS} stroke={ROSE} strokeWidth="1.500" /><text x="39" y="29" textAnchor="middle" fill={ROSE} fontSize="14" fontWeight="800">쉿…</text></g>
      {/* 의심하는 시선 */}
      <g className="stg-pop" style={at(1.8)}>
        <circle cx="280" cy="52" r="20" fill="#ffd9b8" /><path d="M260 50a20 20 0 0 1 40 0c-10-1-16-5-20-12-4 7-10 11-20 12z" fill="#2a1a4a" />
        <g fill="none" stroke="#2a1a4a" strokeWidth="1.500"><circle cx="273" cy="55" r="5.500" /><circle cx="288" cy="55" r="5.500" /><path d="M278.500 55h4" /></g>
        <path d="M262 100c0-18 8-28 18-28s18 10 18 28z" fill="#6c5ce7" />
        <text x="248" y="30" fill={ROSE} fontSize="20" fontWeight="800" className="ab-tw">?</text>
      </g>
    </svg>
  );
}

// 화이트보드 검문 — 선생님의 네 질문. 지금 묻는 항목에 따라 칠판의 표시가 바뀐다.
function BoardArt({ i }: { i: number }) {
  const g = GATES[i];
  return (
    <svg viewBox="0 0 520 300" role="img" aria-label="선생님이 화이트보드 앞에서 순서도, 핵심, 차별점, 실패 조건을 묻는다" className="h-auto w-full" style={FONT}>
      {/* 칠판 */}
      <rect x="170" y="16" width="336" height="206" rx="10" fill={GLASS} stroke="#c7d2fe" strokeWidth="2" />
      <path d="M190 222v18M486 222v18M178 240h320" stroke="#c7d2fe" strokeWidth="2" strokeLinecap="round" />
      {/* 손으로 그린 순서도 */}
      <g fill="none" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M216 40q30-3 62 0l1 26q-32 3-63 0z" /><path d="M247 67v20" />
        <path d="M247 88l44 24-44 24-44-24z" /><path d="M247 136v20" />
        <path d="M212 158q34-3 70 0l1 26q-36 3-71 0z" />
      </g>
      <g fill="#e5e7eb" fontSize="12" fontWeight="700" textAnchor="middle"><text x="247" y="58">흙 센서</text><text x="247" y="116">마름?</text><text x="247" y="176">펌프 · 최대 5초</text></g>

      {i === 0 && <g key="flow"><path d="M247 30V196" stroke={GOLD} strokeWidth="5" strokeLinecap="round" opacity="0.35" /><circle r="7" fill={GOLD} className="neon" style={{ ["--neon" as string]: `${GOLD}aa` }}><animateMotion dur="2.600s" repeatCount="indefinite" path="M247 30V196" /></circle><text x="330" y="60" fill={GOLD} fontSize="13" fontWeight="800" className="swap">380이 들어오면 →</text></g>}
      {i === 1 && <g key="core" className="swap"><ellipse cx="247" cy="112" rx="58" ry="34" fill="none" stroke={VIOLET} strokeWidth="3" strokeDasharray="1" pathLength={1} className="draw-now" /><path d="M308 100l34-18" stroke={VIOLET} strokeWidth="2" /><text x="346" y="80" fill={VIOLET} fontSize="13" fontWeight="800">여기가 핵심 —</text><text x="346" y="98" fill={VIOLET} fontSize="13" fontWeight="800">기준이 내가 잰 숫자</text></g>}
      {i === 2 && <g key="diff" className="swap"><rect x="352" y="92" width="130" height="40" rx="8" fill="none" stroke={SUB} strokeDasharray="4 4" /><text x="417" y="116" textAnchor="middle" fill={SUB} fontSize="12" fontWeight="700">타이머로 3초</text><path d="M356 96l122 32M478 96l-122 32" stroke={ROSE} strokeWidth="2.400" strokeLinecap="round" /><path d="M292 112h58" stroke={SUB} strokeDasharray="3 4" /><text x="417" y="156" textAnchor="middle" fill={PINK} fontSize="13" fontWeight="800">내 방식: 550까지만</text><text x="417" y="174" textAnchor="middle" fill={PINK} fontSize="11.500" fontWeight="700">→ 과습을 막는다</text></g>}
      {i === 3 && <g key="fail" className="swap"><path d="M238 70l18 14M256 70l-18 14" stroke={ROSE} strokeWidth="3.500" strokeLinecap="round" /><circle cx="300" cy="77" r="15" fill="#2a0f16" stroke={ROSE} strokeWidth="1.800" className="ab-pulse" /><text x="300" y="82" textAnchor="middle" fill={ROSE} fontSize="14" fontWeight="800">0</text><text x="330" y="70" fill={ROSE} fontSize="13" fontWeight="800">센서가 빠지면?</text><text x="330" y="88" fill="#fff" fontSize="12" fontWeight="700">“계속 마른 걸로 읽어요.</text><text x="330" y="105" fill="#fff" fontSize="12" fontWeight="700">그래서 5초에서 끊어요.”</text></g>}

      {/* 선생님 */}
      <path d="M26 300c0-40 18-62 44-62s44 22 44 62z" fill="#6c5ce7" />
      <circle cx="70" cy="206" r="28" fill="#ffd9b8" /><path d="M42 203a28 28 0 0 1 56 0c-13-2-23-8-29-18-6 10-15 16-27 18z" fill="#2a1a4a" />
      <g fill="none" stroke="#2a1a4a" strokeWidth="1.800"><circle cx="60" cy="210" r="7.500" /><circle cx="81" cy="210" r="7.500" /><path d="M67.500 210h6" /></g>
      <path d="M62 224q8 5 16 0" fill="none" stroke="#2a1a4a" strokeWidth="1.800" strokeLinecap="round" />
      <g key={`t${i}`} className="swap">
        <rect x="8" y="96" width="156" height="66" rx="14" fill={GLASS} stroke={g.color} strokeWidth="1.800" />
        <path d="M60 161l8 16 10-16z" fill={GLASS} stroke={g.color} strokeWidth="1.800" strokeLinejoin="round" />
        <text x="20" y="116" fill={g.color} fontSize="11" fontWeight="800">선생님의 질문 {i + 1}/4</text>
        {g.lines.map((l, n) => <text key={n} x="20" y={135 + n * 17} fill="#fff" fontSize="12.500" fontWeight="700">{l}</text>)}
      </g>

      {/* 네 관문과 도장 */}
      {GATES.map((x, n) => (
        <g key={x.key} transform={`translate(${176 + n * 66} 256)`}>
          <rect width="60" height="30" rx="15" fill={n <= i ? `${x.color}26` : GLASS} stroke={n <= i ? x.color : LINE} strokeWidth="1.500" style={{ transition: "all 0.4s" }} />
          <text x="30" y="20" textAnchor="middle" fill={n <= i ? x.color : SUB} fontSize="11.500" fontWeight="800">{n <= i ? "✓ " : ""}{x.name}</text>
        </g>
      ))}
      {i === 3 && (
        <g key="stamp" className="stamp" style={{ transformOrigin: "474px 262px" }}>
          <rect x="440" y="238" width="74" height="50" rx="8" fill="#0a261f" stroke={MINT} strokeWidth="3" transform="rotate(-8 477 263)" />
          <text x="477" y="259" textAnchor="middle" fill={MINT} fontSize="12" fontWeight="800" transform="rotate(-8 477 263)">AI 사용</text>
          <text x="477" y="277" textAnchor="middle" fill={MINT} fontSize="15" fontWeight="800" transform="rotate(-8 477 263)">인정 ✓</text>
        </g>
      )}
    </svg>
  );
}

export function GateTabs() {
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setI((v) => (v + 1) % GATES.length), 4600);
    return () => clearInterval(t);
  }, [auto]);
  const pick = (n: number) => { setAuto(false); setI(n); };
  const g = GATES[i];
  return (
    <div className="grid items-center gap-6 lg:grid-cols-[1.15fr_1fr]">
      <div className="scene-stage rounded-[24px] border border-line p-4 sm:p-6"><BoardArt i={i} /></div>
      <div>
        <div role="tablist" className="noscroll flex gap-2 overflow-x-auto pb-1">
          {GATES.map((x, n) => <button key={x.key} role="tab" aria-selected={n === i} type="button" onClick={() => pick(n)} className={`tab shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-bold transition ${n === i ? "on" : ""}`}>{n + 1}. {x.name}</button>)}
        </div>
        <div key={i} className="tilecard swap mt-4 p-5 sm:p-6" style={{ borderColor: `${g.color}88` }}>
          <p className="text-[11px] font-extrabold text-sub">👩‍🏫 선생님은 이렇게 묻습니다</p>
          <p className="mt-1 text-lg font-extrabold leading-snug">“{g.teacher}”</p>
          <div className="my-4 flex items-center gap-2 text-xs font-bold text-sub"><span className="h-px flex-1 bg-white/10" />AskBack은 매일, 대화 속에서<span className="h-px flex-1 bg-white/10" /></div>
          <p className="rounded-2xl rounded-bl-md border px-4 py-3 text-[15px] font-bold leading-snug" style={{ borderColor: g.color, color: g.color }}>🧭 “{g.app}”</p>
          <dl className="mt-4 space-y-2 text-[13.5px]">
            <div className="flex gap-3"><dt className="w-[92px] shrink-0 text-xs font-extrabold text-mint">증명되는 것</dt><dd className="font-semibold">{g.proves}</dd></div>
            <div className="flex gap-3"><dt className="w-[92px] shrink-0 text-xs font-extrabold text-sub">AI가 못 하는 이유</dt><dd className="leading-relaxed text-sub">{g.why}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  );
}
