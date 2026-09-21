"use client";

// 온보딩의 '실전 화면' — 진짜 채팅 화면을 작게 줄여서, 대본대로 타자 치듯 재생한다.
// 대본은 onboarding.json 의 steps[].scene 에 있다.
import { useEffect, useRef, useState } from "react";
import roles from "@/data/roles.json";
import Buddy from "./Buddy";
import { CoachAvatar, RolePlanet, Rocket } from "./Space";

type RoleKey = keyof typeof roles.roles;
export type SceneEvent =
  | { t: "project"; emoji: string; name: string }
  | { t: "user"; text: string }
  | { t: "answer"; text: string; role?: string; roleText?: string }
  | { t: "rq"; text: string }
  | { t: "reply"; text: string; verdict: string }
  | { t: "xp"; to: number }
  | { t: "banner"; text: string }
  | { t: "report" }
  | { t: "levelup" }
  | { t: "packs"; items: { emoji: string; name: string; text: string }[] };

const TICK = 38; // ms — 한 글자
const PAUSE: Record<SceneEvent["t"], number> = { project: 6, user: 10, answer: 22, rq: 16, reply: 30, xp: 8, banner: 18, report: 50, levelup: 90, packs: 70 };
const BARS = [["typist", 10], ["coder", 30], ["engineer", 40], ["architect", 20]] as const;

const textOf = (e: SceneEvent) => ("text" in e ? e.text : "");
const Caret = () => <span className="ob-caret" />;

export default function OnboardingScene({ events, level }: { events: SceneEvent[]; level: number }) {
  // at: 지금 재생 중인 이벤트, n: 그 이벤트에서 찍힌 글자 수, rest: 다 찍고 쉬는 틱
  // 동작 줄이기를 켠 기기에서는 다 펼친 채로 멈춰 둔다
  const [still] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [pos, setPos] = useState({ at: still ? events.length : 0, n: 0, rest: 0 });
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (still) return;
    const id = setInterval(() => {
      setPos((p) => {
        if (p.at >= events.length) return p.rest > 70 ? { at: 0, n: 0, rest: 0 } : { ...p, rest: p.rest + 1 };
        const e = events[p.at];
        const len = textOf(e).length;
        if (p.n < len) return { ...p, n: Math.min(len, p.n + (e.t === "answer" ? 2 : 1)) };
        if (p.rest < PAUSE[e.t]) return { ...p, rest: p.rest + 1 };
        return { at: p.at + 1, n: 0, rest: 0 };
      });
    }, TICK);
    return () => clearInterval(id);
  }, [events, still]);

  useEffect(() => {
    const el = box.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [pos]);

  const played = events.slice(0, pos.at + 1);
  const project = [...played].reverse().find((e) => e.t === "project") as Extract<SceneEvent, { t: "project" }> | undefined;
  const xp = ([...played].reverse().find((e) => e.t === "xp") as Extract<SceneEvent, { t: "xp" }> | undefined)?.to ?? 7;
  const leveled = played.some((e) => e.t === "levelup");
  const current = events[pos.at];
  const typingUser = current?.t === "user" && pos.n < current.text.length ? current.text.slice(0, pos.n) : "";

  return (
    <div className="flex h-[252px] w-full flex-col overflow-hidden rounded-3xl border border-[#3d3399] bg-[#0b0827] text-left shadow-[0_0_40px_rgba(124,92,255,0.25)]">
      {/* 헤더 — 실제 채팅 헤더와 같은 구성 */}
      <div className="border-b border-line px-3 pb-1.5 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-sub">☰</span>
          <p key={project?.name} className="rise min-w-0 flex-1 truncate text-[12px] font-bold">
            {project?.emoji} {project?.name}
            {project && <span className="ml-1.5 rounded-full border border-dashed border-current px-1.5 py-px text-[9px] font-bold text-sub">예시</span>}
          </p>
          <span key={String(leveled)} className={`flex items-center gap-0.5 rounded-full border border-[#8a6a1f] bg-amber-soft py-0.5 pl-1 pr-2 text-[10px] font-bold text-gold ${leveled ? "ob-pop" : ""}`}>
            <Buddy level={level + (leveled ? 1 : 0)} size={16} />
            Lv.{level + (leveled ? 1 : 0)}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <Rocket size={10} />
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-sand">
            <div className="ob-xp xp h-full rounded-full" style={{ width: `${(leveled ? 0 : xp) * 10}%` }} />
          </div>
          <span className="text-[9px] font-bold text-sub">다음 리포트 {leveled ? 0 : xp}/10</span>
        </div>
      </div>

      {/* 대화 */}
      <div ref={box} className="scroll flex-1 space-y-2 px-3 py-2.5 text-[11.5px] leading-relaxed">
        {played.map((e, i) => {
          const live = i === pos.at;
          const text = live ? textOf(e).slice(0, pos.n) : textOf(e);
          const done = !live || pos.n >= textOf(e).length;
          if (leveled && (e.t === "user" || e.t === "banner")) return null; // 레벨업 순간엔 리포트와 별이만 남긴다
          if (e.t === "user")
            return live && !done ? null : (
              <div key={i} className="rise flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-md bg-sand px-2.5 py-1.5">{e.text}</p>
              </div>
            );
          if (e.t === "answer") {
            const role = e.role ? roles.roles[e.role as RoleKey] : null;
            return (
              <div key={i} className="rise space-y-1.5">
                <div className="flex gap-1.5">
                  <CoachAvatar size={16} />
                  <p className="min-w-0 flex-1">
                    {text}
                    {!done && <Caret />}
                  </p>
                </div>
                {done && role && (
                  <p className="rise flex w-fit items-center gap-1.5 rounded-xl border py-1 pl-2 pr-3 text-[10.5px]" style={{ background: `${role.color}1f`, borderColor: `${role.color}55` }}>
                    <RolePlanet role={e.role!} size={20} />
                    <span>
                      이번엔 <b style={{ color: role.color }}>{e.roleText}</b>로 일했어
                    </span>
                  </p>
                )}
              </div>
            );
          }
          if (e.t === "rq")
            return (
              <div key={i} className="ob-pop glow rounded-2xl border border-[#8a6a1f] bg-amber-soft p-2.5">
                <span className="rounded-full bg-[#5a4312] px-1.5 py-0.5 text-[9.5px] font-bold text-gold">🧭 되묻기</span>
                <p className="mt-1.5 font-semibold">
                  {text}
                  {!done && <Caret />}
                </p>
              </div>
            );
          if (e.t === "reply")
            return (
              <div key={i} className="rise rounded-2xl border border-[#8a6a1f] bg-amber-soft p-2.5">
                <p className="rounded-lg bg-card/70 px-2 py-1">
                  <b>내 답</b> · {text}
                  {!done && <Caret />}
                </p>
                {done && <p className="ob-pop mt-1.5 font-bold text-mint">{e.verdict}</p>}
              </div>
            );
          if (e.t === "banner")
            return (
              <p key={i} className="ob-pop rounded-full bg-ink px-3 py-1.5 text-center text-[11px] font-bold">
                {e.text}
              </p>
            );
          if (e.t === "report")
            return (
              <div key={i} className="ob-slide rounded-2xl border border-[#ffd98a]/60 bg-card p-2.5">
                <p className="text-[10.5px] font-bold text-gold">📊 내 질문 10개, 이렇게 물었어</p>
                <div className="mt-2 flex h-12 items-end gap-2">
                  {BARS.map(([k, v], b) => (
                    <div key={k} className="flex flex-1 flex-col items-center gap-0.5">
                      <div className="ob-bar w-full rounded-t-md" style={{ height: `${v}px`, background: roles.roles[k].color, animationDelay: `${0.3 + b * 0.15}s` }} />
                      <span className="text-[8.5px] text-sub">{roles.roles[k].name}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-1.5 text-[10px] text-sub">⭐ 최고의 질문 · “어떻게 할까?”</p>
              </div>
            );
          if (e.t === "packs")
            return (
              <div key={i} className="grid grid-cols-2 gap-1.5">
                {/* 쉬는 틱에 맞춰 한 장씩 튀어나온다 */}
                {e.items.slice(0, live ? Math.ceil(pos.rest / 12) : e.items.length).map((it) => (
                  <div key={it.name} className="ob-pop rounded-xl border border-line bg-card px-2 py-1.5">
                    <p className="text-[11px] font-bold">
                      {it.emoji} {it.name}
                    </p>
                    <p className="text-[9.5px] leading-snug text-sub">{it.text}</p>
                  </div>
                ))}
              </div>
            );
          if (e.t === "levelup")
            return (
              <p key={i} className="ob-pop bg-gradient-to-r from-[#5c9dff] via-[#c08bff] to-[#ff5fb0] bg-clip-text py-1 text-center text-lg font-black text-transparent">
                LEVEL UP! 별이가 자랐어
              </p>
            );
          return null;
        })}
      </div>

      {/* 입력창 — 질문이 여기서 한 글자씩 찍힌다 */}
      <div className="flex items-center gap-2 border-t border-line px-3 py-2">
        <p className="min-w-0 flex-1 rounded-2xl border border-line bg-card px-3 py-1.5 text-[11px]">
          {typingUser ? (
            <>
              {typingUser}
              <Caret />
            </>
          ) : (
            <span className="text-sub">무엇이든 물어봐</span>
          )}
        </p>
        <span className={`grid h-6 w-6 place-items-center rounded-full bg-clay text-[11px] font-bold text-white ${typingUser ? "" : "opacity-40"}`}>↑</span>
      </div>
    </div>
  );
}
