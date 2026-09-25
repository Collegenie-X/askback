"use client";

// 🔥 7단계 기획 가이드 — 불씨 → 불꽃 → 횃불 → 봉화.
// AskBack 루프(질문 · 답 · 되묻기)는 그대로 두고, 그 위에 "지금 기획서의 어느 칸을 채우는 중인가"를 얹는다.
// 빈칸은 코치가 대신 못 채운다 — 열린 질문을 건네줄 뿐이고, 누르면 입력창 초안이 된다.
import { useState } from "react";
import { sparkLevelOf, type Spark, type SparkState, type SparkStep, type TurnSpark } from "./demo/types";

const DIM = "#6b7399";

/** 레벨 사다리 — 칸 두 개마다 한 단. 지금 단만 빛난다. */
export function SparkLadder({ spark, state, compact }: { spark: Spark; state: SparkState; compact?: boolean }) {
  return (
    <ol className={`relative flex items-stretch ${compact ? "gap-1" : "gap-1.5"}`} aria-label="레벨">
      <span
        aria-hidden
        className="absolute left-4 right-4 top-[15px] h-[3px] rounded-full opacity-50"
        style={{ background: `linear-gradient(90deg, ${spark.levels[0].color}, ${spark.levels[spark.levels.length - 1].color})` }}
      />
      {spark.levels.map((lv, i) => {
        const on = state.count > 0 && i <= state.level;
        const now = state.count > 0 && i === state.level;
        return (
          <li key={lv.name} title={lv.done} className="relative z-10 flex flex-1 flex-col items-center text-center">
            <span
              className={`grid h-[34px] w-[34px] place-items-center rounded-full text-[17px] ${now ? "glow" : ""}`}
              style={{
                background: on ? `${lv.color}26` : "#131a35",
                border: `2px solid ${on ? lv.color : "#2b3560"}`,
                boxShadow: now ? `0 0 16px ${lv.color}66` : undefined,
                filter: on ? undefined : "grayscale(1) opacity(0.65)",
              }}
            >
              {lv.emoji}
            </span>
            <b className="mt-1.5 text-[12px] font-extrabold leading-none" style={{ color: on ? lv.color : DIM }}>
              Lv.{i + 1} {lv.name}
            </b>
            <span className="mt-1 text-[10.5px] font-semibold leading-none" style={{ color: on ? "#98a2cc" : DIM }}>
              {lv.range}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** 7칸 스파크 체크 — 찬 칸은 그때 적힌 한 줄, 빈칸은 코치의 열린 질문. */
export function SparkChecklist({
  spark,
  state,
  onAsk,
  onGo,
  openAll,
}: {
  spark: Spark;
  state: SparkState;
  onAsk?: (draft: string) => void;
  /** 찬 칸을 누르면 그 칸이 찬 질문으로 간다 */
  onGo?: (turnNumber: number) => void;
  openAll?: boolean;
}) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <ol className="space-y-1.5">
      {spark.steps.map((st, i) => {
        const at = state.filled[i];
        const done = at !== null;
        const isOpen = openAll || open === st.no;
        const lv = spark.levels[sparkLevelOf(i + 1)];
        return (
          <li key={st.no} className={`overflow-hidden rounded-xl border ${done ? "border-[#8a6a1f] bg-amber-soft" : "border-line bg-card"}`}>
            <button
              type="button"
              onClick={() => setOpen(isOpen && !openAll ? null : st.no)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-2 px-2.5 py-2 text-left"
            >
              <span className="shrink-0 text-[15px]">{done ? "✅" : "⬜"}</span>
              <span className="shrink-0 text-[15px]" style={{ filter: done ? undefined : "grayscale(1) opacity(0.6)" }}>
                {st.emoji}
              </span>
              <b className="shrink-0 text-[12.5px] font-extrabold" style={{ color: done ? lv.color : DIM }}>
                {st.no}단계
              </b>
              <span className={`min-w-0 flex-1 truncate text-[13px] font-bold ${done ? "" : "text-sub"}`}>{st.name}</span>
              {done && <span className="shrink-0 text-[10.5px] font-bold text-sub">Q{at}에서 참</span>}
              <span className="shrink-0 text-[11px] text-sub">{isOpen ? "▴" : "▾"}</span>
            </button>
            {isOpen && (
              <div className="fade space-y-2 border-t border-line px-2.5 py-2.5 text-[12.5px] leading-relaxed">
                <p className="text-sub">
                  <b className="text-ink">목표</b> — {st.goal}
                </p>
                <p className="text-sub">
                  <b className="text-ink">스파크 체크</b> — {st.check}
                </p>
                {done ? (
                  <>
                    <p className="rounded-lg bg-card/70 px-2.5 py-2">
                      <b className="text-gold">📝 이 칸에 적힌 것</b>
                      <span className="mt-0.5 block">{st.line}</span>
                    </p>
                    {onGo && (
                      <button
                        type="button"
                        onClick={() => onGo(at)}
                        className="w-full rounded-lg border border-[#8a6a1f] bg-paper px-2.5 py-1.5 text-left text-[12.5px] font-bold text-gold"
                      >
                        🔗 이 칸이 찬 자리로 — Q{at}번째 질문 보기 ›
                      </button>
                    )}
                  </>
                ) : (
                  <div>
                    <p className="font-bold text-clay">🙋 이 칸을 여는 열린 질문 — 코치가 대신 못 정해</p>
                    <div className="mt-1.5 flex flex-col gap-1.5">
                      {st.opens.map((q) => (
                        <button
                          key={q}
                          type="button"
                          disabled={!onAsk}
                          onClick={() => onAsk?.(q)}
                          className="rounded-lg border border-line bg-paper px-2.5 py-1.5 text-left text-[12.5px] leading-relaxed disabled:opacity-70"
                        >
                          {q}
                          {onAsk && <span className="ml-1 text-[11px] font-bold text-clay">— 이대로 물어보기 ›</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** 대화 맨 위에 펼쳐지는 가이드 패널 — 레벨 사다리 + 7칸 체크 */
export function SparkPanel({ spark, state, onAsk, onGo, defaultOpen }: { spark: Spark; state: SparkState; onAsk?: (draft: string) => void; onGo?: (turnNumber: number) => void; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const lv = state.levelMeta;
  return (
    <section className="overflow-hidden rounded-2xl border border-[#8a4a1f]" style={{ background: "linear-gradient(140% 140% at 0% 0%, #2a1408 0%, #131a35 62%)" }}>
      <div className="px-3 pt-3">
        <p className="flex items-center gap-1.5 text-[11.5px] font-extrabold" style={{ color: "#FF8C55" }}>
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "#FF6B35" }} />
          🔥 {spark.title} — {spark.caption}
        </p>
        <div className="mt-3">
          <SparkLadder spark={spark} state={state} />
        </div>
        <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[12.5px] leading-relaxed">
          <b style={{ color: lv?.color ?? "#FF8C55" }}>
            {lv ? `${lv.emoji} Lv.${state.level + 1} ${lv.name}` : "🕯 아직 첫 칸 전"}
          </b>
          <span className="font-bold text-ink">기획서 {state.count}/{spark.steps.length}칸</span>
          <span className="text-sub">{lv ? lv.done : "첫 질문이 불씨를 만든다"}</span>
        </p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-sub">{spark.rule}</p>
      </div>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="mt-2.5 flex w-full items-center gap-2 border-t border-[#5a3418] px-3 py-2.5 text-left text-[12px] font-bold">
        <span className="flex-1">
          {open ? "칸 접기" : state.nextStep ? `⬜ 아직 빈 칸 — ${state.nextStep.no}단계 ${state.nextStep.name}` : "✅ 일곱 칸이 다 찼어"}
        </span>
        <span className="text-sub">{open ? "▴" : "일곱 칸 보기 ▾"}</span>
      </button>
      {open && (
        <div className="fade border-t border-[#5a3418] px-3 py-3">
          <SparkChecklist spark={spark} state={state} onAsk={onAsk} onGo={onGo} />
        </div>
      )}
    </section>
  );
}

/** 답 아래 한 줄 — 이 답이 선 칸과, 지금 / 다음 방향 */
export function SparkStepBadge({ spark, turnSpark, onOpen }: { spark: Spark; turnSpark: TurnSpark; onOpen?: () => void }) {
  const st: SparkStep | undefined = spark.steps.find((x) => x.no === turnSpark.step);
  if (!st) return null;
  const color = spark.levels[sparkLevelOf(st.no)].color;
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!onOpen}
      className="w-full rounded-xl border px-3 py-2.5 text-left text-[12.5px] leading-relaxed disabled:cursor-default"
      style={{ borderColor: `${color}66`, background: `${color}14` }}
    >
      <span className="flex items-center gap-1.5 text-[11px] font-extrabold" style={{ color }}>
        {st.emoji} {st.no}단계 · {st.name}
        {turnSpark.fills && <span className="rounded-full px-1.5 py-0.5 text-[10px]" style={{ background: `${color}2e` }}>✅ 이 답으로 칸이 찼어</span>}
      </span>
      <span className="mt-1 block">
        <b className="text-ink">지금</b> — {turnSpark.now}
      </span>
      <span className="mt-0.5 block text-sub">
        <b className="text-clay">다음</b> — {turnSpark.next}
      </span>
    </button>
  );
}
