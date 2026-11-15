"use client";

import { useEffect, useRef, useState } from "react";
import about from "@/data/about.json";
import wb from "@/data/whiteboard.json";

// 나쁜 예시 — '딸깍'. 몇 단어 질문 → 완성품 → 더 짧은 질문. 결정은 AI가 몰래, 발표 날 화이트보드 앞에서 🤷.
// 데이터는 whiteboard.json 의 badExample 그대로.

const T = about.askback.whiteboard;
const B = wb.badExample;
const RED = "#fb7185";
const KEY = "teenspark.about.badclick.v1"; // 한 번 만든 칸은 저장 — 다시 오면 기다림 없이 바로
const WAIT = 1400;

const load = () => {
  try { return Math.min(B.turns.length, Number(localStorage.getItem(KEY)) || 0); } catch { return 0; }
};
const save = (n: number) => {
  try { localStorage.setItem(KEY, String(n)); } catch { /* 저장이 막혀도 화면은 돈다 */ }
};

function Skeleton() {
  return (
    <div className="swap space-y-1.5 rounded-2xl rounded-tl-md border border-line bg-sand p-3" aria-busy="true" aria-label="AI가 만드는 중">
      <p className="flex items-center gap-1.5 text-[12px] font-bold text-sub">🤖 만드는 중<span className="ldot" /><span className="ldot" /><span className="ldot" /></p>
      <div className="skel h-3 w-[92%]" />
      <div className="skel h-3 w-[70%]" />
      <div className="skel h-3 w-[82%]" />
    </div>
  );
}

export default function BadClick() {
  const [shown, setShown] = useState(0); // 완성된 칸 수
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setShown(load());
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);
  const done = shown >= B.turns.length;
  const click = () => {
    if (busy || done) return;
    setBusy(true);
    timer.current = setTimeout(() => {
      setBusy(false);
      setShown((n) => { save(n + 1); return n + 1; });
    }, WAIT);
  };
  const setAll = (n: number) => { if (timer.current) clearTimeout(timer.current); setBusy(false); setShown(n); save(n); };
  const next = B.turns[shown];

  return (
    <div className="rounded-[24px] border bg-card p-4 sm:p-6" style={{ borderColor: `${RED}66` }}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold" style={{ color: RED }}>{T.badEyebrow}</p>
          <p className="mt-1 text-lg font-extrabold sm:text-xl">{T.badTitle}</p>
        </div>
        <span className="rounded-full border border-dashed border-current px-2.5 py-0.5 text-[11px] font-bold text-sub">{B.label}</span>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        {/* 딸깍 대화 — 질문은 갈수록 짧아지고, 몰래 정해진 것만 쌓인다 */}
        <div className="space-y-3">
          <ol className="space-y-3">
            {B.turns.slice(0, shown).map((t) => (
              <li key={t.q} className="swap space-y-1.5">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-[10.5px] font-bold text-sub">{t.words}단어</span>
                  <span className="rounded-2xl rounded-tr-md bg-[#6c5ce7] px-3.5 py-1.5 text-[14px] font-bold text-white">🙋 {t.q}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-2xl rounded-tl-md border border-line bg-sand px-3.5 py-1.5 text-[13.5px] font-bold">🤖 {t.out}</span>
                  <span className="rounded-full bg-[#ffffff14] px-2.5 py-1 text-[11px] font-bold text-sub">{t.run}</span>
                </div>
                {t.hidden.length > 0 && (
                  <p className="flex flex-wrap gap-1.5 pl-1 text-[11.5px] font-bold" style={{ color: RED }}>
                    <span>{T.hiddenLabel}</span>
                    {t.hidden.map((h) => <span key={h} className="rounded-md bg-[#2a0f16] px-1.5 py-0.5">{h}</span>)}
                  </p>
                )}
              </li>
            ))}
            {busy && next && (
              <li className="space-y-1.5">
                <div className="flex justify-end"><span className="rounded-2xl rounded-tr-md bg-[#6c5ce7] px-3.5 py-1.5 text-[14px] font-bold text-white">🙋 {next.q}</span></div>
                <Skeleton />
              </li>
            )}
          </ol>
          {!done && (
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={click} disabled={busy} className="cta rounded-2xl px-4 py-2.5 text-[14px] font-extrabold text-white disabled:opacity-60">
                {busy ? "⏳ 만드는 중…" : `🖱 딸깍 — “${next.q}”`}
              </button>
              <span className="text-[11.5px] font-bold text-sub">{shown} / {B.turns.length}</span>
              <button type="button" onClick={() => setAll(B.turns.length)} className="ml-auto text-[12px] font-bold text-sub underline">⏩ 한꺼번에 보기</button>
            </div>
          )}
          {done && <button type="button" onClick={() => setAll(0)} className="text-[12px] font-bold text-sub underline">↺ 처음부터 딸깍</button>}
        </div>

        {/* 발표 날 화이트보드 — 설명할 칸이 없다. 딸깍이 다 끝나야 열린다 */}
        {!done ? (
          <div className="space-y-3 rounded-2xl border border-dashed border-[#ffffff2e] bg-void p-4">
            <p className="text-xs font-extrabold text-sub">{T.boardLabel} · 딸깍을 끝까지 누르면 열려요</p>
            {[0, 1, 2, 3].map((i) => <div key={i} className="space-y-1.5"><div className="skel h-3.5 w-[80%]" /><div className="skel ml-5 h-3 w-[40%]" /></div>)}
            <div className="grid grid-cols-2 gap-2 pt-1">{[0, 1, 2, 3].map((i) => <div key={i} className="skel h-14" />)}</div>
          </div>
        ) : (
        <div className="swap space-y-3">
          <div className="rounded-2xl border border-dashed border-[#ffffff2e] bg-void p-4">
            <p className="text-xs font-extrabold text-sub">{T.boardLabel} · {B.board.who}</p>
            <ul className="mt-3 space-y-2.5">
              {B.board.items.map((b) => (
                <li key={b.ask} className="text-[13.5px]">
                  <p className="font-bold">🧑‍🏫 {b.ask}</p>
                  <p className="mt-0.5 pl-5 font-bold" style={{ color: RED }}>🙋 {b.reply}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-extrabold text-sub">{T.scoreLabel}</p>
            <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
              {B.score.map((s) => (
                <li key={s.label} className="rounded-xl bg-sand px-3 py-2">
                  <span className="block text-[11px] font-bold text-sub">{s.label}</span>
                  <b className="block text-lg leading-tight" style={{ color: s.bad ? RED : undefined }}>{s.value}</b>
                  <span className="block text-[11px] leading-snug text-sub">{s.note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        )}
      </div>

      {/* 왜 도움이 안 되나 */}
      <p className="mt-6 text-xs font-extrabold text-sub">{T.whyLabel}</p>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {B.why.map((w) => (
          <li key={w.head} className="rounded-2xl border border-line bg-sand p-3">
            <span className="text-lg">{w.emoji}</span>
            <b className="mt-1 block text-[13px] leading-snug">{w.head}</b>
            <span className="mt-1 block text-[11.5px] leading-snug text-sub">{w.body}</span>
          </li>
        ))}
      </ul>

      {/* 같은 질문, 다르게 받기 */}
      <div className="mt-6 rounded-2xl border border-line p-4">
        <p className="text-xs font-extrabold text-sub">{T.sameLabel} — 🙋 “{B.same.q}”</p>
        <div className="mt-2.5 grid gap-2 md:grid-cols-2">
          <p className="rounded-xl bg-[#2a0f16] px-3.5 py-2.5 text-[13px] font-bold leading-snug text-[#fda4af]"><span className="mb-0.5 block text-[11px]">✕ {T.sameBad}</span>{B.same.bad}</p>
          <p className="rounded-xl bg-mint-soft px-3.5 py-2.5 text-[13px] font-bold leading-snug text-mint"><span className="mb-0.5 block text-[11px]">✓ {T.sameGood}</span>{B.same.good}</p>
        </div>
      </div>
    </div>
  );
}
