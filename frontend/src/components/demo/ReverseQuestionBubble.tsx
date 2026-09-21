"use client";

import { useState } from "react";
import { scoreDot, type ReverseQuestion, type RqRecord } from "./types";

interface Props {
  rq: ReverseQuestion;
  studentName: string;
  record?: RqRecord;
  hintStage: number;
  draft: string;
  busy: boolean;
  canContinue: boolean;
  onHint: () => void;
  onDontKnow: () => void;
  onLater: () => void;
  onOption: (index: number) => void;
  onDemoAnswer: () => void;
  onContinue: () => void;
}

const HINT_STEPS = [
  { key: "hint", icon: "💡", label: "힌트" },
  { key: "example", icon: "📎", label: "예시" },
  { key: "coachView", icon: "🤖", label: "내 생각은 이래" },
] as const;

export default function ReverseQuestionBubble(p: Props) {
  const { rq, record } = p;
  const [whyOpen, setWhyOpen] = useState(false);

  // [나중에] → 한 줄로 접힌다
  if (record?.status === "later") {
    return <div className="fade-up rounded-xl bg-orange-50 px-3 py-2 text-[13px] text-orange-900">🧭 알겠어. 복기함에 있을게. 🧺</div>;
  }

  const decided = Boolean(record);
  const hintLabel = p.hintStage === 0 ? "힌트 줘" : p.hintStage === 1 ? "아직 모르겠어" : "그래도 모르겠어";
  // 세 버튼의 크기는 같다 — 빠져나갈 문을 작게 만들지 않는다 (P6)
  const exitBtn = "flex-1 rounded-lg border border-orange-200 bg-white px-2 py-2 text-[13px] text-stone-700 disabled:opacity-40";

  return (
    <div className="fade-up space-y-2">
      <div className="rounded-2xl border border-orange-200 bg-[#FFF3E1] px-3.5 py-3 text-[14px] leading-relaxed">
        <div className="mb-1.5 flex items-center justify-between text-[11.5px] text-orange-800">
          <span className="font-semibold">🧭 돌아보기</span>
          <span>
            {rq.elementIcon} {rq.elementLabel} · {rq.formLabel}
          </span>
        </div>
        <div className="font-medium text-stone-900">{rq.question}</div>
        {rq.benefit && <div className="mt-1 text-[12.5px] text-stone-500">{rq.benefit}</div>}

        {/* F1 고르기 — 한 번 탭으로 선택과 제출 */}
        {rq.form === "F1" && rq.options && (
          <div className="mt-2.5 space-y-1.5">
            {rq.options.map((opt, i) => {
              const picked = record?.answer === opt.label;
              return (
                <button
                  key={opt.label}
                  disabled={decided}
                  onClick={() => p.onOption(i)}
                  className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-[13.5px] ${
                    picked
                      ? "border-stone-800 bg-white font-semibold"
                      : decided
                        ? "border-orange-100 bg-white/50 text-stone-400"
                        : i === rq.demoOptionIndex
                          ? "pulse-ring border-orange-300 bg-white"
                          : "border-orange-200 bg-white"
                  }`}
                >
                  <span className="text-stone-400">{"①②③④"[i]}</span> {opt.label}
                </button>
              );
            })}
          </div>
        )}

        {/* F3 한두 문장 */}
        {rq.form === "F3" && !decided && (
          <div className="mt-2.5 min-h-[52px] rounded-lg border border-orange-200 bg-white px-3 py-2 text-[13.5px]">
            {p.draft ? <span>{p.draft}</span> : <span className="text-stone-400">엉성해도 돼. 네 말로 한두 문장.</span>}
            {p.busy && <span className="caret" />}
          </div>
        )}
        {rq.form === "F3" && record?.answer && (
          <div className="mt-2.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-[13.5px]">🙋 {record.answer}</div>
        )}

        {/* 힌트 사다리 — 한 단씩만 열린다 */}
        {HINT_STEPS.slice(0, p.hintStage).map((h) => (
          <div key={h.key} className="fade-up mt-2 rounded-lg bg-white/70 px-3 py-2 text-[13px]">
            <span className="font-semibold">
              {h.icon} {h.label}
            </span>{" "}
            — {rq.hints[h.key]}
          </div>
        ))}

        {!decided && (
          <div className="mt-2.5 space-y-1.5">
            <div className="flex gap-1.5">
              {rq.form === "F3" && (
                <button className={exitBtn} disabled={p.busy} onClick={p.onDontKnow}>
                  잘 모르겠어
                </button>
              )}
              <button className={exitBtn} disabled={p.busy || p.hintStage >= 3} onClick={p.onHint}>
                {hintLabel}
              </button>
              <button className={exitBtn} disabled={p.busy} onClick={p.onLater}>
                나중에
              </button>
            </div>
            {rq.form === "F3" && (
              <button
                disabled={p.busy}
                onClick={p.onDemoAnswer}
                className="w-full rounded-lg bg-stone-800 px-3 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
              >
                {p.studentName}의 답 써서 보내기 (시연)
              </button>
            )}
          </div>
        )}
      </div>

      {/* 코치 피드백 — 받아준다 · 하나 보탠다 · 돌려준다 */}
      {record?.feedback && (
        <div className="fade-up rounded-2xl border border-orange-200 bg-white px-3.5 py-3 text-[14px] leading-relaxed">
          <div>🧭 {record.feedback}</div>
          <div className="mt-2 flex items-center justify-between">
            {p.canContinue ? (
              <button onClick={p.onContinue} className="rounded-full bg-stone-800 px-3 py-1.5 text-[13px] font-semibold text-white">
                하던 거 계속
              </button>
            ) : (
              <span />
            )}
            <button onClick={() => setWhyOpen((v) => !v)} className="text-[12.5px] text-stone-500">
              {scoreDot(record.score)} 왜 이 색이야?
            </button>
          </div>
          {whyOpen && (
            <div className="fade-up mt-2 rounded-lg bg-stone-50 px-3 py-2 text-[12.5px] text-stone-600">
              {record.status === "dontknow" || record.score === 0
                ? "'잘 모르겠어'를 골랐어. 모르는 걸 모른다고 누른 거라 그대로 기록했어 — 월간 처방의 가장 정직한 재료야."
                : record.score !== null && record.score >= 2
                  ? "네 말로 골랐고 방향이 맞았어. 다음엔 같은 걸 '빈칸'이나 '한두 문장'으로 물어볼게."
                  : rq.scoreReason}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
