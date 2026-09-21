"use client";

import { useMemo, useState } from "react";
import roles from "@/data/roles.json";
import { scenarios } from "@/data/scenarios";
import { update, useTable } from "@/lib/db";
import { exampleReports } from "@/lib/example";
import { fmtDate, reportHeadline, reportSub, reportTitle, ROLE_KEYS, seqOf, windowCountOf, ymOf } from "@/lib/report";
import type { WindowReport } from "@/lib/types";
import { useApp } from "./AppContext";
import { OpenTrend, ReportArt, StampArt } from "./Art";
import Buddy, { buddyName, levelOf } from "./Buddy";
import ReportView from "./ReportView";
import { PageHeader, Sheet } from "./ui";

const RESULT = { done: "미션 해냈어", partial: "미션 절반쯤", missed: "미션 다음에 다시" };
const DOT = (score: number | null) => (score === null ? "#4a5380" : score >= 2 ? "#5ad1b3" : score === 1 ? "#ffc83d" : "#c9cfee");

function share(r: WindowReport) {
  const top = ROLE_KEYS.map((k) => ({ k, n: r.roles[k] })).sort((a, b) => b.n - a.n).filter((x) => x.n > 0).slice(0, 2);
  return top.map((x) => `${roles.roles[x.k].emoji} ${roles.roles[x.k].name} ${x.n * 10}%`).join(" · ") || "—";
}

interface Group { key: string; name: string; emoji: string; who: string; mine: boolean; items: WindowReport[] }

// 한 줄 = 리포트 한 장. 제목 · 질문 유형 · 열린 질문 · 글자 수 · 돌아보기 · 미션이 같은 칸에 같은 순서로 놓인다
function Row({ r, all, onOpen }: { r: WindowReport; all: WindowReport[]; onOpen: () => void }) {
  const seated = ROLE_KEYS.filter((k) => r.roles[k] > 0);
  const openN = r.mix.O3 + r.mix.O4;
  return (
    <li>
      <button type="button" onClick={onOpen} className="rrow block w-full rounded-xl border border-line bg-card px-3 py-2.5 text-left active:bg-sand">
        <span className="rrow-title flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink text-[13px] font-black text-paper">{seqOf(r, all)}</span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-[13px] font-bold leading-snug">
              <span className="truncate">“{reportHeadline(r)}”</span>
              {!r.opened && !r.example && <span className="shrink-0 rounded-full bg-clay px-1.5 py-px text-[10px] text-white">NEW</span>}
            </span>
            <span className="block truncate text-[11px] text-sub">{seqOf(r, all)}번째 리포트 · {reportSub(r, all)}</span>
          </span>
        </span>
        <span className="rrow-cell" data-label="질문 유형">
          <span className="flex h-3.5 w-full gap-px overflow-hidden rounded" role="img" aria-label={seated.map((k) => `${roles.roles[k].name} ${r.roles[k]}번`).join(", ")}>
            {seated.map((k) => (
              <i key={k} title={`${roles.roles[k].name} ${r.roles[k]}번`} style={{ flexGrow: r.roles[k], flexBasis: 0, background: roles.roles[k].color }} />
            ))}
          </span>
        </span>
        <span className="rrow-cell" data-label="열린 질문"><span><b className="text-mint">{openN}</b><span className="text-sub">/10</span></span></span>
        <span className="rrow-cell" data-label="평균 글자">{r.text ? <span><b>{r.text.avg}</b><span className="text-sub">자</span></span> : <span className="text-sub">—</span>}</span>
        <span className="rrow-cell" data-label="돌아보기">
          {r.elements.length ? (
            <svg width={r.elements.length * 12} height="12" role="img" aria-label={`돌아보기 ${r.elements.length}개`}>
              {r.elements.map((e, j) => (
                <circle key={j} cx={6 + j * 12} cy="6" r="4.5" fill={e.score === null ? "none" : DOT(e.score)} stroke={DOT(e.score)} strokeWidth="1.5" strokeDasharray={e.score === null ? "2 2" : undefined} />
              ))}
            </svg>
          ) : <span className="text-sub">—</span>}
        </span>
        <span className="rrow-cell" data-label="미션">{r.lastMission ? <span title={RESULT[r.lastMission.result]}><StampArt result={r.lastMission.result} size={24} /></span> : <span className="text-[10px] text-sub">첫 미션</span>}</span>
        <span className="rrow-go text-base text-sub" aria-hidden>›</span>
      </button>
    </li>
  );
}

export default function ReportsView() {
  const { go, openReport } = useApp();
  const reports = useTable("reports");
  const state = useTable("state");
  const profile = useTable("profile");
  const turns = useTable("turns");
  const projects = useTable("projects");
  const [compare, setCompare] = useState(false);
  const [preview, setPreview] = useState<{ r: WindowReport; who: string } | null>(null); // 불러오지 않은 예시의 리포트 — 저장 없이 같은 팝업으로 연다
  const level = levelOf(reports.length);
  const current = projects.find((p) => p.id === state.currentProjectId);
  const windowCount = windowCountOf(current?.id, current?.name ?? "", turns, reports);
  const sorted = [...reports].sort((a, b) => b.index - a.index);
  const first = reports[0];
  const last = reports[reports.length - 1];
  const months = [...new Set(sorted.map((r) => ymOf(r.createdAt)))];

  // 내 프로젝트의 리포트(저장된 것) + 아직 열지 않은 예시들의 리포트(JSON에서 바로 만든 것) — 프로젝트마다 한 묶음, 번호는 묶음 안에서 1번째부터
  const groups = useMemo<Group[]>(() => {
    const keys = [...new Set(sorted.map((r) => r.projectId ?? r.projects[0] ?? "—"))];
    const mine = keys.map((key) => {
      const items = sorted.filter((r) => (r.projectId ?? r.projects[0] ?? "—") === key);
      const p = projects.find((x) => x.id === items[0].projectId);
      return { key, name: p?.name ?? items[0].projects[0] ?? "프로젝트", emoji: p?.emoji ?? "📁", who: profile?.name ?? "나", mine: true, items };
    });
    const others = scenarios
      .filter((sc) => !keys.includes(`prj_example_${sc.id}`))
      .flatMap((sc, i) => {
        const items = exampleReports(sc).map((r, j) => ({ ...r, index: -(i * 10 + j + 1), example: true })).reverse();
        return items.length ? [{ key: `prj_example_${sc.id}`, name: sc.project.name, emoji: sc.project.emoji, who: `${sc.student.name} ${sc.student.grade}`, mine: false, items }] : [];
      });
    return [...mine, ...others];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports, projects, profile?.name]);
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const allRows = groups.flatMap((g) => g.items);
  const avgOpen = total ? Math.round((allRows.reduce((n, r) => n + r.mix.O3 + r.mix.O4, 0) / total) * 10) / 10 : 0;

  const open = (r: WindowReport) => {
    if (r.example) return setPreview({ r, who: groups.find((g) => g.items.includes(r))?.who ?? "" });
    update("reports", (prev) => prev.map((x) => (x.index === r.index ? { ...x, opened: true } : x)));
    openReport(r.index);
  };

  return (
    <>
      <PageHeader title="📊 질문 리포트 전체 목록" sub={`질문 10개가 모이면 리포트 1장 · 프로젝트 ${groups.length}개 · 리포트 ${total}장`} back={{ name: "chat" }} />
      <div className="scroll flex-1 px-4 py-4">
        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-line bg-card p-4">
          <Buddy level={level} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-[13px] font-bold">
              <span className="truncate">
                <span className="text-gold">Lv.{level}</span> {buddyName(level)}
              </span>
              <span className="text-clay">{windowCount}/10</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand">
              <div className="xp h-full rounded-full" style={{ width: `${windowCount * 10}%` }} />
            </div>
            <p className="mt-2 text-[11px] text-sub">{current ? `${current.emoji} ${current.name} — ` : ""}질문 {10 - windowCount}개만 더! 다음 리포트가 나오면 별이가 진화해</p>
          </div>
        </div>

        {/* 요약 — 전체가 몇 장이고, 내 리포트의 열린 질문이 어떻게 변했나 */}
        <section className="mb-4 rounded-2xl border border-line bg-card p-4" aria-label="리포트 요약">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex min-w-[200px] flex-1 items-center gap-3">
              <ReportArt size={52} />
              <div className="min-w-0">
                <h2 className="text-[16px] font-extrabold">📑 전체 리포트 <span className="text-gold">{total}장</span></h2>
                <p className="text-[11px] leading-relaxed text-sub">프로젝트 {groups.length}개 · 내 리포트 {reports.length}장 · 열린 질문 평균 {avgOpen}/10</p>
              </div>
            </div>
            {reports.length >= 2 && (
              <div className="w-full max-w-[340px] flex-1 basis-[240px]">
                <h3 className="text-[11px] font-bold text-sub">💡 내 리포트마다 ‘열린 질문’은 몇 개? <span className="font-normal">(10개 중)</span></h3>
                <OpenTrend points={[...reports].sort((a, b) => a.index - b.index).map((r) => ({ label: reports.every((x) => x.projects[0] === reports[0].projects[0]) ? `${seqOf(r, reports)}번째` : `${(r.projects[0] ?? "").slice(0, 4)} ${seqOf(r, reports)}`, value: r.mix.O3 + r.mix.O4 }))} />
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {months.map((ym) => (
              <button key={ym} type="button" onClick={() => go({ name: "monthly", ym })} className="shrink-0 rounded-full bg-mint-soft px-3.5 py-2 text-xs font-bold text-mint">
                📘 {Number(ym.split("-")[1])}월 월간
              </button>
            ))}
            {reports.length >= 2 && (
              <button type="button" onClick={() => setCompare(true)} className="shrink-0 rounded-full bg-rose-soft px-3.5 py-2 text-xs font-bold text-[#ff9bd8]">
                ↔ 첫 리포트와 지금 비교
              </button>
            )}
          </div>
        </section>

        <h2 className="mb-1 text-[13px] font-extrabold">🗂 리포트 한눈에 보기 <span className="text-[11px] font-normal text-sub">— 한 줄이 리포트 한 장, 누르면 전체 내용</span></h2>
        <div className="rrow rrow-head px-3 py-1.5 text-[10px] font-bold text-sub" aria-hidden>
          <span>번호 · 제목</span><span>🪑 질문 유형</span><span>🌅 열린 질문</span><span>📏 평균 글자</span><span>🔁 돌아보기</span><span>🎯 미션</span><span />
        </div>

        {groups.map((g) => (
          <section key={g.key} className="mb-4" aria-label={`${g.name} 리포트`}>
            <h3 className="mb-1.5 mt-2 flex items-center gap-2 text-[13px] font-extrabold">
              <span className="text-mint">{g.emoji} {g.name}</span>
              <span className="text-[11px] font-normal text-sub">{g.who}</span>
              <span className={`rounded-full px-2 py-px text-[10px] ${g.mine ? "bg-mint-soft text-mint" : "border border-dashed border-line text-sub"}`}>{g.mine ? `내 프로젝트 · ${g.items.length}장` : `예시 · ${g.items.length}장`}</span>
              <span className="h-px flex-1 bg-line" />
            </h3>
            <ol className="space-y-1.5">
              {g.items.map((r) => (
                <Row key={r.index} r={r} all={g.mine ? reports : g.items} onOpen={() => open(r)} />
              ))}
            </ol>
          </section>
        ))}
        {reports.length === 0 && <p className="mb-3 rounded-xl bg-sand px-3 py-2.5 text-[12px] leading-relaxed text-sub">📄 내 리포트는 아직 없어 — 유효 질문이 10개 모이면 첫 장이 여기 맨 위에 생겨. 아래는 예시 프로젝트들의 리포트야.</p>}

        <p className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-sub">
          {ROLE_KEYS.map((k) => (
            <span key={k} className="flex items-center gap-1"><i className="h-2 w-2 rounded-[3px]" style={{ background: roles.roles[k].color }} />{roles.roles[k].emoji} {roles.roles[k].name}</span>
          ))}
          <span className="opacity-50">|</span>
          {[["#5ad1b3", "내 말로 잘 답함"], ["#ffc83d", "조금 답함"], ["#c9cfee", "아직 어려움"]].map(([c, t]) => (
            <span key={t} className="flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: c }} />{t}</span>
          ))}
        </p>
      </div>

      {preview && <ReportView index={preview.r.index} report={preview.r} owner={preview.who} onClose={() => setPreview(null)} />}

      {compare && first && last && (
        <Sheet title="첫 리포트와 지금" onClose={() => setCompare(false)}>
          {[first, last].map((r) => (
            <div key={r.index} className="mb-3 rounded-2xl border border-line bg-card p-4 text-[13px] leading-relaxed">
              <p className="mb-1 text-xs font-bold text-clay">{reportTitle(r, reports)} — “{reportHeadline(r)}” · {fmtDate(r.createdAt)}</p>
              <p className="font-bold">{share(r)}</p>
              <p className="text-sub">기준 {r.six.criteria}/10 · 열린 질문(O3+O4) {r.mix.O3 + r.mix.O4}번</p>
              {r.best && <p className="mt-1.5">“{r.best.text}”</p>}
            </div>
          ))}
          <p className="rounded-xl bg-sand px-3 py-2.5 text-[13px] leading-relaxed">
            💬 열린 질문이 {first.mix.O3 + first.mix.O4}번 → {last.mix.O3 + last.mix.O4}번, 질문에 실은 ‘기준’이 {first.six.criteria} → {last.six.criteria}.
            {last.roles.architect + last.roles.engineer > first.roles.architect + first.roles.engineer ? " 예전엔 AI에게 받아쓰게 했고, 지금은 AI와 설계를 의논해." : " 숫자는 비슷해. 다음 리포트 미션 하나만 해보자."}
          </p>
        </Sheet>
      )}
    </>
  );
}
