"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import about from "@/data/about.json";
import LadderArt from "./LadderArt";
import { LevelIcon, StepIcon } from "./LadderIcons";
import LadderScene from "./LadderScene";
import { LADDER_STEPS, ladder, levelOf } from "./ladder";
import Reveal from "./Reveal";
import { rich } from "./rich";

const { hero } = about;
const STEP_MS = 4200;

// 일곱 칸 한 덩어리 — 아이콘 줄 · 가리키는 꼭지 · 설명이 한 몸으로 같이 바뀐다.
// 아이콘을 누르면 아래 7단계 탭의 그 칸이 열린다.
function LadderCapsule({ i, onPick }: { i: number; onPick: (n: number) => void }) {
  const s = LADDER_STEPS[i];
  const lv = levelOf(s);
  const c = lv.color;
  return (
    <div
      className="mt-6 max-w-[580px] overflow-hidden rounded-[26px] border transition-colors duration-500"
      style={{ borderColor: `${c}4d`, background: `linear-gradient(180deg, ${c}12, rgba(255,255,255,0.02) 60%)` }}
    >
      {/* 양 끝이 어디서 어디까지인지 */}
      <div className="flex items-center gap-2.5 px-4 pt-3.5 text-[11px] font-extrabold">
        <span className="inline-flex items-center gap-1" style={{ color: ladder.levels[0].color }}>
          <LevelIcon lvl="ember" size={14} />{ladder.levels[0].name}
        </span>
        <span aria-hidden className="h-px flex-1 rounded-full" style={{ background: `linear-gradient(90deg, ${ladder.levels[0].color}, ${ladder.levels[3].color})`, opacity: 0.45 }} />
        <span className="inline-flex items-center gap-1" style={{ color: ladder.levels[3].color }}>
          {ladder.levels[3].name}<LevelIcon lvl="beacon" size={14} />
        </span>
      </div>

      {/* 일곱 칸 — 아이콘과 짧은 이름 */}
      <ol role="tablist" className="flex gap-1 px-2.5 pt-2.5 sm:gap-1.5">
        {LADDER_STEPS.map((st, n) => {
          const cc = levelOf(st).color;
          const on = n === i;
          return (
            <li key={st.no} className="flex-1">
              <button
                type="button"
                role="tab"
                aria-selected={on}
                aria-label={`${st.no}단계 ${st.title}`}
                onClick={() => onPick(n)}
                className="flex w-full flex-col items-center gap-1 rounded-2xl border px-0.5 py-2 transition-all duration-300"
                style={{
                  color: on ? cc : `${cc}8c`,
                  borderColor: on ? cc : "transparent",
                  background: on ? `${cc}24` : "transparent",
                  boxShadow: on ? `0 0 20px ${cc}55` : undefined,
                }}
              >
                <StepIcon n={n} size={on ? 23 : 20} />
                <span className="text-[10px] font-extrabold leading-none" style={{ color: on ? cc : "#7a7a9c" }}>{st.short}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* 지금 칸을 가리키는 꼭지 — 아이콘 줄과 설명을 한 몸으로 잇는다 */}
      <div aria-hidden className="relative h-2.5">
        <span
          className="absolute top-0 h-2.5 w-2.5 rotate-45 border-l border-t transition-all duration-500"
          style={{ left: `calc(${(i + 0.5) / LADDER_STEPS.length * 100}% - 5px)`, borderColor: `${c}80`, background: `${c}1a` }}
        />
      </div>

      {/* 그 칸에서 실제로 벌어지는 일 */}
      <div className="border-t px-4 pb-4 pt-3.5" style={{ borderColor: `${c}33`, background: `${c}0d` }}>
        <p key={`t${s.no}`} className="word-in text-[14px] font-extrabold" style={{ color: c }}>
          {s.no}단계 · {s.title}
        </p>
        <div className="mt-2.5 rounded-2xl border border-line bg-void p-2.5">
          <LadderScene n={i} color={c} label={`${s.no}단계 ${s.title} — ${s.line}`} />
        </div>
        <p key={`g${s.no}`} className="word-in mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-extrabold text-sub">{ladder.gainLabel}</span>
          {s.gain.split(" · ").map((g) => (
            <span key={g} className="rounded-full border px-2.5 py-0.5 text-[11.5px] font-extrabold" style={{ borderColor: `${c}66`, color: c }}>{g}</span>
          ))}
        </p>
      </div>
    </div>
  );
}

// 히어로 — 한 줄이 무엇이 되는지 먼저 보이고, 일곱 칸이 한 덩어리로 그 과정을 돌린다.
export default function AboutHero() {
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setI((v) => (v + 1) % LADDER_STEPS.length), STEP_MS);
    return () => clearInterval(t);
  }, [auto]);
  const color = levelOf(LADDER_STEPS[i]).color;
  const ex = hero.example;

  return (
    <div className="relative mx-auto grid w-full max-w-[1200px] items-center gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1fr_400px] lg:pt-16">
      <Reveal>
        <p className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 text-xs font-bold text-sub">
          <span style={{ color: ladder.levels[3].color }}><LevelIcon lvl="beacon" size={14} /></span>
          {hero.badge}
        </p>
        <h1 className="hero-h1 mt-5 text-[36px] font-extrabold leading-[1.1] tracking-tight sm:text-[54px]">
          {hero.title}
          <span className="block grad-gold">{hero.headline}</span>
        </h1>
        <p className="mt-4 text-xl font-bold leading-snug sm:text-[25px]">{rich(hero.tagline)}</p>

        {/* 한 줄이 무엇이 되는지 — 이 페이지가 끝까지 끌고 가는 한 가지 예시 */}
        <div className="mt-5 flex max-w-[580px] flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-line bg-card px-4 py-3">
          <span className="text-[15px] font-bold text-ink">{ex.from}</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold" style={{ color: ladder.levels[3].color }}>
            —<LevelIcon lvl="beacon" size={13} />{ex.via}→
          </span>
          <span className="flex flex-wrap gap-1">
            {ex.to.map((t) => (
              <span key={t} className="rounded-full border px-2.5 py-0.5 text-[12px] font-extrabold" style={{ borderColor: `${ladder.levels[3].color}66`, color: ladder.levels[3].color }}>{t}</span>
            ))}
          </span>
        </div>

        <LadderCapsule i={i} onPick={(n) => { setAuto(false); setI(n); }} />

        <div className="mt-7 flex flex-wrap items-center gap-2.5">
          <Link href="/" className="cta rounded-[20px] px-7 py-3.5 text-[15px] font-bold text-white">{hero.primary}</Link>
          <a href="#ladder" className="ghost rounded-[20px] px-6 py-3.5 text-[15px] font-bold">{hero.ladderMore} ↓</a>
        </div>
        <p className="mt-4 text-xs text-sub">{hero.note}</p>
      </Reveal>

      <Reveal delay={150} className="relative mx-auto w-full max-w-[400px]">
        <div aria-hidden className="pointer-events-none absolute inset-[12%] rounded-full blur-3xl transition-colors duration-700" style={{ background: `${color}2e` }} />
        <div className="relative"><LadderArt i={i} /></div>
      </Reveal>
    </div>
  );
}
