"use client";

import { useEffect, useState } from "react";
import data from "@/data/onboarding.json";
import { createProject } from "@/lib/actions";
import { write } from "@/lib/db";
import Buddy from "./Buddy";
import OnboardingScene, { type SceneEvent } from "./OnboardingScene";

const INTRO = data.steps.length;

// 설명을 타자 치듯 찍는다. 자리를 미리 잡아 둬서 글이 늘어나도 화면이 밀리지 않는다
function Typed({ text }: { text: string }) {
  const plain = text.replaceAll("**", "");
  const [n, setN] = useState(() => (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? plain.length : 0));
  useEffect(() => {
    if (n >= plain.length) return;
    const id = setTimeout(() => setN(n + 1), n === 0 ? 700 : 26);
    return () => clearTimeout(id);
  }, [n, plain.length]);

  const segs = text.split("**");
  const parts = segs.map((t, i) => {
    const before = segs.slice(0, i).reduce((sum, x) => sum + x.length, 0);
    const cut = t.slice(0, Math.max(0, n - before));
    return i % 2 ? cut && <mark key={i} className="hl" style={{ animationDelay: "0s" }}>{cut}</mark> : cut;
  });
  return (
    <div className="relative mx-auto mt-3 max-w-[250px] text-[14px] leading-[1.75] text-sub [word-break:keep-all]">
      <p className="invisible" aria-hidden>{plain}</p>
      <p className="absolute inset-0" aria-label={plain}>
        {parts}
        {n < plain.length && <span className="ob-caret" />}
      </p>
    </div>
  );
}

// **굵게** 로 감싼 말에 형광펜을 긋는다
function marked(text: string) {
  return text.split("**").map((t, i) => (i % 2 ? <mark key={i} className="hl" style={{ animationDelay: `${0.4 + i * 0.12}s` }}>{t}</mark> : t));
}

export default function Onboarding({ hasProfile, onDone, onDemo }: { hasProfile: boolean; onDone: () => void; onDemo: () => void }) {
  const [step, setStep] = useState(0);
  const [up, setUp] = useState(false); // 앞으로 넘어갈 때만 레벨업 효과
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("중3");
  const [interests, setInterests] = useState<string[]>([]);
  const [project, setProject] = useState("");
  const [desc, setDesc] = useState("");

  const finish = (free: boolean) => {
    write("profile", { name: name.trim() || "친구", grade, interests, createdAt: Date.now() });
    if (free || !project.trim()) createProject({ name: "자유 질문", desc: "", emoji: "💬", packs: [] });
    else createProject({ name: project.trim(), desc: desc.trim(), emoji: "🌱", packs: [] });
    onDone();
  };

  const input = "w-full rounded-xl border border-line bg-card px-4 py-3.5 text-[15px] outline-none focus:border-clay";
  const primary = "w-full rounded-2xl bg-ink py-3.5 text-[15px] font-bold text-paper active:opacity-80 disabled:opacity-30";

  const intro = data.steps[step];
  const last = step === INTRO - 1;
  const lv = Math.min(step + 1, INTRO);
  const buddy = data.buddy[lv - 1];
  const go = (next: number) => {
    setUp(next > step);
    setStep(next);
  };

  const next = () => (last && hasProfile ? onDone() : go(step + 1));

  const hud = (
    <div className="flex w-full items-center gap-3 rounded-2xl border border-line bg-card px-3 py-2 text-left">
      <div className="relative">
        <div key={lv} className={step > 0 ? "ob-pop" : undefined}>
          <Buddy level={lv} size={52} />
        </div>
        {up && intro && (
          <>
            <span key={`f${lv}`} className="ob-flash pointer-events-none absolute inset-0 rounded-full border-2 border-[#ffd98a]" />
            <span key={`u${lv}`} className="ob-levelup pointer-events-none absolute -top-4 left-1/2 -ml-9 w-[72px] rounded-full bg-ink py-0.5 text-center text-[10px] font-extrabold">LEVEL UP!</span>
          </>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-extrabold">
          <span className="text-gold">Lv.{lv}</span> {buddy.name}
        </p>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
          <div className="ob-xp xp h-full rounded-full" style={{ width: `${(lv / INTRO) * 100}%` }} />
        </div>
        <p key={lv} className="rise mt-1.5 truncate text-[11px] text-sub">{intro ? buddy.say : "이제 네 차례야. 알려 줘!"}</p>
      </div>
    </div>
  );

  return (
    <>
      {/* 배경을 가라앉혀서 한 화면에 한 가지만 보이게 한다 */}
      <div className="pointer-events-none absolute inset-0 -z-[1] bg-[#05041a]/90" />
      <div className="scroll flex flex-1 flex-col px-7 pb-[max(28px,env(safe-area-inset-bottom))] pt-8">
        <div className="mb-6 grid grid-cols-[1fr_auto_1fr] items-center">
          <button type="button" className={`justify-self-start text-xs font-semibold text-sub ${step === 0 ? "invisible" : ""}`} onClick={() => go(step - 1)}>
            ‹ 이전
          </button>
          <div className="flex gap-1.5">
            {Array.from({ length: hasProfile ? INTRO : INTRO + 2 }, (_, i) => (
              <span key={i} className={`h-1 rounded-full transition-all duration-300 ${i === step ? "w-7 bg-clay" : "w-3.5 bg-line"}`} />
            ))}
          </div>
          <button type="button" className={`justify-self-end text-xs font-semibold text-sub ${intro && !last ? "" : "invisible"}`} onClick={() => go(INTRO - 1)}>
            건너뛰기
          </button>
        </div>

        {!intro && <div className="mb-8">{hud}</div>}

        {intro && (
          <div
            key={step}
            className={`flex flex-1 flex-col items-center text-center ${last ? "" : "cursor-pointer"}`}
            {...(last ? {} : { role: "button", tabIndex: 0, onClick: next, onKeyDown: (e: React.KeyboardEvent) => (e.key === "Enter" || e.key === " ") && next() })}
          >
            <div className="rise relative w-full">
              <div className="pointer-events-none absolute inset-x-0 top-1/4 h-1/2 rounded-full bg-gradient-to-r from-[#2f6bff] to-[#ff3d9a] opacity-40 blur-3xl" />
              <div className="relative">
                <OnboardingScene events={intro.scene as SceneEvent[]} level={lv} />
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2.5">
              <p className="ob-pop bg-gradient-to-r from-[#5c9dff] via-[#c08bff] to-[#ff5fb0] bg-clip-text text-[38px] font-black leading-tight tracking-tight text-transparent" style={{ animationDelay: "0.15s" }}>
                {intro.word}
              </p>
              {intro.core && <span className="ob-badge rounded-full bg-ink px-2 py-0.5 text-[10px] font-extrabold">★ 핵심</span>}
            </div>
            <h1 className="rise mx-auto mt-1.5 max-w-[260px] text-xl font-extrabold leading-snug [word-break:keep-all]" style={{ animationDelay: "0.3s" }}>{marked(intro.title)}</h1>
            <Typed text={intro.desc} />

            <ul className="mt-5 flex flex-wrap justify-center gap-2">
              {intro.stats.map((st, i) => (
                <li key={i} className="ob-pop flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-xs" style={{ animationDelay: `${0.6 + i * 0.15}s` }}>
                  <span>{st.icon}</span>
                  <b>{st.value}</b>
                  {st.label && <span className="text-sub">{st.label}</span>}
                </li>
              ))}
            </ul>

            <div className="mt-auto w-full space-y-3.5 pt-6">
              {hud}
              {last ? (
                <div className="space-y-2.5">
                  <button type="button" className={primary} onClick={next}>
                    {hasProfile ? "시작하기" : "좋아, 시작할게"}
                  </button>
                  <button type="button" className="w-full rounded-2xl border border-clay py-3 text-sm font-bold text-clay" onClick={onDemo}>
                    📂 예시 프로젝트 먼저 보기 — 한꺼번에 펼쳐져
                  </button>
                </div>
              ) : (
                <span className="mx-auto flex w-fit items-center gap-2 rounded-full border border-line bg-card px-5 py-2.5 text-sm font-semibold">
                  <span className="dot" /> 탭하여 계속
                </span>
              )}
            </div>
          </div>
        )}

      {step === INTRO && (
        <div className="rise flex flex-1 flex-col">
          <h1 className="text-2xl font-extrabold tracking-tight">뭐라고 부를까?</h1>
          <input className={`${input} mt-7`} placeholder="이름이나 별명" value={name} onChange={(e) => setName(e.target.value)} maxLength={12} />
          <p className="mb-3 mt-9 text-sm font-bold">몇 학년이야?</p>
          <div className="flex flex-wrap gap-2.5">
            {data.grades.map((g) => (
              <button key={g} type="button" onClick={() => setGrade(g)} className={`rounded-full border px-4 py-2 text-sm ${grade === g ? "border-ink bg-ink text-paper" : "border-line bg-card"}`}>
                {g}
              </button>
            ))}
          </div>
          <p className="mb-3 mt-9 text-sm font-bold">요즘 뭘 만들어? <span className="font-normal text-sub">(여러 개)</span></p>
          <div className="flex flex-wrap gap-2.5">
            {data.interests.map((g) => {
              const on = interests.includes(g);
              return (
                <button key={g} type="button" onClick={() => setInterests(on ? interests.filter((x) => x !== g) : [...interests, g])} className={`rounded-full border px-4 py-2 text-sm ${on ? "border-clay bg-clay-soft text-clay" : "border-line bg-card"}`}>
                  {on ? "✓ " : ""}
                  {g}
                </button>
              );
            })}
          </div>
          <p className="mt-6 text-xs leading-relaxed text-sub">학년과 관심사는 말의 높이와 예시를 고르는 데만 써. 평가에는 쓰지 않아.</p>
          <div className="mt-auto pt-10">
            <button type="button" className={primary} onClick={() => setStep(INTRO + 1)}>
              다음
            </button>
          </div>
        </div>
      )}

      {step === INTRO + 1 && (
        <div className="rise flex flex-1 flex-col">
          <h1 className="text-2xl font-extrabold tracking-tight">지금 만들고 있는 게 있어?</h1>
          <input className={`${input} mt-7`} placeholder="예: 스마트 화분" value={project} onChange={(e) => setProject(e.target.value)} maxLength={24} />
          <p className="mb-3 mt-9 text-sm font-bold">한 줄로 설명하면? <span className="font-normal text-sub">(선택)</span></p>
          <input className={input} placeholder="예: 상추 화분 자동 급수" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={40} />
          <div className="mt-auto space-y-3 pt-10">
            <button type="button" className={primary} disabled={!project.trim()} onClick={() => finish(false)}>
              시작하기
            </button>
            <button type="button" className="w-full py-3 text-sm font-semibold text-sub" onClick={() => finish(true)}>
              아직 없어, 그냥 물어볼래
            </button>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
