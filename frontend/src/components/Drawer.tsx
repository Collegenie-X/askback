"use client";

import Link from "next/link";
import { useState } from "react";
import roles from "@/data/roles.json";
import { scenarios } from "@/data/scenarios";
import { update, useTable } from "@/lib/db";
import { windowCountOf } from "@/lib/report";
import { useApp, type View } from "./AppContext";
import { LogoMark } from "./Art";
import Buddy, { buddyName, levelOf } from "./Buddy";
import type { Scenario } from "./demo/types";

const NAV: { view: View; emoji: string; label: string }[] = [
  { view: { name: "reports" }, emoji: "📊", label: "리포트" },
  { view: { name: "space" }, emoji: "🌌", label: "우주 배경" },
  { view: { name: "onboarding" }, emoji: "✨", label: "소개 다시 보기" },
  { view: { name: "settings" }, emoji: "⚙️", label: "설정" },
];

let examplesOpenMemo = true; // 서랍은 열 때마다 새로 그려진다 — 접어 둔 상태는 여기 남긴다

// docked: PC(1024px~)에서 왼쪽에 늘 붙어 있는 메뉴. 아니면 모바일의 햄버거 서랍(덮어쓰기).
export default function Drawer({ docked = false, onClose, onNewProject, onExample }: { docked?: boolean; onClose: () => void; onNewProject: () => void; onExample: (s: Scenario) => void }) {
  const { go, view } = useApp();
  const profile = useTable("profile");
  const projects = useTable("projects");
  const turns = useTable("turns");
  const state = useTable("state");
  const reports = useTable("reports");
  const level = levelOf(reports.length);
  const current = projects.find((p) => p.id === state.currentProjectId);
  const windowCount = windowCountOf(current?.id, current?.name ?? "", turns, reports);
  const [examplesOpen, setExamplesOpen] = useState(examplesOpenMemo);
  const toggleExamples = () => setExamplesOpen((v) => (examplesOpenMemo = !v));
  // 포커스는 늘 하나 — 메뉴 화면을 보고 있으면 메뉴에, 아니면 지금 프로젝트에
  const navOn = (v: View) => v.name === view.name || (v.name === "reports" && view.name === "monthly");
  const onNav = NAV.some((n) => navOn(n.view));
  const examples = scenarios.filter((s) => `prj_example_${s.id}` !== state.demoProjectId); // 지금 열린 예시는 위 목록에 있다

  const menu = (
      <aside className={docked ? "side panel scroll relative z-10 w-[300px] shrink-0 flex-col px-3 pb-6 pt-5" : "drawer panel scroll relative z-10 flex w-[84%] max-w-[320px] flex-col px-3 pb-6 pt-5"}>
        <div className="flex items-center gap-2.5">
          <LogoMark size={36} />
          <div className="min-w-0">
            <p className="text-lg font-extrabold leading-tight">AskBack</p>
            <p className="truncate text-xs text-sub">🧑‍🚀 {profile?.name}의 프로젝트</p>
          </div>
          {/* 소개 페이지(/about) — AskBack이 무엇인지 한 장으로 */}
          <Link href="/about" className="ml-auto shrink-0 rounded-full border border-line bg-sand px-3 py-1.5 text-xs font-bold text-clay active:bg-line">✨ 소개</Link>
        </div>

        {/* 별이 — 질문 10개마다 한 단계 자란다 */}
        <button type="button" onClick={() => { go({ name: "reports" }); onClose(); }} className="chunk-card mt-4 flex items-center gap-2.5 rounded-2xl px-2.5 py-2 text-left">
          <Buddy level={level} size={44} />
          <span className="min-w-0 flex-1">
            <b className="block truncate text-[13px]"><span className="text-gold">Lv.{level}</span> {buddyName(level)}</b>
            <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-sand"><span className="xp block h-full transition-all" style={{ width: `${windowCount * 10}%` }} /></span>
            <span className="mt-0.5 block text-[10.5px] text-sub">⭐ 다음 리포트까지 {windowCount}/10</span>
          </span>
        </button>

        <button type="button" onClick={onNewProject} className="mt-4 rounded-xl border border-dashed border-clay py-2.5 text-sm font-bold text-clay">
          + 새 프로젝트
        </button>

        <ul className="mt-3 space-y-1.5">
          {[...projects].sort((a, b) => b.updatedAt - a.updatedAt).map((p) => {
            const mine = turns.filter((t) => t.projectId === p.id);
            const recent = mine.slice(-5).map((t) => (t.role ? roles.roles[t.role].emoji : "·")).join("");
            const on = !onNav && state.currentProjectId === p.id;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    update("state", (s) => ({ ...s, currentProjectId: p.id }));
                    go({ name: "chat" });
                    onClose();
                  }}
                  aria-current={on ? "page" : undefined}
                  className={`nav-pick block w-full rounded-xl px-3 py-2.5 text-left ${on ? "on" : ""}`}
                >
                  <p className="flex items-center gap-2 text-sm font-bold">
                    <span className={`tile h-8 w-8 text-base ${on ? "on" : ""}`}>{p.emoji}</span>
                    <span className="truncate">{p.name}</span>
                    {state.demoProjectId === p.id && <span className="shrink-0 rounded-full border border-dashed border-current px-1.5 py-px text-[10px] font-bold text-sub">예시</span>}
                  </p>
                  {p.desc && <p className="truncate text-xs text-sub">{p.desc}</p>}
                  {state.demoProjectId === p.id && <p className="text-[11px] text-sub">내 프로젝트가 아니에요 — 시나리오 JSON에서 불러온 예시예요</p>}
                  <p className="mt-0.5 text-[11px] text-sub">질문 {mine.length}개{recent && ` · 최근 역할 ${recent}`}</p>
                </button>
              </li>
            );
          })}
        </ul>

        {examples.length > 0 && (
          <>
            <button type="button" onClick={toggleExamples} aria-expanded={examplesOpen} className="mt-4 flex w-full items-center gap-1.5 rounded-lg px-1 py-1 text-left text-[11px] font-bold text-sub active:bg-sand">
              <span>{examplesOpen ? "📂" : "📁"} 예시 프로젝트</span>
              <span className="rounded-full bg-sand px-1.5 py-px text-[10px]">{examples.length}</span>
              <span className="ml-auto">{examplesOpen ? "접기 ▴" : "펼치기 ▾"}</span>
            </button>
            {examplesOpen && <ul className="fade mt-1.5 space-y-1">
              {examples.map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => onExample(s)} className="nav-pick dashed block w-full rounded-xl px-3 py-2 text-left active:bg-sand">
                    <span className="flex items-center gap-2">
                      <span className="tile h-8 w-8 text-base">{s.card.emoji}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold">{s.card.title}</span>
                        <span className="block text-[11px] text-sub">{s.student.name} {s.student.grade} · 💬 질문 {s.turns.length}개</span>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>}
          </>
        )}

        {/* 메뉴는 늘 바닥에 붙어 있다 — 목록이 길어도 가려지지 않게 */}
        <nav className="sticky -bottom-6 z-10 -mx-3 mt-auto shrink-0 space-y-0.5 border-t border-line bg-[#0c1124] px-3 pb-3 pt-2">
          {NAV.map((n) => (
            <button key={n.label} type="button" onClick={() => { go(n.view); onClose(); }} aria-current={navOn(n.view) ? "page" : undefined} className={`nav-pick flex w-full items-center gap-3 rounded-xl px-3 py-1.5 text-left text-sm font-semibold active:bg-sand ${navOn(n.view) ? "on text-clay" : ""}`}>
              <span className={`tile h-8 w-8 text-base ${navOn(n.view) ? "on" : ""}`}>{n.emoji}</span>
              {n.label}
            </button>
          ))}
        </nav>
      </aside>
  );
  if (docked) return menu;

  return (
    <div className="absolute inset-0 z-40 flex lg:hidden">
      {menu}
      <button type="button" aria-label="닫기" className="fade scrim flex-1" onClick={onClose} />
    </div>
  );
}
