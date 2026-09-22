import about from "@/data/about.json";
import flowSpec from "@/data/flow.json";
import AboutFlowAsk from "./AboutFlowAsk";
import { FLOW_ICONS, FlowJoin } from "./AboutFlowIcons";
import Reveal from "./Reveal";
import { rich } from "./rich";

const { flow } = about;
// 다섯 칸의 순서 · 이름 · 색 · 핵심 표시는 docs/다섯칸.md 가 원본 (scripts/build-flow.mjs → flow.json)
const spec = (no: string) => flowSpec.steps.find((x) => x.no === no)!;
// 설명 문장(about.json) + 뼈대(flow.json)를 한 칸으로 합친다
const steps = flow.steps.map((c) => ({ ...c, ...spec(c.no), big: spec(c.no).core }));
type Step = (typeof steps)[number];

// 한 칸 — 전용 그림 + 한 줄 요약 + 그 칸에서 실제로 나오는 말.
function Tile({ s, big }: { s: Step; big: boolean }) {
  const Ico = FLOW_ICONS[s.no];
  return (
    <article
      className={`flowcard relative flex h-full flex-col rounded-[22px] border p-5 ${s.big ? "tilecard" : "border-line bg-card"}`}
      style={s.big ? { borderColor: `${s.color}66`, boxShadow: `0 18px 60px ${s.color}22` } : undefined}
    >
      {s.big && (
        <span className="absolute -top-2.5 left-5 rounded-full px-2.5 py-1 text-[10px] font-extrabold text-black" style={{ background: s.color }}>
          {flow.coreLabel}
        </span>
      )}

      {/* 번호 · 이름 */}
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-extrabold text-black" style={{ background: s.color }}>{s.no}</span>
        <span className="text-[13px] font-extrabold" style={{ color: s.color }}>{s.label}</span>
      </div>

      {/* 전용 그림 — 이 칸에서 무슨 일이 일어나는지 계속 움직여 보여준다 */}
      <div className="mt-4 grid place-items-center rounded-[18px] border py-5" style={{ borderColor: `${s.color}2e`, background: `radial-gradient(70% 80% at 50% 20%, ${s.color}1f, transparent 72%)` }}>
        <span className="flowico">{Ico ? <Ico c={s.color} size={big ? 72 : 58} /> : null}</span>
      </div>

      <h3 className={`mt-4 font-extrabold leading-snug ${big ? "text-[19px] sm:text-[22px]" : "text-[16px] sm:text-[17px]"}`}>{s.head}</h3>
      <p className={`mt-2 leading-relaxed text-sub ${big ? "text-[14px]" : "text-[13.5px]"}`}>{s.line}</p>
      <p className={`mt-auto pt-4 leading-snug ${big ? "text-[15px] font-bold" : "text-[13.5px] font-semibold"}`} style={{ color: s.color }}>
        {big
          ? <span className="block rounded-2xl rounded-bl-md border px-4 py-3" style={{ borderColor: s.color }}>“{s.quote}”</span>
          : <span className="block rounded-2xl rounded-bl-md border px-3.5 py-2.5 opacity-90" style={{ borderColor: `${s.color}55` }}>“{s.quote}”</span>}
      </p>
      <a href={`#${s.to}`} className="mt-3 inline-flex items-center gap-1 text-[11px] font-extrabold text-sub transition-colors hover:text-ink">
        {flow.detailLabel} <span style={{ color: s.color }}>{s.toLabel} →</span>
      </a>
    </article>
  );
}

// 한 줄 — 과정(세 칸) / 결과(두 칸). 줄마다 띠를 둘러 두 단계를 눈으로 갈라 놓는다.
function Row({ row }: { row: (typeof flow.rows)[number] }) {
  const cards = row.nos.map((no) => steps.find((s) => s.no === no)!).filter(Boolean);
  const proc = row.key === "proc";
  return (
    <div className={`rowband ${row.key}`}>
      <Reveal>
        <div className="flex flex-wrap items-center justify-center gap-3 text-center">
          <span className={`rowtag ${row.key}`}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: proc ? "#a78bfa" : "#67e8f9" }} />
            {row.no} · {row.tag}
          </span>
          <h3 className="text-[19px] font-extrabold leading-snug sm:text-[24px]">{row.title}</h3>
        </div>
        <p className="mx-auto mt-2.5 max-w-[640px] text-center text-[13.5px] leading-relaxed text-sub sm:text-[14.5px]">{rich(row.note)}</p>
      </Reveal>

      <div className={`relative mt-7 grid gap-3 sm:gap-4 ${proc ? "lg:grid-cols-[0.9fr_1.3fr_1.3fr]" : "lg:grid-cols-2"}`}>
        {cards.map((s, i) => (
          <Reveal key={s.no} delay={i * 110} className="h-full">
            <div className="relative h-full">
              <Tile s={s} big={!!s.big} />
              {i < cards.length - 1 && (
                <span aria-hidden className="absolute left-1/2 -bottom-4 z-10 -translate-x-1/2 text-sm text-[#6b6b8f] lg:left-auto lg:-right-4 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 lg:translate-x-0">
                  <span className="lg:hidden">↓</span><span className="hidden lg:inline">→</span>
                </span>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

// 전체 흐름 — 한 사례가 과정 세 칸을 지나, 결과 두 장으로 남는다.
export default function AboutFlow() {
  const [proc, res] = flow.rows;
  return (
    <section id="flow" className="relative mx-auto w-full max-w-[1200px] px-4 py-16 sm:px-6 sm:py-24">
      <Reveal>
        {/* 앞의 STAGE 01~03(왜)에서 넘어오는 다리 */}
        <p className="mx-auto mb-6 max-w-[620px] rounded-full border border-line bg-card px-5 py-2.5 text-center text-[13px] font-bold sm:text-sm">{rich(flow.bridge)}</p>
        <p className="eyebrow text-center" style={{ color: "#a78bfa" }}>{flow.eyebrow}</p>
        <h2 className="mt-3 text-center text-[28px] font-extrabold leading-[1.2] tracking-tight sm:text-[42px]">{rich(flow.title)}</h2>
        <p className="mx-auto mt-4 max-w-[700px] text-center text-[15px] leading-relaxed text-sub sm:text-[17px]">{flow.lead}</p>
      </Reveal>

      {/* 윗줄 — 과정 */}
      <div className="mt-10"><Row row={proc} /></div>

      {/* 이음매 — 세 칸이 한 장으로 접힌다 */}
      <Reveal>
        <div className="my-2 flex flex-col items-center">
          <FlowJoin />
          <p className="-mt-1 text-center text-[12.5px] font-bold text-sub">{flow.joinLine}</p>
        </div>
      </Reveal>

      {/* 아랫줄 — 결과 */}
      <Row row={res} />

      {/* 페이지가 방문자에게 직접 되묻는 한 번 */}
      <Reveal delay={160}><AboutFlowAsk /></Reveal>

      <Reveal delay={200}>
        <p className="mx-auto mt-10 max-w-[760px] text-center text-[14px] leading-relaxed text-sub sm:text-[15px]">{rich(flow.footer)}</p>
        <p className="mt-3 text-center text-[13px] font-bold text-sub">{flow.after} ↓</p>
      </Reveal>
    </section>
  );
}
