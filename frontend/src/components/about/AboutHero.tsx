"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import about from "@/data/about.json";
import { SparkMark } from "./QuestionIcons";
import Reveal from "./Reveal";
import { rich } from "./rich";

const { hero } = about;
const { loop } = hero;
const { scene } = loop;
const STEP_MS = 3200;
const ease = "all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)";

// ── 단계 아이콘 — 묻는다 · 되묻는다 · 점검한다 · 남긴다 ──
function StepIcon({ k, c, size = 40 }: { k: string; c: string; size?: number }) {
  const p = { fill: "none", stroke: c, strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      {k === "ask" && (
        <>
          <path {...p} d="M12 8h24a7 7 0 0 1 7 7v12a7 7 0 0 1-7 7H22l-8 7v-7h-2a7 7 0 0 1-7-7V15a7 7 0 0 1 7-7z" />
          {[16, 24, 32].map((x) => <circle key={x} cx={x} cy={21} r={2.4} fill={c} />)}
        </>
      )}
      {k === "back" && (
        <>
          <path {...p} d="M12 5h24a7 7 0 0 1 7 7v10a7 7 0 0 1-7 7H12a7 7 0 0 1-7-7V12a7 7 0 0 1 7-7z" />
          <path {...p} d="M20 13.5a4 4 0 1 1 5.5 3.7c-1 .4-1.5 1.2-1.5 2.3" />
          <circle cx={24} cy={23.6} r={1.5} fill={c} />
          <path {...p} d="M38 34c-5 8-20 9-27 2" />
          <path {...p} d="M11 36l0.5-6M11 36l6 0.5" />
        </>
      )}
      {k === "check" && (
        <>
          <rect {...p} x={5} y={6} width={38} height={27} rx={3} />
          <path {...p} d="M14 33l-4 10M34 33l4 10" />
          <rect {...p} x={10} y={11} width={9} height={6} rx={1.5} strokeWidth={1.8} />
          <rect {...p} x={29} y={11} width={9} height={6} rx={1.5} strokeWidth={1.8} />
          <path {...p} d="M19 14h10" strokeWidth={1.8} />
          <path {...p} d="M16 25l4 4 10-8" />
        </>
      )}
      {k === "keep" && (
        <>
          <rect {...p} x={16} y={4} width={26} height={32} rx={4} opacity={0.45} />
          <rect {...p} x={7} y={10} width={26} height={33} rx={4} fill="#0b0b14" />
          <path {...p} d="M13 19h14M13 25h14M13 31h8" strokeWidth={2} />
          <circle cx={36} cy={38} r={7} fill={c} />
          <path d="M32.6 38l2.3 2.3 4.2-4.6" fill="none" stroke="#0b0b14" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

// ── 왼쪽 — 네 칸 레일. 지금 칸이 빛나고, 지나온 칸엔 ✓ ──
function StepRail({ i, onPick }: { i: number; onPick: (n: number) => void }) {
  const st = loop.steps[i];
  return (
    <div className="mt-7 max-w-[580px]">
      <p className="flex items-center gap-1.5 text-[11.5px] font-extrabold text-sub">
        <SparkMark size={13} /> {loop.label}
      </p>
      <ol role="tablist" className="mt-3 grid grid-cols-4 gap-2">
        {loop.steps.map((s, n) => {
          const on = n === i;
          const past = n < i;
          return (
            <li key={s.key} className="relative">
              <button
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => onPick(n)}
                className="relative flex w-full flex-col items-center rounded-[20px] border px-1 pb-3 pt-3.5"
                style={{
                  transition: ease,
                  borderColor: on ? s.color : past ? `${s.color}55` : "rgba(255,255,255,0.08)",
                  background: on ? `${s.color}22` : "rgba(255,255,255,0.02)",
                  boxShadow: on ? `0 0 28px ${s.color}55` : undefined,
                  transform: on ? "translateY(-3px)" : "none",
                }}
              >
                {past && (
                  <span className="absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-full text-[9px] font-black text-black" style={{ background: s.color }}>✓</span>
                )}
                <span style={{ opacity: on || past ? 1 : 0.45, transition: ease }}>
                  <StepIcon k={s.key} c={s.color} size={40} />
                </span>
                <span className="mt-1.5 text-[13.5px] font-extrabold" style={{ color: on ? s.color : "#c9c9dd" }}>{s.name}</span>
                <span className="mt-0.5 text-[10.5px] font-bold text-sub">{s.cap}</span>
              </button>
              {n < loop.steps.length - 1 && (
                <span aria-hidden className="absolute -right-[7px] top-[34px] z-10 text-[11px] font-black" style={{ color: past || on ? s.color : "#4b4b66" }}>›</span>
              )}
            </li>
          );
        })}
      </ol>
      {/* 지금 칸 한 줄 요약 */}
      <p
        key={st.key}
        className="word-in mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13.5px] font-extrabold"
        style={{ borderColor: `${st.color}66`, background: `${st.color}14`, color: st.color }}
      >
        <span className="grid h-5 w-5 place-items-center rounded-full text-[10px] font-black text-black" style={{ background: st.color }}>{i + 1}</span>
        {st.sum}
      </p>
    </div>
  );
}

// ── 오른쪽 — 질문이 기획서.md로 쌓이고, 점검 도장이 찍히고, 리포트가 나온다 ──
function HeroScene({ i }: { i: number }) {
  const [ask, back, check, keep] = loop.steps.map((s) => s.color);
  const rowColors = [ask, back, check, keep];
  const pop = (on: boolean, from = "translateY(10px)") => ({ transition: ease, opacity: on ? 1 : 0, transform: on ? "none" : from });
  return (
    <svg viewBox="0 0 400 470" className="w-full" role="img" aria-label={`${scene.doc}가 쌓이는 장면`}>
      <style>{`.hs-dash{stroke-dasharray:4 6;animation:hs-dash 1s linear infinite}@keyframes hs-dash{to{stroke-dashoffset:-20}}`}</style>
      <rect x={1} y={1} width={398} height={468} rx={26} fill="#0b0b14" stroke="rgba(255,255,255,0.1)" />

      {/* 1 · 묻는다 */}
      <g transform="translate(20 22)">
        <g style={pop(true)}>
          <rect width={176} height={44} rx={16} fill={`${ask}22`} stroke={ask} />
          <path d="M26 44l-6 10 16-10" fill={`${ask}22`} stroke={ask} strokeLinejoin="round" />
          <text x={16} y={28} fontSize={14} fontWeight={800} fill="#fff">💬 {scene.ask}</text>
        </g>
      </g>
      {/* 2 · 되묻는다 */}
      <g transform="translate(186 78)">
        <g style={pop(i >= 1)}>
          <rect width={194} height={44} rx={16} fill={`${back}22`} stroke={back} />
          <path d="M168 44l6 10-16-10" fill={`${back}22`} stroke={back} strokeLinejoin="round" />
          <text x={16} y={28} fontSize={14} fontWeight={800} fill="#fff">🙋 {scene.back}</text>
        </g>
      </g>
      {/* 대화 → 기획서로 흘러드는 선 */}
      <path className="hs-dash" d="M70 78 C70 110 110 120 120 150" fill="none" stroke={ask} strokeWidth={2} opacity={0.7} />
      <path className="hs-dash" d="M300 134 C300 145 285 145 280 150" fill="none" stroke={back} strokeWidth={2} style={{ transition: ease, opacity: i >= 1 ? 0.7 : 0 }} />

      {/* 기획서.md */}
      <g transform="translate(36 150)">
        <path d="M18 0h270l40 40v142a18 18 0 0 1-18 18H18A18 18 0 0 1 0 182V18A18 18 0 0 1 18 0z" fill="#13131f" stroke="rgba(255,255,255,0.16)" />
        <path d="M288 0v28a12 12 0 0 0 12 12h28" fill="none" stroke="rgba(255,255,255,0.16)" />
        <text x={18} y={30} fontSize={15} fontWeight={900} fill="#fff">📝 {scene.doc}</text>
        <line x1={18} x2={270} y1={44} y2={44} stroke="rgba(255,255,255,0.08)" />
        {scene.rows.map((t, n) => {
          const y = 58 + n * 34;
          const c = rowColors[n];
          const on = n <= i;
          return (
            <g key={t} transform={`translate(0 ${y})`}>
              <rect x={44} y={0} width={266} height={26} rx={9} fill="none" stroke="rgba(255,255,255,0.07)" strokeDasharray="3 4" />
              <rect
                x={44} y={0} width={266} height={26} rx={9} fill={`${c}24`} stroke={`${c}88`}
                style={{ transition: ease, transformBox: "fill-box", transformOrigin: "left", transform: on ? "scaleX(1)" : "scaleX(0)" }}
              />
              <circle cx={26} cy={13} r={10} fill={on ? c : "transparent"} stroke={on ? c : "rgba(255,255,255,0.15)"} style={{ transition: ease }} />
              <text x={26} y={17.5} fontSize={11} fontWeight={900} textAnchor="middle" fill={on ? "#0b0b14" : "#4b4b66"}>{n + 1}</text>
              <text x={58} y={17.5} fontSize={12.5} fontWeight={800} fill="#fff" style={{ transition: ease, opacity: on ? 1 : 0 }}>{t}</text>
            </g>
          );
        })}
      </g>

      {/* 3 · 점검 도장 */}
      <g transform="translate(322 214) rotate(-14)">
        <g style={{ transition: ease, opacity: i >= 2 ? 1 : 0, transform: i >= 2 ? "scale(1)" : "scale(1.7)" }}>
          <circle r={40} fill="#0b0b14" fillOpacity={0.85} stroke={check} strokeWidth={3} />
          <circle r={33} fill="none" stroke={check} strokeWidth={1.2} strokeDasharray="3 3" />
          <path d="M-10 -10l6 6 13-12" fill="none" stroke={check} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
          <text y={18} fontSize={13} fontWeight={900} textAnchor="middle" fill={check}>{scene.stamp}</text>
        </g>
      </g>

      {/* 4 · 리포트 */}
      <g transform="translate(36 370)">
        <g style={pop(i >= 3)}>
          <rect width={328} height={80} rx={18} fill={`${keep}14`} stroke={keep} />
          <text x={18} y={27} fontSize={14} fontWeight={900} fill="#fff">📊 {scene.report}</text>
          <text x={310} y={27} fontSize={11} fontWeight={800} textAnchor="end" fill={keep}>8칸</text>
          {[0.9, 0.5, 0.7, 0.35, 0.8, 0.45, 0.6, 0.95].map((o, n) => (
            <rect key={n} x={18 + n * 37.5} y={40} width={31} height={24} rx={6} fill={keep} fillOpacity={o * 0.75} />
          ))}
        </g>
      </g>
    </svg>
  );
}

// 히어로 — 하이라이트는 기획서를 잘 쓰는 게 아니라, 내가 설명할 수 있는 프로젝트가 남는 것.
export default function AboutHero() {
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setI((v) => (v + 1) % loop.steps.length), STEP_MS);
    return () => clearInterval(t);
  }, [auto]);
  const c = loop.steps[i].color;

  return (
    <div className="relative mx-auto grid w-full max-w-[1200px] items-center gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1fr_420px] lg:pt-16">
      <Reveal>
        <p className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 text-xs font-bold text-sub">
          <span style={{ color: "#FF6B35" }}><SparkMark size={14} /></span>
          {hero.badge}
        </p>
        <h1 className="hero-h1 mt-5 text-[36px] font-extrabold leading-[1.1] tracking-tight sm:text-[54px]">
          {hero.title}
          <span className="block grad-gold">{hero.headline}</span>
        </h1>
        <p className="mt-4 text-xl font-bold leading-snug sm:text-[25px]">{rich(hero.tagline)}</p>
        {hero.body && <p className="mt-2 text-[15px] leading-relaxed text-sub">{rich(hero.body)}</p>}

        <StepRail i={i} onPick={(n) => { setAuto(false); setI(n); }} />

        <div className="mt-8 flex flex-wrap items-center gap-2.5">
          <Link href="/" className="cta rounded-[20px] px-7 py-3.5 text-[15px] font-bold text-white">{hero.primary}</Link>
          <a href="#flow" className="ghost rounded-[20px] px-6 py-3.5 text-[15px] font-bold">{hero.axesMore} ↓</a>
        </div>
        <p className="mt-4 text-xs text-sub">{hero.note}</p>
      </Reveal>

      <Reveal delay={150} className="relative mx-auto w-full max-w-[420px]">
        <div aria-hidden className="pointer-events-none absolute inset-[12%] rounded-full blur-3xl transition-colors duration-700" style={{ background: `${c}33` }} />
        <div className="relative"><HeroScene i={i} /></div>
      </Reveal>
    </div>
  );
}
