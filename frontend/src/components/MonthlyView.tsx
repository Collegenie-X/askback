"use client";

import { useState } from "react";
import { update, useTable } from "@/lib/db";
import { buildMonthly, elementsLine, fmtDate, monthlyToMd, O_KEYS, reportTitle, rolesLine } from "@/lib/report";
import { colorOf } from "@/lib/rq";
import { useApp } from "./AppContext";
import { Card, Fold, PageHeader } from "./ui";

const O_COLOR: Record<string, string> = { O1: "#b7b3d6", O2: "#5cb8ff", O3: "#3fe0c0", O4: "#ff7ac8", O5: "#ffd98a" };

export default function MonthlyView({ ym }: { ym: string }) {
  const { openMd, openReport } = useApp();
  const reports = useTable("reports");
  const notes = useTable("notes");
  const goals = useTable("goals");
  const profile = useTable("profile");
  const mo = buildMonthly(ym, reports, notes);
  const name = profile?.name ?? "나";
  const [goal, setGoal] = useState(goals[ym] ?? mo.goalDraft);

  return (
    <>
      <PageHeader title={`📘 ${mo.label} 월간 리포트${mo.mini ? " · 미니" : ""}`} sub="이번 달, 무엇을 공부하면 다음 달이 나아지나?" back={{ name: "reports" }}
        right={<button type="button" onClick={() => openMd({ title: `${mo.label} 월간 리포트`, md: monthlyToMd(mo, name, goal), filename: `monthly-${ym}.md` })} className="rounded-full border border-line bg-card px-3 py-1.5 text-xs font-bold">.md</button>}
      />
      <div className="scroll flex-1 space-y-3 px-4 py-4">
        <Fold title="📚 처방과 목표" summary={`공부 처방 ${mo.prescriptions.length}개 · 다음 달 목표`} defaultOpen tone="plain">
          <div className="space-y-3">
        <Card n="6" title="📚 공부 처방 (최대 3개)">
          {mo.prescriptions.length === 0 && <p className="text-[13px] leading-relaxed text-sub">이번 달은 처방할 만큼 뚜렷한 구멍이 안 보여. 데이터가 더 쌓이면 다시 볼게.</p>}
          <div className="space-y-3">
            {mo.prescriptions.map((p) => (
              <div key={p.title} className="rounded-xl bg-mint-soft p-3 text-[13px] leading-relaxed">
                <p className="font-bold">{p.kind} — {p.title}</p>
                <p className="mt-1 text-sub">근거 · {p.basis}</p>
                <p>→ {p.action}</p>
                <p className="text-sub">기대 효과 · {p.effect}</p>
                <p className="mt-1 font-semibold text-mint">🤝 내가 도울게: {p.promise}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card n="8" title="다음 달 목표 — 고치고 지워도 돼" tone="mission">
          <textarea value={goal} onChange={(e) => setGoal(e.target.value)} onBlur={() => update("goals", (g) => ({ ...g, [ym]: goal }))} rows={3} className="w-full resize-none rounded-xl border border-line bg-card px-3 py-2 text-sm leading-relaxed outline-none" />
        </Card>
          </div>
        </Fold>

        <Fold title="📈 이번 달의 흐름" summary={`리포트 ${mo.reports.length}장 · 질문 유형의 변화`} tone="plain">
          <div className="space-y-3">
        <Card n="1" title="이번 달의 리포트">
          <div className="space-y-1.5">
            {mo.reports.map((r) => (
              <button key={r.index} type="button" onClick={() => openReport(r.index)} className="flex w-full items-center gap-2 rounded-xl bg-sand px-3 py-2 text-left text-[13px]">
                <b className="w-[132px] shrink-0 truncate">{reportTitle(r, reports)}</b>
                <span className="w-10 text-xs text-sub">{fmtDate(r.createdAt)}</span>
                <span className="flex-1 truncate">{rolesLine(r.roles)}</span>
                <span>{elementsLine(r.elements)}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card n="2" title="질문 믹스의 변화">
          <div className="space-y-2">
            {mo.reports.map((r) => (
              <div key={r.index} className="flex items-center gap-2 text-xs">
                <b className="w-[132px] shrink-0 truncate">{reportTitle(r, reports)}</b>
                <div className="flex h-4 flex-1 overflow-hidden rounded-full bg-sand">
                  {O_KEYS.map((k) => (r.mix[k] ? <div key={k} style={{ width: `${r.mix[k] * 10}%`, background: O_COLOR[k] }} /> : null))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-sub">
            {O_KEYS.map((k) => (
              <span key={k}><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: O_COLOR[k] }} />{k}</span>
            ))}
          </div>
        </Card>

          </div>
        </Fold>

        <Fold title="🧭 돌아보기와 미션" summary={`평가 요소 ${mo.elementMap.length}개 · 걸린 곳 ${mo.stuck.length} · 미션 ${mo.missions.length}`} tone="plain">
          <div className="space-y-3">
        <Card n="3" title="평가 요소 지도">
          {mo.elementMap.length === 0 && <p className="text-[13px] text-sub">돌아보기 데이터가 아직 없어.</p>}
          <div className="space-y-1.5">
            {mo.elementMap.map((e) => (
              <div key={e.id} className="flex items-center gap-2 text-[13px]">
                <span className="w-24 shrink-0 font-semibold">{e.icon} {e.name}</span>
                <span className="flex-1 tracking-wider">{e.scores.map((s) => colorOf(s)).join("")}</span>
                <span className="text-[11px] text-sub">{e.forms[0]}{e.forms.length > 1 ? ` → ${e.forms[e.forms.length - 1]}` : ""}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card n="4" title="걸린 곳">
          {mo.stuck.length ? mo.stuck.map((s) => <p key={s.concept} className="text-sm"><b>{s.concept}</b> · {s.total}회</p>) : <p className="text-[13px] text-sub">반복해서 걸린 곳은 없었어.</p>}
        </Card>

        <Card n="5" title="미션 기록">
          {mo.missions.length ? (
            <ul className="space-y-1.5 text-[13px] leading-relaxed">
              {mo.missions.map((m, i) => (
                <li key={i}>{m.result === "done" ? "✅" : m.result === "partial" ? "➖" : "◻️"} {m.text}</li>
              ))}
            </ul>
          ) : <p className="text-[13px] text-sub">아직 없어.</p>}
        </Card>

          </div>
        </Fold>

        <Fold title="🔭 가장 깊었던 생각" summary={`생각 노트 ${mo.notes.length}개`} tone="plain">
          <div className="space-y-3">
        <Card n="7" title="가장 깊었던 생각">
          {mo.notes.length ? mo.notes.map((n) => <p key={n.id} className="mb-2 rounded-xl border-l-[3px] border-[#ff5fb0] bg-rose-soft px-3 py-2 text-sm leading-relaxed">“{n.text}”</p>) : <p className="text-[13px] text-sub">답 아래 🔭 심화를 열면 여기에 네 문장이 모여.</p>}
        </Card>

          </div>
        </Fold>

        <div className="h-4" />
      </div>
    </>
  );
}
