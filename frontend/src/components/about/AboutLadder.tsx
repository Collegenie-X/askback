"use client";

import { useEffect, useState } from "react";
import { LevelIcon, StepIcon } from "./LadderIcons";
import LadderScene from "./LadderScene";
import { ladder, levelOf } from "./ladder";
import Reveal from "./Reveal";
import { rich } from "./rich";

// 7단계 — 일곱 칸을 탭 하나로 접어 둔다.
// 아이콘 일곱 개는 늘 함께 보이고, 펼쳐지는 것은 고른 한 칸뿐이다.
// 히어로의 아이콘을 누르면 #step-3 같은 해시로 여기 그 칸이 열린다.

const steps = ladder.steps;

function useHashStep() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const read = () => {
      const m = /^#step-(\d+)$/.exec(window.location.hash);
      if (!m) return;
      const n = steps.findIndex((s) => s.no === Number(m[1]));
      if (n >= 0) setI(n);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  return [i, setI] as const;
}

// 탭 줄 — 일곱 칸을 한눈에. 색은 그 칸이 속한 층(불씨→봉화)을 따른다.
function Tabs({ i, onPick }: { i: number; onPick: (n: number) => void }) {
  return (
    <div role="tablist" aria-label={ladder.eyebrow} className="noscroll -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {steps.map((s, n) => {
        const c = levelOf(s).color;
        const on = n === i;
        return (
          <button
            key={s.no}
            id={`step-${s.no}`}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onPick(n)}
            className="flex min-w-[76px] flex-1 scroll-mt-24 flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 transition-all"
            style={{
              borderColor: on ? c : "rgba(255,255,255,0.1)",
              background: on ? `${c}1f` : "rgba(255,255,255,0.03)",
              boxShadow: on ? `0 0 24px ${c}44` : undefined,
              color: on ? c : "#8a8aa8",
            }}
          >
            <StepIcon n={n} size={on ? 26 : 23} />
            <b className="text-[11.5px] font-extrabold leading-none">{s.no}단계</b>
            <span className="text-center text-[11px] font-bold leading-tight" style={{ color: on ? c : "#7a7a9c" }}>
              <span className="lg:hidden">{s.short}</span>
              <span className="hidden lg:inline">{s.title}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

// 펼쳐지는 한 칸 — 하는 일 · 주고받는 두 마디 · 남는 것 · 자주 막히는 자리
function Panel({ i, onPick }: { i: number; onPick: (n: number) => void }) {
  const s = steps[i];
  const lv = levelOf(s);
  const c = lv.color;
  return (
    <div
      key={s.no}
      className="word-in mt-4 rounded-[28px] border p-5 sm:p-7"
      style={{ borderColor: `${c}4d`, background: `linear-gradient(180deg, ${c}12, transparent 70%)` }}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl" style={{ color: c, background: `${c}1f`, border: `1.5px solid ${c}59` }}>
          <StepIcon n={i} size={26} />
        </span>
        <h3 className="text-[21px] font-extrabold leading-tight sm:text-[25px]">{s.no}단계 · {s.title}</h3>
        <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-extrabold" style={{ borderColor: `${c}80`, color: c, background: `${c}14` }}>
          <LevelIcon lvl={lv.key} size={14} />
          {lv.name} · {lv.span}
        </span>
      </div>
      <p className="mt-3 max-w-[760px] text-[14.5px] leading-relaxed text-sub">{s.line}</p>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        {/* 그 칸에서 실제로 벌어지는 일 + 주고받는 두 마디 */}
        <div>
          <p className="text-[11px] font-extrabold tracking-wide text-sub">{ladder.sceneLabel}</p>
          <div className="mt-1.5 rounded-2xl border border-line bg-void p-3">
            <LadderScene n={i} color={c} label={`${s.no}단계 ${s.title} — ${s.line}`} />
          </div>
          <p className="mt-4 text-[11px] font-extrabold tracking-wide text-sub">{ladder.sayLabel}</p>
          <p className="mt-1.5 rounded-2xl rounded-bl-md border border-line bg-sand px-4 py-3 text-[14.5px] font-semibold leading-snug">{s.say}</p>
          <p className="mt-2.5 pl-1 text-[11px] font-extrabold tracking-wide" style={{ color: c }}>↓ {ladder.backLabel}</p>
          <p className="mt-1.5 rounded-2xl rounded-br-md border px-4 py-3 text-[14.5px] font-bold leading-snug" style={{ borderColor: c, color: c, background: `${c}0f` }}>
            {s.back}
          </p>
        </div>

        {/* 남는 것 · 자주 막히는 자리 */}
        <div className="rounded-2xl border border-line bg-card p-4">
          <p className="text-[11px] font-extrabold tracking-wide text-sub">{ladder.gainLabel}</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {s.gain.split(" · ").map((g) => (
              <li key={g} className="rounded-full border px-2.5 py-1 text-[12.5px] font-extrabold" style={{ borderColor: `${c}66`, color: c }}>{g}</li>
            ))}
          </ul>
          <p className="mt-4 border-t border-line pt-3 text-[12.5px] leading-relaxed text-sub">{s.stuck}</p>
        </div>
      </div>

      {/* 앞뒤로 한 칸씩 */}
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
        <button type="button" disabled={i === 0} onClick={() => onPick(i - 1)} className="ghost rounded-full px-4 py-2 text-[13px] font-bold disabled:invisible">
          ← {steps[i - 1]?.no}단계
        </button>
        <span className="text-[12px] font-extrabold text-sub">{s.no} / {steps.length}</span>
        <button type="button" disabled={i === steps.length - 1} onClick={() => onPick(i + 1)} className="ghost rounded-full px-4 py-2 text-[13px] font-bold disabled:invisible">
          {steps[i + 1]?.no}단계 →
        </button>
      </div>
    </div>
  );
}

export default function AboutLadder() {
  const [i, setI] = useHashStep();
  return (
    <section id="ladder" className="relative mx-auto w-full max-w-[1200px] px-4 py-16 sm:px-6 sm:py-24">
      <Reveal>
        <p className="eyebrow text-center" style={{ color: ladder.levels[3].color }}>{ladder.eyebrow}</p>
        <h2 className="mt-3 text-center text-[28px] font-extrabold leading-[1.2] tracking-tight sm:text-[42px]">{rich(ladder.title)}</h2>
        <p className="mx-auto mt-4 max-w-[720px] text-center text-[15px] leading-relaxed text-sub sm:text-[17px]">{ladder.lead}</p>
      </Reveal>

      <Reveal delay={120} className="mt-10">
        <Tabs i={i} onPick={setI} />
        <Panel i={i} onPick={setI} />
      </Reveal>

      <Reveal delay={180}>
        <p className="mt-10 text-center text-[13.5px] font-bold text-sub">{ladder.formatsLabel}</p>
        <ul className="mt-3 flex flex-wrap justify-center gap-1.5">
          {ladder.formats.map((f) => (
            <li key={f} className="rounded-full border border-line bg-card px-3.5 py-1.5 text-[13px] font-bold text-sub">{f}</li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
