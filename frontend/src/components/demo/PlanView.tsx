"use client";

import { useState } from "react";
import DemoMarkdown from "./DemoMarkdown";
import { PLAN_OP_LABEL, type PlanSlot } from "./types";

interface Props {
  filename: string;
  markdown: string;
  slots: PlanSlot[];
  onClose: () => void;
}

export default function PlanView({ filename, markdown, slots, onClose }: Props) {
  const [openSlot, setOpenSlot] = useState<string | null>(null);

  const download = () => {
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filledSlots = slots.length;
  const revisions = slots.reduce((n, s) => n + s.history.length, 0);

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-white dark:bg-stone-950">
      <header className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 px-3 py-3">
        <button onClick={onClose} aria-label="닫기" className="px-1 text-lg">
          ✕
        </button>
        <div className="min-w-0">
          <div className="truncate text-[14.5px] font-semibold">📝 {filename}</div>
          <div className="text-[11.5px] text-stone-500">
            {filledSlots}칸 · {revisions}번 고쳐 씀
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setOpenSlot(null)} className="shrink-0 rounded-full border border-stone-300 px-3 py-1.5 text-[12.5px] font-semibold">
            📋 MD 복사
          </button>
          <button onClick={download} className="shrink-0 rounded-full bg-amber-400 px-3 py-1.5 text-[12.5px] font-semibold text-stone-900">
            ⬇ .md 저장
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* 칸 목록 — 타임라인 */}
        <div className="space-y-0">
          {slots.map((slot) => {
            const latest = slot.history[slot.history.length - 1];
            const isOpen = openSlot === slot.id;
            const hasMultiple = slot.history.length > 1;
            return (
              <div key={slot.id} className="border-b border-stone-100 dark:border-stone-800">
                {/* 칸 헤더 */}
                <button
                  onClick={() => setOpenSlot(isOpen ? null : slot.id)}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-stone-50 dark:hover:bg-stone-900"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[12px] font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                    {slot.no}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold truncate">{slot.section}</div>
                    <div className="flex items-center gap-1.5 text-[11.5px] text-stone-500">
                      {hasMultiple ? (
                        <>
                          <span className="text-emerald-600 font-medium">{slot.history.length}번 고쳐 씀</span>
                          <span>·</span>
                          <span>{slot.history.map((h) => `Q${h.turnNumber}`).join(" → ")}</span>
                        </>
                      ) : (
                        <span>Q{latest.turnNumber}에서 생김</span>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-stone-400 text-[14px]">{isOpen ? "▾" : "▸"}</span>
                </button>

                {/* 칸 내용 — 열렸을 때 */}
                {isOpen && (
                  <div className="px-4 pb-4">
                    {/* 버전 타임라인 */}
                    {hasMultiple && (
                      <SlotTimeline slot={slot} />
                    )}

                    {/* 지금 모습 */}
                    <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3.5 py-3 text-[13.5px] leading-relaxed">
                      <DemoMarkdown>{latest.change.md}</DemoMarkdown>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 하단 안내 */}
        <div className="px-4 py-4">
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950 px-3 py-2.5 text-[12.5px] text-emerald-900 dark:text-emerald-200">
            이 파일을 코딩 도구(Cursor · Claude Code · Replit 등)에 그대로 붙여넣으면 코드가 나와요. <b>___ 빈칸</b>은 도구가 모르는 칸 — 네가 채워야 해요.
          </div>
        </div>
      </div>
    </div>
  );
}

function SlotTimeline({ slot }: { slot: PlanSlot }) {
  const [expandedVer, setExpandedVer] = useState<number | null>(null);
  return (
    <div className="mb-3 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/50 px-3 py-2.5">
      <div className="text-[11.5px] font-semibold text-emerald-800 dark:text-emerald-300 mb-1.5">버전 자취</div>
      <div className="space-y-0 relative">
        <div className="absolute left-[9px] top-2 bottom-2 w-px bg-emerald-300 dark:bg-emerald-700" />
        {slot.history.map((h, i) => {
          const isCurrent = i === slot.history.length - 1;
          const isExpanded = expandedVer === i;
          return (
            <div key={i} className="relative pl-6">
              <div className={`absolute left-[5px] top-1.5 h-[10px] w-[10px] rounded-full border-2 ${
                isCurrent
                  ? "border-emerald-600 bg-emerald-600"
                  : "border-emerald-400 bg-white dark:bg-stone-900"
              }`} />
              <button
                onClick={() => setExpandedVer(isExpanded ? null : i)}
                className="w-full text-left py-1"
              >
                <div className="flex items-center gap-1.5">
                  <span className={`text-[12px] font-semibold ${isCurrent ? "text-emerald-700 dark:text-emerald-300" : "text-stone-600 dark:text-stone-400"}`}>
                    v{h.version} · Q{h.turnNumber}
                  </span>
                  <span className={`text-[11px] rounded-full px-1.5 py-0.5 ${
                    h.change.op === "add" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200" :
                    h.change.op === "revise" ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200" :
                    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200"
                  }`}>
                    {PLAN_OP_LABEL[h.change.op]}
                  </span>
                  {!isCurrent && <span className="text-[11px] text-stone-400 ml-auto">{isExpanded ? "▾" : "▸"}</span>}
                </div>
                {h.change.why && (
                  <div className="text-[11.5px] text-stone-500 mt-0.5">← {h.change.why}</div>
                )}
                {h.change.changed && (
                  <ul className="mt-1 space-y-0.5">
                    {h.change.changed.map((c, j) => (
                      <li key={j} className="text-[11.5px] text-stone-600 dark:text-stone-400">• {c}</li>
                    ))}
                  </ul>
                )}
              </button>
              {isExpanded && !isCurrent && (
                <div className="mt-1 mb-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-[12.5px] leading-relaxed">
                  <DemoMarkdown>{h.change.md}</DemoMarkdown>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
