"use client";

// 대화 속 리포트 카드 — 스크롤해도 위에 붙어 있고, 누르면 팝업(ReportView)으로 연다.
import roles from "@/data/roles.json";
import { update, useTable } from "@/lib/db";
import { reportHeadline, reportSub, reportTitle, ROLE_KEYS } from "@/lib/report";
import type { WindowReport } from "@/lib/types";
import { ReportArt } from "./Art";

export default function ReportCard({ r, onDoc, onDetail }: { r: WindowReport; onDoc: () => void; onDetail: () => void }) {
  const reports = useTable("reports");
  const openPopup = () => {
    if (!r.opened) update("reports", (prev) => prev.map((x) => (x.index === r.index ? { ...x, opened: true } : x)));
    onDetail();
  };

  const seated = ROLE_KEYS.filter((k) => r.roles[k] > 0);
  const top = [...seated].sort((a, b) => r.roles[b] - r.roles[a])[0];
  const title = reportTitle(r, reports);

  return (
    <section className="rcard rise pinned" style={{ zIndex: 10 + r.index }} aria-label={title}>
      <button type="button" onClick={openPopup} className="rcard-head">
        <ReportArt size={34} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-[12px] font-extrabold text-gold">
            <span className="truncate">{title}</span>
            {!r.opened && <span className="shrink-0 rounded-full bg-gold px-1.5 py-px text-[10px] text-paper">NEW</span>}
          </span>
          <span className="block truncate text-[13px] font-bold">"{reportHeadline(r)}"</span>
          <span className="block truncate text-[11px] text-sub">{reportSub(r, reports)}{top ? ` · ${roles.roles[top].emoji} ${roles.roles[top].name} ${r.roles[top]}번` : ""}</span>
        </span>
        <span className="rcard-mini" aria-hidden>
          {seated.map((k) => (
            <span key={k} style={{ flexGrow: r.roles[k], background: roles.roles[k].color }} />
          ))}
        </span>
        <span className="rcard-toggle">📖 열기 ▸</span>
      </button>
    </section>
  );
}
