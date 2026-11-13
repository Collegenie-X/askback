"use client";

import { useState } from "react";
import about from "@/data/about.json";
import { rich } from "./rich";

// 한 문장 속 숨은 결정 — 열고 닫기 + 요약(결정 → 받는 질문) / 상세(4칸 표) 전환
const { problem } = about;
const M = problem.hiddenModes;
type Mode = "summary" | "detail";

export default function HiddenDecisions() {
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState<Mode>("summary");

  return (
    <div className="tilecard overflow-hidden" style={{ borderColor: "#fb718566" }}>
      {/* 머리 — 누르면 열고 닫힌다 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 px-5 pt-5 text-left sm:px-6"
      >
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold tracking-wider text-[#fda4af]">{problem.hiddenEyebrow}</p>
          <p className="mt-2 text-lg font-extrabold sm:text-xl">{problem.hiddenTitle}</p>
          <p className="mt-1 text-[13.5px] text-sub">{problem.hiddenLead}</p>
        </div>
        <span className="mt-1 flex shrink-0 items-center gap-1 rounded-full border border-line bg-[#ffffff08] px-3 py-1.5 text-[12px] font-extrabold text-sub">
          {open ? M.close : M.open}
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className={`transition-transform ${open ? "rotate-180" : ""}`}>
            <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {/* 숫자 세 개 — 닫혀 있어도 보인다 */}
      <div className="mt-4 grid grid-cols-3 gap-2 px-5 sm:px-6">
        {problem.hiddenStats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-[#ffffff06] px-3 py-2.5 text-center">
            <p className="text-2xl font-extrabold leading-none" style={{ color: s.color }}>{s.num}</p>
            <p className="mt-1 text-[11.5px] font-bold text-sub">{s.label}</p>
          </div>
        ))}
      </div>

      {open && (
        <div className="mt-4 px-3 sm:px-4">
          {/* 요약 / 상세 전환 */}
          <div role="tablist" className="mx-2 inline-flex rounded-full border border-line bg-[#ffffff08] p-1">
            {(["summary", "detail"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={`rounded-full px-4 py-1.5 text-[12.5px] font-extrabold transition-colors ${
                  mode === m ? "bg-[#fb718533] text-[#fda4af]" : "text-sub hover:text-ink"
                }`}
              >
                {M[m]}
              </button>
            ))}
          </div>

          {mode === "summary" ? (
            // 요약 — 결정 이름과 그 결정이 부르는 질문만
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {problem.hiddenRows.map((r) => (
                <li key={r.q} className="flex flex-col gap-1 rounded-2xl border border-line bg-[#ffffff06] px-3.5 py-3 text-[13.5px]">
                  <span className="font-bold">
                    <span className="mr-1.5 text-[#fb7185]">✕</span>
                    {r.q}
                  </span>
                  <span className="text-[#fde68a]">{r.ask}</span>
                </li>
              ))}
            </ul>
          ) : (
            // 상세 — AI가 넣은 실제 값까지 4칸 표
            <div className="mt-3">
              <div className="hidden grid-cols-[1.1fr_1.4fr_0.8fr_1.2fr] gap-3 px-3 pb-2 text-[11.5px] font-extrabold tracking-wider text-sub md:grid">
                {problem.hiddenCols.map((c) => <span key={c}>{c}</span>)}
              </div>
              <ul className="space-y-2">
                {problem.hiddenRows.map((r) => (
                  <li key={r.q} className="grid gap-1.5 rounded-2xl border border-line bg-[#ffffff06] px-3 py-3 text-[13.5px] md:grid-cols-[1.1fr_1.4fr_0.8fr_1.2fr] md:items-center md:gap-3">
                    <span className="font-bold">{r.q}</span>
                    <code className="break-words font-mono text-[12.5px] text-[#c4b5fd]">{r.ai}</code>
                    <span className="font-bold text-[#fb7185]">✕ {r.who}</span>
                    <span className="text-[#fde68a]">{r.ask}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <p className="px-5 py-5 text-[14.5px] font-bold leading-relaxed sm:px-6">{rich(problem.hiddenFoot)}</p>
    </div>
  );
}
