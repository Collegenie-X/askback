"use client";

import { useEffect, useState } from "react";
import about from "@/data/about.json";
import formats from "@/data/formats.json";
import Buddy from "../Buddy";
import { FormatArt, Glyph, PersonaArt, SceneArt } from "./AboutArt";

// 탭은 스스로 넘어가다가, 한 번 누르면 멈춘다
function useAutoTab(count: number, ms: number) {
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setI((v) => (v + 1) % count), ms);
    return () => clearInterval(t);
  }, [auto, count, ms]);
  return [i, (n: number) => { setAuto(false); setI(n); }, auto] as const;
}

const tabBtn = (on: boolean) => `tab shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-bold transition ${on ? "on" : ""}`;

/* ── 왜 필요한가: 여덟 장면을 네 묶음으로 ─────────────────── */
const SCENE_GROUPS = about.problem.sceneGroups;

export function SceneTabs() {
  const [i, pick] = useAutoTab(SCENE_GROUPS.length, 5200);
  const g = SCENE_GROUPS[i];
  return (
    <div>
      <div role="tablist" className="noscroll flex gap-2 overflow-x-auto pb-1">
        {SCENE_GROUPS.map((x, n) => <button key={x.label} role="tab" aria-selected={n === i} type="button" onClick={() => pick(n)} className={tabBtn(n === i)}>{x.label}</button>)}
      </div>
      <div key={i} className="mt-4 grid gap-3 md:grid-cols-2">
        {g.scenes.map((s, n) => (
          <div key={s.title} className="tilecard swap overflow-hidden" style={{ animationDelay: `${n * 0.12}s` }}>
            <div className="scene-stage px-6 pt-5"><div className="mx-auto max-w-[380px]"><SceneArt name={s.art} /></div></div>
            <div className="p-5">
              <p className="text-[11px] font-extrabold text-sub">장면 {i * 2 + n + 1}</p>
              <h3 className="mt-0.5 text-lg font-extrabold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-sub"><b className="text-[#fb7185]">{about.problem.nowLabel}</b>{s.now}</p>
              <p className="mt-3 rounded-xl bg-mint-soft px-3.5 py-2.5 text-[13.5px] font-semibold leading-snug text-mint">{s.fix}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 누구에게: 네 고객군 — 안쪽 궤도부터 ─────────────────── */
const AUDIENCES = about.who.audiences;

export function AudienceTabs() {
  const [i, pick] = useAutoTab(AUDIENCES.length, 6000);
  const a = AUDIENCES[i];
  const C = 150;
  return (
    <div className="grid items-center gap-6 lg:grid-cols-[320px_1fr]">
      {/* 궤도 — 안쪽부터 절실한 순서 */}
      <svg viewBox="0 0 300 300" role="img" aria-label="네 고객군이 안쪽 궤도부터 놓여 있다" className="mx-auto h-auto w-full max-w-[320px]" style={{ fontFamily: "inherit" }}>
        <circle cx={C} cy={C} r="20" fill="#fbbf24" className="ab-pulse" />
        <text x={C} y={C + 4} textAnchor="middle" fontSize="10" fontWeight="800" fill="#04060f">설계</text>
        {AUDIENCES.map((x, n) => {
          const r = 48 + n * 30;
          const ang = (-50 + n * 95) * (Math.PI / 180);
          const px = C + Math.cos(ang) * r, py = C + Math.sin(ang) * r;
          const on = n === i;
          return (
            <g key={x.title} onClick={() => pick(n)} className="cursor-pointer">
              <circle cx={C} cy={C} r={r} fill="none" stroke={on ? x.color : "#2c2c46"} strokeWidth={on ? 2.4 : 1.2} strokeDasharray={on ? undefined : "3 6"} style={{ transition: "stroke 0.3s" }} />
              <circle cx={px} cy={py} r={on ? 17 : 11} fill={x.color} opacity={on ? 1 : 0.55} className={on ? "neon" : undefined} style={{ transition: "r 0.3s, opacity 0.3s", ["--neon" as string]: `${x.color}99` }} />
              {on && <circle cx={px} cy={py} r="24" fill="none" stroke={x.color} className="ab-pulse" />}
              <text x={px} y={py + 4.500} textAnchor="middle" fontSize={on ? 13 : 10} fontWeight="800" fill="#04060f">{n + 1}</text>
            </g>
          );
        })}
      </svg>

      <div>
        <div role="tablist" className="noscroll flex gap-2 overflow-x-auto pb-1">
          {AUDIENCES.map((x, n) => <button key={x.tab} role="tab" aria-selected={n === i} type="button" onClick={() => pick(n)} className={tabBtn(n === i)}>{x.tab}</button>)}
        </div>
        <div key={i} className="tilecard swap mt-4 p-5 sm:p-6" style={{ borderColor: `${a.color}88` }}>
          <div className="flex items-center gap-4">
            <div className="w-[120px] shrink-0 sm:w-[150px]"><PersonaArt who={a.who as "student" | "teacher" | "parent" | "school"} /></div>
            <div>
              <p className="text-[11px] font-extrabold" style={{ color: a.color }}>{about.who.orbitLabel} {i + 1}</p>
              <h3 className="text-xl font-extrabold sm:text-2xl">{a.title}</h3>
              <p className="mt-1 text-[13px] font-semibold leading-snug text-sub">{a.lead}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#fb718555] bg-[#2a0f1655] p-4">
              <p className="text-xs font-extrabold text-[#fb7185]">{about.who.painsLabel}</p>
              <ul className="mt-2 space-y-1.5 text-[13.5px] leading-snug">{a.pains.map((p) => <li key={p} className="flex gap-2"><span className="text-[#fb7185]">✕</span>{p}</li>)}</ul>
            </div>
            <div className="rounded-2xl border border-[#34d39955] bg-mint-soft p-4">
              <p className="text-xs font-extrabold text-mint">{about.who.gainsLabel}</p>
              <ul className="mt-2 space-y-1.5 text-[13.5px] leading-snug">{a.gains.map((p) => <li key={p} className="flex gap-2"><span className="text-mint">✓</span>{p}</li>)}</ul>
            </div>
          </div>
          <p className="mt-4 rounded-xl bg-sand px-3.5 py-2.5 text-[13px] font-semibold"><span className="text-clay">{about.who.startLabel}</span>{a.start}</p>
        </div>
      </div>
    </div>
  );
}

/* ── 사용법: 다섯 정거장을 돌면 가운데에서 리포트가 뜬다 ───── */
const CYCLE = about.how.cycle;

export function OrbitCycle() {
  const [i, pick] = useAutoTab(CYCLE.length, 4200);
  const s = CYCLE[i];
  const C = 200, R = 140;
  const pos = (n: number) => { const a = (-90 + n * 72) * (Math.PI / 180); return [C + Math.cos(a) * R, C + Math.sin(a) * R]; };
  const ring = `M${C} ${C - R}A${R} ${R} 0 1 1 ${C - 0.01} ${C - R}`;
  return (
    <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      <svg viewBox="0 0 400 400" role="img" aria-label="다섯 정거장을 도는 궤도와 가운데의 10문 리포트" className="mx-auto h-auto w-full max-w-[420px]" style={{ fontFamily: "inherit" }}>
        <circle cx={C} cy={C} r={R + 34} fill="none" stroke="#2c2c46" strokeDasharray="2 8" />
        <path d={ring} fill="none" stroke="#2c2c46" strokeWidth="3" />
        <path d={ring} fill="none" stroke="#a78bfa" strokeWidth="3" className="ab-dash" opacity="0.7" />
        <g><animateMotion dur="14s" repeatCount="indefinite" path={ring} rotate="auto" /><path d="M-9 -6L9 0L-9 6L-5 0z" fill="#fff" /><path d="M-9 0h-10" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" className="ab-tw" /></g>
        {CYCLE.slice(0, 5).map((x, n) => <path key={n} d={`M${C} ${C}L${pos(n)[0]} ${pos(n)[1]}`} stroke="#2c2c46" strokeDasharray="3 6" />)}
        {/* 가운데 — 리포트 */}
        <g onClick={() => pick(5)} className="cursor-pointer">
          <circle cx={C} cy={C} r="62" fill="#67e8f9" opacity={i === 5 ? 0.22 : 0.08} className="ab-pulse" />
          <path d={`M${C} ${C - 52}l45 26v52l-45 26-45-26v-52z`} fill="#11112a" stroke={i === 5 ? "#67e8f9" : "#4a4a78"} strokeWidth={i === 5 ? 3 : 1.6} />
          <text x={C} y={C - 6} textAnchor="middle" fontSize="14" fontWeight="800" fill="#ffffff">10문 리포트</text>
          <text x={C} y={C + 14} textAnchor="middle" fontSize="14" fontWeight="800" fill="#67e8f9">&amp; 미션</text>
        </g>
        {CYCLE.slice(0, 5).map((x, n) => {
          const [px, py] = pos(n);
          const on = n === i;
          return (
            <g key={x.title} onClick={() => pick(n)} className="cursor-pointer">
              {on && <circle cx={px} cy={py} r="40" fill={x.color} opacity="0.2" className="ab-pulse" />}
              <circle cx={px} cy={py} r={on ? 32 : 25} fill="#0b0b16" stroke={x.color} strokeWidth={on ? 3.4 : 1.8} className={on ? "neon" : undefined} style={{ transition: "r 0.3s", ["--neon" as string]: `${x.color}99` }} />
              <text x={px} y={py + 8} textAnchor="middle" fontSize={on ? 24 : 19}>{x.emoji}</text>
              <circle cx={px + (on ? 24 : 19)} cy={py - (on ? 24 : 19)} r="10" fill={x.color} />
              <text x={px + (on ? 24 : 19)} y={py - (on ? 24 : 19) + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="#04060f">{n + 1}</text>
              <text x={px} y={n === 0 ? py - 40 : py + (on ? 50 : 43)} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={on ? x.color : "#c9c9e6"} stroke="#0b0b16" strokeWidth="4" paintOrder="stroke" strokeLinejoin="round" style={{ transition: "fill 0.3s" }}>{x.short}</text>
            </g>
          );
        })}
      </svg>

      <div>
        <div role="tablist" className="noscroll flex gap-1.5 overflow-x-auto pb-1">
          {CYCLE.map((x, n) => <button key={x.title} role="tab" aria-selected={n === i} type="button" onClick={() => pick(n)} className={tabBtn(n === i)}>{n < 5 ? n + 1 : "★"} {x.emoji}</button>)}
        </div>
        <div key={i} className="tilecard swap mt-4 p-5 sm:p-6" style={{ borderColor: `${s.color}88` }}>
          <p className="text-[11px] font-extrabold tracking-wider" style={{ color: s.color }}>{i < 5 ? `${about.how.stationLabel} ${i + 1} / 5` : about.how.centerLabel}</p>
          <h3 className="mt-1 text-xl font-extrabold sm:text-2xl">{s.emoji} {s.title}</h3>
          <p className="mt-1 text-[13px] font-semibold text-sub">{s.tag}</p>
          <p className="mt-4 rounded-xl border border-line bg-void px-3.5 py-2.5 text-[13px] font-semibold"><span className="text-sub">{about.how.clickLabel}</span>{s.click}</p>
          <ul className="mt-3 space-y-2">
            {s.does.map((d, n) => <li key={d} className="swap flex gap-2.5 text-sm leading-snug" style={{ animationDelay: `${0.15 + n * 0.12}s` }}><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: s.color }} />{d}</li>)}
          </ul>
          <p className="mt-4 inline-block rounded-full px-3 py-1 text-xs font-extrabold text-void" style={{ background: s.color }}>{about.how.leftLabel}{s.left}</p>
        </div>
      </div>
    </div>
  );
}

/* ── 다섯 형식 탐색기 ─────────────────────────────────── */
const FORMAT_GLYPH: Record<string, string> = { paper: "paper", research: "search", campaign: "clapper", service: "browser", product: "robot" };
const FORMAT_EX: Record<string, { project: string; q: string; back: string; fill: string }> = about.formats.examples;

export function FormatExplorer() {
  const keys = Object.keys(formats.formats) as (keyof typeof formats.formats)[];
  const [i, pick] = useAutoTab(keys.length, 7000);
  const key = keys[i];
  const f = formats.formats[key];
  const ex = FORMAT_EX[key];
  return (
    <div>
      <div role="tablist" className="noscroll flex gap-2 overflow-x-auto pb-1">
        {keys.map((k, n) => {
          const x = formats.formats[k];
          return (
            <button key={k} role="tab" aria-selected={n === i} type="button" onClick={() => pick(n)} className={`${tabBtn(n === i)} flex items-center gap-2`} style={n === i ? { background: x.color, borderColor: x.color } : undefined}>
              <Glyph name={FORMAT_GLYPH[k]} size={18} />{x.name}
            </button>
          );
        })}
      </div>
      <div key={key} className="tilecard swap mt-4 grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_1fr]" style={{ borderColor: `${f.color}88` }}>
        <div>
          <p className="text-[11px] font-extrabold" style={{ color: f.color }}>{about.formats.meaningLabel}</p>
          <h3 className="mt-0.5 text-xl font-extrabold">{f.emoji} {f.name}</h3>
          <p className="mt-1 text-[13px] text-sub">{about.formats.draftLabel}{f.draft}</p>
          <div className="scene-stage mt-4 rounded-2xl p-3"><FormatArt name={key} color={f.color} /></div>
        </div>
        <div className="flex flex-col">
          <p className="text-[11px] font-extrabold text-sub">{about.formats.exampleLabel}{ex.project}</p>
          <p className="swap ml-auto mt-2 max-w-[92%] rounded-2xl rounded-br-md bg-student px-3.5 py-2.5 text-[13.5px] font-semibold leading-snug" style={{ animationDelay: "0.2s" }}>{ex.q}</p>
          <p className="swap mt-2 max-w-[92%] rounded-2xl rounded-bl-md border border-clay bg-clay-soft px-3.5 py-2.5 text-[13.5px] font-semibold leading-snug text-clay" style={{ animationDelay: "0.9s" }}>🙋 {ex.back}</p>
          <ol className="mt-4 space-y-2">
            {f.checks.map((c, n) => (
              <li key={c.key} className="swap flex items-start gap-2.5 rounded-xl border px-3 py-2.5" style={{ animationDelay: `${1.5 + n * 0.15}s`, borderColor: n === 0 ? f.color : "var(--color-line)", background: n === 0 ? `${f.color}1a` : "transparent" }}>
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[11px] font-extrabold" style={{ borderColor: f.color, color: n === 0 ? "#04060f" : f.color, background: n === 0 ? f.color : "transparent" }}>{n === 0 ? "✓" : n + 1}</span>
                <span className="min-w-0 text-[13.5px]"><b>{c.label}</b>{n === 0 && <span className="block text-[13px] leading-snug text-sub">“{ex.fill}”</span>}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs leading-snug text-sub">{about.formats.rqLabel}{f.rq.map((r) => r.name).join(" · ")}</p>
        </div>
      </div>
    </div>
  );
}

/* ── 질문이 자라는 여섯 단계 — 별이가 계단을 오른다 ────────── */
const STEPS = about.weeks.steps;

export function GrowStairs() {
  const [i, pick] = useAutoTab(STEPS.length, 3600);
  const s = STEPS[i];
  const W = 116;
  const top = (n: number) => 236 - n * 36;
  return (
    <div>
      <div className="relative rounded-[20px] border border-line bg-card p-3 sm:p-5">
        <svg viewBox="0 0 720 300" role="img" aria-label="질문이 자라는 여섯 단계 계단" className="h-auto w-full" style={{ fontFamily: "inherit" }}>
          <defs><linearGradient id="st-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#17172a" /><stop offset="1" stopColor="#07070f" /></linearGradient></defs>
          {STEPS.map((x, n) => {
            const px = 12 + n * W, py = top(n), on = n <= i;
            return (
              <g key={x.title} onClick={() => pick(n)} className="cursor-pointer">
                <rect x={px} y={py} width={W} height={290 - py} fill="url(#st-fade)" stroke="#2c2c46" />
                <rect x={px} y={py} width={W} height={290 - py} fill={x.color} opacity={n === i ? 0.22 : on ? 0.08 : 0} style={{ transition: "opacity 0.4s" }} />
                <rect x={px} y={py} width={W} height="6" fill={x.color} opacity={on ? 1 : 0.35} style={{ transition: "opacity 0.4s" }} />
                <text x={px + W / 2} y="280" textAnchor="middle" fontSize="22" fontWeight="800" fill={on ? x.color : "#2c2c46"}>{n + 1}</text>
              </g>
            );
          })}
          <path d="M70 200C220 180 440 110 650 22" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="2 8" strokeLinecap="round" opacity="0.6" />
        </svg>
        {/* 별이 — 지금 단계 위에 서 있다 */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-full p-3 sm:p-5">
          <div className="relative h-full w-full">
            <div className="absolute -translate-x-1/2 -translate-y-full" style={{ left: `${((12 + i * W + W / 2) / 720) * 100}%`, top: `${(top(i) / 300) * 100}%`, transition: "left 0.7s cubic-bezier(0.3, 1.4, 0.5, 1), top 0.7s cubic-bezier(0.3, 1.4, 0.5, 1)" }}>
              <div className="ab-float w-[44px] sm:w-[64px] [&>svg]:h-auto [&>svg]:w-full"><Buddy level={i + 1} size={64} /></div>
            </div>
          </div>
        </div>
      </div>
      <div key={i} className="tilecard swap mt-3 p-5" style={{ borderColor: `${s.color}88` }}>
        <p className="flex flex-wrap items-center gap-2 text-sm font-extrabold">
          <span className="grid h-7 w-7 place-items-center rounded-full text-[13px] text-void" style={{ background: s.color }}>{i + 1}</span>
          <span className="text-lg">{s.title}</span>
          <span className="rounded-full bg-sand px-2.5 py-1 text-[11px] text-sub">{about.weeks.pushLabel}{s.push}</span>
        </p>
        <p className="mt-3 text-base font-bold leading-snug sm:text-lg">{s.quote}</p>
        <p className="mt-1.5 text-xs text-sub">— {s.who} {about.weeks.sourceNote}</p>
      </div>
      <div className="mt-3 flex justify-center gap-1.5">{STEPS.map((x, n) => <button key={x.title} type="button" aria-label={`${n + 1}단계 ${x.title}`} onClick={() => pick(n)} className="h-2 rounded-full transition-all" style={{ width: n === i ? 28 : 10, background: n === i ? x.color : "var(--color-line)" }} />)}</div>
    </div>
  );
}
