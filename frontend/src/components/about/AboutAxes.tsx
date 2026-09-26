"use client";

import { useEffect, useState } from "react";
import AxisScene from "./AxisScene";
import { AxisIcon } from "./QuestionIcons";
import { axes } from "./question";
import Reveal from "./Reveal";
import { rich } from "./rich";

// 질문을 넓히는 여섯 축 — 밟아 올라가는 계단이 아니라, 아무 때나 하나 붙이면 되는 방향이다.
// 히어로나 다른 곳에서 #axis-criteria 같은 해시로 바로 그 축을 열 수 있다.

const items = axes.items;
const FOCUS_TONE = ["#67e8f9", "#34d399"];
const KEEP_TONE = ["#a78bfa", "#fbbf24", "#67e8f9", "#f472b6"];

function useHashAxis() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const read = () => {
      const m = /^#axis-([a-z]+)$/.exec(window.location.hash);
      if (!m) return;
      const n = items.findIndex((a) => a.key === m[1]);
      if (n >= 0) setI(n);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  return [i, setI] as const;
}

function Tabs({ i, onPick }: { i: number; onPick: (n: number) => void }) {
  return (
    <div role="tablist" aria-label={axes.eyebrow} className="noscroll -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {items.map((a, n) => {
        const on = n === i;
        return (
          <button
            key={a.key}
            id={`axis-${a.key}`}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onPick(n)}
            className="flex min-w-[92px] flex-1 scroll-mt-24 flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 transition-all"
            style={{
              borderColor: on ? a.color : "rgba(255,255,255,0.1)",
              background: on ? `${a.color}1f` : "rgba(255,255,255,0.03)",
              boxShadow: on ? `0 0 24px ${a.color}44` : undefined,
              color: on ? a.color : "#8a8aa8",
            }}
          >
            <AxisIcon k={a.key} size={on ? 26 : 23} />
            <b className="text-[13px] font-extrabold leading-none">{a.name}</b>
            <span className="text-center text-[10.5px] font-bold leading-tight" style={{ color: on ? a.color : "#7a7a9c" }}>{a.q}</span>
          </button>
        );
      })}
    </div>
  );
}

function Panel({ i }: { i: number }) {
  const a = items[i];
  const c = a.color;
  return (
    <div
      key={a.key}
      className="word-in mt-4 rounded-[28px] border p-5 sm:p-7"
      style={{ borderColor: `${c}4d`, background: `linear-gradient(180deg, ${c}12, transparent 70%)` }}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl" style={{ color: c, background: `${c}1f`, border: `1.5px solid ${c}59` }}>
          <AxisIcon k={a.key} size={26} />
        </span>
        <h3 className="text-[21px] font-extrabold leading-tight sm:text-[25px]">{a.full}</h3>
        <span className="rounded-full border px-3 py-1 text-[12.5px] font-extrabold" style={{ borderColor: `${c}80`, color: c, background: `${c}14` }}>
          “{a.q}”
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <p className="text-[11px] font-extrabold tracking-wide text-sub">{axes.sceneLabel}</p>
          <div className="mt-1.5 rounded-2xl border border-line bg-void p-3">
            <AxisScene k={a.key} color={c} label={`${a.full} — ${a.diff}`} />
          </div>
        </div>

        <div>
          {/* 좁게 → 한 축을 붙이면 */}
          <p className="text-[11px] font-extrabold tracking-wide text-sub">{axes.narrowLabel}</p>
          <p className="mt-1.5 rounded-2xl rounded-bl-md border border-line bg-sand px-4 py-2.5 text-[14px] font-semibold leading-snug text-sub">{a.narrow}</p>

          <p className="mt-3 flex items-center gap-1.5 text-[11px] font-extrabold tracking-wide" style={{ color: c }}>
            <AxisIcon k={a.key} size={14} />↓ {axes.wideLabel}
          </p>
          <p className="mt-1.5 rounded-2xl rounded-bl-md border px-4 py-2.5 text-[14px] font-bold leading-snug" style={{ borderColor: c, color: c, background: `${c}0f` }}>{a.wide}</p>

          <p className="mt-3 text-[11px] font-extrabold tracking-wide text-clay">🙋 {axes.backLabel}</p>
          <p className="mt-1.5 rounded-2xl rounded-br-md border border-clay bg-clay-soft px-4 py-2.5 text-[13.5px] font-bold leading-snug text-clay">{a.back}</p>

          <p className="mt-4 border-t border-line pt-3 text-[11px] font-extrabold tracking-wide text-sub">{axes.diffLabel}</p>
          <p className="mt-1 text-[13.5px] leading-relaxed">{a.diff}</p>
        </div>
      </div>
    </div>
  );
}

export default function AboutAxes() {
  const [i, setI] = useHashAxis();
  return (
    <section id="axes" className="relative mx-auto w-full max-w-[1200px] px-4 py-16 sm:px-6 sm:py-24">
      <Reveal>
        <p className="eyebrow text-center" style={{ color: "#a78bfa" }}>{axes.eyebrow}</p>
        <h2 className="mt-3 text-center text-[28px] font-extrabold leading-[1.2] tracking-tight sm:text-[42px]">{rich(axes.title)}</h2>
        <p className="mx-auto mt-4 max-w-[740px] text-center text-[15px] leading-relaxed text-sub sm:text-[17px]">{axes.lead}</p>
        <p className="mx-auto mt-4 w-fit rounded-full border border-line bg-card px-4 py-1.5 text-[12.5px] font-extrabold text-sub">{axes.noOrder}</p>
      </Reveal>

      <Reveal delay={120} className="mt-9">
        <Tabs i={i} onPick={setI} />
        <Panel i={i} />
      </Reveal>

      {/* 넓히는 이유 둘 — 내가 아는 것이 드러나고, 아이템이 단단해진다 */}
      <Reveal delay={160} className="mt-10">
        <p className="text-center text-[12px] font-extrabold tracking-wide text-sub">{axes.focusLabel}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {axes.focus.map((f, n) => (
            <div key={f.key} className="stg tilecard p-5" style={{ animationDelay: `${n * 0.12}s` }}>
              <p className="flex items-center gap-2 text-[17px] font-extrabold">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl" style={{ color: FOCUS_TONE[n], background: `${FOCUS_TONE[n]}1f`, border: `1.4px solid ${FOCUS_TONE[n]}59` }}>
                  <AxisIcon k={f.key === "know" ? "verify" : "criteria"} size={18} />
                </span>
                {f.t}
              </p>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-sub">{f.d}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* 넓힌 질문은 사라지지 않는다 — 질문·방향·프롬프트가 그대로 리포트로 */}
      <Reveal delay={200} className="mt-8">
        <div className="rounded-[28px] border border-line bg-card p-5 sm:p-7">
          <p className="text-center text-[14px] font-extrabold">{axes.keepsLabel}</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {axes.keeps.map((k, n) => (
              <li key={k.t} className="stg rounded-2xl border border-line bg-sand p-4" style={{ animationDelay: `${n * 0.1}s` }}>
                <span className="text-[11px] font-extrabold" style={{ color: KEEP_TONE[n] }}>{String(n + 1).padStart(2, "0")}</span>
                <b className="mt-1 block text-[14px] font-extrabold leading-snug">{k.t}</b>
                <span className="mt-1.5 block text-[12.5px] leading-relaxed text-sub">{k.d}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-center text-[13px] font-bold text-clay">{axes.keepsNote}</p>
        </div>
      </Reveal>

      <Reveal delay={240}>
        <p className="mx-auto mt-9 max-w-[720px] text-center text-[15px] font-bold leading-relaxed">{rich(axes.closing)}</p>
        <p className="mt-6 text-center text-[13px] font-bold text-sub">{axes.formatsLabel}</p>
      </Reveal>
    </section>
  );
}
