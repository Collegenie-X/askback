import Link from "next/link";
import type { ReactNode } from "react";
import "../askback.css";
import "./about.css";
import { LogoMark } from "../Art";
import { CandyPlanet, Galaxy, GiantPlanet, OceanPlanet, Probe, RingPlanet } from "../Space";
import { Glyph, HeroArt, ReportMini, StagePlanet, ThreeStepArt } from "./AboutArt";
import { BridgeArt, CompassArt, RhythmArt } from "./AboutArt3";
import { DebtArt, GapArt, MiracleArt, MirrorArt, PositionArt, PrincipleArt } from "./AboutArt2";
import { AudienceTabs, FormatExplorer, GrowStairs, OrbitCycle, SceneTabs } from "./AboutTabs";
import { GateTabs, SecretArt } from "./AboutGate";
import Reveal from "./Reveal";
import TopNav from "./TopNav";

// 소개 페이지 — 설계서 v4 · 사업계획서 v4 · 이전 기획서(코드보다 설계 먼저)를 우주 항해의 정거장(STAGE)으로 푼다.
// 글은 광고 문구처럼 짧게, 설명은 커스텀 SVG와 탭으로.

const NAV = [
  { id: "gate", label: "몰래→인정" },
  { id: "problem", label: "문제" },
  { id: "gap", label: "빈칸" },
  { id: "who", label: "누구에게" },
  { id: "rules", label: "원칙" },
  { id: "how", label: "사용법" },
  { id: "askback", label: "되묻기" },
  { id: "formats", label: "다섯 형식" },
  { id: "output", label: "남는 것" },
  { id: "weeks", label: "같은 3주" },
  { id: "position", label: "비교" },
];


const AXES = [
  { glyph: "compass", color: "#fbbf24", name: "기획", mean: "누구의 무엇을 왜 바꾸는지", say: "“이건 ___의 ___ 문제를 풀어”" },
  { glyph: "flow", color: "#34d399", name: "알고리즘", mean: "어떤 순서와 규칙으로 돌아가는지", say: "“___가 들어오면 → ___를 확인해서 → ___한다”" },
  { glyph: "blocks", color: "#f472b6", name: "전체 구조", mean: "무엇이 무엇과 어떻게 이어지는지", say: "블록 · 화면 · 목차 · 컷이 이어진 그림 한 장" },
];

const RULES = [
  { art: "boundary" as const, title: <>정보는 끝까지,<br />판단은 네 몫.</>, desc: "가르치려고 일부러 덜 주지 않습니다. 대신 목표 · 기준 · 선택 · 직접 잴 숫자는 AI가 정하지 않습니다." },
  { art: "spec" as const, title: <>코드 대신<br />명세(Specification).</>, desc: "답의 기본은 규칙 카드 · 상태표 · 순서도 · 비교표. 코드는 요청이 분명할 때만, 20줄 이내로." },
  { art: "noforce" as const, title: <>억지로<br />묻지 않는다.</>, desc: "답을 인질로 잡지 않습니다. 먼저 다 주고, 끝에서 묻습니다. 물을 게 없으면 묻지 않습니다." },
];

const BACKS = [
  { art: "bridge", color: "#fbbf24", soft: "bg-clay-soft border-clay", head: "🙋 열린 되묻기", sub: "대화의 다리", where: "모든 답의 끝", quote: "이 400이란 숫자는 어디서 왔어? 직접 재 본 적 있어?", impact: "학생이 현실의 데이터를 직접 재서 다음 질문으로 가져옵니다." },
  { art: "compass", color: "#f472b6", soft: "bg-rose-soft border-[#f472b666]", head: "🧭 2문 1역 역질문", sub: "이해의 확인", where: "질문 두 번마다, 별도 카드로", quote: "센서가 빠져서 0이 되면 화분에 어떤 일이 벌어질까?", impact: "잔소리가 되지 않게 5초(고르기)부터 30초(서술)까지. 순서도와 실패 조건을 확인합니다." },
];

const REPORT = ["한눈에", "질문 유형", "질문 길이", "실은 것", "되묻기", "걸린 곳", "베스트 질문", "미션"];

const DOC_TAGS = [
  { emoji: "🗂", title: "AI 활용 기록서", desc: "수행평가에 그대로 내는 전체 기록.md" },
  { emoji: "🗣", title: "학생 본인의 언어", desc: "AI 문장 복붙이 아니라 내 말로 채운 칸" },
  { emoji: "⚡", title: "코딩 도구의 입력값", desc: "Cursor · Claude Code · Replit에 붙여넣기" },
];

const DOC_LINES: ReactNode[] = [
  <span key="0" className="font-bold text-ink"># 🌱 스마트 화분 · 기획서</span>,
  <span key="1"><span className="text-mint">[x]</span> <b>동작 시나리오</b> <span className="text-sub">— 흙이 400보다 마르면 550이 될 때까지, 길어도 5초만 물을 준다</span></span>,
  <span key="2"><span className="text-mint">[x]</span> <b>부품 목록</b> <span className="text-sub">— 5V 펌프 · 흙 센서</span></span>,
  <span key="3"><span className="text-sub">[ ]</span> <b>구조 스케치</b></span>,
  <span key="4"><span className="text-sub">[ ]</span> <b>만드는 순서</b></span>,
  <span key="5" className="text-clay">## 🫵 내가 정한 것</span>,
  <span key="6" className="text-sub">- 마른 흙 320 · 젖은 흙 610 (직접 잼)</span>,
  <span key="7" className="text-[#67e8f9]">## 📌 AI가 가정한 것</span>,
  <span key="8" className="text-sub">- 펌프가 도는 동안은 흙을 안 본다</span>,
];

const TRACKS = [
  { label: "AskBack 없이", tone: "#fb7185", bad: true, end: "남은 것: 출처 모를 코드 파일 하나", rows: [
    { when: "1일차", what: "“코드 짜줘” → 복붙" },
    { when: "2일차", what: "안 된다 → “다시 짜줘”" },
    { when: "1주차", what: "뚝딱 완성 → 끝" },
    { when: "3주차 발표", what: "“왜 400이에요?” → ……" },
  ] },
  { label: "AskBack과 함께", tone: "#34d399", bad: false, end: "남은 것: 기획서.md · 리포트 · 전체 기록", rows: [
    { when: "1일차", what: "“코드 짜줘” → 순서도 + 🙋 되묻기" },
    { when: "2일차", what: "직접 잰다 — 320 · 610" },
    { when: "1주차", what: "기획서 4칸 · 1번째 리포트" },
    { when: "2주차", what: "한 단씩 확장 · 친구 검증" },
    { when: "3주차 발표", what: "“동그라미 친 상자가 제가 잰 숫자예요”" },
  ] },
];

const LESSONS = [
  { n: "1", t: "예시 프로젝트를 같이 읽는다", d: "/demo · 계정 없이" },
  { n: "2", t: "💡 아이디어 티키타카", d: "형식을 고른다" },
  { n: "3–5", t: "자기 프로젝트 대화", d: "교사는 🧩 n/4 만 본다" },
  { n: "6", t: "첫 리포트 · 미션", d: "🏆 베스트 질문 바꿔 읽기" },
  { n: "7", t: "초안.md 로 만든다", d: "코딩 · 영상 · 문서 도구" },
  { n: "8", t: "발표", d: "기획서 한 장 + 내가 확인한 가정 하나" },
];

function Stage({ id, no, color, title, lead, children, center = false }: { id: string; no: string; color: string; title: ReactNode; lead?: ReactNode; children: ReactNode; center?: boolean }) {
  return (
    <section id={id} className="relative mx-auto w-full max-w-[1200px] px-4 py-16 sm:px-6 sm:py-24">
      <Reveal>
        <div className={`flex items-center gap-3 ${center ? "justify-center" : ""}`}>
          <StagePlanet color={color} no={no} />
          <p className="eyebrow" style={{ color }}>STAGE {no}</p>
        </div>
        <h2 className={`mt-3 text-[28px] font-extrabold leading-[1.2] tracking-tight sm:text-[42px] ${center ? "text-center" : ""}`}>{title}</h2>
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
      <TopNav items={NAV} />

      {/* ═══ 히어로 ═══ */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -right-56 -top-44 opacity-30"><Galaxy size={620} /></div>
          <div className="ab-float absolute -left-16 top-2 hidden opacity-60 xl:block"><RingPlanet size={130} /></div>
          <div className="ab-float absolute right-[44%] top-10 hidden opacity-70 lg:block" style={{ animationDelay: "1.2s" }}><CandyPlanet size={46} /></div>
          <span className="shoot right-[8%] top-[12%]" /><span className="shoot right-[38%] top-[4%]" style={{ animationDelay: "4.5s" }} />
        </div>
        <div className="relative mx-auto grid w-full max-w-[1200px] items-center gap-8 px-4 pb-12 pt-10 sm:px-6 lg:grid-cols-[1fr_460px] lg:pt-16">
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs font-bold text-sub">🧭 청소년 AI 프로젝트 코치</p>
            <h1 className="hero-h1 mt-4 text-[44px] font-extrabold leading-[1.08] tracking-tight sm:text-[68px]">
              코드보다<br /><span className="grad-gold">설계 먼저.</span>
            </h1>
            <p className="mt-5 text-xl font-bold leading-snug sm:text-2xl">
              만드는 건 AI가. <span className="grad">“왜”는 네가.</span>
            </p>
            <ul className="mt-5 flex flex-wrap items-center gap-2 text-sm font-extrabold">
              <li className="rounded-full border border-[#818cf8]/50 bg-[#4f46e5]/20 px-3.5 py-1.5 text-[#c7d2fe]">💬 묻고</li>
              <li aria-hidden className="text-sub">→</li>
              <li className="rounded-full border border-clay/50 bg-clay-soft px-3.5 py-1.5 text-clay">🙋 되묻고</li>
              <li aria-hidden className="text-sub">→</li>
              <li className="rounded-full border border-[#f472b6]/50 bg-rose-soft px-3.5 py-1.5 text-[#f9a8d4]">📝 기획서 한 장</li>
            </ul>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link href="/" className="cta rounded-[20px] px-7 py-3.5 text-[15px] font-bold text-white">지금 질문하러 가기 →</Link>
              <Link href="/demo" className="ghost rounded-[20px] px-6 py-3.5 text-[15px] font-bold">▶ 시연 보기</Link>
            </div>
            <p className="mt-4 text-xs text-sub">가입 없이 바로 시작 · “코드 짜줘”로 시작해도 됩니다</p>
          </Reveal>
          <Reveal delay={150} className="mx-auto w-full max-w-[460px]"><HeroArt /></Reveal>
        </div>
      </section>

      {/* ═══ STAGE 01 · 몰래 쓰는 AI → 인정받는 AI ═══ */}
      <Stage id="gate" no="01" color="#fbbf24" title={<>AI, 몰래 쓰지 마세요.<br /><span className="grad">설명할 수 있으면, 당당하게.</span></>} lead="학생들은 이미 AI를 씁니다 — 다만 몰래. 금지와 허용으로만 나누면 쓰고도 말을 못 하고, 선생님은 의심만 남습니다.">
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <div className="tilecard h-full overflow-hidden" style={{ borderColor: "#fb718588" }}>
              <p className="bg-[#fb71852e] px-5 py-2.5 text-sm font-extrabold text-[#fda4af]">🤫 지금 — 몰래 쓰는 AI</p>
              <div className="scene-stage px-5 pt-4"><div className="mx-auto max-w-[400px]"><SecretArt /></div></div>
              <ul className="space-y-1.5 px-5 py-4 text-[13.5px] leading-snug">
                {["썼다고 말하면 의심받는다 — 그래서 숨긴다", "“AI를 썼다”는 걸 떳떳하게 말할 기준이 없다", "결과물은 있는데 ‘출처’ 칸은 비어 있다"].map((t) => <li key={t} className="flex gap-2"><span className="text-[#fb7185]">✕</span>{t}</li>)}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className="tilecard flex h-full flex-col justify-center p-6 sm:p-8" style={{ borderColor: "#34d39966" }}>
              <p className="text-xs font-extrabold tracking-wider text-mint">현장에서 온 답 · 특성화고의 ‘화이트보드 검문’</p>
              <p className="mt-3 text-[22px] font-extrabold leading-snug sm:text-[26px]">AI로 만들어 와도 괜찮다.<br />대신 그 자리에서 <span className="text-clay">순서도</span>를 그리고, <span className="text-[#a78bfa]">핵심</span>을 짚고, <span className="text-[#f472b6]">차별점</span>을 직접 말한다.</p>
              <p className="mt-4 rounded-2xl border border-mint bg-mint-soft px-4 py-3 text-[15px] font-extrabold text-mint">✅ 이게 되어야 “AI를 썼다”가 인정됩니다 — 설명할 수 있는 만큼만.</p>
              <p className="mt-4 text-[13.5px] leading-relaxed text-sub">문제는 시간입니다. 한 명씩 검문하면 한 반에 2시간. 그래서 AskBack은 이 검문을 <b className="text-ink">가끔 치르는 시험이 아니라, 매일의 대화 안에 넣었습니다.</b></p>
            </div>
          </Reveal>
        </div>
        <Reveal className="mt-12">
          <h3 className="text-xl font-extrabold sm:text-2xl">선생님이 묻던 네 가지를, 앱이 대신 묻습니다</h3>
          <p className="mt-1.5 text-sm text-sub">질문 두 번마다 5~30초. 네 관문을 지나면 도장이 찍힙니다 — 탭을 눌러 보세요.</p>
          <div className="mt-6"><GateTabs /></div>
        </Reveal>
        <Reveal className="mt-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {[["🧑‍🚀", "학생", "몰래 쓰지 않아도 됩니다. “제가 잰 숫자는 이거고, AI가 가정한 건 이거예요.”"], ["👩‍🏫", "선생님", "한 명씩 검문하던 2시간 → 헤더의 🧩 n/4 와 10문 리포트만 봅니다."], ["🗂", "남는 증빙", "되물음에 한 답까지 전체 기록.md 에 — AI 활용 표기가 그대로 끝납니다."]].map(([e, t, d], i) => (
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
      <Stage id="problem" no="02" color="#fb7185" title={<>뚝딱 만들지만,<br /><span className="grad">기획과 설계는 증발</span>했습니다.</>} lead="바이브 코딩 이후, 만드는 건 쉬워졌고 설계는 그대로입니다. 문제는 “AI를 쓴다”가 아니라 그 앞의 빈칸입니다.">
        <div className="grid gap-4 md:grid-cols-2">
          <Reveal>
            <div className="tilecard h-full overflow-hidden" style={{ borderColor: "#a78bfa88" }}>
              <p className="bg-[#a78bfa33] px-5 py-2.5 text-sm font-extrabold text-[#ddd6fe]">✨ AI 시대의 기적</p>
              <div className="scene-stage px-5 pt-4"><div className="mx-auto max-w-[440px]"><MiracleArt /></div></div>
              <p className="px-5 py-4 text-[15px] font-bold">한 마디면 화면이 나옵니다. <span className="text-sub">만드는 비용은 0에 가까워졌습니다.</span></p>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className="tilecard h-full overflow-hidden" style={{ borderColor: "#fb718588" }}>
              <p className="bg-[#fb71852e] px-5 py-2.5 text-sm font-extrabold text-[#fda4af]">⚠️ 인지적 부채 (Cognitive Debt)</p>
              <div className="scene-stage px-5 pt-4"><div className="mx-auto max-w-[440px]"><DebtArt /></div></div>
              <p className="px-5 py-4 text-[15px] font-bold">무엇을, 왜 만들었는지 <span className="text-[#fb7185]">설명할 수 없습니다.</span></p>
            </div>
          </Reveal>
        </div>
        <Reveal className="mt-12">
          <h3 className="text-xl font-extrabold sm:text-2xl">교실에서 되풀이되는 여덟 장면</h3>
          <p className="mt-1.5 text-sm text-sub">장면마다 비어 있는 것과, 그 칸을 채우는 AskBack의 장치.</p>
          <div className="mt-5"><SceneTabs /></div>
        </Reveal>
      </Stage>
      <Trail />

      {/* ═══ STAGE 03 · 빈칸 ═══ */}
      <Stage id="gap" no="03" color="#34d399" center title={<>아이디어와 코딩 도구 사이,<br /><span className="grad">텅 빈 한 칸</span></>} lead="코드는 다른 도구가 뽑습니다. AskBack은 그 도구에 넣을 ‘설계도’를 학생 스스로 만들게 하는 AI 코치입니다.">
        <Reveal><div className="noscroll overflow-x-auto rounded-[24px] border border-line bg-card p-4 sm:p-6"><GapArt /></div></Reveal>
        <p className="mt-8 text-center text-sm font-bold text-sub">그 칸에 들어가야 하는 세 가지</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {AXES.map((a, i) => (
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

      {/* ═══ STAGE 04 · 누구에게 ═══ */}
      <Stage id="who" no="04" color="#60a5fa" title={<>누구에게, <span className="grad">왜 필요한가</span></>} lead="가장 절실한 자리부터 안쪽 궤도에 놓았습니다. 행성이나 탭을 눌러 보세요.">
        <Reveal><AudienceTabs /></Reveal>
        <Reveal className="mt-10">
          <div className="rounded-[24px] border border-line bg-card p-5 sm:p-6">
            <p className="text-sm font-extrabold text-[#c4b5fd]">👩‍🏫 교실에서는 — 자유학기 8차시</p>
            <ol className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {LESSONS.map((l, i) => (
                <li key={l.n} className="stg rounded-2xl bg-sand p-3" style={{ animationDelay: `${i * 0.12}s` }}>
                  <span className="text-xs font-extrabold text-clay">{l.n}차시</span>
                  <b className="mt-1 block text-[13px] leading-snug">{l.t}</b>
                  <span className="mt-0.5 block text-[11.5px] leading-snug text-sub">{l.d}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-sub">평가의 근거 = 전체 기록.md (질문의 폭 · 내가 정한 것 · 되물음에 한 답) — 과정 중심 평가가 그대로 남습니다.</p>
          </div>
        </Reveal>
      </Stage>
      <Trail />

      {/* ═══ STAGE 05 · 원칙 ═══ */}
      <Stage id="rules" no="05" color="#fbbf24" center title={<>코치가 지키는 <span className="grad">세 가지 선</span></>}>
        <div className="grid gap-4 md:grid-cols-3">
          {RULES.map((r, i) => (
            <Reveal key={r.art} delay={i * 140}>
              <div className="tilecard flex h-full flex-col p-6 text-center">
                <h3 className="text-[22px] font-extrabold leading-tight">{r.title}</h3>
                <div className="mx-auto my-5 w-full max-w-[240px]"><PrincipleArt name={r.art} /></div>
                <p className="mt-auto text-[13.5px] leading-relaxed text-sub">{r.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Stage>
      <Trail />

      {/* ═══ STAGE 06 · 사용법 ═══ */}
      <Stage id="how" no="06" color="#67e8f9" title={<>쓰는 법은 <span className="grad">세 마디</span>면 됩니다</>} lead="묻는다 → 되물음에 답한다 → 적는다. 따로 정리할 필요 없이, 평소처럼 질문하면 같이 쌓입니다.">
        <Reveal><div className="noscroll overflow-x-auto rounded-[24px] border border-line bg-card p-4 sm:p-6"><ThreeStepArt /></div></Reveal>
        <Reveal className="mt-12">
          <h3 className="text-xl font-extrabold sm:text-2xl">다섯 정거장을 돌면, 가운데에서 리포트가 뜹니다</h3>
          <p className="mt-1.5 text-sm text-sub">정거장마다 어디를 누르고 · 무엇을 하고 · 무엇이 남는지.</p>
          <div className="mt-6"><OrbitCycle /></div>
        </Reveal>
      </Stage>
      <Trail />

      {/* ═══ STAGE 07 · 되묻기 ═══ */}
      <Stage id="askback" no="07" color="#f472b6" title={<>되묻기는 <span className="grad">두 겹</span>입니다</>} lead="답 → 되묻기 → 학생이 재 온 숫자 → 다음 답. 대화가 티키타카가 됩니다.">
        <Reveal><div className="noscroll overflow-x-auto rounded-[24px] border border-line bg-card p-4 sm:p-6"><RhythmArt /></div></Reveal>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {BACKS.map((b, i) => (
            <Reveal key={b.head} delay={i * 140}>
              <div className={`h-full overflow-hidden rounded-[24px] border ${b.soft}`}>
                <div className="scene-stage px-4 pt-4"><div className="mx-auto max-w-[460px]">{b.art === "bridge" ? <BridgeArt /> : <CompassArt />}</div></div>
                <p className="px-5 pt-5 text-xl font-extrabold" style={{ color: b.color }}>{b.head} <span className="text-sm text-sub">— {b.sub}</span></p>
                <dl className="space-y-3 p-5 text-sm">
                  <div className="flex gap-3"><dt className="w-14 shrink-0 text-xs font-extrabold text-sub">📍 어디서</dt><dd className="font-semibold">{b.where}</dd></div>
                  <div className="rounded-2xl rounded-bl-md border px-4 py-3 text-[15px] font-bold leading-snug" style={{ borderColor: b.color, color: b.color }}>“{b.quote}”</div>
                  <div className="flex gap-3"><dt className="w-14 shrink-0 text-xs font-extrabold text-sub">🎯 효과</dt><dd className="leading-relaxed">{b.impact}</dd></div>
                </dl>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-4">
          <ul className="flex flex-wrap justify-center gap-2 text-[13px] font-bold">
            {["💡 힌트 → 📎 예시 → 🤖 코치의 생각 · 힌트 3단", "🤷 “모르겠어”도 탓하지 않는다", "⏭ 급하면 [나중에]", "🚫 물을 게 없으면 억지로 묻지 않는다"].map((t, i) => <li key={t} className="stg rounded-full border border-line bg-card px-4 py-2" style={{ animationDelay: `${i * 0.15}s` }}>{t}</li>)}
          </ul>
        </Reveal>
      </Stage>
      <Trail />

      {/* ═══ STAGE 08 · 다섯 형식 ═══ */}
      <Stage id="formats" no="08" color="#a855f7" title={<>코딩만이 아닙니다 — <span className="grad">다섯 형식</span></>} lead="같은 “설계”가 형식마다 다른 뜻입니다. 형식을 고르면 채울 칸 4개 · 질문 버튼 · 전용 역질문이 바뀝니다.">
        <Reveal><FormatExplorer /></Reveal>
      </Stage>
      <Trail />

      {/* ═══ STAGE 09 · 남는 것 ═══ */}
      <Stage id="output" no="09" color="#f472b6" title={<>대화는 휘발되지만,<br /><span className="grad">내 말로 채운 칸은 남습니다.</span></>}>
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <Reveal>
            <div className="h-full rounded-[24px] border border-[#f472b666] bg-card p-5 sm:p-6">
              <p className="text-sm font-extrabold text-[#f472b6]">📝 기획서.md</p>
              <div className="mt-3 rounded-2xl bg-void p-4 font-mono text-[12.5px] leading-[1.9]">
                {DOC_LINES.map((l, i) => <p key={i} className="stg" style={{ animationDelay: `${0.3 + i * 0.22}s` }}>{l}</p>)}
              </div>
              <ul className="mt-4 grid gap-2 sm:grid-cols-3">
                {DOC_TAGS.map((t) => (
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
              <p className="text-lg font-extrabold leading-snug">학기 말의 늦은 평가가 아닌,<br /><span className="text-clay">10번의 질문마다 비춰 주는 거울.</span></p>
              <div className="mx-auto mt-3 max-w-[340px]"><MirrorArt /></div>
              <p className="rounded-2xl border border-clay bg-clay-soft px-4 py-3 text-center text-[15px] font-extrabold text-clay">🚩 다음 미션 — “다음엔 대안을 물어봐”</p>
            </div>
          </Reveal>
        </div>
        <Reveal className="mt-4">
          <div className="rounded-[24px] border border-line bg-card p-5 sm:p-6">
            <p className="text-sm font-extrabold text-clay">📊 스마트 화분 · 1번째 리포트 — 대화 카드 · 팝업 · .md 가 늘 같은 8칸</p>
            <ul className="mt-4 grid grid-cols-4 gap-2 lg:grid-cols-8">
              {REPORT.map((r, i) => (
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
      <Stage id="weeks" no="10" color="#34d399" title={<>같은 3주, 다른 결말.<br /><span className="grad">설명할 수 있는 작품</span>을 만듭니다.</>} lead="“화분에 물을 자동으로 주고 싶어” — 같은 아이디어로 시작한 두 갈래.">
        <Reveal>
          <div className="space-y-4">
            {TRACKS.map((tr) => (
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
          <h3 className="text-xl font-extrabold sm:text-2xl">그 3주 동안, 질문이 여섯 단을 오릅니다</h3>
          <p className="mt-1.5 text-sm text-sub">계단을 눌러 보세요. 별이가 따라 올라갑니다.</p>
          <div className="mt-5"><GrowStairs /></div>
        </Reveal>
      </Stage>
      <Trail />

      {/* ═══ STAGE 11 · 비교 ═══ */}
      <Stage id="position" no="11" color="#a78bfa" center title={<>답은 끝까지 주고, 설계는 학생이 한다.<br /><span className="grad">그 자리는 비어 있었습니다.</span></>}>
        <Reveal><div className="noscroll overflow-x-auto rounded-[24px] border border-line bg-card p-4 sm:p-6"><PositionArt /></div></Reveal>
        <Reveal className="mt-4">
          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div className="rounded-[24px] border border-line bg-card p-5">
              <p className="text-xs font-extrabold text-sub">THE MANDATE</p>
              <p className="mt-1 text-lg font-extrabold">📜 2026 수행평가 AI 활용 지침</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-sub">AI 도구 · 프롬프트 · <b className="text-ink">프롬프트 개발 과정</b>을 표기해야 합니다. 양식은 있는데, 무엇으로 증빙할지는 막막합니다.</p>
            </div>
            <span aria-hidden className="text-center text-2xl text-sub"><span className="md:hidden">↓</span><span className="hidden md:inline">→</span></span>
            <div className="rounded-[24px] border border-mint bg-mint-soft p-5">
              <p className="text-xs font-extrabold text-mint">THE ASKBACK SOLUTION</p>
              <p className="mt-1 text-lg font-extrabold">평소처럼 묻기만 해도 기록이 쌓입니다</p>
              <p className="mt-2 text-[13.5px] leading-relaxed">📁 전체 기록.md 가 자동으로 — 질문의 궤적이 그대로 증빙. 결과 중심에서 <b>과정 중심 평가</b>로: 10문 리포트와 월간 요약.</p>
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
              <h2 className="mx-auto mt-5 max-w-[760px] text-[26px] font-extrabold leading-[1.3] tracking-tight text-white sm:text-[38px]">
                만드는 비용이 ‘0’에 가까워지는 시대,<br />가장 중요한 역량은 <span className="grad-gold">‘무엇을, 왜 만드는가’</span>입니다.
              </h2>
              <p className="mt-4 text-lg font-bold text-white/85">AskBack이 그 질문을 함께합니다.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/" className="cta rounded-[20px] px-7 py-3.5 text-[15px] font-extrabold text-white">AskBack 시작하기 →</Link>
                <Link href="/demo" className="ghost rounded-[20px] px-7 py-3.5 text-[15px] font-bold">▶ /demo 시연 보기</Link>
              </div>
            </div>
          </div>
        </Reveal>
        <p className="mt-6 text-center text-xs text-sub">AskBack — 코드보다 설계 먼저 · 이 페이지의 예시는 앱의 예시 프로젝트와 설명용 장면으로, 실제 학생 데이터가 아닙니다.</p>
      </section>
    </div>
  );
}
