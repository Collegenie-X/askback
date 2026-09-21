"use client";

import { useState } from "react";
import { answerRQ, hintRQ, idkRQ, laterRQ } from "@/lib/actions";
import { colorOf, elementById, FORM_LABEL } from "@/lib/rq";
import type { ReverseQuestion } from "@/lib/types";
import { CompassArt } from "./Art";

const HINT_LABEL = ["💡 힌트 줘", "📎 예시 보여줘", "🤖 코치는 어떻게 봐?"];

export default function RQCard({ rq, inChat }: { rq: ReverseQuestion; inChat: boolean }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [why, setWhy] = useState(false);
  const el = elementById(rq.element);
  const answered = rq.status === "answered";
  const [reopen, setReopen] = useState(false); // [나중에]로 넘긴 질문은 그 자리에서 다시 연다
  const canAnswer = rq.status === "open" || (rq.status === "later" && (!inChat || reopen)) || (!inChat && answered && (rq.score ?? 0) <= 1);

  const submit = async (value: string, optionScore: number | null) => {
    if (busy || !value.trim()) return;
    setBusy(true);
    await answerRQ(rq.id, value.trim(), optionScore, inChat);
    setBusy(false);
    setText("");
  };

  return (
    <div className="rise rounded-2xl border border-[#8a6a1f] bg-amber-soft p-4">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-bold text-gold">
        <span className="rounded-full bg-[#5a4312] px-2 py-0.5">🧭 되묻기</span>
        <span>
          {el?.icon} {el?.name} · {FORM_LABEL[rq.form]}
        </span>
        {answered && (
          <button type="button" className="ml-auto text-sm" onClick={() => setWhy((v) => !v)} aria-label="왜 이 색이야?">
            {colorOf(rq.score)}
          </button>
        )}
        {rq.status === "later" && !reopen && <button type="button" onClick={() => setReopen(true)} className="ml-auto rounded-full border border-[#8a6a1f] px-2 py-0.5 font-bold text-gold">⏭ 넘겼어 · 지금 답하기</button>}
      </div>

      <div className="flex items-start gap-3">
        <CompassArt size={40} />
        <p className="min-w-0 flex-1 whitespace-pre-line text-[15px] font-semibold leading-relaxed">{rq.question}</p>
      </div>

      {answered && rq.answer && (
        <p className="mt-3 rounded-xl bg-card/70 px-3 py-2 text-sm text-sub">
          <span className="font-semibold text-ink">🙋 내 답</span> · {rq.answer}
        </p>
      )}
      {answered && why && <p className="mt-2 text-xs leading-relaxed text-sub">왜 {colorOf(rq.score)}야? — {rq.reason}. 점수가 아니라 다음에 어떤 모양으로 물을지 정하는 표시야.</p>}
      {answered && !inChat && rq.feedback && <p className="mt-2 text-sm leading-relaxed">💬 {rq.feedback}</p>}

      {canAnswer && (
        <>
          {rq.hintStage >= 1 && <p className="mt-3 rounded-xl bg-card/70 px-3 py-2 text-sm">💡 {rq.hint}</p>}
          {rq.hintStage >= 2 && <p className="mt-2 rounded-xl bg-card/70 px-3 py-2 text-sm">📎 {rq.example}</p>}
          {rq.hintStage >= 3 && <p className="mt-2 rounded-xl bg-card/70 px-3 py-2 text-sm">🤖 {rq.coachView}</p>}

          {rq.form === "F1" && rq.options ? (
            <div className="mt-3 space-y-2">
              {rq.options.map((o, i) => (
                <button key={o.label} type="button" disabled={busy} onClick={() => submit(o.label, o.score)} className="flex w-full items-start gap-2 rounded-xl border border-line bg-card px-3 py-2.5 text-left text-sm active:bg-sand disabled:opacity-50">
                  <span className="font-bold text-clay">{"①②③"[i]}</span>
                  <span>{o.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-3">
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder={rq.form === "F2" ? "빈칸에 들어갈 말을 적어줘" : "네 말로 한두 문장. 엉성해도 돼."} className="w-full resize-none rounded-xl border border-line bg-card px-3 py-2.5 text-sm outline-none focus:border-clay" />
              <button type="button" disabled={busy || !text.trim()} onClick={() => submit(text, null)} className="mt-2 w-full rounded-xl bg-ink py-2.5 text-sm font-bold text-paper disabled:opacity-30">
                {busy ? "읽는 중…" : "답하기"}
              </button>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
            <button type="button" disabled={busy} onClick={() => idkRQ(rq.id, inChat)} className="rounded-full border border-line bg-card px-3 py-1.5">
              🤷 잘 모르겠어
            </button>
            {rq.hintStage < 3 && (
              <button type="button" onClick={() => hintRQ(rq.id)} className="rounded-full border border-line bg-card px-3 py-1.5">
                {HINT_LABEL[rq.hintStage]}
              </button>
            )}
            {rq.status === "open" && (
              <button type="button" onClick={() => laterRQ(rq.id)} className="rounded-full px-3 py-1.5 text-sub">
                나중에
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
