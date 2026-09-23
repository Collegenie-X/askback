// 온보딩 인트로의 '한 장 요약' — 그 칸이 무슨 일을 하는지 카드 한 벌로 보여 준다.
// 글자는 px 고정이라 화면이 넓어져도 커지지 않는다. 어떤 요약을 부를지는 onboarding.json 의 steps[].art.
import type { CSSProperties } from "react";

const at = (s: number): CSSProperties => ({ animationDelay: `${s}s` });
const GOLD = "#ffc83d";
const PINK = "#f472b6";
const SKY = "#67e8f9";
const MINT = "#5ad1b3";
const VIOLET = "#a78bfa";

// ② 질문할 때 — 📐 버튼이 빈칸 질문을 채워 준다
const CHIPS = [
  { t: "🧩 기획", c: VIOLET },
  { t: "🔀 알고리즘", c: SKY },
  { t: "🗺 구조", c: MINT },
  { t: "🚀 확장", c: GOLD },
];
function Draft() {
  return (
    <div className="text-left">
      <div className="flex flex-wrap justify-center gap-1">
        {CHIPS.map((c, i) => (
          <span key={c.t} className="ob-pop rounded-lg border px-2 py-1 text-[10px] font-extrabold" style={{ ...at(0.2 + i * 0.1), color: c.c, borderColor: `${c.c}77`, background: `${c.c}1f` }}>
            {c.t}
          </span>
        ))}
      </div>
      <p className="ob-pop mt-1.5 rounded-xl border bg-sand px-2.5 py-1.5 text-[11px] font-bold" style={{ ...at(0.65), borderColor: `${GOLD}aa` }}>
        <b className="text-gold">___</b>이면 <b className="text-gold">___</b>한다 — 빠진 경우 있을까?
      </p>
      <p className="ob-pop mt-1 rounded-xl border bg-mint-soft px-2.5 py-1.5 text-[10px] font-extrabold text-mint" style={{ ...at(0.85), borderColor: `${MINT}88` }}>
        ✅ 조건 · 이유 · 빠진 경우까지 한 번에 묻게 돼
      </p>
    </div>
  );
}

// ③ 답을 받을 때 — 되묻기 두 겹이 각각 무엇을 묻는지
const LAYERS = [
  { tone: GOLD, bg: "bg-amber-soft", head: "🙋 열린 되묻기", when: "모든 답 끝", q: "“그 400, 어디서 나온 숫자야?”", got: "→ 직접 재 온 내 숫자가 남는다" },
  { tone: PINK, bg: "bg-rose-soft", head: "🧑‍🏫 화이트보드", when: "질문 두 번마다", q: "“센서가 0이 되면 화분엔 무슨 일이?”", got: "→ 순서도 · 핵심 · 차별점을 내 말로" },
];
function AskBack() {
  return (
    <div className="space-y-1 text-left">
      {LAYERS.map((l, i) => (
        <div key={l.head} className={`ob-pop rounded-2xl border px-2.5 py-1 ${l.bg}`} style={{ ...at(0.2 + i * 0.25), borderColor: `${l.tone}88` }}>
          <p className="flex items-baseline justify-between gap-2">
            <b className="text-[10.5px] font-extrabold" style={{ color: l.tone }}>{l.head}</b>
            <span className="shrink-0 text-[9.5px] font-bold text-sub">{l.when}</span>
          </p>
          <p className="mt-1 rounded-lg bg-card px-2 py-1 text-[11px] font-bold [word-break:keep-all]">{l.q}</p>
          <p className="mt-0.5 text-[9.5px] font-semibold text-sub [word-break:keep-all]">{l.got}</p>
        </div>
      ))}
    </div>
  );
}

// ④ 리포트 — 늘 같은 8칸 + 다음 미션 하나
const CELLS = ["한눈에", "질문 유형", "질문 길이", "실은 것", "되묻기", "걸린 곳", "베스트 질문", "미션"];
function Report() {
  return (
    <div className="rounded-2xl border bg-card p-2 text-left" style={{ borderColor: `${GOLD}88` }}>
      <p className="flex items-baseline justify-between gap-2 px-0.5">
        <b className="text-[10px] font-extrabold text-gold">📊 스마트 화분 · 1번째 리포트</b>
        <span className="shrink-0 text-[9px] font-bold text-sub">질문 10개마다</span>
      </p>
      <ol className="mt-1.5 grid grid-cols-4 gap-1">
        {CELLS.map((c, i) => (
          <li key={c} className={`ob-pop rounded-lg border px-1.5 py-1 ${i === 7 ? "border-gold bg-amber-soft text-gold" : "border-line bg-sand"}`} style={at(0.25 + i * 0.06)}>
            <span className="block text-[8px] font-extrabold text-sub">{i + 1}</span>
            <span className="block text-[9.5px] font-bold leading-tight">{c}</span>
          </li>
        ))}
      </ol>
      <p className="ob-pop mt-1 rounded-lg border bg-amber-soft px-2 py-1 text-[9.5px] font-extrabold text-gold" style={{ ...at(0.8), borderColor: `${GOLD}99` }}>
        🚩 다음 미션 — “다음엔 대안을 물어봐”
      </p>
    </div>
  );
}

// ⑤ 더 크게 — 열린 질문 하나로 열리는 네 갈래
const PATHS = [
  { e: "🔧", n: "메이커", d: "내 손으로", c: GOLD },
  { e: "📣", n: "공유", d: "친구도 쓰게", c: SKY },
  { e: "🤖", n: "AI", d: "자동화 · 추론", c: VIOLET },
  { e: "🤝", n: "협력", d: "손잡기", c: PINK },
];
function Grow() {
  return (
    <ol className="grid grid-cols-4 gap-1">
      {PATHS.map((p, i) => (
        <li key={p.n} className="ob-pop rounded-xl border px-1 py-1.5" style={{ ...at(0.2 + i * 0.12), borderColor: `${p.c}77`, background: `${p.c}1a` }}>
          <span className="block text-[13px]" aria-hidden>{p.e}</span>
          <b className="mt-0.5 block text-[10px] font-extrabold" style={{ color: p.c }}>{p.n}</b>
          <span className="block text-[8.5px] leading-tight text-sub">{p.d}</span>
        </li>
      ))}
    </ol>
  );
}

const ART = { draft: Draft, askback: AskBack, report: Report, grow: Grow };
export type IntroArtKind = keyof typeof ART;

export default function IntroArt({ kind }: { kind: string }) {
  const Art = ART[kind as IntroArtKind];
  return Art ? <Art /> : null;
}
