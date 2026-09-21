"use client";

import { scoreDot, type RqRecord, type Scenario } from "./types";

interface Props {
  scenario: Scenario;
  records: Record<number, RqRecord>;
  onClose: () => void;
}

function Section({ no, title, children }: { no: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-stone-200 px-4 py-3.5">
      <h3 className="mb-1.5 text-[12.5px] font-semibold text-stone-500">
        {no} {title}
      </h3>
      {children}
    </section>
  );
}

export default function ReportView({ scenario, records, onClose }: Props) {
  const { report, roles, turns } = scenario;
  const maxMix = Math.max(...report.mix.map((m) => m.count), 1);

  // ④ 돌아보기 — 앞선 마디의 결과 + 방금 시연에서 실제로 고른 것
  const sessionRows = turns.flatMap((t, i) => {
    const rq = t.reverseQuestion;
    const rec = records[i];
    if (!rq || !rec) return [];
    const detail =
      rec.status === "later" ? "나중에 → 복기함" : rec.status === "dontknow" ? '"잘 모르겠어"' : `${rq.formLabel}${rec.hintStage > 0 ? " · 힌트 후" : ""}`;
    return [{ icon: rq.elementIcon, label: rq.elementLabel, dot: scoreDot(rec.score), detail }];
  });
  const rows = [...report.elementsBefore.map((e) => ({ icon: e.icon, label: e.label, dot: scoreDot(e.score), detail: e.form })), ...sessionRows];

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-white">
      <header className="flex items-center gap-2 border-b border-stone-200 px-3 py-3">
        <button onClick={onClose} aria-label="닫기" className="px-1 text-lg">
          ‹
        </button>
        <div>
          <div className="text-[11.5px] font-semibold text-stone-500">📄 {report.title}</div>
          <div className="text-[14.5px] font-semibold">“{report.headline}”</div>
          <div className="text-[11.5px] text-stone-500">{report.range}</div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto text-[13.5px] leading-relaxed">
        <Section no="①" title="지난 미션">
          <div className="text-stone-600">&ldquo;{report.lastMission.text}&rdquo;</div>
          <div className="mt-1">✅ {report.lastMission.result}</div>
        </Section>

        <Section no="②" title="질문 믹스">
          <div className="space-y-1">
            {report.mix.map((m) => (
              <div key={m.role} className="flex items-center gap-2">
                <span className="w-[74px] shrink-0 text-[12.5px]">
                  {roles[m.role].emoji} {m.label}
                </span>
                <div className="h-3.5 flex-1 rounded bg-stone-100">
                  <div
                    className="h-3.5 rounded border border-stone-300"
                    style={{ width: `${(m.count / maxMix) * 100}%`, background: roles[m.role].color, display: m.count ? "block" : "none" }}
                  />
                </div>
                <span className="w-4 text-right tabular-nums">{m.count}</span>
                <span className="w-[64px] text-[11px] text-pink-700">{m.note}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[11.5px] text-stone-400">{report.mixReference}</div>
          <div className="mt-1.5 rounded-lg bg-stone-50 px-2.5 py-1.5 text-[13px]">💬 {report.mixComment}</div>
        </Section>

        <Section no="③" title="질문에 실은 것">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {report.six.map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="w-4">{s.label}</span>
                <div className="h-2.5 flex-1 rounded bg-stone-100">
                  <div className={`h-2.5 rounded ${s.value <= 3 ? "bg-stone-400" : "bg-stone-700"}`} style={{ width: `${s.value * 10}%` }} />
                </div>
                <span className="w-7 text-right text-[12px] tabular-nums text-stone-500">{s.value}/10</span>
              </div>
            ))}
          </div>
        </Section>

        <Section no="④" title="돌아보기 결과">
          <div className="space-y-1">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center gap-2">
                <span className="w-[84px] shrink-0">
                  {r.icon} {r.label}
                </span>
                <span>{r.dot}</span>
                <span className="text-[12.5px] text-stone-500">{r.detail}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section no="⑤" title="걸린 곳">
          {report.stuck}
        </Section>

        <Section no="⑥" title="이번 판의 질문 ⭐">
          <div className="font-medium">&ldquo;{report.best.question}&rdquo;</div>
          <div className="mt-1.5 rounded-lg bg-stone-50 px-2.5 py-1.5 text-[13px]">💬 {report.best.comment}</div>
        </Section>

        {/* 미션 카드만 테두리가 또렷하다 */}
        <div className="p-4">
          <div className="rounded-2xl border-2 border-stone-800 px-4 py-3.5">
            <div className="text-[12.5px] font-semibold text-stone-500">⑦ 다음 판 미션 · 하나만</div>
            <div className="mt-1 text-[15px] font-semibold">🎯 {report.nextMission.text}</div>
            <div className="mt-1.5 text-[12.5px] text-stone-500">← {report.nextMission.basis}</div>
            <div className="mt-3 flex gap-2 text-[13px]">
              <button onClick={onClose} className="flex-1 rounded-full bg-stone-800 px-3 py-2 font-semibold text-white">
                좋아, 해볼게
              </button>
              <button disabled className="flex-1 rounded-full border border-stone-300 px-3 py-2 text-stone-400">
                미션 바꾸기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
