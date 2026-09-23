"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import data from "@/data/onboarding.json";
import flowSpec from "@/data/flow.json"; // 다섯 칸의 원본은 docs/다섯칸.md
import { createProject } from "@/lib/actions";
import { write } from "@/lib/db";
import Buddy from "./Buddy";
import IntroArt from "./IntroArt";
import OnboardingScene, { type SceneEvent } from "./OnboardingScene";
import { AstroKid } from "./Art";
import { GRADE_TONE, GradeArt, INTEREST_TONE, InterestArt, ProjectPlanet } from "./ProfileArt";

// 인트로 한 칸 — 대본은 data/onboarding.json, 아래쪽 요약 그림은 art 가 고른다
type IntroStep = {
  core: boolean;
  coreTag?: string;
  word: string;
  caption: string;
  art: string;
  title: string;
  desc: string;
  why: { head: string; text: string };
  stats: { icon: string; value: string; label: string }[];
  scene: SceneEvent[];
};
const STEPS = data.steps as unknown as IntroStep[];
const INTRO = STEPS.length;

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
  // 자리잡이도 같은 마크업 — 형광펜은 줄바꿈이 안 되니, 글자만 흘리면 높이가 어긋난다
  const full = segs.map((t, i) => (i % 2 ? <mark key={i} className="hl">{t}</mark> : t));
  return (
    <div className="relative mx-auto mt-1.5 max-w-[300px] text-[12.5px] leading-[1.65] text-sub [word-break:keep-all]">
      <p className="invisible" aria-hidden>{full}</p>
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
  const [emoji, setEmoji] = useState("🌱");
  const [say, setSay] = useState(data.profileSay.start); // 별이가 방금 고른 것에 맞장구친다

  const finish = (free: boolean) => {
    write("profile", { name: name.trim() || "친구", grade, interests, createdAt: Date.now() });
    if (free || !project.trim()) createProject({ name: "자유 질문", desc: "", emoji: "💬", packs: [] });
    else createProject({ name: project.trim(), desc: desc.trim(), emoji, packs: [] });
    onDone();
  };

  const input = "w-full rounded-xl border border-line bg-card px-4 py-3.5 text-[15px] outline-none focus:border-clay";
  const primary = "w-full rounded-2xl bg-ink py-3.5 text-[15px] font-bold text-paper active:opacity-80 disabled:opacity-30";

  const intro = STEPS[step];
  const last = step === INTRO - 1;
  const lv = Math.min(step + 1, INTRO);
  const buddy = data.buddy[lv - 1];
  const go = (next: number) => {
    setUp(next > step);
    setStep(next);
  };

  const ps = data.profileSay;
  const heroSay = step === INTRO ? say : project.trim() ? ps.projectNamed.replace("{name}", project.trim()) : ps.project;

  const next = () => (last && hasProfile ? onDone() : go(step + 1));

  const hud = (
    <div className="flex w-full items-center gap-2.5 rounded-2xl border border-line bg-card px-3 py-1.5 text-left">
      <div className="relative">
        <div key={lv} className={step > 0 ? "ob-pop" : undefined}>
          <Buddy level={lv} size={intro ? 44 : 52} />
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
      <div className={`scroll flex min-h-0 flex-1 flex-col px-7 ${intro ? "pb-[max(14px,env(safe-area-inset-bottom))] pt-5" : "pb-[max(28px,env(safe-area-inset-bottom))] pt-8"}`}>
        <div className={`grid grid-cols-[1fr_auto_1fr] items-center ${intro ? "mb-3" : "mb-6"}`}>
          {step === 0 ? (
            <Link href="/about" className="justify-self-start text-xs font-semibold text-clay">✨ 소개</Link>
          ) : (
            <button type="button" className="justify-self-start text-xs font-semibold text-sub" onClick={() => go(step - 1)}>
              ‹ 이전
            </button>
          )}
          <div className="flex gap-1.5">
            {Array.from({ length: hasProfile ? INTRO : INTRO + 2 }, (_, i) => (
              <span key={i} className={`h-1 rounded-full transition-all duration-300 ${i === step ? "w-7 bg-clay" : "w-3.5 bg-line"}`} />
            ))}
          </div>
          <button type="button" className={`justify-self-end text-xs font-semibold text-sub ${intro && !last ? "" : "invisible"}`} onClick={() => go(INTRO - 1)}>
            건너뛰기
          </button>
        </div>

        {!intro && (
          <div className="mb-6 flex items-end gap-1.5">
            <Buddy level={lv} size={84} />
            <div className="mb-2 min-w-0 flex-1 rounded-[8px_22px_22px_22px] border-[1.5px] border-line bg-card px-4 py-3">
              <p className="truncate text-[11px] font-extrabold text-sub">
                <span className="text-gold">Lv.{lv}</span> {buddy.name}
              </p>
              <p key={heroSay} className="rise mt-0.5 text-[15px] font-bold leading-snug [word-break:keep-all]">{heroSay}</p>
            </div>
          </div>
        )}

        {intro && (
          <div
            key={step}
            className={`flex min-h-0 flex-1 flex-col items-center text-center ${last ? "" : "cursor-pointer"}`}
            {...(last ? {} : { role: "button", tabIndex: 0, onClick: next, onKeyDown: (e: React.KeyboardEvent) => (e.key === "Enter" || e.key === " ") && next() })}
          >
            {/* 실전 화면 — 남는 높이를 요약과 나눠 갖는다 (한 화면 안에 끝나게) */}
            <div className="rise relative w-full min-h-[118px] flex-[1.4]">
              <div className="pointer-events-none absolute inset-x-0 top-1/4 h-1/2 rounded-full bg-gradient-to-r from-[#2f6bff] to-[#ff3d9a] opacity-40 blur-3xl" />
              <div className="relative h-full"><OnboardingScene events={intro.scene} level={lv} /></div>
            </div>

            <p className="rise mt-2.5 text-[10px] font-extrabold tracking-[0.08em] text-sub" style={{ animationDelay: "0.1s" }}>{intro.caption}</p>
            <div className="flex items-center gap-2">
              <p className="ob-pop bg-gradient-to-r from-[#5c9dff] via-[#c08bff] to-[#ff5fb0] bg-clip-text text-[26px] font-black leading-tight tracking-tight text-transparent" style={{ animationDelay: "0.15s" }}>
                {intro.word}
              </p>
              {intro.core && <span className="ob-badge rounded-full bg-ink px-2 py-0.5 text-[10px] font-extrabold">★ {intro.coreTag ?? "핵심"}</span>}
            </div>
            <h1 className="rise mx-auto mt-0.5 max-w-[300px] text-[17px] font-extrabold leading-snug [word-break:keep-all]" style={{ animationDelay: "0.3s" }}>{marked(intro.title)}</h1>
            <Typed text={intro.desc} />

            {/* 요약 자리 — 첫 칸은 앞으로 지나갈 다섯 칸, 나머지는 그 칸이 하는 일 한 장 (/about 과 같은 순서) */}
            <div className="rise mx-auto mt-2.5 w-full max-w-[330px]" style={{ animationDelay: "0.5s" }}>
              {step === 0 ? (
                <>
                  <p className="text-[10px] font-extrabold text-sub">{data.flow.label}</p>
                  <ol className="mt-1.5 grid grid-cols-5 gap-1">
                    {flowSpec.steps.map((f) => (
                      <li key={f.no} className={`flex flex-col items-center gap-0.5 rounded-xl border px-1 py-1.5 ${f.core ? "border-gold bg-ink/40" : "border-line bg-card"}`}>
                        <span className="text-[12px]" aria-hidden>{f.emoji}</span>
                        <span className={`text-[9px] font-extrabold leading-tight [word-break:keep-all] ${f.core ? "text-gold" : "text-sub"}`}>{f.appLabel}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-1.5 text-[10px] font-bold text-gold">★ {data.flow.note}</p>
                </>
              ) : (
                <IntroArt kind={intro.art} />
              )}
            </div>

            <ul className="mt-2 flex flex-wrap justify-center gap-1.5">
              {intro.stats.map((st, i) => (
                <li key={i} className="ob-pop flex items-center gap-1 rounded-full border border-line bg-card px-2.5 py-0.5 text-[11px]" style={{ animationDelay: `${0.6 + i * 0.15}s` }}>
                  <span>{st.icon}</span>
                  <b>{st.value}</b>
                  {st.label && <span className="text-sub">{st.label}</span>}
                </li>
              ))}
            </ul>

            {/* 왜 중요한지 — 이 한 줄이 이 칸의 이유다 */}
            <div className={`rise mx-auto mt-2 w-full max-w-[330px] rounded-2xl border px-3 py-1.5 text-left ${intro.core ? "border-gold bg-amber-soft" : "border-line bg-card"}`} style={{ animationDelay: "0.7s" }}>
              <p className="text-[10px] font-extrabold text-gold">💡 {intro.why.head}</p>
              <p className="mt-0.5 text-[11.5px] leading-[1.6] [word-break:keep-all]">{marked(intro.why.text)}</p>
            </div>

            <div className="mt-auto w-full space-y-2 pt-2">
              {hud}
              {last ? (
                <div className="space-y-2">
                  <button type="button" className={primary} onClick={next}>
                    {hasProfile ? "시작하기" : "좋아, 시작할게"}
                  </button>
                  <button type="button" className="w-full rounded-2xl border border-clay py-2.5 text-[13px] font-bold text-clay" onClick={onDemo}>
                    📂 예시 프로젝트 먼저 보기 — 한꺼번에 펼쳐져
                  </button>
                </div>
              ) : (
                <span className="mx-auto flex w-fit items-center gap-2 rounded-full border border-line bg-card px-4 py-1.5 text-[13px] font-semibold">
                  <span className="dot" /> 탭하여 계속
                </span>
              )}
            </div>
          </div>
        )}

      {step === INTRO && (
        <div className="rise flex flex-1 flex-col">
          <h1 className="text-2xl font-extrabold tracking-tight">뭐라고 부를까?</h1>
          <div className="mt-5 flex items-center gap-3">
            <span className={`tile h-[54px] w-[54px] ${name.trim() ? "on" : ""}`}>
              <AstroKid size={40} />
            </span>
            <input
              className={input}
              placeholder="이름이나 별명"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSay(e.target.value.trim() ? ps.name.replace("{name}", e.target.value.trim()) : ps.start);
              }}
              maxLength={12}
            />
          </div>

          <p className="mb-3 mt-8 text-sm font-bold">몇 학년이야? <span className="font-normal text-sub">— 우주에서 어디쯤?</span></p>
          <div className="grid grid-cols-4 gap-2">
            {data.grades.map((g) => {
              const on = grade === g;
              const [main, soft] = GRADE_TONE[g] ?? GRADE_TONE["기타"];
              return (
                <button
                  key={g}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setGrade(g);
                    setSay((ps.grades as Record<string, string>)[g] ?? ps.start);
                  }}
                  className={`pick ${on ? "on" : ""}`}
                  style={{ ["--pick" as string]: main, ["--pick-soft" as string]: soft }}
                >
                  <GradeArt grade={g} on={on} />
                  <span>{g}</span>
                </button>
              );
            })}
          </div>

          <p className="mb-3 mt-8 text-sm font-bold">요즘 뭘 만들어? <span className="font-normal text-sub">(여러 개)</span></p>
          <div className="grid grid-cols-3 gap-2">
            {data.interests.map((g) => {
              const on = interests.includes(g);
              const [main, soft] = INTEREST_TONE[g] ?? INTEREST_TONE["기타"];
              return (
                <button
                  key={g}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setInterests(on ? interests.filter((x) => x !== g) : [...interests, g]);
                    if (!on) setSay((ps.interests as Record<string, string>)[g] ?? ps.start);
                  }}
                  className={`pick ${on ? "on" : ""}`}
                  style={{ ["--pick" as string]: main, ["--pick-soft" as string]: soft }}
                >
                  {on && <span className="pick-check ob-pop">✓</span>}
                  <InterestArt kind={g} on={on} />
                  <span>{g}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-5 text-xs leading-relaxed text-sub">🔒 학년과 관심사는 말의 높이와 예시를 고르는 데만 써. 평가에는 쓰지 않아.</p>
          <div className="mt-auto pt-8">
            <button type="button" className={primary} onClick={() => setStep(INTRO + 1)}>
              다음
            </button>
          </div>
        </div>
      )}

      {step === INTRO + 1 && (
        <div className="rise flex flex-1 flex-col">
          <h1 className="text-2xl font-extrabold tracking-tight">지금 만들고 있는 게 있어?</h1>
          <div className="mt-4 flex items-center gap-3">
            <ProjectPlanet emoji={emoji} named={!!project.trim()} size={112} />
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-xs font-bold text-sub">행성에 세울 아이콘</p>
              <div className="grid grid-cols-4 gap-1.5">
                {data.emojis.map((e) => (
                  <button key={e} type="button" aria-pressed={emoji === e} onClick={() => setEmoji(e)} className={`pick emoji ${emoji === e ? "on" : ""}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <input className={`${input} mt-5`} placeholder="예: 스마트 화분" value={project} onChange={(e) => setProject(e.target.value)} maxLength={24} />
          <p className="mb-3 mt-7 text-sm font-bold">한 줄로 설명하면? <span className="font-normal text-sub">(선택)</span></p>
          <input className={input} placeholder="예: 상추 화분 자동 급수" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={40} />

          <p className="mb-2.5 mt-7 text-xs font-bold text-sub">💡 떠오르지 않으면 눌러 봐 — 고쳐 써도 돼</p>
          <div className="flex flex-wrap gap-2">
            {data.ideas.map((it) => (
              <button
                key={it.name}
                type="button"
                onClick={() => {
                  setProject(it.name);
                  setDesc(it.desc);
                  setEmoji(it.emoji);
                }}
                className={`rounded-full border px-3 py-1.5 text-[13px] font-semibold ${project === it.name ? "border-clay bg-clay-soft text-clay" : "border-line bg-card"}`}
              >
                {it.emoji} {it.name}
              </button>
            ))}
          </div>

          <div className="mt-auto space-y-3 pt-8">
            <button type="button" className={primary} disabled={!project.trim()} onClick={() => finish(false)}>
              {project.trim() ? `${emoji} 시작하기` : "시작하기"}
            </button>
            <button type="button" className="w-full py-3 text-sm font-semibold text-sub" onClick={() => finish(true)}>
              💬 아직 없어, 그냥 물어볼래
            </button>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
