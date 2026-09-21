"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./demo.css";
import ChatTurn from "./ChatTurn";
import DeepView from "./DeepView";
import DemoMarkdown from "./DemoMarkdown";
import PlanView from "./PlanView";
import ReportView from "./ReportView";
import ReverseQuestionBubble from "./ReverseQuestionBubble";
import { answerMarkdown, extrasOrder, planMarkdown, type ChipKind, type Guide, type Phase, type RoleKey, type RqRecord, type Scenario } from "./types";

type PrimaryKind =
  | "closeReport" | "deepNext" | "deepDeeper" | "saveNote" | "start" | "chip" | "send" | "option"
  | "hint" | "demoAnswer" | "continue" | "lens" | "pickLens" | "openReport" | "reset";

interface Primary {
  kind: PrimaryKind;
  label: string;
}

export default function DemoPlayer({ scenario }: { scenario: Scenario }) {
  const { turns } = scenario;
  const name = scenario.student.name;
  const scenes = [...turns.map((t) => t.scene), "🔭 심화", "📄 10문 리포트"];
  // 기본은 '한꺼번에' — 질문 · 답 · 역질문의 답까지 전부 펼친 채로 연다. [한 걸음씩]은 고를 때만.
  const allRecords = (): Record<number, RqRecord> =>
    Object.fromEntries(
      turns.flatMap((t, i) => {
        const q = t.reverseQuestion;
        if (!q) return [];
        const opt = q.form === "F1" ? q.options?.[q.demoOptionIndex ?? 0] : undefined;
        const hint = q.demoUsesHint ? 1 : 0;
        const rec: RqRecord = opt
          ? { status: opt.dontKnow ? "dontknow" : "answered", score: opt.score, hintStage: 0, answer: opt.label, feedback: opt.feedback }
          : { status: "answered", score: q.demoScore ?? (hint ? 1 : 2), hintStage: hint, answer: q.demoAnswer, feedback: q.demoFeedback };
        return [[i, rec]];
      }),
    );
  const [mode, setMode] = useState<"all" | "step">("all");
  const [turnIndex, setTurnIndex] = useState(turns.length - 1);
  const [phase, setPhase] = useState<Phase>("afterTurns");
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [chipUsed, setChipUsed] = useState(false);
  const [streamLen, setStreamLen] = useState(0);
  const [extras, setExtras] = useState(0);
  const [records, setRecords] = useState<Record<number, RqRecord>>(allRecords);
  const [hintStage, setHintStage] = useState(0);
  const [rqDraft, setRqDraft] = useState("");
  const [rqBusy, setRqBusy] = useState(false);
  const [view, setView] = useState<"chat" | "deep" | "report">("chat");
  const [planOpen, setPlanOpen] = useState(false);
  const [lensOpen, setLensOpen] = useState(false);
  const [deepStep, setDeepStep] = useState(1);
  const [deepDone, setDeepDone] = useState(false);
  const [reportSeen, setReportSeen] = useState(false);
  const [sheetRole, setSheetRole] = useState<RoleKey | null>(null);
  const [autoplay, setAutoplay] = useState(false);

  // ── 타이머: 서버가 없으니 스트리밍·타이핑을 전부 여기서 흉내 낸다 ──
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const later = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  }, []);
  const every = useCallback((fn: (stop: () => void) => void, ms: number) => {
    const id = setInterval(() => fn(stop), ms);
    const stop = () => {
      clearInterval(id);
      timers.current.delete(id);
    };
    timers.current.add(id);
  }, []);
  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => clearTimeout(id));
    timers.current.clear();
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  const typeInto = (set: (s: string) => void, text: string, onDone: () => void, ms = 28) => {
    let n = 0;
    every((stop) => {
      n += 1;
      set(text.slice(0, n));
      if (n >= text.length) {
        stop();
        onDone();
      }
    }, ms);
  };

  // ── 한 턴의 흐름: 질문 → (분석) → 답 스트리밍 → 부가물 → 역질문 → 피드백 ──
  const goAsk = (i: number) => {
    setTurnIndex(i);
    setPhase("ask");
    setDraft("");
    setChipUsed(false);
    setStreamLen(0);
    setExtras(0);
    setHintStage(0);
    setRqDraft("");
    if (!turns[i].fromChip) {
      setTyping(true);
      later(() => typeInto(setDraft, turns[i].question, () => setTyping(false)), 500);
    }
  };

  const next = (i: number) => (i + 1 < turns.length ? goAsk(i + 1) : setPhase("afterTurns"));

  const tapChip = (i: number) => {
    const t = turns[i];
    if (!t.fromChip) return;
    setChipUsed(true);
    setTyping(true);
    // 칩은 전송하지 않는다. 초안을 채우고, ___ 는 학생이 채운다.
    typeInto(setDraft, t.fromChip.draft, () =>
      later(() => {
        setDraft(t.question);
        setTyping(false);
      }, 1400),
    );
  };

  const extrasCount = (i: number) => extrasOrder(turns[i]).length;

  const send = (i: number) => {
    setDraft("");
    setPhase("thinking");
    later(() => {
      setPhase("streaming");
      const total = answerMarkdown(turns[i]).length;
      let n = 0;
      every((stop) => {
        n += 6;
        setStreamLen(Math.min(n, total));
        if (n < total) return;
        stop();
        // 답이 끝난 뒤에야 배지 · 칩 · 카드가 하나씩 붙는다
        setPhase("extras");
        let k = 0;
        every((stopExtras) => {
          k += 1;
          setExtras(k);
          if (k < extrasCount(i)) return;
          stopExtras();
          later(() => (turns[i].reverseQuestion ? setPhase("rq") : next(i)), 900);
        }, 320);
      }, 16);
    }, 800);
  };

  const resolveRq = (i: number, record: RqRecord) => {
    setRecords((r) => ({ ...r, [i]: record }));
    if (record.status === "later") {
      setPhase("extras");
      later(() => next(i), 1100);
    } else {
      setPhase("feedback");
    }
  };

  const demoAnswer = (i: number) => {
    const rq = turns[i].reverseQuestion;
    if (!rq?.demoAnswer) return;
    const usedHint = hintStage;
    setRqBusy(true);
    typeInto(
      setRqDraft,
      rq.demoAnswer,
      () =>
        later(() => {
          setRqBusy(false);
          resolveRq(i, {
            status: "answered",
            score: usedHint > 0 ? 1 : 2,
            hintStage: usedHint,
            answer: rq.demoAnswer,
            feedback: rq.demoFeedback,
          });
        }, 500),
      40,
    );
  };

  const pickOption = (i: number, index: number) => {
    const opt = turns[i].reverseQuestion?.options?.[index];
    if (!opt) return;
    resolveRq(i, {
      status: opt.dontKnow ? "dontknow" : "answered",
      score: hintStage > 0 ? Math.min(opt.score, 1) : opt.score,
      hintStage,
      answer: opt.label,
      feedback: opt.feedback,
    });
  };

  const dontKnow = (i: number) =>
    resolveRq(i, { status: "dontknow", score: 0, hintStage, feedback: turns[i].reverseQuestion?.dontKnowFeedback });

  const showAll = () => {
    reset();
    setMode("all");
    setTurnIndex(turns.length - 1);
    setPhase("afterTurns");
    setRecords(allRecords());
  };

  const reset = () => {
    clearTimers();
    setMode("step");
    setTurnIndex(0);
    setPhase("intro");
    setDraft("");
    setTyping(false);
    setChipUsed(false);
    setStreamLen(0);
    setExtras(0);
    setRecords({});
    setHintStage(0);
    setRqDraft("");
    setRqBusy(false);
    setView("chat");
    setPlanOpen(false);
    setLensOpen(false);
    setDeepStep(1);
    setDeepDone(false);
    setReportSeen(false);
    setSheetRole(null);
    setAutoplay(false);
  };

  const openReport = () => setView("report");
  const closeReport = () => {
    setView("chat");
    setReportSeen(true);
  };
  const saveNote = () => {
    setDeepDone(true);
    setLensOpen(false);
    setView("chat");
  };

  // ── 지금 상태에서 '다음에 누를 것' 하나 — 가이드의 [다음 ▶]과 자동 시연이 이걸 누른다 ──
  const turn = turns[turnIndex];
  const rq = turn.reverseQuestion;
  const demoLens = scenario.deep.lenses.find((l) => l.key === scenario.deep.demoLens) ?? scenario.deep.lenses[0];
  let primary: Primary | null = null;
  if (view === "report") primary = { kind: "closeReport", label: "리포트 닫기" };
  else if (view === "deep") {
    if (deepStep === 1 || deepStep === 3) primary = { kind: "deepNext", label: `${name}의 생각 보내기` };
    else if (deepStep === 2) primary = { kind: "deepDeeper", label: "[한 단 더 깊이] 누르기" };
    else primary = { kind: "saveNote", label: "📌 생각 노트에 담기" };
  } else if (phase === "intro") primary = { kind: "start", label: "시연 시작" };
  else if (phase === "ask") {
    if (turn.fromChip && !chipUsed) primary = { kind: "chip", label: `${scenario.chips[turn.fromChip.kind].emoji} ${scenario.chips[turn.fromChip.kind].label} 칩 누르기` };
    else if (!typing && draft) primary = { kind: "send", label: "➤ 질문 보내기" };
  } else if (phase === "rq" && rq && !rqBusy) {
    if (rq.form === "F1") primary = { kind: "option", label: `"${rq.options?.[rq.demoOptionIndex ?? 0].label}" 고르기` };
    else if (rq.demoUsesHint && hintStage === 0) primary = { kind: "hint", label: "💡 [힌트 줘] 누르기" };
    else primary = { kind: "demoAnswer", label: `${name}의 답 써서 보내기` };
  } else if (phase === "feedback") primary = { kind: "continue", label: "[하던 거 계속] 누르기" };
  else if (phase === "afterTurns") {
    if (!deepDone && !lensOpen) primary = { kind: "lens", label: "🔭 심화 누르기" };
    else if (!deepDone) primary = { kind: "pickLens", label: `${demoLens.emoji} ${demoLens.label} 고르기` };
    else if (!reportSeen) primary = { kind: "openReport", label: "📄 리포트 칩 누르기" };
    else primary = { kind: "reset", label: "↺ 처음부터 다시" };
  }
  const primaryKind = primary?.kind ?? null;

  const runPrimary = (kind: PrimaryKind) => {
    const actions: Record<PrimaryKind, () => void> = {
      closeReport,
      deepNext: () => setDeepStep((step) => step + 1),
      deepDeeper: () => setDeepStep(3),
      saveNote,
      start: () => goAsk(0),
      chip: () => tapChip(turnIndex),
      send: () => send(turnIndex),
      option: () => pickOption(turnIndex, rq?.demoOptionIndex ?? 0),
      hint: () => setHintStage(1),
      demoAnswer: () => demoAnswer(turnIndex),
      continue: () => next(turnIndex),
      lens: () => setLensOpen(true),
      pickLens: () => setView("deep"),
      openReport,
      reset,
    };
    actions[kind]();
  };

  // 자동 시연 — 리포트는 읽을 시간을 주려고 자동으로 닫지 않고, 마지막의 '처음부터 다시'도 누르지 않는다
  const autoRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    autoRef.current = primaryKind && primaryKind !== "reset" && primaryKind !== "closeReport" ? () => runPrimary(primaryKind) : null;
  });
  const primaryKey = [view, phase, turnIndex, chipUsed, typing, Boolean(draft), hintStage, rqBusy, lensOpen, deepStep, deepDone, reportSeen].join("|");
  useEffect(() => {
    if (!autoplay) return;
    const id = setTimeout(() => autoRef.current?.(), 3600);
    return () => clearTimeout(id);
  }, [autoplay, primaryKey]);

  // ── 가이드 문구 ──
  let guide: Guide | undefined;
  if (view === "report") guide = scenario.guides.report;
  else if (view === "deep") guide = scenario.guides[`deep${deepStep}`];
  else if (phase === "intro") guide = scenario.guides.intro;
  else if (phase === "ask") guide = turn.guide.ask;
  else if (phase === "rq") guide = (hintStage > 0 && turn.guide.hint) || turn.guide.rq;
  else if (phase === "feedback") guide = turn.guide.feedback;
  else if (phase === "afterTurns")
    guide = reportSeen ? scenario.guides.done : deepDone ? scenario.guides.afterDeep : lensOpen ? scenario.guides.lens : (mode === "all" && scenario.guides.all) || scenario.guides.afterTurns;
  else guide = records[turnIndex] ? turn.guide.feedback : turn.guide.answer;
  guide = guide ?? scenario.guides.afterTurns;

  // ── 마디 점 · 판 막대 ──
  const sentCount = phase === "intro" || phase === "ask" ? turnIndex : phase === "afterTurns" ? turns.length : turnIndex + 1;
  let barPos = 0;
  for (let i = 0; i < sentCount; i++) {
    barPos += 1;
    if (turns[i].reverseQuestion && records[i]) barPos = 0;
  }
  const asked = scenario.window.startCount + sentCount;
  const windowCount = asked > scenario.window.size ? asked - scenario.window.size : asked; // 10개가 차면 리포트 1장, 그다음은 새 판
  const reviewBox = Object.values(records).filter((r) => r.status === "later" || (r.score ?? 0) <= 1).length;
  const scene = phase === "afterTurns" ? turns.length + (deepDone ? 1 : 0) : turnIndex;
  const stageNow = phase === "intro" ? -1 : turn.stage;
  // 기획서.md — 답이 끝난 턴까지만 쌓인다
  const answeredCount = phase === "intro" || phase === "ask" || phase === "thinking" || phase === "streaming" ? turnIndex : sentCount;
  const planFilled = turns.slice(0, answeredCount).filter((t) => t.plan).length;
  const planTotal = turns.filter((t) => t.plan).length;

  const scrollRef = useRef<HTMLDivElement>(null);
  const landed = useRef(false);
  useEffect(() => {
    const el = scrollRef.current;
    // 한꺼번에 보기는 처음부터 읽는 것 — 첫 화면만 맨 위에서 시작한다
    if (!landed.current) {
      landed.current = true;
      if (el) el.scrollTop = 0;
      return;
    }
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: phase === "streaming" ? "auto" : "smooth" });
  }, [streamLen, extras, phase, turnIndex, hintStage, records, lensOpen]);

  const canSend = phase === "ask" && !typing && Boolean(draft);

  return (
    <div>
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-5 lg:flex-row lg:items-start lg:gap-8 lg:py-8">
        {/* ───────── 가이드 패널 ───────── */}
        <aside className="lg:sticky lg:top-8 lg:w-[420px] lg:shrink-0">
          <div className="text-[12px] font-semibold tracking-wide text-stone-500">ASKBACK · 사용 시연 · <span className="rounded-full border border-dashed border-stone-400 px-1.5 py-px">예시 시나리오</span></div>
          <h1 className="mt-1 text-2xl font-bold">{scenario.meta.title}</h1>
          <p className="text-[13.5px] text-stone-500">{scenario.meta.subtitle}</p>

          <ol className="mt-4 flex flex-wrap gap-1.5 text-[12px]">
            {scenes.map((s, i) => (
              <li
                key={`${i}${s}`}
                className={`rounded-full px-2.5 py-1 ${
                  phase !== "intro" && i === scene ? "bg-stone-800 font-semibold text-white" : phase !== "intro" && i < scene ? "bg-stone-300 text-stone-700" : "bg-white text-stone-400"
                }`}
              >
                {i + 1}. {s}
              </li>
            ))}
          </ol>

          {/* 확장 사다리 — 작게 시작해서 한 단씩 */}
          <div className="mt-3 rounded-2xl border border-stone-200 bg-white px-3 py-2.5">
            <div className="text-[11.5px] font-semibold text-stone-500">🪜 확장 사다리 — 작게 시작해서, 질문으로 한 단씩</div>
            <ol className="mt-1.5 space-y-1">
              {scenario.stages.map((st, i) => (
                <li
                  key={st.label}
                  className={`flex items-baseline gap-2 rounded-lg px-2 py-1 text-[12.5px] ${
                    i === stageNow ? "bg-orange-50 font-semibold text-orange-900" : i < stageNow ? "text-stone-700" : "text-stone-400"
                  }`}
                >
                  <span className="shrink-0">{i < stageNow ? "✅" : st.emoji}</span>
                  <span className="shrink-0">{st.label}</span>
                  <span className={`truncate text-[11.5px] font-normal ${i === stageNow ? "text-orange-800" : "text-stone-400"}`}>{st.desc}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-[16px] font-bold leading-snug">{guide?.title}</h2>
              {guide?.ref && <span className="shrink-0 rounded bg-stone-100 px-1.5 py-0.5 text-[11px] text-stone-500">{guide.ref}</span>}
            </div>
            <div className="mt-2 text-[14px] leading-relaxed text-stone-700">
              <DemoMarkdown>{guide?.body ?? ""}</DemoMarkdown>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                disabled={!primary}
                onClick={() => primaryKind && runPrimary(primaryKind)}
                className="flex-1 rounded-full bg-orange-500 px-4 py-2.5 text-[14px] font-semibold text-white disabled:bg-stone-200 disabled:text-stone-400"
              >
                {primary ? `다음 ▶  ${primary.label}` : "…진행 중"}
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between text-[12.5px] text-stone-500">
              <label className="flex cursor-pointer items-center gap-1.5">
                <input type="checkbox" checked={autoplay} onChange={(e) => setAutoplay(e.target.checked)} />
                자동 시연
              </label>
              <span className="flex gap-3">
                <button onClick={showAll} className="underline underline-offset-2">
                  📜 한꺼번에
                </button>
                <button onClick={reset} className="underline underline-offset-2">
                  ▶ 한 걸음씩
                </button>
              </span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[12px]">
            {[
              ["마디", Array.from({ length: scenario.project.rhythm }, (_, i) => (i < barPos ? "●" : "○")).join("")],
              ["이번 판", `${windowCount}/${scenario.window.size}`],
              ["복기함", `🧺 ${reviewBox}`],
              ["생각 노트", `📌 ${deepDone ? 1 : 0}`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-stone-200 bg-white py-2">
                <div className="text-stone-400">{k}</div>
                <div className="mt-0.5 text-[14px] font-semibold">{v}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setPlanOpen(true)}
            className="mt-2 flex w-full items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-left text-[13px] text-emerald-900"
          >
            <span>📝</span>
            <span className="flex-1 font-semibold">{scenario.planDoc.filename}</span>
            <span className="tabular-nums">
              {planFilled}/{planTotal}칸 ›
            </span>
          </button>
          <p className="mt-3 text-[12px] leading-relaxed text-stone-400">{scenario.meta.note}</p>
        </aside>

        {/* ───────── 폰 ───────── */}
        <div className="mx-auto w-full max-w-[400px] shrink-0">
          <div className="relative flex h-[min(800px,calc(100dvh-2.5rem))] min-h-[560px] flex-col overflow-hidden rounded-[36px] border-[9px] border-stone-900 bg-stone-50 shadow-xl">
            <header className="flex items-center gap-2 border-b border-stone-200 bg-white px-3 pb-2.5 pt-3.5 text-[14.5px]">
              <span className="px-1 text-lg text-stone-400">‹</span>
              <span className="font-semibold">
                {scenario.project.emoji} {scenario.project.name}
              </span>
              <button onClick={() => setPlanOpen(true)} className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[12px] font-semibold text-emerald-900" aria-label="기획서 열기">
                📝 {planFilled}
              </button>
            </header>
            {/* 판 막대 — 다음 리포트까지 */}
            <div className="flex items-center gap-2 bg-white px-3 pb-1.5">
              <div className="h-[3px] flex-1 rounded bg-stone-200">
                <div className="h-[3px] rounded bg-stone-700 transition-all duration-500" style={{ width: `${(windowCount / scenario.window.size) * 100}%` }} />
              </div>
              <span className="text-[11px] tabular-nums text-stone-500">
                {windowCount}/{scenario.window.size}
              </span>
            </div>

            {/* 리포트 도착 칩 — 끼어들지 않는다 */}
            {phase === "afterTurns" && !reportSeen && (
              <button
                onClick={openReport}
                className={`fade-up absolute left-1/2 top-[64px] z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-sky-300 bg-sky-50 px-3.5 py-1.5 text-[12.5px] font-semibold text-sky-900 shadow ${deepDone ? "pulse-ring" : ""}`}
              >
                📄 {scenario.project.name} · {scenario.window.index}번째 리포트 도착
              </button>
            )}

            <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
              {phase === "intro" && (
                <div className="mt-10 text-center text-[13.5px] leading-relaxed text-stone-500">
                  <div className="text-4xl">{scenario.project.emoji}</div>
                  <div className="mt-2 font-semibold text-stone-800">{scenario.project.name}</div>
                  <div>{scenario.project.desc}</div>
                  <div className="mt-4 text-[12.5px]">이번 판에서 이미 질문 {scenario.window.startCount}개를 했어요.</div>
                  <button onClick={() => goAsk(0)} className="pulse-ring mt-5 rounded-full bg-stone-800 px-5 py-2.5 text-[14px] font-semibold text-white">
                    시연 시작
                  </button>
                </div>
              )}

              {turns.map((t, i) => {
                const past = i < turnIndex || phase === "afterTurns";
                const current = i === turnIndex && phase !== "intro" && phase !== "ask" && phase !== "afterTurns";
                if (!past && !current) return null;
                const full = past || phase === "extras" || phase === "rq" || phase === "feedback";
                const nextTurn = turns[i + 1];
                const activeChip: ChipKind | null =
                  phase === "ask" && turnIndex === i + 1 && nextTurn?.fromChip && !chipUsed ? nextTurn.fromChip.kind : null;
                const showRq = t.reverseQuestion && (past || (current && (phase === "rq" || phase === "feedback" || Boolean(records[i]))));
                return (
                  <div key={t.id} className="space-y-3">
                    <ChatTurn
                      turn={t}
                      scenario={scenario}
                      thinking={current && phase === "thinking"}
                      answerText={current && phase === "thinking" ? "" : full ? answerMarkdown(t) : answerMarkdown(t).slice(0, streamLen)}
                      answerDone={full}
                      extrasShown={past || phase === "rq" || phase === "feedback" ? 99 : phase === "extras" ? extras : 0}
                      activeChip={activeChip}
                      onChip={() => tapChip(i + 1)}
                      deepActive={phase === "afterTurns" && i === turns.length - 1 && !deepDone}
                      lensOpen={lensOpen && i === turns.length - 1}
                      deepDone={deepDone && i === turns.length - 1}
                      onDeepToggle={() => setLensOpen((v) => !v)}
                      onLensPick={() => setView("deep")}
                      onRole={setSheetRole}
                      onPlan={() => setPlanOpen(true)}
                    />
                    {showRq && t.reverseQuestion && (
                      <ReverseQuestionBubble
                        rq={t.reverseQuestion}
                        studentName={name}
                        record={records[i]}
                        hintStage={records[i]?.hintStage ?? (current ? hintStage : 0)}
                        draft={current ? rqDraft : ""}
                        busy={rqBusy}
                        canContinue={current && phase === "feedback"}
                        onHint={() => setHintStage((s) => Math.min(s + 1, 3))}
                        onDontKnow={() => dontKnow(i)}
                        onLater={() => resolveRq(i, { status: "later", score: null, hintStage })}
                        onOption={(index) => pickOption(i, index)}
                        onDemoAnswer={() => demoAnswer(i)}
                        onContinue={() => next(i)}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* 입력창 — 왼쪽의 마디 점이 다음 역질문을 예고한다 */}
            <div className="flex items-end gap-2 border-t border-stone-200 bg-white px-3 py-2.5">
              <span className="pb-2 text-[13px] tracking-tight text-stone-500" title="질문 2번마다 역질문 1번">
                {Array.from({ length: scenario.project.rhythm }, (_, i) => (i < barPos ? "●" : "○")).join("")}
              </span>
              <div className="min-h-[40px] flex-1 rounded-2xl bg-stone-100 px-3.5 py-2.5 text-[14px] leading-snug">
                {draft ? (
                  draft.split("___").map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && <span className="mx-0.5 rounded bg-orange-200 px-1 text-orange-900">___</span>}
                    </span>
                  ))
                ) : (
                  <span className="text-stone-400">무엇이든 물어봐</span>
                )}
                {typing && <span className="caret" />}
              </div>
              <button
                disabled={!canSend}
                onClick={() => send(turnIndex)}
                aria-label="보내기"
                className={`h-10 w-10 shrink-0 rounded-full text-white ${canSend ? "pulse-ring bg-stone-800" : "bg-stone-300"}`}
              >
                ➤
              </button>
            </div>

            {view === "deep" && (
              <DeepView
                scenario={scenario}
                step={deepStep}
                onStudentAnswer={() => setDeepStep((s) => s + 1)}
                onDeeper={() => setDeepStep(3)}
                onSaveNote={saveNote}
                onClose={() => setView("chat")}
              />
            )}
            {view === "report" && <ReportView scenario={scenario} records={records} onClose={closeReport} />}
            {planOpen && (
              <PlanView
                filename={scenario.planDoc.filename}
                markdown={planMarkdown(scenario, answeredCount)}
                filled={planFilled}
                total={planTotal}
                onClose={() => setPlanOpen(false)}
              />
            )}

            {/* 역할 배지 설명 — 바텀시트 */}
            {sheetRole && (
              <div className="absolute inset-0 z-30 flex items-end bg-black/30" onClick={() => setSheetRole(null)}>
                <div className="fade-up w-full rounded-t-[20px] bg-white px-4 pb-6 pt-4 text-[13.5px]" onClick={(e) => e.stopPropagation()}>
                  <div className="mx-auto mb-3 h-1 w-10 rounded bg-stone-300" />
                  <div className="font-semibold">
                    이번 답에서 나는 {scenario.roles[sheetRole].emoji} {scenario.roles[sheetRole].label}로 일했어
                  </div>
                  <div className="mt-3 space-y-1">
                    {(Object.keys(scenario.roles) as RoleKey[]).map((key) => (
                      <div
                        key={key}
                        className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 ${key === sheetRole ? "font-semibold" : "text-stone-500"}`}
                        style={key === sheetRole ? { background: scenario.roles[key].color } : undefined}
                      >
                        <span className="w-24">
                          {key === sheetRole ? "▶ " : ""}
                          {scenario.roles[key].emoji} {scenario.roles[key].label}
                        </span>
                        <span>{scenario.roles[key].desc}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-stone-600">어느 게 더 좋은 건 아니야. 지금 필요한 걸 고르면 돼.</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
