"use client";

import { useState } from "react";
import roles from "@/data/roles.json";
import DemoMarkdown from "./DemoMarkdown";
import { extrasOrder, type ChipKind, type RoleKey, type Scenario, type Turn } from "./types";

interface Props {
  turn: Turn;
  scenario: Scenario;
  thinking: boolean;
  answerText: string;
  answerDone: boolean;
  extrasShown: number;
  activeChip: ChipKind | null;
  onChip: (kind: ChipKind) => void;
  deepActive: boolean;
  lensOpen: boolean;
  deepDone: boolean;
  onDeepToggle: () => void;
  onLensPick: (key: string) => void;
  onRole: (role: RoleKey) => void;
  onPlan: () => void;
}

const SIX_KEYS = ["why", "context", "constraint", "criteria", "verify"] as const;

export default function ChatTurn(p: Props) {
  const { turn, scenario } = p;
  const [reviewOpen, setReviewOpen] = useState(false);
  const role = scenario.roles[turn.answer.role];

  const order = extrasOrder(turn);
  const shown = (key: string) => order.indexOf(key) > -1 && order.indexOf(key) < p.extrasShown;

  return (
    <div className="space-y-3">
      {/* 학생 질문 */}
      <div className="flex justify-end">
        <div className="max-w-[82%] rounded-2xl rounded-br-md bg-stone-800 px-3.5 py-2.5 text-[14.5px] leading-relaxed text-white">
          {turn.fromChip && <div className="mb-1 text-[11px] text-stone-300">{scenario.chips[turn.fromChip.kind].emoji} 칩으로 시작 · 빈칸은 직접 채움</div>}
          {turn.question}
        </div>
      </div>

      {p.thinking && (
        <div className="flex gap-1 px-1 py-2" aria-label="답을 준비하는 중">
          <span className="dot-bounce h-2 w-2 rounded-full bg-stone-400" />
          <span className="dot-bounce h-2 w-2 rounded-full bg-stone-400 [animation-delay:120ms]" />
          <span className="dot-bounce h-2 w-2 rounded-full bg-stone-400 [animation-delay:240ms]" />
        </div>
      )}

      {/* 답 — 말풍선이 아니라 본문처럼 넓게 */}
      {p.answerText && (
        <div className="rounded-2xl border border-stone-200 bg-white px-3.5 py-3 text-[14.5px] leading-relaxed">
          <DemoMarkdown streaming={!p.answerDone}>{p.answerText}</DemoMarkdown>

          {p.answerDone && (
            <div className="fade-up mt-3 rounded-xl bg-stone-50 px-3 py-2 text-[13px]">
              <div className="font-semibold text-stone-600">💬 내가 가정한 것</div>
              <ul className="mt-1 space-y-0.5 text-stone-700">
                {turn.answer.assumptions.map((a) => (
                  <li key={a}>· {a}</li>
                ))}
              </ul>
            </div>
          )}

          {shown("risk") && (
            <div className="fade-up mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
              🔧 {turn.answer.riskNote}
            </div>
          )}
        </div>
      )}

      {/* 역할 배지 */}
      {shown("badge") && (
        <button
          onClick={() => p.onRole(turn.answer.role)}
          className="fade-up flex w-full items-center gap-1.5 px-1 text-left text-[13px] text-stone-600"
        >
          <span>이번 답에서 나는</span>
          <span className="rounded-full px-2 py-0.5 font-semibold text-stone-900" style={{ background: role.color }}>
            {role.emoji} {role.label}
          </span>
          <span>로 일했어 ⓘ</span>
        </button>
      )}
      {shown("badge") && <div className="fade-up -mt-2 px-1 text-[12px] text-stone-400">({turn.answer.roleReason})</div>}

      {/* 📝 기획서.md — 이번 답에서 남은 것 */}
      {shown("plan") &&
        (turn.plan ? (
          <button onClick={p.onPlan} className="fade-up flex w-full items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-left text-[13px] text-emerald-900">
            <span>📝</span>
            <span className="min-w-0 flex-1">
              기획서.md에 <b>{turn.plan.section}</b> 칸을 담았어
            </span>
            <span className="shrink-0 text-emerald-700">열기 ›</span>
          </button>
        ) : (
          <div className="fade-up rounded-xl border border-dashed border-stone-300 px-3 py-2 text-[13px] text-stone-500">📝 {turn.planSkip}</div>
        ))}

      {/* 칩 */}
      {shown("chips") && (
        <div className="fade-up flex flex-wrap gap-2 px-1">
          {turn.chips.map((kind) => {
            const chip = scenario.chips[kind];
            const active = p.activeChip === kind;
            return (
              <button
                key={kind}
                disabled={!active}
                onClick={() => p.onChip(kind)}
                title={active ? "누르면 입력창에 초안이 채워져요" : "이 시연에서는 이어지지 않는 칩이에요"}
                className={`rounded-full border px-3 py-1.5 text-[13px] ${
                  active ? "pulse-ring border-orange-400 bg-orange-50 font-semibold text-orange-900" : "border-stone-300 bg-white text-stone-500"
                }`}
              >
                {chip.emoji} {chip.label}
              </button>
            );
          })}
        </div>
      )}

      {/* 🔎 내 질문 돌아보기 */}
      {shown("review") && turn.review && (
        <div className="fade-up px-1">
          <button onClick={() => setReviewOpen((v) => !v)} className="text-[13px] text-stone-600">
            {reviewOpen ? "▾" : "▸"} 🔎 내 질문 돌아보기
          </button>
          {reviewOpen && (
            <div className="mt-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-[13px] leading-relaxed text-stone-800">
              <div className="text-stone-500">
                이 질문은 <b className="text-stone-800">{turn.opennessLabel}</b>이었어
              </div>
              {turn.six && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {SIX_KEYS.map((key) => (
                    <span
                      key={key}
                      title={roles.six[key].name}
                      className={`rounded-md px-1.5 py-0.5 text-[12px] ${turn.six?.[key] ? "bg-emerald-100 text-emerald-900" : "bg-white text-stone-400"}`}
                    >
                      {roles.six[key].name.replace(/ \(.*\)/, "")} {turn.six?.[key] ? "✅" : "⬜"}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-2 font-semibold">💬 그래서 내 답이 이렇게 됐어</div>
              <ul className="mt-0.5 space-y-1">
                {turn.review.because.map((b) => (
                  <li key={b}>· {b}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 🔭 심화 */}
      {shown("deep") && (
        <div className="fade-up px-1">
          <button
            disabled={!p.deepActive}
            onClick={p.onDeepToggle}
            className={`rounded-md text-[13px] ${p.deepActive ? "pulse-ring bg-pink-50 px-2 py-1 font-semibold text-pink-900" : "text-stone-600"}`}
          >
            {p.lensOpen ? "▾" : "▸"} 🔭 심화{p.deepDone ? ` · ${scenario.deep.lenses.find((l) => l.key === scenario.deep.demoLens)?.emoji ?? ""} 확장까지` : ""}
          </button>
          {p.lensOpen && (
            <div className="fade-up mt-2 overflow-hidden rounded-xl border border-pink-200 bg-white">
              {scenario.deep.lenses.map((lens) => {
                const active = lens.key === scenario.deep.demoLens;
                return (
                  <button
                    key={lens.key}
                    disabled={!active}
                    onClick={() => p.onLensPick(lens.key)}
                    className={`flex w-full items-baseline gap-2 border-b border-pink-100 px-3 py-2.5 text-left text-[13px] last:border-b-0 ${
                      active ? "bg-pink-50" : "opacity-60"
                    }`}
                  >
                    <span className="w-16 shrink-0 font-semibold">
                      {lens.emoji} {lens.label}
                    </span>
                    <span className="text-stone-600">{lens.preview}</span>
                  </button>
                );
              })}
              <div className="px-3 py-1.5 text-right text-[11px] text-stone-400">하나를 골라줘</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
