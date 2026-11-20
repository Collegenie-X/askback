"use client";

// 동의 문서 한 장 (상세판) — 3줄 요약 → 목차 → 전문(全文).
// 로그인 팝업 안(동의 단계에서 "보기 ›")과 /legal/<id> 페이지가 같은 부품을 쓴다.
//   · 칸이 3개 이상인 표는 좁은 화면에서 줄마다 카드로 펼친다 (가로 스크롤 없이 읽히게)
//   · 목차를 누르면 그 조항으로 스크롤한다
import { useState } from "react";
import type { LegalDoc, LegalSection } from "@/data/legal";

const CIRCLED = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮";

export default function LegalView({ doc }: { doc: LegalDoc }) {
  const [toc, setToc] = useState(false);
  const anchor = (i: number) => `legal-${doc.id}-${i}`;
  const jump = (i: number) => document.getElementById(anchor(i))?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <article className="text-[13px] leading-relaxed [word-break:keep-all]">
      <div className="flex items-center gap-3">
        <span className="slot-icon grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl">{doc.emoji}</span>
        <div className="min-w-0">
          <h2 className="text-[17px] font-extrabold leading-snug">{doc.title}</h2>
          <p className="text-[11px] text-sub">{doc.version} · 시행일 {doc.effective}</p>
        </div>
      </div>

      <ol className="mt-4 space-y-1.5 rounded-2xl border border-clay bg-clay-soft p-3.5">
        <li className="mb-1 flex items-center justify-between text-[11px] font-bold text-clay">
          <span>⚡ 3줄 요약</span>
          <span className="font-normal text-sub">이해를 돕는 요약이에요 · 효력은 아래 전문</span>
        </li>
        {doc.summary.map((s, i) => (
          <li key={s} className="rise flex gap-2 font-bold" style={{ animationDelay: `${i * 70}ms` }}>
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-clay text-[11px] text-[#1d1600]">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>

      <div className="mt-3 rounded-2xl border border-line bg-card">
        <button type="button" onClick={() => setToc((v) => !v)} aria-expanded={toc} className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-[12.5px] font-bold">
          <span>📑 목차 · {doc.sections.length}개 항목</span>
          <span className="text-[11px] text-sub">{toc ? "접기 ▴" : "펼치기 ▾"}</span>
        </button>
        {toc && (
          <ul className="fade grid gap-0.5 border-t border-line px-2 py-2 sm:grid-cols-2">
            {doc.sections.map((s, i) => (
              <li key={s.h}>
                <button type="button" onClick={() => jump(i)} className="w-full truncate rounded-lg px-2 py-1 text-left text-[12px] text-sub hover:text-ink active:bg-sand">{s.h}</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5 space-y-5">
        {doc.sections.map((s, i) => <Section key={s.h} id={anchor(i)} s={s} />)}
      </div>
    </article>
  );
}

function Section({ id, s }: { id: string; s: LegalSection }) {
  return (
    <section id={id} className="scroll-mt-4">
      <h3 className="mb-1.5 text-[14px] font-extrabold">{s.h}</h3>
      {s.body?.split("\n\n").map((p) => <p key={p} className="mb-1.5 text-sub">{p}</p>)}
      {s.items && (
        <ol className="space-y-1 text-sub">
          {s.items.map((t, i) => (
            <li key={t} className="flex gap-1.5">
              <span className="shrink-0 text-ink">{CIRCLED[i] ?? `${i + 1}.`}</span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
      )}
      {s.table && <Table head={s.table.head} rows={s.table.rows} />}
      {s.note && <p className="mt-2 rounded-xl border-l-[3px] border-clay bg-sand px-3 py-2 text-[12.5px] text-ink">{s.note}</p>}
    </section>
  );
}

// 2칸 표는 그대로, 3칸 이상은 줄마다 카드 (첫 칸이 카드 제목)
function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  if (head.length <= 2) {
    return (
      <div className="mt-1.5 overflow-hidden rounded-xl border border-line">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[38%_1fr] border-b border-line last:border-b-0">
            <span className="bg-sand px-3 py-2 font-bold">{k}</span>
            <span className="px-3 py-2 text-sub">{v}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="mt-1.5 space-y-2">
      {rows.map((r) => (
        <div key={r[0]} className="overflow-hidden rounded-xl border border-line">
          <p className="bg-sand px-3 py-2 font-extrabold">{r[0]}</p>
          <dl className="divide-y divide-line">
            {head.slice(1).map((h, j) => (
              <div key={h} className="grid grid-cols-[32%_1fr] gap-2 px-3 py-1.5">
                <dt className="text-[11.5px] font-bold text-sub">{h}</dt>
                <dd className="text-[12.5px]">{r[j + 1]}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
