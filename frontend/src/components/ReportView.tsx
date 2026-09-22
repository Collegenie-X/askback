"use client";

import { useTable } from "@/lib/db";
import { reportHeadline, reportSub, reportTitle, reportToMd, seqOf } from "@/lib/report";
import type { WindowReport } from "@/lib/types";
import { useApp } from "./AppContext";
import { Sparkle } from "./Art";
import ReportBody from "./ReportBody";
import { Empty } from "./ui";

// 팝업으로 뜬다 — 대화든 리포트 목록이든 보던 화면 위에 열리고, 닫으면 그 자리로 돌아온다. 본문은 대화 속 카드와 같은 ReportBody.
export default function ReportView({ index, report, owner, onClose }: { index: number; report?: WindowReport; owner?: string; onClose: () => void }) {
  const { openMd } = useApp();
  const reports = useTable("reports");
  const profile = useTable("profile");
  const r = report ?? reports.find((x) => x.index === index); // report를 직접 주면 저장되지 않은 리포트(다른 예시)도 같은 모양으로 연다
  if (!r) return <div className="scrim fade fixed inset-0 z-[110] grid place-items-center" onClick={onClose}><Empty emoji="📄">리포트를 찾지 못했어.</Empty></div>;

  const name = owner ?? profile?.name ?? "나";
  const title = reportTitle(r, reports);

  return (
    <div className="scrim fade fixed inset-0 z-[110] grid place-items-center p-0 sm:p-5" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="panel popup flex h-full w-full max-w-[1000px] flex-col overflow-hidden sm:h-[92dvh] sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center gap-2 border-b border-line px-3 py-2.5">
          <div className="min-w-0 flex-1 px-1">
            <p className="truncate text-[11px] font-extrabold text-gold">📄 {title}</p>
            <h1 className="truncate text-[15px] font-bold">“{reportHeadline(r)}”</h1>
            <p className="truncate text-[11px] text-sub">{name} · {reportSub(r, reports)}</p>
          </div>
          <button type="button" onClick={() => openMd({ title: `📄 ${title}`, md: reportToMd(r, reports, name), filename: `report-${seqOf(r, reports)}.md` })} className="shrink-0 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-bold">⬇️ .md</button>
          <button type="button" onClick={onClose} aria-label="닫기" className="chunk-ghost grid h-9 w-9 shrink-0 place-items-center rounded-full text-base font-bold">✕</button>
        </header>
        <div className="scroll flex-1 px-4 py-4">
          <ReportBody r={r} readOnly={!!report} />
          <p className="flex items-center justify-center gap-1.5 py-4 text-[11px] text-sub"><Sparkle size={10} /> 비교 대상은 언제나 예전의 너야. <Sparkle size={10} color="#8fe9ff" /></p>
        </div>
        {/* 하단 고정 — 스크롤 영역 밖에 두어 모바일에서도 잘리지 않는다 */}
        <footer className="shrink-0 border-t border-line px-4 pt-2.5 pb-[max(10px,env(safe-area-inset-bottom))]">
          <button type="button" onClick={onClose} className="chunk w-full rounded-2xl py-3 text-sm font-extrabold">↩ 보던 곳으로 돌아가기</button>
        </footer>
      </div>
    </div>
  );
}
