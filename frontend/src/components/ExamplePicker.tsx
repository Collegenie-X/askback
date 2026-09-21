"use client";

import { scenarios } from "@/data/scenarios";
import type { Scenario } from "./demo/types";
import { Sheet } from "./ui";

// 예시 고르기 — 시나리오 JSON 한 장이 예시 프로젝트 하나. 고르면 대화 전체가 한꺼번에 펼쳐진다.
export default function ExamplePicker({ onPick, onClose }: { onPick: (s: Scenario) => void; onClose: () => void }) {
  return (
    <Sheet title="📂 예시 프로젝트 — 한꺼번에 펼쳐 보기" onClose={onClose}>
      <p className="mb-3 text-[13px] leading-relaxed text-sub">
        작게 시작해서 <b className="text-ink">질문으로 한 단씩 키우는</b> 과정이야. 답에는 코드가 없고 순서도 · 기획 · 차별점만 있어. 고르면 지금 기록은 지워지고 예시로 바뀌어.
      </p>
      <div className="space-y-2">
        {scenarios.map((s) => (
          <button key={s.id} type="button" onClick={() => onPick(s)} className="chunk-card block w-full rounded-2xl p-3.5 text-left">
            <p className="flex items-center gap-2 text-[15px] font-bold">
              <span className="text-xl">{s.card.emoji}</span>
              {s.card.title}
              <span className="ml-auto shrink-0 text-[11px] font-semibold text-sub">
                질문 {s.turns.length} · 🧭 {s.turns.filter((t) => t.reverseQuestion).length}
              </span>
            </p>
            <p className="mt-1 text-xs leading-relaxed text-sub">{s.card.oneLine}</p>
            <p className="mt-1.5 text-[11px] text-sub">{s.stages.map((st) => st.emoji).join(" → ")} · {s.student.name} {s.student.grade}</p>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
