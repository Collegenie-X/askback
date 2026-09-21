"use client";

// 아이디어 티키타카 — 한 줄 아이디어가 몇 번의 주고받기로 유저 시나리오가 되는지 보여준다.
// 대본은 src/data/ideas.json, 시나리오는 public/scenarios/*.md. 서버 없이 돈다.
import { useEffect, useRef, useState } from "react";
import data from "@/data/ideas.json";
import { useApp } from "./AppContext";
import Markdown from "./Markdown";
import { Buddy, CoachAvatar } from "./Space";

type Idea = (typeof data.ideas)[number];

function stageOf(filled: number) {
  let s = 0;
  data.stages.forEach((st, i) => {
    if (filled >= st.min) s = i;
  });
  return s;
}

function Coach({ md }: { md: string }) {
  return (
    <div className="rise flex gap-2.5">
      <CoachAvatar size={34} />
      <div className="min-w-0 flex-1 rounded-3xl rounded-tl-lg bg-card px-4 py-3.5">
        <Markdown>{md}</Markdown>
      </div>
    </div>
  );
}

function Picker({ onPick }: { onPick: (idea: Idea) => void }) {
  const { go } = useApp();
  return (
    <>
      <header className="flex items-center gap-2 px-4 py-3">
        <button type="button" aria-label="뒤로" onClick={() => go({ name: "chat" })} className="chunk-ghost grid h-10 w-10 place-items-center rounded-2xl text-xl">‹</button>
        <h1 className="text-lg font-extrabold">아이디어 티키타카</h1>
      </header>
      <div className="scroll flex-1 px-5 pb-8">
        <div className="flex items-center gap-4 rounded-3xl bg-card p-5">
          <div className="float"><Buddy stage={1} size={84} /></div>
          <div>
            <p className="text-[17px] font-extrabold leading-snug">한 줄 아이디어가<br />유저 시나리오가 되기까지</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-sub">코치는 짧게 받고, 하나 보태고, 하나만 되물어. 정하는 건 언제나 너야.</p>
          </div>
        </div>

        <p className="mb-3 mt-7 text-[13px] font-bold text-sub">수상작 계열에서 고른 3개 — 하나를 눌러봐</p>
        <div className="space-y-3">
          {data.ideas.map((idea) => (
            <button key={idea.id} type="button" onClick={() => onPick(idea)} className="chunk-card block w-full rounded-3xl p-5 text-left">
              <div className="flex items-center gap-3">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-sand text-3xl">{idea.emoji}</span>
                <div className="min-w-0">
                  <p className="text-[16px] font-extrabold">{idea.title}</p>
                  <p className="mt-0.5 text-xs text-sub">{idea.origin}</p>
                </div>
              </div>
              <p className="mt-3.5 rounded-2xl bg-sand px-4 py-3 text-[14px] leading-relaxed">“{idea.seed}”</p>
              <p className="mt-3 text-right text-[13px] font-bold text-clay">이 한 줄로 시작하기 →</p>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function Play({ idea, onBack }: { idea: Idea; onBack: () => void }) {
  const { openMd } = useApp();
  const [done, setDone] = useState(0); // 끝난 티키타카 횟수
  const [typing, setTyping] = useState(true);
  const [showSlots, setShowSlots] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const total = idea.rounds.length;
  const filled = 1 + done;
  const stage = stageOf(filled);
  const finished = done >= total;
  const next = idea.rounds[done];

  useEffect(() => {
    if (!typing) return;
    const t = setTimeout(() => setTyping(false), 1100);
    return () => clearTimeout(t);
  }, [typing, done]);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [done, typing]);

  const values: Record<string, string> = { seed: idea.seed };
  idea.rounds.slice(0, done).forEach((r) => (values[r.slot] = r.fill));

  const reply = () => {
    setDone((d) => d + 1);
    setTyping(true);
  };

  return (
    <>
      <header className="flex items-center gap-2 px-4 py-3">
        <button type="button" aria-label="뒤로" onClick={onBack} className="chunk-ghost grid h-10 w-10 place-items-center rounded-2xl text-xl">‹</button>
        <h1 className="min-w-0 flex-1 truncate text-[16px] font-extrabold">{idea.emoji} {idea.title}</h1>
        <span className="rounded-full bg-sand px-3 py-1.5 text-xs font-bold">티키타카 {Math.min(done, total)}/{total}</span>
      </header>

      {/* 성장 카드 — 핵심만, 누르면 8칸이 펼쳐진다 */}
      <section className="mx-4 rounded-3xl bg-card">
        <button type="button" onClick={() => setShowSlots((v) => !v)} aria-expanded={showSlots} className="flex w-full items-center gap-3 p-3.5 text-left">
          <div key={stage} className="spark"><Buddy stage={stage} size={64} /></div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-extrabold">
              {data.stages[stage].name} <span className="ml-1 text-xs font-semibold text-sub">{data.stages[stage].line}</span>
            </p>
            <div className="mt-2 flex gap-1">
              {data.slots.map((s, i) => (
                <span key={s.key} className={`h-2.5 flex-1 rounded-full transition-colors ${i < filled ? "bg-clay" : "bg-sand"}`} />
              ))}
            </div>
            <p className="mt-1.5 text-xs text-sub">
              아이디어 카드 {filled}/8칸 {finished ? "· 시나리오 완성!" : `· 시나리오까지 ${8 - filled}칸`} <span className="ml-1">{showSlots ? "▴" : "▾"}</span>
            </p>
          </div>
        </button>
        {showSlots && (
          <ul className="fade space-y-1.5 px-3.5 pb-3.5">
            {data.slots.map((s) => (
              <li key={s.key} className={`flex gap-2.5 rounded-2xl px-3 py-2.5 text-[13px] leading-relaxed ${values[s.key] ? "bg-sand" : "border border-dashed border-line text-sub"}`}>
                <span className="text-base">{s.icon}</span>
                <span className="min-w-0">
                  <b className="block text-xs text-sub">{s.name}</b>
                  {values[s.key] ?? "아직 비어 있어"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div ref={scroller} className="scroll flex-1 space-y-4 px-4 py-5">
        <div className="rise flex justify-end">
          <div className="max-w-[82%] rounded-3xl rounded-br-lg bg-student px-4 py-3 text-[15px] leading-relaxed">
            <b className="mb-0.5 block text-[11px] opacity-70">{idea.student}</b>
            {idea.seed}
          </div>
        </div>

        {idea.rounds.slice(0, done).map((r, i) => {
          const before = stageOf(1 + i);
          const after = stageOf(2 + i);
          const slot = data.slots.find((s) => s.key === r.slot);
          return (
            <div key={i} className="space-y-4">
              <Coach md={r.coach} />
              <div className="flex justify-end">
                <div className="max-w-[82%] rounded-3xl rounded-br-lg bg-student px-4 py-3 text-[15px] leading-relaxed">{r.student}</div>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center text-xs font-bold">
                <span className="rounded-full bg-clay-soft px-3.5 py-1.5 text-clay">
                  {slot?.icon} ‘{slot?.name}’ 칸이 채워졌어
                </span>
                {after > before && (
                  <span className="rounded-full bg-mint-soft px-3.5 py-1.5 text-mint">
                    ✨ {data.stages[before].name} → {data.stages[after].name}(으)로 자랐어!
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {typing ? (
          <div className="flex items-center gap-2.5">
            <CoachAvatar size={34} />
            <div className="flex gap-1.5 rounded-3xl bg-card px-4 py-4"><span className="dot" /><span className="dot" /><span className="dot" /></div>
          </div>
        ) : finished ? (
          <Coach md={`다 됐어. **네 말만으로** 유저 시나리오가 나와 — 티키타카 **${total}번** 만이야.\n\n처음엔 한 줄이었는데, 지금은 *누가 · 언제 · 뭘 누르고 · 어떤 기분인지*까지 있어. 읽어 보고 틀린 데를 고쳐줘.`} />
        ) : (
          <Coach md={next.coach} />
        )}
      </div>

      <div className="px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-2">
        {finished && !typing ? (
          <div className="space-y-2.5">
            <button type="button" onClick={() => openMd({ title: `${idea.title} — 유저 시나리오`, src: `/scenarios/${idea.scenario}`, filename: idea.scenario })} className="chunk w-full rounded-2xl py-4 text-[16px] font-extrabold">
              📜 유저 시나리오 열기
            </button>
            <button type="button" onClick={onBack} className="chunk-ghost w-full rounded-2xl py-3 text-sm font-bold">다른 아이디어 보기</button>
          </div>
        ) : (
          !typing && next && (
            <div className="rise rounded-3xl bg-card p-3.5">
              <p className="mb-2 text-xs font-bold text-sub">{idea.student}의 답</p>
              <p className="text-[14px] leading-relaxed">{next.student}</p>
              <button type="button" onClick={reply} className="chunk mt-3 w-full rounded-2xl py-3.5 text-[15px] font-extrabold">
                이렇게 답하기 ↑
              </button>
            </div>
          )
        )}
      </div>
    </>
  );
}

export default function IdeaLab() {
  const [idea, setIdea] = useState<Idea | null>(null);
  return idea ? <Play key={idea.id} idea={idea} onBack={() => setIdea(null)} /> : <Picker onPick={setIdea} />;
}
