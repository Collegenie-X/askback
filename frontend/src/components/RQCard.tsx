"use client";

import { useState } from "react";
import { answerRQ, hintRQ, idkRQ, laterRQ } from "@/lib/actions";
import { AXIS, colorOf, elementById, FORM_LABEL } from "@/lib/rq";
import type { ReverseQuestion } from "@/lib/types";
import type { Guide } from "./demo/types";
import Markdown from "./Markdown";
import { CompassArt } from "./Art";

const HINT_LABEL = ["💡 힌트 줘", "📎 예시 보여줘", "🤖 코치는 어떻게 봐?"];
// 힌트 3단은 답을 주지 않는다 — 세 단 모두 물음표로 끝나는 열린 질문이다
const HINT_STEP = [
  { emoji: "💡", name: "힌트", tip: "답이 아니라 볼 곳을 바꿔 주는 질문" },
  { emoji: "📎", name: "예시", tip: "다른 데서 있었던 일 — 그래서 네 것은?" },
  { emoji: "🤖", name: "코치의 생각", tip: "내 답을 말해도 끝엔 '너는?'이 붙어" },
];

// 열어 본 힌트만 쌓인다. 세 단 모두 물음표로 끝난다는 걸 라벨이 말해 준다.
function HintStack({ rq, past }: { rq: ReverseQuestion; past?: boolean }) {
  const lines = [rq.hint, rq.example, rq.coachView];
  return (
    <div className="mt-3 space-y-2">
      <p className="text-[10.5px] font-extrabold text-sub">
        {past ? "이때 열어 본 힌트" : "힌트는 답을 주지 않아"} — 세 단 모두 <b className="text-clay">열린 질문</b>으로 끝나
      </p>
      {lines.map((line, i) =>
        rq.hintStage >= i + 1 ? (
          <div key={HINT_STEP[i].name} className="rounded-xl border border-line bg-card/70 px-3 py-2.5">
            <p className="text-[10.5px] font-extrabold text-clay">
              {HINT_STEP[i].emoji} {i + 1}단 · {HINT_STEP[i].name} <span className="font-semibold text-sub">— {HINT_STEP[i].tip}</span>
            </p>
            <p className="mt-1 text-sm leading-relaxed">{line}</p>
          </div>
        ) : null,
      )}
    </div>
  );
}

// 가이드 한 장 — 예시 프로젝트에서만 붙는다
function Note({ note, tone }: { note: Guide; tone: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2 rounded-xl border border-[#4a3f8f] bg-[#1a1640]">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center gap-2 px-3 py-2 text-left">
        <span className="shrink-0 text-[13px]">🧭</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-extrabold text-[#a99bff]">{tone}</span>
          <span className="mt-0.5 block truncate text-[12px] font-bold">{note.title}</span>
        </span>
        <span className="shrink-0 text-[11px] text-sub">{open ? "접기 ▴" : "읽기 ▾"}</span>
      </button>
      {open && (
        <div className="fade border-t border-[#3a3170] px-3 py-2.5">
          <Markdown>{note.body}</Markdown>
          {note.ref && <p className="mt-1.5 text-[10.5px] font-semibold text-sub">📎 {note.ref}</p>}
        </div>
      )}
    </div>
  );
}

export default function RQCard({ rq, inChat, note, hintNote }: { rq: ReverseQuestion; inChat: boolean; note?: Guide; hintNote?: Guide }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [why, setWhy] = useState(false);
  const el = elementById(rq.element);
  const axis = rq.axis ?? (el && "axis" in el ? (el.axis as keyof typeof AXIS) : undefined);
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
        {axis && (
          <span className="rounded-full border border-[#8a6a1f] px-2 py-0.5" title={AXIS[axis].desc}>
            {AXIS[axis].emoji} {AXIS[axis].name}
          </span>
        )}
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
      {/* 왜 묻는지 — 답하면 내 아이템의 어디가 세지는지 한 줄 */}
      {rq.benefit && <p className="mt-1.5 pl-[52px] text-xs leading-relaxed text-sub">↳ {rq.benefit}</p>}

      {answered && rq.hintStage >= 1 && (
        <>
          <HintStack rq={rq} past />
          {hintNote && <Note note={hintNote} tone="코치 노트 — 힌트는 왜 이렇게 생겼나" />}
        </>
      )}
      {answered && rq.answer && (
        <p className="mt-3 rounded-xl bg-card/70 px-3 py-2 text-sm text-sub">
          <span className="font-semibold text-ink">🙋 내 답</span> · {rq.answer}
        </p>
      )}
      {answered && why && <p className="mt-2 text-xs leading-relaxed text-sub">왜 {colorOf(rq.score)}야? — {rq.reason}. 점수가 아니라 다음에 어떤 모양으로 물을지 정하는 표시야.</p>}
      {answered && !inChat && rq.feedback && <p className="mt-2 text-sm leading-relaxed">💬 {rq.feedback}</p>}

      {canAnswer && (
        <>
          {rq.hintStage >= 1 && (
            <>
              <HintStack rq={rq} />
              {hintNote && <Note note={hintNote} tone="코치 노트 — 힌트는 왜 이렇게 생겼나" />}
            </>
          )}

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

      {note && <Note note={note} tone="코치 노트 — 이 되묻기가 확인하는 것" />}
    </div>
  );
}
