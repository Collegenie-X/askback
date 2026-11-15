"use client";

import { useState } from "react";
import about from "@/data/about.json";
import wb from "@/data/whiteboard.json";
import { rich } from "./rich";

// 딸깍 화이트보드 역질문 — 소개 페이지에서 직접 눌러 보는 판.
// 데이터는 whiteboard.json 의 examples 그대로: 1차 딸깍 → 답에 따라 네 갈래로 받고 → 같은 보드에서 한 번 더.

const T = about.askback.whiteboard;

type Opt = { label: string; ok: boolean; note?: string };
type Next = {
  move: string;
  card?: string;
  ask: string;
  highlight?: string;
  choices?: Opt[];
  reasons?: Opt[];
  write?: { maxWords: number; example: string; keywords: string[] };
  openChoices?: Opt[];
  then?: { ask: string; pick: string; answer: string };
};
type Choice = { label: string; branch: string; reply: string; marks?: string[]; next: Next };
type Node = { id: string; label: string; shape: string };
type Example = (typeof wb.examples)[number] & { choices: Choice[]; nodes: Node[]; card?: string };

const EXAMPLES = wb.examples as unknown as Example[];
const TYPES = wb.types as Record<string, { emoji: string; name: string }>;
const BRANCH = wb.branches as Record<string, { emoji: string; label: string; move: string }>;
const MOVES = wb.moves as Record<string, { emoji: string; name: string; does: string }>;
const AXIS: Record<string, { name: string; color: string }> = {
  plan: { name: "🧭 기획", color: "#fbbf24" },
  algo: { name: "🔀 알고리즘", color: "#a78bfa" },
  arch: { name: "🏗 전체 구조", color: "#67e8f9" },
};
const TONE: Record<string, string> = { right: "#34d399", half: "#fbbf24", wrong: "#fb7185", dontKnow: "#94a3b8" };

const tabBtn = (on: boolean) => `tab shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-bold transition ${on ? "on" : ""}`;
const optBtn = "rounded-xl border border-line bg-sand px-3.5 py-2.5 text-[13.5px] font-bold transition hover:border-[#a78bfa] disabled:cursor-default disabled:hover:border-line";

function Board({ nodes, marks, tone, glow, onPick }: { nodes: Node[]; marks: string[]; tone: string; glow?: string; onPick?: (id: string) => void }) {
  const cards = nodes.every((n) => n.shape === "card");
  const flow = nodes.filter((n) => n.shape !== "out");
  const outs = nodes.filter((n) => n.shape === "out");
  const box = (n: Node) => {
    const on = marks.includes(n.id);
    const lit = glow === n.id;
    const base = n.shape === "diamond" ? "border-dashed" : n.shape === "edge" ? "rounded-full text-[11.5px]" : n.shape === "cut" ? "border-[#fb7185] text-[#fb7185]" : "";
    const El = onPick ? "button" : "span";
    return (
      <El
        key={n.id}
        type={onPick ? "button" : undefined}
        onClick={onPick ? () => onPick(n.id) : undefined}
        className={`rounded-lg border px-2.5 py-1.5 text-[12.5px] font-bold transition ${base} ${onPick ? "cursor-pointer hover:border-[#a78bfa]" : ""} ${lit ? "ab-pulse" : ""}`}
        style={{ borderColor: on ? tone : lit ? "#fbbf24" : undefined, background: on ? `${tone}2a` : lit ? "#fbbf2422" : "rgba(255,255,255,0.04)", color: on ? tone : undefined }}
      >
        {n.shape === "diamond" ? "◇ " : ""}
        {n.label}
      </El>
    );
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-dashed border-[#ffffff26] bg-void p-3 sm:p-4">
      {flow.map((n, i) => (
        <span key={n.id} className="flex items-center gap-1.5">
          {i > 0 && !cards && n.shape !== "edge" && <span aria-hidden className="text-sub">→</span>}
          {box(n)}
        </span>
      ))}
      {outs.length > 0 && (
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="text-sub">⇉</span>
          <span className="flex flex-col gap-1">{outs.map(box)}</span>
          <span className="text-[10.5px] font-bold text-sub">끝나는 곳</span>
        </span>
      )}
    </div>
  );
}

function Bubble({ who, children, tone = "#a78bfa" }: { who: string; children: React.ReactNode; tone?: string }) {
  return (
    <div className="swap">
      <p className="text-[11px] font-extrabold" style={{ color: tone }}>{who}</p>
      <div className="mt-1 rounded-2xl rounded-tl-md border px-4 py-2.5 text-[14px] font-bold leading-snug" style={{ borderColor: `${tone}88` }}>{children}</div>
    </div>
  );
}

export default function WhiteboardTry() {
  const [ei, setEi] = useState(0);
  const [first, setFirst] = useState<number | null>(null);
  const [pick2, setPick2] = useState<number | null>(null);
  const [reason, setReason] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [opened, setOpened] = useState(false);
  const [boardPick, setBoardPick] = useState<string | null>(null);

  const ex = EXAMPLES[ei];
  const reset = (n = ei) => {
    setEi(n); setFirst(null); setPick2(null); setReason(null); setText(""); setSent(false); setOpened(false); setBoardPick(null);
  };
  const c = first === null ? null : ex.choices[first];
  const nx = c?.next;
  const tone = c ? TONE[c.branch] : "#a78bfa";

  // 2차가 끝났나, 맞았나
  const opts = nx ? (nx.write ? (opened ? nx.openChoices ?? [] : []) : nx.choices ?? []) : [];
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wroteOk = !!nx?.write && sent && words.length > 0 && words.length <= nx.write.maxWords && nx.write.keywords.some((k) => text.includes(k));
  let done = false;
  let ok = false;
  if (nx) {
    if (nx.write && sent) { done = true; ok = wroteOk; }
    else if (pick2 !== null) {
      const o = opts[pick2];
      if (nx.reasons) { done = reason !== null; ok = o.ok && reason !== null && nx.reasons[reason].ok; }
      else if (nx.then && o.ok) { done = boardPick !== null; ok = boardPick === nx.then.answer; }
      else { done = true; ok = o.ok; }
    }
  }
  const closeKey = c?.branch === "dontKnow" ? "dontKnow" : c?.branch === "right" && ok ? "right" : "wrong";
  const close = ex.close as Record<string, string>;
  const level = wb.ladder.find((l) => l.level === ex.level)!;
  const boardMarks = boardPick ? [boardPick] : c?.marks ?? [];
  const showThen = !!(nx?.then && pick2 !== null && opts[pick2]?.ok);

  return (
    <div>
      {/* 아는지 퀴즈 vs 화이트보드 */}
      <div className="grid gap-3 md:grid-cols-2">
        {T.compare.map((k) => (
          <div key={k.head} className="tilecard p-4" style={{ borderColor: k.bad ? "#fb718566" : "#34d39966" }}>
            <p className="text-sm font-extrabold" style={{ color: k.bad ? "#fda4af" : "#34d399" }}>{k.head}</p>
            <p className="mt-2 text-[14px] font-bold leading-snug">{k.ask}</p>
            <p className="mt-1.5 text-[12.5px] text-sub">{k.pick}</p>
            <p className={`mt-3 rounded-xl px-3 py-2 text-[12.5px] font-bold ${k.bad ? "bg-[#2a0f16] text-[#fda4af]" : "bg-mint-soft text-mint"}`}>{k.end}</p>
          </div>
        ))}
      </div>

      {/* 직접 눌러 보는 판 */}
      <div className="mt-6 rounded-[24px] border border-line bg-card p-4 sm:p-6">
        <p className="text-xs font-extrabold text-sub">{T.tryLabel}</p>
        <div role="tablist" className="noscroll mt-3 flex gap-2 overflow-x-auto pb-1">
          {EXAMPLES.map((x, n) => (
            <button key={x.id} role="tab" aria-selected={n === ei} type="button" onClick={() => reset(n)} className={tabBtn(n === ei)}>
              {TYPES[x.type].emoji} {TYPES[x.type].name}
            </button>
          ))}
        </div>

        <div key={ei} className="mt-4 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-[12px] font-extrabold">
              <span className="rounded-full px-2.5 py-1" style={{ color: AXIS[ex.axis].color, background: `${AXIS[ex.axis].color}1f` }}>{AXIS[ex.axis].name}</span>
              <span className="rounded-full bg-sand px-2.5 py-1">{level.emoji} L{level.level} {level.name}</span>
              <span className="text-sub">{T.studentLabel} — “{ex.studentQ}”</span>
            </div>

            <Board nodes={ex.nodes} marks={boardMarks} tone={showThen ? "#fbbf24" : tone} glow={!done ? nx?.highlight : undefined} onPick={showThen && boardPick === null ? setBoardPick : undefined} />

            {ex.card && <p className="rounded-xl bg-clay-soft px-3.5 py-2 text-[13.5px] font-bold text-clay"><span className="mr-1 text-[11px]">{T.cardLabel}</span> {ex.card}</p>}

            <Bubble who={T.firstLabel}>{ex.ask}</Bubble>
            <div className="grid grid-cols-2 gap-2">
              {ex.choices.map((o, n) => (
                <button
                  key={o.label}
                  type="button"
                  disabled={first !== null}
                  onClick={() => setFirst(n)}
                  className={optBtn}
                  style={first === n ? { borderColor: TONE[o.branch], color: TONE[o.branch], background: `${TONE[o.branch]}1f` } : first !== null ? { opacity: 0.45 } : undefined}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {!c && (
              <div className="rounded-2xl border border-line bg-sand p-4">
                <p className="text-xs font-extrabold text-sub">{T.branchLabel}</p>
                <ul className="mt-2.5 space-y-2 text-[13px]">
                  {Object.entries(BRANCH).map(([k, b]) => (
                    <li key={k} className="flex gap-2">
                      <span className="w-[86px] shrink-0 font-extrabold" style={{ color: TONE[k] }}>{b.emoji} {b.label}</span>
                      <span><b>{MOVES[b.move].emoji} {MOVES[b.move].name}</b> <span className="text-sub">— {MOVES[b.move].does}</span></span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {c && nx && (
              <>
                <p className="swap text-[12px] font-extrabold" style={{ color: tone }}>
                  {BRANCH[c.branch].emoji} {BRANCH[c.branch].label} → {MOVES[nx.move].emoji} {MOVES[nx.move].name}
                </p>
                <Bubble who="🤖 코치" tone={tone}>{c.reply}</Bubble>
                {nx.card && <p className="swap rounded-xl bg-clay-soft px-3.5 py-2 text-[13px] font-bold text-clay">{nx.card}</p>}
                <Bubble who={T.secondLabel}>{nx.ask}</Bubble>

                {nx.write && !sent && (
                  <div className="swap space-y-2">
                    <div className="flex gap-2">
                      <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && text.trim() && setSent(true)}
                        placeholder={`✏ ${T.writeHint} — 예: ${nx.write.example}`}
                        className="min-w-0 flex-1 rounded-xl border border-line bg-void px-3 py-2.5 text-[13.5px] outline-none focus:border-[#a78bfa]"
                      />
                      <button type="button" disabled={!text.trim()} onClick={() => setSent(true)} className="cta rounded-xl px-4 text-[13px] font-extrabold text-white disabled:opacity-40">{T.writeSend}</button>
                    </div>
                    <p className={`text-right text-[11.5px] font-bold ${words.length > nx.write.maxWords ? "text-[#fb7185]" : "text-sub"}`}>{words.length} / {nx.write.maxWords}단어</p>
                    {nx.openChoices && !opened && <button type="button" onClick={() => setOpened(true)} className="text-[12px] font-bold text-sub underline">{T.writeOpen}</button>}
                  </div>
                )}

                {opts.length > 0 && !sent && (
                  <div className="swap grid grid-cols-2 gap-2">
                    {opts.map((o, n) => (
                      <button key={o.label} type="button" disabled={pick2 !== null} onClick={() => setPick2(n)} className={optBtn}
                        style={pick2 === n ? { borderColor: o.ok ? "#34d399" : "#fb7185", color: o.ok ? "#34d399" : "#fb7185" } : pick2 !== null ? { opacity: 0.45 } : undefined}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}

                {nx.reasons && pick2 !== null && (
                  <div className="swap">
                    <p className="text-[12px] font-extrabold text-sub">🧩 왜?</p>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {nx.reasons.map((o, n) => (
                        <button key={o.label} type="button" disabled={reason !== null} onClick={() => setReason(n)} className="rounded-full border border-line bg-sand px-3 py-1.5 text-[12.5px] font-bold"
                          style={reason === n ? { borderColor: o.ok ? "#34d399" : "#fb7185", color: o.ok ? "#34d399" : "#fb7185" } : reason !== null ? { opacity: 0.45 } : undefined}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {showThen && <p className="swap text-[13px] font-bold text-clay">👆 {nx.then!.ask} <span className="text-sub">— 보드의 상자를 딸깍</span></p>}

                {nx.write && sent && (
                  <p className="swap ml-auto w-fit max-w-[90%] rounded-2xl rounded-tr-md bg-[#6c5ce7] px-4 py-2 text-[14px] font-bold text-white">🙋 {text}</p>
                )}
                {done && (
                  <div className="swap space-y-3">
                    <Bubble who={ok ? "✅ 코치" : "🤖 코치"} tone={ok ? "#34d399" : "#94a3b8"}>{close[closeKey]}</Bubble>
                    {ok && (
                      <p className="rounded-xl border border-[#f472b666] bg-rose-soft px-3.5 py-2.5 font-mono text-[12.5px] leading-relaxed">
                        <b className="block text-[11px] text-[#f472b6]">{T.planLabel}</b>
                        {ex.planLine}
                      </p>
                    )}
                    <button type="button" onClick={() => reset()} className="text-[12.5px] font-bold text-sub underline">{T.again}</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 사다리 + 찍기 막는 장치 */}
      <div className="mt-6 rounded-[24px] border border-line bg-card p-4 sm:p-6">
        <p className="text-sm font-extrabold">{rich(T.ladderTitle)}</p>
        <ol className="mt-4 grid gap-2 sm:grid-cols-4">
          {wb.ladder.map((l, i) => (
            <li key={l.level} className="stg rounded-2xl bg-sand p-3" style={{ animationDelay: `${i * 0.12}s` }}>
              <span className="text-lg">{l.emoji}</span>
              <b className="mt-1 block text-[13px]">L{l.level} · {l.name}</b>
              <span className="block text-[11.5px] leading-snug text-sub">
                {{ click: "한 번 더도 딸깍", "click+reason": "딸깍 + ‘왜?’ 칩", write: "한 번 더는 6단어로 쓰기", "board-add": "보드에 상자 하나 직접" }[l.second]}
              </span>
            </li>
          ))}
        </ol>
        <ul className="mt-4 flex flex-wrap gap-2 text-[12.5px] font-bold">
          {T.guards.map((g) => <li key={g} className="rounded-full border border-line px-3 py-1.5">{g}</li>)}
        </ul>
      </div>
    </div>
  );
}
