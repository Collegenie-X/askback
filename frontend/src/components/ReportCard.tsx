"use client";

// 대화 속 리포트 카드 — 접혀 있으면 스크롤해도 위에 붙어 있고(가장 최근에 지나온 리포트가 남는다), 열면 자세히 팝업과 똑같은 본문(ReportBody)이 펼쳐진다.
import { useState } from "react";
import roles from "@/data/roles.json";
import { update, useTable } from "@/lib/db";
import { reportHeadline, reportSub, reportTitle, ROLE_KEYS } from "@/lib/report";
import type { WindowReport } from "@/lib/types";
import { ReportArt } from "./Art";
import ReportBody from "./ReportBody";

export default function ReportCard({ r, onDoc, onDetail }: { r: WindowReport; onDoc: () => void; onDetail: () => void }) {
  const reports = useTable("reports");
  const [open, setOpen] = useState(false);
  const toggle = () => {
    if (!open && !r.opened) update("reports", (prev) => prev.map((x) => (x.index === r.index ? { ...x, opened: true } : x)));
    setOpen((v) => !v);
  };

  const seated = ROLE_KEYS.filter((k) => r.roles[k] > 0);
  const top = [...seated].sort((a, b) => r.roles[b] - r.roles[a])[0];
  const title = reportTitle(r, reports);

  return (
    <section className={`rcard rise ${open ? "open" : "pinned"}`} style={{ zIndex: 10 + r.index }} aria-label={title}>
      <button type="button" onClick={toggle} aria-expanded={open} className="rcard-head">
        <span key={String(open)} className={open ? "spark" : ""}><ReportArt size={34} /></span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-[12px] font-extrabold text-gold">
            <span className="truncate">{title}</span>
            {!r.opened && <span className="shrink-0 rounded-full bg-gold px-1.5 py-px text-[10px] text-paper">NEW</span>}
          </span>
          <span className="block truncate text-[13px] font-bold">“{reportHeadline(r)}”</span>
          <span className="block truncate text-[11px] text-sub">{reportSub(r, reports)}{top ? ` · ${roles.roles[top].emoji} ${roles.roles[top].name} ${r.roles[top]}번` : ""}</span>
        </span>
        {/* 접힌 채로도 질문 유형이 한눈에 — 작은 띠 */}
        {!open && (
          <span className="rcard-mini" aria-hidden>
            {seated.map((k) => (
              <span key={k} style={{ flexGrow: r.roles[k], background: roles.roles[k].color }} />
            ))}
          </span>
        )}
        <span className="rcard-toggle">{open ? "닫기 ▴" : "📖 열기 ▾"}</span>
      </button>

      <div className="rcard-body">
        <div className="rcard-inner">
          <div className="space-y-3 px-3 pb-4 pt-1 sm:px-4">
            <div className="rcard-item" style={{ transitionDelay: "0.08s" }}>{open && <ReportBody r={r} />}</div>
            <div className="rcard-item flex gap-2" style={{ transitionDelay: "0.2s" }}>
              <button type="button" onClick={onDoc} className="chunk flex-1 rounded-xl py-2 text-[13px] font-extrabold">⬇️ .md로 내보내기</button>
              <button type="button" onClick={onDetail} className="rounded-xl border border-line bg-card px-3 py-2 text-xs font-bold">크게 보기</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
