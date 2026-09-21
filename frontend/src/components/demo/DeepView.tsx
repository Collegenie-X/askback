"use client";

import { useEffect, useRef } from "react";
import type { Scenario } from "./types";

interface Props {
  scenario: Scenario;
  step: number; // 1: L1 질문 · 2: 학생 답 + 받아줌 · 3: L2 · 4: 학생 답 + 확장
  onStudentAnswer: () => void;
  onDeeper: () => void;
  onSaveNote: () => void;
  onClose: () => void;
}

const LEVELS = ["L1", "L2", "확장"];

export default function DeepView({ scenario, step, onStudentAnswer, onDeeper, onSaveNote, onClose }: Props) {
  const { deep, project } = scenario;
  const lens = deep.lenses.find((l) => l.key === deep.demoLens)!;
  const messages = deep.messages.filter((m) => m.showAt <= step);
  const level = step >= 4 ? 2 : step >= 3 ? 1 : 0;
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [step]);

  const waitingStudent = step === 1 || step === 3;

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-[#FFF7FC]">
      <header className="flex items-center gap-2 border-b border-pink-200 bg-white px-3 py-3 text-[14px]">
        <button onClick={onClose} aria-label="대화로 돌아가기" className="px-1 text-lg">
          ‹
        </button>
        <span className="font-semibold">
          {lens.emoji} {lens.label}
        </span>
        <span className="text-stone-400">· {project.name}</span>
        <span className="ml-auto flex items-center gap-1 text-[11px] text-pink-900">
          {LEVELS.map((l, i) => (
            <span key={l} className={`rounded-full px-1.5 py-0.5 ${i <= level ? "bg-pink-200 font-semibold" : "bg-stone-100 text-stone-400"}`}>
              {l}
            </span>
          ))}
        </span>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        <div className="rounded-xl border border-dashed border-pink-200 px-3 py-2 text-[12px] text-stone-500">시작한 곳 — {deep.origin}</div>

        {messages.map((m, i) =>
          m.from === "student" ? (
            <div key={i} className="fade-up flex justify-end">
              <div className="max-w-[82%] rounded-2xl rounded-br-md bg-stone-800 px-3.5 py-2.5 text-[14.5px] leading-relaxed text-white">{m.text}</div>
            </div>
          ) : (
            <div key={i} className="fade-up rounded-2xl border border-pink-200 bg-[#FFE1F5] px-3.5 py-3 text-[14.5px] leading-relaxed">
              {m.level && <div className="mb-1 text-[11px] font-semibold text-pink-900">{lens.emoji} {m.level}</div>}
              {m.text}
              {m.actions && step === 2 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5 text-[13px]">
                  <button onClick={onDeeper} className="pulse-ring rounded-full bg-stone-800 px-3 py-1.5 font-semibold text-white">
                    한 단 더 깊이
                  </button>
                  <button disabled className="rounded-full border border-pink-300 bg-white px-3 py-1.5 text-stone-400">
                    다른 렌즈로
                  </button>
                  <button onClick={onClose} className="rounded-full border border-pink-300 bg-white px-3 py-1.5">
                    여기까지
                  </button>
                </div>
              )}
              {m.final && (
                <div className="mt-2.5 flex flex-wrap gap-1.5 text-[13px]">
                  <button disabled className="rounded-full border border-pink-300 bg-white px-3 py-1.5 text-stone-400">
                    프로젝트로 가져가기
                  </button>
                  <button onClick={onSaveNote} className="pulse-ring rounded-full bg-stone-800 px-3 py-1.5 font-semibold text-white">
                    📌 생각 노트에 담기
                  </button>
                </div>
              )}
            </div>
          ),
        )}
        <div ref={bottom} />
      </div>

      {/* 마디 점도, 판 막대도 없다 — 심화에는 평가가 없다 */}
      <div className="border-t border-pink-200 bg-white px-3 py-2.5">
        <button
          disabled={!waitingStudent}
          onClick={onStudentAnswer}
          className={`w-full rounded-full px-4 py-2.5 text-left text-[13.5px] ${
            waitingStudent ? "pulse-ring bg-stone-800 font-semibold text-white" : "bg-stone-100 text-stone-400"
          }`}
        >
          {waitingStudent ? `${scenario.student.name}의 생각 보내기 (시연) ➤` : "네 생각을 적어줘"}
        </button>
      </div>
    </div>
  );
}
