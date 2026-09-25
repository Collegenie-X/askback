import Link from "next/link";
import type { ReactNode } from "react";
import about from "@/data/about.json";
import "../askback.css";
import "./about.css";
import { LogoMark } from "../Art";
import { CandyPlanet, Galaxy, GiantPlanet, OceanPlanet, Probe, RingPlanet } from "../Space";
import { Glyph, ReportMini, StagePlanet, ThreeStepArt } from "./AboutArt";
import { BridgeArt, CompassArt, RhythmArt } from "./AboutArt3";
import { DebtArt, GapArt, MiracleArt, MirrorArt, PositionArt, PrincipleArt } from "./AboutArt2";
import { AudienceTabs, FormatExplorer, GrowStairs, OrbitCycle, SceneTabs } from "./AboutTabs";
import { GateTabs, SecretArt } from "./AboutGate";
import AboutFlow from "./AboutFlow";
import AboutHero from "./AboutHero";
import AboutLadder from "./AboutLadder";
import Reveal from "./Reveal";
import { rich } from "./rich";
import TopNav from "./TopNav";

// 소개 페이지 — 설계서 v4 · 사업계획서 v4 · 이전 기획서(코드보다 설계 먼저)를 우주 항해의 정거장(STAGE)으로 푼다.
// 글은 광고 문구처럼 짧게, 설명은 커스텀 SVG와 탭으로.

const { stages, gate, problem, gap, who, rules, how, askback, output, weeks, position, closing } = about;
type StageId = keyof typeof stages;

// 히어로의 세 걸음 카드 — 질문(남보라) · 되묻고(금) · 리포트(분홍)
// 기획서.md 예시의 줄 색
const DOC_TONE: Record<string, string> = { h1: "font-bold text-ink", mine: "text-clay", ai: "text-[#67e8f9]", li: "text-sub" };

function Stage({ id, no, children, center = false }: { id: StageId; no: string; children: ReactNode; center?: boolean }) {
  const { color, title, lead } = stages[id];
  return (
    <section id={id} className="relative mx-auto w-full max-w-[1200px] px-4 py-16 sm:px-6 sm:py-24">
      <Reveal>
        <div className={`flex items-center gap-3 ${center ? "justify-center" : ""}`}>
          <StagePlanet color={color} no={no} />
          <p className="eyebrow" style={{ color }}>STAGE {no}</p>
        </div>
        <h2 className={`mt-3 text-[28px] font-extrabold leading-[1.2] tracking-tight sm:text-[42px] ${center ? "text-center" : ""}`}>{rich(title)}</h2>
        {lead && <p className={`mt-4 max-w-[700px] text-[15px] leading-relaxed text-sub sm:text-[17px] ${center ? "mx-auto text-center" : ""}`}>{lead}</p>}
      </Reveal>
      <div className="mt-9">{children}</div>
    </section>
  );
}

// 정거장 사이를 잇는 점선 궤도
function Trail() {
  return <div aria-hidden className="mx-auto h-16 w-px bg-[repeating-linear-gradient(180deg,#4a4a78_0_4px,transparent_4px_12px)]" />;
}

export default function About() {
  return (
    <div className="about" id="top">
      <TopNav items={about.nav} />

      {/* ═══ 히어로 ═══ */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -right-56 -top-44 opacity-30"><Galaxy size={620} /></div>
          <div className="ab-float absolute -left-16 top-2 hidden opacity-60 xl:block"><RingPlanet size={130} /></div>
          <div className="ab-float absolute right-[44%] top-10 hidden opacity-70 lg:block" style={{ animationDelay: "1.2s" }}><CandyPlanet size={46} /></div>
          <span className="shoot right-[8%] top-[12%]" /><span className="shoot right-[38%] top-[4%]" style={{ animationDelay: "4.5s" }} />
        </div>
        <AboutHero />
      </section>

      {/* ═══ 7단계 — 불씨에서 봉화까지, 한 칸씩 ═══ */}
      <AboutLadder />
      <Trail />

      {/* ═══ STAGE 01 · 몰래 쓰는 AI → 인정받는 AI ═══ */}
      <Stage id="gate" no="01">
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <div className="tilecard h-full overflow-hidden" style={{ borderColor: "#fb718588" }}>
              <p className="bg-[#fb71852e] px-5 py-2.5 text-sm font-extrabold text-[#fda4af]">{gate.secretHead}</p>
              <div className="scene-stage px-5 pt-4"><div className="mx-auto max-w-[400px]"><SecretArt /></div></div>
              <ul className="space-y-1.5 px-5 py-4 text-[13.5px] leading-snug">
                {gate.secret.map((t) => <li key={t} className="flex gap-2"><span className="text-[#fb7185]">✕</span>{t}</li>)}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className="tilecard flex h-full flex-col justify-center p-6 sm:p-8" style={{ borderColor: "#34d39966" }}>
              <p className="text-xs font-extrabold tracking-wider text-mint">{gate.fieldEyebrow}</p>
              <p className="mt-3 text-[22px] font-extrabold leading-snug sm:text-[26px]">{rich(gate.fieldQuote)}</p>
              <p className="mt-4 rounded-2xl border border-mint bg-mint-soft px-4 py-3 text-[15px] font-extrabold text-mint">{gate.fieldRule}</p>
              <p className="mt-4 text-[13.5px] leading-relaxed text-sub">{rich(gate.fieldNote)}</p>
            </div>
          </Reveal>
        </div>
        <Reveal className="mt-12">
          <h3 className="text-xl font-extrabold sm:text-2xl">{gate.tabsTitle}</h3>
          <p className="mt-1.5 text-sm text-sub">{gate.tabsLead}</p>
          <div className="mt-6"><GateTabs /></div>
        </Reveal>
        <Reveal className="mt-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {gate.outcomes.map(({ emoji: e, title: t, desc: d }, i) => (
              <div key={t} className="stg tilecard p-4" style={{ animationDelay: `${i * 0.15}s` }}>
                <p className="text-sm font-extrabold"><span className="mr-1.5 text-lg">{e}</span>{t}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-sub">{d}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </Stage>
      <Trail />

      {/* ═══ STAGE 02 · 문제 ═══ */}
      <Stage id="problem" no="02">
        <div className="grid gap-4 md:grid-cols-2">
          <Reveal>
            <div className="tilecard h-full overflow-hidden" style={{ borderColor: "#a78bfa88" }}>
              <p className="bg-[#a78bfa33] px-5 py-2.5 text-sm font-extrabold text-[#ddd6fe]">{problem.miracleHead}</p>
              <div className="scene-stage px-5 pt-4"><div className="mx-auto max-w-[440px]"><MiracleArt /></div></div>
              <p className="px-5 py-4 text-[15px] font-bold">{rich(problem.miracle)}</p>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className="tilecard h-full overflow-hidden" style={{ borderColor: "#fb718588" }}>
              <p className="bg-[#fb71852e] px-5 py-2.5 text-sm font-extrabold text-[#fda4af]">{problem.debtHead}</p>
              <div className="scene-stage px-5 pt-4"><div className="mx-auto max-w-[440px]"><DebtArt /></div></div>
              <p className="px-5 py-4 text-[15px] font-bold">{rich(problem.debt)}</p>
            </div>
          </Reveal>
        </div>
        <Reveal className="mt-12">
          <h3 className="text-xl font-extrabold sm:text-2xl">{problem.scenesTitle}</h3>
          <p className="mt-1.5 text-sm text-sub">{problem.scenesLead}</p>
          <div className="mt-5"><SceneTabs /></div>
        </Reveal>
      </Stage>
      <Trail />

      {/* ═══ STAGE 03 · 빈칸 ═══ */}
      <Stage id="gap" no="03" center>
        <Reveal><div className="noscroll overflow-x-auto rounded-[24px] border border-line bg-card p-4 sm:p-6"><GapArt /></div></Reveal>
        <p className="mt-8 text-center text-sm font-bold text-sub">{gap.axesLead}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {gap.axes.map((a, i) => (
            <Reveal key={a.name} delay={i * 120}>
              <div className="tilecard h-full p-5">
                <span className="icon h-12 w-12" style={{ color: a.color, background: `${a.color}1f` }}><Glyph name={a.glyph} size={28} /></span>
                <h3 className="mt-3 text-xl font-extrabold" style={{ color: a.color }}>{a.name}</h3>
                <p className="mt-1 text-sm font-semibold">{a.mean}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-sub">{a.say}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Stage>
      <Trail />

      {/* ═══ 전체 흐름 — 한 번의 질문이 지나가는 다섯 칸 ═══ */}
      <AboutFlow />
      <Trail />

      {/* ═══ STAGE 04 · 누구에게 ═══ */}
      <Stage id="who" no="04">
        <Reveal><AudienceTabs /></Reveal>
        <Reveal className="mt-10">
          <div className="rounded-[24px] border border-line bg-card p-5 sm:p-6">
            <p className="text-sm font-extrabold text-[#c4b5fd]">{who.lessonsHead}</p>
            <ol className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {who.lessons.map((l, i) => (
                <li key={l.n} className="stg rounded-2xl bg-sand p-3" style={{ animationDelay: `${i * 0.12}s` }}>
                  <span className="text-xs font-extrabold text-clay">{l.n}차시</span>
                  <b className="mt-1 block text-[13px] leading-snug">{l.t}</b>
                  <span className="mt-0.5 block text-[11.5px] leading-snug text-sub">{l.d}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-sub">{who.lessonsNote}</p>
          </div>
        </Reveal>
      </Stage>
      <Trail />

      {/* ═══ STAGE 05 · 원칙 ═══ */}
      <Stage id="rules" no="05" center>
        <div className="grid gap-4 md:grid-cols-3">
          {rules.map((r, i) => (
            <Reveal key={r.art} delay={i * 140}>
              <div className="tilecard flex h-full flex-col p-6 text-center">
                <h3 className="text-[22px] font-extrabold leading-tight">{rich(r.title)}</h3>
                <div className="mx-auto my-5 w-full max-w-[240px]"><PrincipleArt name={r.art as "boundary" | "spec" | "noforce"} /></div>
                <p className="mt-auto text-[13.5px] leading-relaxed text-sub">{r.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Stage>
      <Trail />

      {/* ═══ STAGE 06 · 사용법 ═══ */}
      <Stage id="how" no="06">
        <Reveal><div className="noscroll overflow-x-auto rounded-[24px] border border-line bg-card p-4 sm:p-6"><ThreeStepArt /></div></Reveal>
        <Reveal className="mt-12">
          <h3 className="text-xl font-extrabold sm:text-2xl">{how.cycleTitle}</h3>
          <p className="mt-1.5 text-sm text-sub">{how.cycleLead}</p>
          <div className="mt-6"><OrbitCycle /></div>
        </Reveal>
      </Stage>
      <Trail />

      {/* ═══ STAGE 07 · 되묻기 ═══ */}
      <Stage id="askback" no="07">
        <Reveal><div className="noscroll overflow-x-auto rounded-[24px] border border-line bg-card p-4 sm:p-6"><RhythmArt /></div></Reveal>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {askback.backs.map((b, i) => (
            <Reveal key={b.head} delay={i * 140}>
              <div className={`h-full overflow-hidden rounded-[24px] border ${b.soft}`}>
                <div className="scene-stage px-4 pt-4"><div className="mx-auto max-w-[460px]">{b.art === "bridge" ? <BridgeArt /> : <CompassArt />}</div></div>
                <p className="px-5 pt-5 text-xl font-extrabold" style={{ color: b.color }}>{b.head} <span className="text-sm text-sub">— {b.sub}</span></p>
                <dl className="space-y-3 p-5 text-sm">
                  <div className="flex gap-3"><dt className="w-14 shrink-0 text-xs font-extrabold text-sub">{askback.whereLabel}</dt><dd className="font-semibold">{b.where}</dd></div>
                  <div className="rounded-2xl rounded-bl-md border px-4 py-3 text-[15px] font-bold leading-snug" style={{ borderColor: b.color, color: b.color }}>“{b.quote}”</div>
                  <div className="flex gap-3"><dt className="w-14 shrink-0 text-xs font-extrabold text-sub">{askback.impactLabel}</dt><dd className="leading-relaxed">{b.impact}</dd></div>
                </dl>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-4">
          <ul className="flex flex-wrap justify-center gap-2 text-[13px] font-bold">
            {askback.chips.map((t, i) => <li key={t} className="stg rounded-full border border-line bg-card px-4 py-2" style={{ animationDelay: `${i * 0.15}s` }}>{t}</li>)}
          </ul>
        </Reveal>
      </Stage>
      <Trail />

      {/* ═══ STAGE 08 · 다섯 형식 ═══ */}
      <Stage id="formats" no="08">
        <Reveal><FormatExplorer /></Reveal>
      </Stage>
      <Trail />

      {/* ═══ STAGE 09 · 남는 것 ═══ */}
      <Stage id="output" no="09">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <Reveal>
            <div className="h-full rounded-[24px] border border-[#f472b666] bg-card p-5 sm:p-6">
              <p className="text-sm font-extrabold text-[#f472b6]">{output.docHead}</p>
              <div className="mt-3 rounded-2xl bg-void p-4 font-mono text-[12.5px] leading-[1.9]">
                {output.docLines.map((l, i) => <p key={i} className={`stg ${DOC_TONE[l.kind] ?? ""}`} style={{ animationDelay: `${0.3 + i * 0.22}s` }}>{l.kind === "check" ? <><span className={l.done ? "text-mint" : "text-sub"}>{l.done ? "[x]" : "[ ]"}</span> <b>{l.label}</b> <span className="text-sub">{l.text}</span></> : l.text}</p>)}
              </div>
              <ul className="mt-4 grid gap-2 sm:grid-cols-3">
                {output.docTags.map((t) => (
                  <li key={t.title} className="rounded-2xl bg-sand p-3">
                    <span className="text-xl">{t.emoji}</span>
                    <b className="mt-1 block text-[13px]">{t.title}</b>
                    <span className="block text-[11.5px] leading-snug text-sub">{t.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className="h-full rounded-[24px] border border-line bg-card p-5 sm:p-6">
              <p className="text-lg font-extrabold leading-snug">{rich(output.mirror)}</p>
              <div className="mx-auto mt-3 max-w-[340px]"><MirrorArt /></div>
              <p className="rounded-2xl border border-clay bg-clay-soft px-4 py-3 text-center text-[15px] font-extrabold text-clay">{output.mission}</p>
            </div>
          </Reveal>
        </div>
        <Reveal className="mt-4">
          <div className="rounded-[24px] border border-line bg-card p-5 sm:p-6">
            <p className="text-sm font-extrabold text-clay">{output.reportHead}</p>
            <ul className="mt-4 grid grid-cols-4 gap-2 lg:grid-cols-8">
              {output.report.map((r, i) => (
                <li key={r} className={`rounded-2xl border px-1 py-3 text-center ${i === 7 ? "border-clay bg-clay-soft" : "border-line bg-sand"}`}>
                  <ReportMini i={i} />
                  <span className="mt-1.5 block text-[11.5px] font-bold">{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </Stage>
      <Trail />

      {/* ═══ STAGE 10 · 같은 3주 + 성장 ═══ */}
      <Stage id="weeks" no="10">
        <Reveal>
          <div className="space-y-4">
            {weeks.tracks.map((tr) => (
              <div key={tr.label} className="rounded-[24px] border bg-card p-5" style={{ borderColor: `${tr.tone}66` }}>
                <p className="text-base font-extrabold" style={{ color: tr.tone }}>{tr.bad ? "✕" : "✓"} {tr.label}</p>
                <div className="relative mt-4">
                  <span aria-hidden className="grow-x absolute left-0 top-[9px] hidden h-[3px] w-full rounded-full md:block" style={{ background: tr.tone, opacity: 0.5, animationDuration: "1.6s" }} />
                  <ol className="relative grid gap-3 md:grid-flow-col md:auto-cols-fr">
                    {tr.rows.map((r, i) => (
                      <li key={r.when} className="stg flex gap-3 md:block" style={{ animationDelay: `${0.3 + i * 0.3}s` }}>
                        <span className="mt-1 block h-[21px] w-[21px] shrink-0 rounded-full border-4 border-card md:mt-0" style={{ background: tr.tone }} />
                        <span className="md:mt-2 md:block">
                          <b className="block text-xs" style={{ color: tr.tone }}>{r.when}</b>
                          <span className="block text-[13.5px] font-semibold leading-snug">{r.what}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
                <p className={`stg mt-4 rounded-xl px-4 py-2.5 text-sm font-extrabold ${tr.bad ? "bg-[#2a0f1688] text-[#fda4af] line-through decoration-[#fb718588]" : "bg-mint-soft text-mint"}`} style={{ animationDelay: "1.8s" }}>{tr.end}</p>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal className="mt-12">
          <h3 className="text-xl font-extrabold sm:text-2xl">{weeks.stairsTitle}</h3>
          <p className="mt-1.5 text-sm text-sub">{weeks.stairsLead}</p>
          <div className="mt-5"><GrowStairs /></div>
        </Reveal>
      </Stage>
      <Trail />

      {/* ═══ STAGE 11 · 비교 ═══ */}
      <Stage id="position" no="11" center>
        <Reveal><div className="noscroll overflow-x-auto rounded-[24px] border border-line bg-card p-4 sm:p-6"><PositionArt /></div></Reveal>
        <Reveal className="mt-4">
          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div className="rounded-[24px] border border-line bg-card p-5">
              <p className="text-xs font-extrabold text-sub">{position.mandateEyebrow}</p>
              <p className="mt-1 text-lg font-extrabold">{position.mandateTitle}</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-sub">{rich(position.mandate)}</p>
            </div>
            <span aria-hidden className="text-center text-2xl text-sub"><span className="md:hidden">↓</span><span className="hidden md:inline">→</span></span>
            <div className="rounded-[24px] border border-mint bg-mint-soft p-5">
              <p className="text-xs font-extrabold text-mint">{position.solutionEyebrow}</p>
              <p className="mt-1 text-lg font-extrabold">{position.solutionTitle}</p>
              <p className="mt-2 text-[13.5px] leading-relaxed">{rich(position.solution)}</p>
            </div>
          </div>
        </Reveal>
      </Stage>

      {/* ═══ 마무리 ═══ */}
      <section className="relative mx-auto w-full max-w-[1200px] px-4 pb-20 pt-6 sm:px-6">
        <Reveal>
          <div className="banner relative overflow-hidden rounded-[32px] px-6 py-14 text-center sm:py-20">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="ab-float absolute -left-6 -top-6 opacity-90"><GiantPlanet size={120} /></div>
              <div className="ab-float absolute -bottom-4 right-4 opacity-90" style={{ animationDelay: "1s" }}><OceanPlanet size={96} /></div>
              <div className="ab-float absolute right-[18%] top-6 hidden sm:block" style={{ animationDelay: "2s" }}><Probe size={56} /></div>
            </div>
            <div className="relative">
              <span className="inline-block"><LogoMark size={60} /></span>
              <h2 className="mx-auto mt-5 max-w-[760px] text-[26px] font-extrabold leading-[1.3] tracking-tight text-white sm:text-[38px]">{rich(closing.title)}</h2>
              <p className="mt-4 text-lg font-bold text-white/85">{closing.sub}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/" className="cta rounded-[20px] px-7 py-3.5 text-[15px] font-extrabold text-white">{closing.primary}</Link>
                <Link href="/demo" className="ghost rounded-[20px] px-7 py-3.5 text-[15px] font-bold">{closing.secondary}</Link>
              </div>
            </div>
          </div>
        </Reveal>
        <p className="mt-6 text-center text-xs text-sub">{closing.footnote}</p>
      </section>
    </div>
  );
}
