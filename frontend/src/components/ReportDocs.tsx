"use client";

// 리포트가 남기는 두 장의 .md — 📝 기획서(무엇을 만들기로 했나)와 🔎 질문 분석(내가 어떻게 물었나).
// 리포트의 그래프는 요약이고, 진짜 남는 건 이 두 장이다.
import { useTable } from "@/lib/db";
import { questionsToMd, reportTitle, seqOf } from "@/lib/report";
import type { WindowReport } from "@/lib/types";
import { useApp } from "./AppContext";
import { PlanArt, ReportArt } from "./Art";

export default function ReportDocs({ r, compact }: { r: WindowReport; compact?: boolean }) {
  const { openMd } = useApp();
  const projects = useTable("projects");
  const turns = useTable("turns");
  const rqs = useTable("rqs");
  const messages = useTable("messages");
  const profile = useTable("profile");
  const reports = useTable("reports");

  const project = projects.find((p) => (r.projectId ? p.id === r.projectId : p.name === r.projects[0]));
  const name = profile?.name ?? "나";
  const [from, to] = r.turnRange;
  const mine = turns.filter((t) => (r.projectId ? t.projectId === r.projectId : true) && t.n >= from && t.n <= to);
  const rqCount = mine.filter((t) => rqs.some((q) => q.turnId === t.id)).length;
  const seq = seqOf(r, reports);
  const planSlots = project?.plan ? (project.plan.md.match(/^## /gm)?.length ?? 0) : 0;

  const openPlan = () =>
    project?.plan &&
    openMd({ title: `📝 ${project.plan.filename}`, md: project.plan.md, filename: project.plan.filename });

  const openQuestions = () =>
    openMd({
      title: `🔎 질문 분석 · ${seq}번째 리포트`,
      subtitle: `${name} · Q${from}~Q${to}`,
      md: questionsToMd(r, reports, name, {
        turns,
        rqs,
        planNoteOf: (turnId) => {
          const m = messages.find((x) => x.kind === "answer" && x.turnId === turnId);
          return m && m.kind === "answer" ? m.planNote : undefined;
        },
        answerOf: (turnId) => {
          const m = messages.find((x) => x.kind === "answer" && x.turnId === turnId);
          return m && m.kind === "answer" ? { md: m.md, assumptions: m.assumptions, yourCall: m.yourCall } : undefined;
        },
      }),
      filename: `questions-${seq}.md`,
      variant: "report",
    });

  return (
    <section className={compact ? "" : "mb-4"}>
      <p className="mb-2 text-[11.5px] font-extrabold text-sub">
        📂 이 리포트가 남기는 <b className="text-ink">.md 두 장</b> — 무엇을 만들기로 했나 · 내가 어떻게 물었나
      </p>
      <div className="grid gap-2 min-[560px]:grid-cols-2">
        <button
          type="button"
          onClick={openPlan}
          disabled={!project?.plan}
          className="flex items-start gap-2.5 rounded-2xl border border-mint bg-mint-soft px-3 py-2.5 text-left disabled:opacity-50"
        >
          <span className="mt-0.5 shrink-0"><PlanArt size={30} /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10.5px] font-extrabold text-mint">📝 기획 .md</span>
            <span className="mt-0.5 block truncate text-[13px] font-bold">{project?.plan?.filename ?? "아직 기획서가 없어"}</span>
            <span className="mt-0.5 block text-[11px] leading-relaxed text-sub">
              {project?.plan ? `지금까지 쌓인 ${planSlots}칸 — 질문이 정한 것만 들어 있어` : "질문이 칸을 열면 여기에 쌓여"}
            </span>
          </span>
          {project?.plan && <span className="mt-0.5 shrink-0 rounded-full border border-mint px-2 py-0.5 text-[10.5px] font-extrabold text-mint">열기 ›</span>}
        </button>

        <button
          type="button"
          onClick={openQuestions}
          className="flex items-start gap-2.5 rounded-2xl border border-[#8a6a1f] bg-amber-soft px-3 py-2.5 text-left"
        >
          <span className="mt-0.5 shrink-0"><ReportArt size={30} /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10.5px] font-extrabold text-gold">🔎 질문 분석 .md</span>
            <span className="mt-0.5 block truncate text-[13px] font-bold">Q{from}~Q{to} · 질문 {mine.length}개</span>
            <span className="mt-0.5 block text-[11px] leading-relaxed text-sub">
              프롬프트 전문 · 질문별 분석 · 📊 전체 통계 · 되묻기 {rqCount}번
            </span>
          </span>
          <span className="mt-0.5 shrink-0 rounded-full border border-[#8a6a1f] px-2 py-0.5 text-[10.5px] font-extrabold text-gold">열기 ›</span>
        </button>
      </div>
      {!compact && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-sub">
          기획 .md는 <b className="text-ink">무엇을 만들기로 했는지</b>, 질문 분석 .md는 <b className="text-ink">그걸 어떻게 물어서 정했는지</b>를 남겨. 둘 다 그대로 내보낼 수 있어 — {reportTitle(r, reports)}
        </p>
      )}
    </section>
  );
}
