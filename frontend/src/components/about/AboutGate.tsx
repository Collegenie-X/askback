"use client";

import { useEffect, useState, type CSSProperties } from "react";
import about from "@/data/about.json";
import { rich } from "./rich";

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

const { gates: GATES, teacherLabel, appLabel, provesLabel, whyLabel } = about.gate;

const { secretSays, fieldEyebrow, fieldTitle, fieldSteps, fieldResult, fieldCompare } = about.gate;

// 지금 — 책상 밑에서 몰래 쓴다. 선생님이 물으면 "네…" 하고 숨긴다. 결과물의 출처 칸은 비어 있다.
export function SecretArt() {
  return (
    <svg viewBox="0 0 340 214" role="img" aria-label="학생이 책상 밑 휴대폰으로 AI를 몰래 쓰고, 선생님이 직접 했냐고 묻자 네라고 숨긴다. 과제의 출처 칸은 비어 있다" className="h-auto w-full" style={FONT}>
      <defs>
        <radialGradient id="sec-glow"><stop offset="0" stopColor="#60a5fa" stopOpacity="0.6" /><stop offset="1" stopColor="#60a5fa" stopOpacity="0" /></radialGradient>
        <marker id="sec-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5 0 10z" fill="#60a5fa" /></marker>
      </defs>

      {/* ① 책상 밑 — 숨긴 휴대폰 속 AI */}
      <circle cx="122" cy="172" r="48" fill="url(#sec-glow)" className="ab-pulse" />
      <g className="stg-pop" style={at(0.5)}>
        <rect x="98" y="150" width="48" height="44" rx="7" fill="#0b1220" stroke="#60a5fa" strokeWidth="1.800" />
        <text x="122" y="168" textAnchor="middle" fill="#93c5fd" fontSize="12" fontWeight="800">AI</text>
        <path d="M106 176h32M106 184h22" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      </g>
      <text x="122" y="208" textAnchor="middle" fill={SUB} fontSize="10" fontWeight="700">책상 밑</text>
      {/* 몰래 옮겨 적기 */}
      <g className="stg" style={at(0.9)}>
        <path d="M148 170C200 170 214 158 214 134" fill="none" stroke="#60a5fa" strokeWidth="1.800" strokeDasharray="4 4" markerEnd="url(#sec-arr)" className="ab-dash" />
        <text x="154" y="160" fill="#93c5fd" fontSize="10.500" fontWeight="800">그대로 옮김</text>
      </g>

      {/* 책상 */}
      <rect x="30" y="122" width="226" height="10" rx="4" fill={LINE} /><path d="M46 132v74M240 132v74" stroke={LINE} strokeWidth="8" strokeLinecap="round" />

      {/* ② 책상 위 — 완성된 과제, 출처는 빈칸 */}
      <g className="stg" style={at(0.3)}>
        <path d="M172 58h56l12 12v52h-68z" fill={GLASS} stroke={SUB} strokeWidth="1.500" strokeLinejoin="round" />
        <text x="180" y="74" fill="#fff" fontSize="10" fontWeight="800">과제 ✓</text>
        {[0, 1, 2].map((i) => <path key={i} d={`M180 ${84 + i * 7}h${[50, 40, 46][i]}`} stroke={SUB} strokeWidth="2" strokeLinecap="round" />)}
        <text x="180" y="116" fill={SUB} fontSize="9.500" fontWeight="700">출처</text>
        <rect x="202" y="106" width="32" height="13" rx="3" fill="#2a0f16" stroke={ROSE} strokeWidth="1.400" strokeDasharray="3 2" className="ab-pulse" />
        <text x="218" y="116" textAnchor="middle" fill={ROSE} fontSize="10" fontWeight="800">?</text>
      </g>

      {/* ③ 학생 — 시선은 책상 밑, 식은땀 */}
      <g className="stg" style={at(0.1)}>
        <path d="M66 122c0-26 13-40 30-40s30 14 30 40z" fill="#4f46e5" />
        <circle cx="96" cy="58" r="22" fill="#ffd9b8" /><path d="M74 56a22 22 0 0 1 44 0c-9-2-18-7-23-14-5 7-12 12-21 14z" fill="#3b2a1e" />
        <g className="sec-eyes"><circle cx="90" cy="64" r="2.200" fill="#2a1a4a" /><circle cx="104" cy="64" r="2.200" fill="#2a1a4a" /></g>
        <path d="M91 72q5-2 10 0" fill="none" stroke="#2a1a4a" strokeWidth="1.600" strokeLinecap="round" />
        <path d="M121 46c-3 5-3 8 0 10 3-2 3-5 0-10z" fill="#67e8f9" className="fa-drop" />
      </g>
      <g className="stg-pop" style={at(1.6)}>
        <rect x="8" y="6" width="74" height="26" rx="13" fill={GLASS} stroke={SUB} strokeWidth="1.400" />
        <path d="M60 31l8 9 2-9" fill={GLASS} stroke={SUB} strokeWidth="1.400" strokeLinejoin="round" />
        <text x="45" y="24" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="800">{secretSays.student}</text>
      </g>

      {/* ④ 선생님 — 의심 */}
      <g className="stg-pop" style={at(1.1)}>
        <circle cx="296" cy="72" r="20" fill="#ffd9b8" /><path d="M276 70a20 20 0 0 1 40 0c-10-1-16-5-20-12-4 7-10 11-20 12z" fill="#2a1a4a" />
        <g fill="none" stroke="#2a1a4a" strokeWidth="1.500"><circle cx="289" cy="75" r="5.500" /><circle cx="304" cy="75" r="5.500" /><path d="M294.500 75h4" /></g>
        <path d="M290 85h12" stroke="#2a1a4a" strokeWidth="1.500" strokeLinecap="round" />
        <path d="M272 122c0-20 10-30 24-30s24 10 24 30z" fill="#6c5ce7" />
        <rect x="236" y="6" width="98" height="28" rx="14" fill={GLASS} stroke={ROSE} strokeWidth="1.500" />
        <path d="M290 33l4 10 8-10" fill={GLASS} stroke={ROSE} strokeWidth="1.500" strokeLinejoin="round" />
        <text x="285" y="25" textAnchor="middle" fill={ROSE} fontSize="12.500" fontWeight="800">{secretSays.teacher}</text>
      </g>
    </svg>
  );
}

// 세 칸 아이콘 — 순서도(상자 셋) · 핵심(과녁) · 차별점(갈라지는 길)
function StepIcon({ k, c }: { k: string; c: string }) {
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" aria-hidden>
      <rect x="1" y="1" width="38" height="38" rx="11" fill={`${c}1f`} stroke={`${c}66`} />
      <g fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {k === "flow" && <><rect x="13" y="7" width="14" height="6" rx="2" /><path d="M20 13v4M20 17l6 4-6 4-6-4z" /><path d="M20 25v3" /><rect x="13" y="28" width="14" height="5" rx="2" /></>}
        {k === "core" && <><circle cx="20" cy="20" r="11" /><circle cx="20" cy="20" r="6" /><circle cx="20" cy="20" r="1.800" fill={c} /></>}
        {k === "diff" && <><path d="M20 33V21" /><path d="M20 21l-8-10M20 21l8-10" /><path d="M12 11l-1 5M12 11l5 1" opacity="0.4" /><circle cx="28" cy="11" r="2.600" fill={c} /></>}
      </g>
    </svg>
  );
}

// 오른쪽 — 현장의 규칙을 한눈에: 세 칸 → 인정 → 시간 비교
export function FieldRule() {
  return (
    <div className="tilecard flex h-full flex-col p-5 sm:p-7" style={{ borderColor: "#34d39966" }}>
      <p className="text-xs font-extrabold tracking-wider text-mint">{fieldEyebrow}</p>
      <p className="mt-2 text-[20px] font-extrabold leading-snug sm:text-[23px]">{rich(fieldTitle)}</p>

      <ol className="mt-4 space-y-2">
        {fieldSteps.map((s, n) => (
          <li key={s.key} className="stg flex items-center gap-3 rounded-2xl border bg-[#ffffff05] px-3 py-2.5" style={{ ...at(0.2 + n * 0.15), borderColor: `${s.color}55` }}>
            <StepIcon k={s.key} c={s.color} />
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-extrabold"><span style={{ color: s.color }}>{n + 1}. {s.name}</span><span className="ml-2 font-semibold text-white/90">{s.desc}</span></p>
              <p className="mt-0.5 truncate text-[12.5px] text-sub">예) {s.eg}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-3 rounded-2xl border border-mint bg-mint-soft px-4 py-2.5 text-center text-[14.5px] font-extrabold text-mint">{fieldResult}</p>

      <div className="mt-4 grid grid-cols-2 gap-2 text-[12.5px]">
        {fieldCompare.map((x) => (
          <div key={x.who} className={`rounded-2xl border px-3 py-2.5 ${x.tone === "mint" ? "border-[#34d39966] bg-[#34d3990f]" : "border-[#fb718555] bg-[#fb71850d]"}`}>
            <p className="font-bold text-sub">{x.who}</p>
            <p className={`mt-0.5 text-[15px] font-extrabold ${x.tone === "mint" ? "text-mint" : "text-[#fb7185]"}`}>{x.cost}</p>
          </div>
        ))}
      </div>
    </div>
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
          <p className="text-[11px] font-extrabold text-sub">{teacherLabel}</p>
          <p className="mt-1 text-lg font-extrabold leading-snug">“{g.teacher}”</p>
          <div className="my-4 flex items-center gap-2 text-xs font-bold text-sub"><span className="h-px flex-1 bg-white/10" />{appLabel}<span className="h-px flex-1 bg-white/10" /></div>
          <p className="rounded-2xl rounded-bl-md border px-4 py-3 text-[15px] font-bold leading-snug" style={{ borderColor: g.color, color: g.color }}>🧭 “{g.app}”</p>
          <dl className="mt-4 space-y-2 text-[13.5px]">
            <div className="flex gap-3"><dt className="w-[92px] shrink-0 text-xs font-extrabold text-mint">{provesLabel}</dt><dd className="font-semibold">{g.proves}</dd></div>
            <div className="flex gap-3"><dt className="w-[92px] shrink-0 text-xs font-extrabold text-sub">{whyLabel}</dt><dd className="leading-relaxed text-sub">{g.why}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  );
}
