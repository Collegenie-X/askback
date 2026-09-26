"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import about from "@/data/about.json";
import OpenChat from "./OpenChat";
import { SparkMark } from "./QuestionIcons";
import { OPEN_LEVELS, SWEET, open } from "./question";
import Reveal from "./Reveal";
import { rich } from "./rich";

const { hero } = about;
const STEP_MS = 4600;

// 열림 다이얼 — 사다리가 아니다. 왼쪽으로 가면 내 판단만 남고, 오른쪽으로 가면 나와 상관없는 답이 온다.
// 다이얼과 설명이 한 몸으로 같이 움직인다.
function OpenDial({ i, onPick }: { i: number; onPick: (n: number) => void }) {
  const lv = OPEN_LEVELS[i];
  const c = lv.color;
  return (
    <div
      className="mt-6 max-w-[580px] overflow-hidden rounded-[26px] border transition-colors duration-500"
      style={{ borderColor: `${c}4d`, background: `linear-gradient(180deg, ${c}12, rgba(255,255,255,0.02) 62%)` }}
    >
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 pt-3.5 text-[11.5px] font-extrabold" style={{ color: c }}>
        <SparkMark size={14} />
        {open.label}
        <span className="font-bold text-sub">· {open.hint}</span>
      </p>

      {/* 다섯 칸 — 가운데가 스위트 스팟 */}
      <ol role="tablist" className="flex gap-1 px-2.5 pt-2.5">
        {OPEN_LEVELS.map((l, n) => {
          const on = n === i;
          const isSweet = n === SWEET;
          return (
            <li key={l.key} className="flex-1">
              <button
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => onPick(n)}
                className="flex w-full flex-col items-center gap-1 rounded-2xl border px-0.5 py-2 transition-all duration-300"
                style={{
                  borderColor: on ? l.color : "transparent",
                  background: on ? `${l.color}24` : "transparent",
                  boxShadow: on ? `0 0 20px ${l.color}55` : undefined,
                }}
              >
                <span className="text-[10px] font-extrabold leading-none" style={{ color: on ? l.color : "#6b6b8f" }}>{l.key}</span>
                <span className="text-[11px] font-extrabold leading-tight" style={{ color: on ? l.color : "#8a8aa8" }}>{l.label}</span>
                <span
                  aria-hidden
                  className="mt-0.5 block h-[3px] w-full rounded-full"
                  style={{ background: on ? l.color : isSweet ? "#34d39966" : "rgba(255,255,255,0.08)" }}
                />
              </button>
            </li>
          );
        })}
      </ol>
      {/* 스위트 스팟 표시 — O3 칸 바로 아래에 세운다 */}
      <div aria-hidden className="relative h-5 px-2.5">
        <span
          className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-[10.5px] font-extrabold text-mint"
          style={{ left: `calc(${((SWEET + 0.5) / OPEN_LEVELS.length) * 100}% )` }}
        >
          ↑ {open.sweet}
        </span>
      </div>

      {/* 지금 칸을 가리키는 꼭지 */}
      <div aria-hidden className="relative h-2.5">
        <span
          className="absolute top-0 h-2.5 w-2.5 rotate-45 border-l border-t transition-all duration-500"
          style={{ left: `calc(${((i + 0.5) / OPEN_LEVELS.length) * 100}% - 5px)`, borderColor: `${c}80`, background: `${c}1a` }}
        />
      </div>

      <div className="border-t px-4 pb-4 pt-3.5" style={{ borderColor: `${c}33`, background: `${c}0d` }}>
        <p key={`s${lv.key}`} className="word-in text-[14px] font-extrabold" style={{ color: c }}>{lv.shape}</p>
        <dl key={`g${lv.key}`} className="word-in mt-3 grid gap-1.5 text-[12.5px] sm:grid-cols-2">
          <div className="flex gap-2 rounded-xl border border-mint bg-mint-soft px-3 py-2">
            <dt className="shrink-0 font-extrabold text-mint">+ {open.gainLabel}</dt>
            <dd className="font-semibold">{lv.gain}</dd>
          </div>
          <div className="flex gap-2 rounded-xl border border-line bg-card px-3 py-2">
            <dt className="shrink-0 font-extrabold text-[#fb7185]">− {open.loseLabel}</dt>
            <dd className="font-semibold text-sub">{lv.lose}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

// 히어로 — 같은 것을 물어도 얼마나 열어서 묻느냐에 따라 AI가 달라진다.
export default function AboutHero() {
  const [i, setI] = useState(SWEET);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setI((v) => (v + 1) % OPEN_LEVELS.length), STEP_MS);
    return () => clearInterval(t);
  }, [auto]);
  const lv = OPEN_LEVELS[i];

  return (
    <div className="relative mx-auto grid w-full max-w-[1200px] items-center gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1fr_400px] lg:pt-16">
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
        <p className="mt-3 max-w-[540px] text-[15px] leading-relaxed text-sub">{rich(hero.body)}</p>

        <OpenDial i={i} onPick={(n) => { setAuto(false); setI(n); }} />
        <p className="mt-3 max-w-[580px] text-[12.5px] leading-relaxed text-sub">{open.note}</p>

        <div className="mt-7 flex flex-wrap items-center gap-2.5">
          <Link href="/" className="cta rounded-[20px] px-7 py-3.5 text-[15px] font-bold text-white">{hero.primary}</Link>
          <a href="#axes" className="ghost rounded-[20px] px-6 py-3.5 text-[15px] font-bold">{hero.axesMore} ↓</a>
        </div>
        <p className="mt-4 text-xs text-sub">{hero.note}</p>
      </Reveal>

      <Reveal delay={150} className="relative mx-auto w-full max-w-[400px]">
        <div aria-hidden className="pointer-events-none absolute inset-[14%] rounded-full blur-3xl transition-colors duration-700" style={{ background: `${lv.color}2e` }} />
        <div className="relative"><OpenChat lv={lv} sweet={i === SWEET} /></div>
      </Reveal>
    </div>
  );
}
