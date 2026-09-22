"use client";

import Link from "next/link";
import { useState } from "react";
import about from "@/data/about.json";
import { rich } from "./rich";

const { ask } = about.flow;

// 고른 자리를 앱으로 넘긴다 — 저장이 아니라 배턴이라, 한 번 쓰이고 사라지는 sessionStorage에 둔다
function handoff(seed: string) {
  try { sessionStorage.setItem("ab.seed", seed); } catch { /* 사생활 보호 모드 등 — 넘기지 못해도 이동은 한다 */ }
}

// 소개 페이지가 방문자에게 직접 한 번 되묻는 자리 — ③ 화이트보드 테스트의 축소판.
// 고르면 답 대신 "막힌 자리"를 짚고, 그 자리를 다루는 STAGE로 데려간다.
export default function AboutFlowAsk() {
  const [picked, setPicked] = useState<string | null>(null);
  const one = ask.options.find((o) => o.id === picked);

  return (
    <div className="mx-auto mt-14 max-w-[820px] rounded-[26px] border border-[#f472b655] bg-card p-6 text-center sm:p-8" style={{ boxShadow: "0 18px 70px rgba(244,114,182,0.14)" }}>
      <p className="eyebrow" style={{ color: "#f472b6" }}>{ask.badge}</p>
      <h3 className="mt-3 text-[20px] font-extrabold leading-snug sm:text-[26px]">{rich(ask.question)}</h3>
      <p className="mx-auto mt-3 max-w-[560px] text-[14px] leading-relaxed text-sub">{ask.lead}</p>

      {!one ? (
        <ul className="mt-6 grid gap-2 text-left">
          {ask.options.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => setPicked(o.id)}
                className="tilecard flex w-full items-center gap-3 px-4 py-3 text-[14px] font-bold leading-snug"
              >
                <span className="text-lg" aria-hidden>{o.emoji}</span>
                <span className="flex-1">{o.label}</span>
                <span className="shrink-0 text-xs" style={{ color: o.color }}>→</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 text-left">
          <p className="text-[13px] font-extrabold text-sub">{one.emoji} {one.label}</p>
          <p className="mt-3 rounded-2xl rounded-bl-md border px-5 py-4 text-[15px] font-bold leading-relaxed" style={{ borderColor: one.color, color: one.color }}>
            {one.reply}
          </p>
          {/* 답 뒤에 한 번 더 — 되묻기는 여기서도 같은 규칙이다 */}
          <p className="mt-4 text-center text-[14px] leading-relaxed text-sub">{rich(ask.backAgain)}</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {/* 남기지 않고 앱으로 넘긴다 — 고른 자리가 첫 질문이 된다 */}
            <Link href="/" onClick={() => handoff(one.seed)} className="cta rounded-full px-5 py-2.5 text-[13px] font-bold text-white">{ask.startLabel} →</Link>
            <a href={`#${one.to}`} className="rounded-full border border-line px-4 py-2.5 text-[13px] font-bold text-sub">{ask.readLabel} — {one.toLabel} →</a>
            <button type="button" onClick={() => setPicked(null)} className="rounded-full border border-line px-4 py-2.5 text-[13px] font-bold text-sub">{ask.againLabel}</button>
          </div>
          <p className="mt-3 text-center text-[12px] text-sub">{ask.startNote}</p>
        </div>
      )}
    </div>
  );
}
