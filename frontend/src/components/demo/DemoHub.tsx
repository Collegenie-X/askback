"use client";

import { useState } from "react";
import { scenarios } from "@/data/scenarios";
import DemoPlayer from "./DemoPlayer";
import "./demo.css";

// 시연 고르기 — 시나리오를 바꾸면 플레이어를 통째로 새로 만든다 (key)
export default function DemoHub() {
  const [id, setId] = useState(scenarios[0].id);
  const [jsonOpen, setJsonOpen] = useState(false);
  const scenario = scenarios.find((s) => s.id === id) ?? scenarios[0];

  return (
    <div className="askback-demo min-h-screen bg-stone-100 text-stone-900">
      <div className="mx-auto max-w-5xl px-4 pt-5 lg:pt-7">
        <div className="text-[12px] font-semibold tracking-wide text-stone-500">예시 고르기 — 전부 JSON 한 장씩이에요</div>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {scenarios.map((s) => {
            const active = s.id === id;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setId(s.id);
                  setJsonOpen(false);
                }}
                aria-pressed={active}
                className={`rounded-2xl border px-3.5 py-3 text-left transition ${active ? "border-stone-800 bg-white shadow-sm" : "border-stone-200 bg-white/60 hover:bg-white"}`}
              >
                <div className="flex items-center gap-2 text-[15px] font-bold">
                  <span className="text-xl">{s.card.emoji}</span>
                  {s.card.title}
                </div>
                <div className="mt-1 text-[12.5px] leading-snug text-stone-600">{s.card.oneLine}</div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {s.card.tags.map((t) => (
                    <span key={t} className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[11px] text-stone-500">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-1.5 text-[11px] text-stone-400">{s.card.origin}</div>
              </button>
            );
          })}
        </div>
        <button onClick={() => setJsonOpen((v) => !v)} className="mt-2 text-[12.5px] text-stone-500 underline underline-offset-2">
          {jsonOpen ? "▾" : "▸"} {"{ }"} 이 시연의 JSON 보기 — src/data/scenarios/{scenario.id}.json
        </button>
        {jsonOpen && (
          <pre className="mt-2 max-h-[360px] overflow-auto rounded-xl bg-stone-900 p-3 text-[11.5px] leading-relaxed text-stone-100">
            {JSON.stringify({ ...scenario, roles: undefined, chips: undefined }, null, 2)}
          </pre>
        )}
      </div>
      <DemoPlayer key={scenario.id} scenario={scenario} />
    </div>
  );
}
