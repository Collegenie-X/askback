"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import about from "@/data/about.json";
import formats from "@/data/formats.json";
import { HeroArt, type HeroScene } from "./AboutArt";
import Reveal from "./Reveal";
import { rich } from "./rich";

const { hero } = about;
const SCENE_MS = 5200;

// 히어로의 세 걸음 카드 — 질문(남보라) · 되묻고(금) · 리포트(분홍)
const STEP_TONE = [
  { box: "border-[#818cf8]/50 bg-[#4f46e5]/20", text: "text-[#c7d2fe]", glow: "#818cf8" },
  { box: "border-clay/50 bg-clay-soft", text: "text-clay", glow: "#fbbf24" },
  { box: "border-[#f472b6]/50 bg-rose-soft", text: "text-[#f9a8d4]", glow: "#f472b6" },
];

// 히어로 — 다섯 결과물이 차례로 돌아가며 제목 · 세 걸음의 예시 · 그림이 함께 바뀐다. 결과물 칩을 누르면 그 장면에 멈춘다.
export default function AboutHero() {
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setI((v) => (v + 1) % hero.scenes.length), SCENE_MS);
    return () => clearInterval(t);
  }, [auto]);
  const scene = hero.scenes[i];
  const all = formats.formats as Record<string, { emoji: string; name: string; color: string }>;
  const color = all[scene.format].color;

  return (
    <div className="relative mx-auto grid w-full max-w-[1200px] items-center gap-8 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1fr_460px] lg:pt-16">
      <Reveal>
        <p className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs font-bold text-sub">{hero.badge}</p>
        <h1 className="hero-h1 mt-4 text-[36px] font-extrabold leading-[1.12] tracking-tight sm:text-[56px]">
          {hero.title}
          <span className="block min-h-[1.2em] overflow-hidden"><span key={i} className="word-in grad-gold inline-block">{scene.headline}</span></span>
        </h1>
        <p className="mt-4 text-xl font-bold leading-snug sm:text-2xl">{rich(hero.tagline)}</p>
        {hero.body && <p className="mt-3 max-w-[560px] text-[15px] leading-relaxed text-sub">{rich(hero.body)}</p>}

        {/* 질문 → 되묻고 → 리포트 — 지금 장면의 예시가 차례로 켜진다 */}
        <ol className="mt-6 grid max-w-[620px] gap-2 sm:grid-cols-3">
          {hero.steps.map((st, n) => {
            const tone = STEP_TONE[n % STEP_TONE.length];
            return (
              <li key={`${st.title}-${i}`} className={`step-hl relative rounded-2xl border p-3.5 ${tone.box}`} style={{ animationDelay: `${n * 0.9}s`, ["--hl" as string]: tone.glow }}>
                <p className={`flex items-center gap-1.5 text-[15px] font-extrabold ${tone.text}`}><span className="grid h-5 w-5 place-items-center rounded-full bg-white/15 text-[11px] text-white">{n + 1}</span>{st.emoji} {st.title}</p>
                <p className="word-in mt-2 min-h-[1.4em] text-[13px] font-extrabold leading-snug text-white" style={{ animationDelay: `${n * 0.9}s` }}>{scene[st.field as keyof HeroScene]}</p>
                {n === 1 && <p className="word-in mt-1 text-[11.5px] font-bold leading-snug text-clay/90" style={{ animationDelay: "1.5s" }}>{hero.expandLabel} {scene.expand}</p>}
                {n < hero.steps.length - 1 && <span aria-hidden className="absolute -right-[11px] top-5 z-10 hidden text-sub sm:block">→</span>}
              </li>
            );
          })}
        </ol>

        {/* 다섯 가지 결과물 — 누르면 그 장면으로 */}
        <div className="mt-5 max-w-[620px]">
          {hero.outputsLabel && <p className="text-xs font-extrabold text-sub">{hero.outputsLabel}</p>}
          <div role="tablist" className="mt-2 flex flex-wrap gap-1.5">
            {hero.scenes.map((sc, n) => {
              const f = all[sc.format];
              const on = n === i;
              return (
                <button key={sc.format} role="tab" aria-selected={on} type="button" onClick={() => { setAuto(false); setI(n); }} className="relative overflow-hidden rounded-full border px-3 py-1.5 text-[13px] font-extrabold text-white transition" style={{ borderColor: on ? f.color : `${f.color}55`, background: on ? `${f.color}40` : `${f.color}14`, boxShadow: on ? `0 0 22px ${f.color}66` : undefined }}>
                  {sc.chip}
                  {on && auto && <span aria-hidden className="scene-timer absolute bottom-0 left-0 h-[2px] w-full origin-left" style={{ background: f.color, animationDuration: `${SCENE_MS}ms` }} />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-2.5">
          <Link href="/" className="cta rounded-[20px] px-7 py-3.5 text-[15px] font-bold text-white">{hero.primary}</Link>
          <Link href="/demo" className="ghost rounded-[20px] px-6 py-3.5 text-[15px] font-bold">{hero.secondary}</Link>
        </div>
        <p className="mt-4 text-xs text-sub">{hero.note}</p>
      </Reveal>

      <Reveal delay={150} className="relative mx-auto w-full max-w-[460px]">
        <div aria-hidden className="pointer-events-none absolute inset-[12%] rounded-full blur-3xl transition-colors duration-700" style={{ background: `${color}33` }} />
        <div className="relative"><HeroArt scene={scene} /></div>
      </Reveal>
    </div>
  );
}
