"use client";

import { useState } from "react";
import roles from "@/data/roles.json";
import { update, useTable } from "@/lib/db";
import { fmtDate, reportSub, reportTitle, ROLE_KEYS, seqOf, windowCountOf, ymOf } from "@/lib/report";
import type { WindowReport } from "@/lib/types";
import { useApp } from "./AppContext";
import { OpenTrend, ReportArt, StampArt } from "./Art";
import Buddy, { buddyName, levelOf } from "./Buddy";
import { Empty, PageHeader, Sheet } from "./ui";

const RESULT = { done: "미션 해냈어", partial: "미션 절반쯤", missed: "미션 다음에 다시" };
const DOT = (score: number | null) => (score === null ? "#4a5380" : score >= 2 ? "#5ad1b3" : score === 1 ? "#ffc83d" : "#c9cfee");

function share(r: WindowReport) {
  const top = ROLE_KEYS.map((k) => ({ k, n: r.roles[k] })).sort((a, b) => b.n - a.n).filter((x) => x.n > 0).slice(0, 2);
  return top.map((x) => `${roles.roles[x.k].emoji} ${roles.roles[x.k].name} ${x.n * 10}%`).join(" · ") || "—";
}

export default function ReportsView() {
  const { go, openReport } = useApp();
  const reports = useTable("reports");
  const state = useTable("state");
  const profile = useTable("profile");
  const [compare, setCompare] = useState(false);
  const turns = useTable("turns");
  const projects = useTable("projects");
  const level = levelOf(reports.length);
  const current = projects.find((p) => p.id === state.currentProjectId);
  const windowCount = windowCountOf(current?.id, current?.name ?? "", turns, reports);
  const sorted = [...reports].sort((a, b) => b.index - a.index);
  const first = reports[0];
  const last = reports[reports.length - 1];
  const months = [...new Set(sorted.map((r) => ymOf(r.createdAt)))];

  const open = (r: WindowReport) => {
    update("reports", (prev) => prev.map((x) => (x.index === r.index ? { ...x, opened: true } : x)));
    openReport(r.index);
  };

  return (
    <>
      <PageHeader title={`📊 ${profile?.name ?? "나"}의 질문 리포트`} sub={`질문 10개가 모이면 리포트 1장 · 지금까지 ${reports.length}장`} back={{ name: "chat" }} />
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
            <p className="mt-2 text-[11px] text-sub">질문 {10 - windowCount}개만 더! 리포트가 나오면 별이가 진화해</p>
          </div>
        </div>

        {reports.length === 0 ? (
          <Empty emoji="📄">
            유효 질문 10개마다 리포트가 한 장 생겨.
            <br />
            미리 보고 싶으면 설정 → 샘플 데이터를 넣어봐.
          </Empty>
        ) : (
          <>
            <div className="mb-3 flex gap-2 overflow-x-auto">
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

            {/* 리포트 요약 — 몇 장 모였고, 열린 질문이 어떻게 변했나 */}
            <section className="mb-4 rounded-2xl border border-line bg-card p-4" aria-label="리포트 요약">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="flex min-w-[200px] flex-1 items-center gap-3">
                  <ReportArt size={52} />
                  <div className="min-w-0">
                    <h2 className="text-[16px] font-extrabold">📑 모인 리포트 <span className="text-gold">{reports.length}장</span></h2>
                    <p className="text-[11px] leading-relaxed text-sub">질문 {reports.length * 10}개를 {reports.length}번으로 나눠 돌아봤어</p>
                  </div>
                </div>
                <div className="w-full max-w-[340px] flex-1 basis-[240px]">
                  <h3 className="text-[11px] font-bold text-sub">💡 리포트마다 ‘열린 질문’은 몇 개? <span className="font-normal">(10개 중)</span></h3>
                  <OpenTrend points={[...reports].sort((a, b) => a.index - b.index).map((r) => ({ label: reports.every((x) => x.projects[0] === reports[0].projects[0]) ? `${seqOf(r, reports)}번째` : `${(r.projects[0] ?? "").slice(0, 4)} ${seqOf(r, reports)}`, value: r.mix.O3 + r.mix.O4 }))} />
                </div>
              </div>
            </section>

            <h2 className="mb-2 text-[13px] font-extrabold">🗂 리포트 목록 <span className="text-[11px] font-normal text-sub">— 눌러서 자세히 보기</span></h2>
            <ol className="space-y-2.5">
              {sorted.map((r, i) => {
                const monthBreak = i > 0 && ymOf(sorted[i - 1].createdAt) !== ymOf(r.createdAt);
                const seated = ROLE_KEYS.filter((k) => r.roles[k] > 0);
                const total = Math.max(1, seated.reduce((n, k) => n + r.roles[k], 0));
                return (
                  <li key={r.index}>
                    {monthBreak && (
                      <div className="my-3 flex items-center gap-2 text-[11px] font-bold text-mint">
                        <span className="h-px flex-1 bg-line" />📘 {Number(ymOf(sorted[i - 1].createdAt).split("-")[1])}월 시작<span className="h-px flex-1 bg-line" />
                      </div>
                    )}
                    <button type="button" onClick={() => open(r)} className="block w-full rounded-2xl border border-line bg-card p-3.5 text-left active:bg-sand">
                      <div className="flex items-center gap-2.5">
                        <ReportArt size={34} />
                        <div className="min-w-0 flex-1">
                          <h3 className="flex items-center gap-1.5 text-[14px] font-extrabold text-gold">
                            <span className="truncate">📄 {reportTitle(r, reports)}</span>
                            {i === 0 && <span className="shrink-0 rounded-full bg-mint-soft px-1.5 py-px text-[10px] text-mint">최신</span>}
                            {!r.opened && <span className="shrink-0 rounded-full bg-clay px-1.5 py-px text-[10px] text-white">NEW</span>}
                          </h3>
                          <p className="truncate text-[11px] text-sub">🗓 {reportSub(r, reports)}{r.text ? ` · 📏 평균 ${r.text.avg}자` : ""}</p>
                        </div>
                        {r.lastMission && (
                          <span className="flex shrink-0 flex-col items-center text-[10px] font-bold text-sub">
                            <StampArt result={r.lastMission.result} size={32} />
                            {RESULT[r.lastMission.result]}
                          </span>
                        )}
                        <span className="shrink-0 text-lg text-sub" aria-hidden>›</span>
                      </div>

                      <p className="mt-3 text-[11px] font-bold text-sub">🪑 내 질문이 AI를 앉힌 자리</p>
                      <div className="mt-1 flex h-5 gap-0.5 overflow-hidden rounded-lg" role="img" aria-label={seated.map((k) => `${roles.roles[k].name} ${r.roles[k]}번`).join(", ")}>
                        {seated.map((k) => (
                          <span key={k} className="grow-x grid place-items-center text-[11px] font-black text-[#10142b]" style={{ flexGrow: r.roles[k], flexBasis: 0, minWidth: 16, background: roles.roles[k].color }}>
                            {r.roles[k]}
                          </span>
                        ))}
                      </div>
                      <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]">
                        {seated.map((k) => (
                          <li key={k} className="flex items-center gap-1">
                            <i className="h-2 w-2 rounded-[3px]" style={{ background: roles.roles[k].color }} />
                            {roles.roles[k].emoji} {roles.roles[k].name} <b>{Math.round((r.roles[k] / total) * 100)}%</b>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-2.5 flex items-center gap-2 text-[11px] text-sub">
                        <span className="font-bold">🔁 돌아보기</span>
                        {r.elements.length ? (
                          <svg width={r.elements.length * 16} height="14" role="img" aria-label={`돌아보기 ${r.elements.length}개`}>
                            {r.elements.map((e, j) => (
                              <circle key={j} cx={8 + j * 16} cy="7" r="5.5" fill={e.score === null ? "none" : DOT(e.score)} stroke={DOT(e.score)} strokeWidth="1.5" strokeDasharray={e.score === null ? "2 2" : undefined} />
                            ))}
                          </svg>
                        ) : (
                          <span>아직 없어</span>
                        )}
                        {r.elements.length > 0 && <span className="ml-auto">잘 답함 {r.elements.filter((e) => (e.score ?? 0) >= 2).length}/{r.elements.length}</span>}
                      </div>

                      {r.best && <p className="mt-2.5 truncate rounded-xl bg-sand px-2.5 py-1.5 text-xs">🏆 <b className="text-gold">베스트 질문</b> “{r.best.text}”</p>}
                    </button>
                  </li>
                );
              })}
            </ol>
            <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-sub">
              {[["#5ad1b3", "내 말로 잘 답함"], ["#ffc83d", "조금 답함"], ["#c9cfee", "아직 어려움"]].map(([c, t]) => (
                <span key={t} className="flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: c }} />{t}</span>
              ))}
            </p>
          </>
        )}
      </div>

      {compare && first && last && (
        <Sheet title="첫 리포트와 지금" onClose={() => setCompare(false)}>
          {[first, last].map((r) => (
            <div key={r.index} className="mb-3 rounded-2xl border border-line bg-card p-4 text-[13px] leading-relaxed">
              <p className="mb-1 text-xs font-bold text-clay">{reportTitle(r, reports)} · {fmtDate(r.createdAt)}</p>
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
