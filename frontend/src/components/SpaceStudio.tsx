"use client";

// 우주 배경 꾸미기 — 밝기 · 빠르기 · 움직임 · 별똥별을 고르고, 천체를 하나씩 켜고 끈다. 바꾸는 즉시 뒤의 배경과 미리보기에 비친다.
import { update, useTable } from "@/lib/db";
import type { SpacePrefs } from "@/lib/types";
import { DEFAULT_SPACE, SPACE_OBJECTS, SpaceObject, Starfield } from "./Space";
import { Card, PageHeader } from "./ui";

const MOODS: [SpacePrefs["mood"], string][] = [["calm", "🌙 은은하게"], ["normal", "✨ 보통"], ["vivid", "🎆 화려하게"]];
const SPEEDS: [SpacePrefs["speed"], string][] = [["slow", "🐢 느리게"], ["normal", "🪐 보통"], ["fast", "🚀 빠르게"]];

export default function SpaceStudio() {
  const space = { ...DEFAULT_SPACE, ...useTable("space") };
  const set = (patch: Partial<SpacePrefs>) => update("space", (prev) => ({ ...DEFAULT_SPACE, ...prev, ...patch }));
  const shownCount = SPACE_OBJECTS.length - space.hidden.length;

  return (
    <>
      <PageHeader title="🌌 우주 배경" sub="내 우주는 내가 꾸민다" back={{ name: "chat" }} />
      <div className="scroll flex-1 px-4 py-4">
        <div className="mx-auto max-w-[640px] space-y-3">
          <div className="space-preview">
            <Starfield prefs={space} />
            <span className="absolute bottom-2 left-3 z-10 rounded-full bg-void/70 px-2.5 py-1 text-[11px] font-bold text-sub">👀 미리보기 — 천체 {shownCount}개</span>
          </div>

          <Card title="🔆 밝기">
            <div className="seg">
              {MOODS.map(([k, label]) => (
                <button key={k} type="button" aria-pressed={space.mood === k} onClick={() => set({ mood: k })} className={`py-2 text-xs font-bold ${space.mood === k ? "on" : ""}`}>{label}</button>
              ))}
            </div>
          </Card>

          <Card title="💫 움직임">
            <div className="space-y-3">
              <button type="button" role="switch" aria-checked={space.motion} onClick={() => set({ motion: !space.motion })} className="flex w-full items-center gap-3 text-left text-sm font-semibold">
                <span className="flex-1">🪐 공전 · 자전<span className="block text-xs font-normal text-sub">끄면 전부 제자리에 멈춰 — 글 읽기에 집중할 때</span></span>
                <span className={`switch ${space.motion ? "on" : ""}`} />
              </button>
              <div className={`seg ${space.motion ? "" : "pointer-events-none opacity-40"}`}>
                {SPEEDS.map(([k, label]) => (
                  <button key={k} type="button" aria-pressed={space.speed === k} onClick={() => set({ speed: k })} className={`py-2 text-xs font-bold ${space.speed === k ? "on" : ""}`}>{label}</button>
                ))}
              </div>
              <button type="button" role="switch" aria-checked={space.shooting} onClick={() => set({ shooting: !space.shooting })} className="flex w-full items-center gap-3 text-left text-sm font-semibold">
                <span className="flex-1">🌠 별똥별<span className="block text-xs font-normal text-sub">가끔 하늘을 가로질러</span></span>
                <span className={`switch ${space.shooting ? "on" : ""}`} />
              </button>
            </div>
          </Card>

          <Card title={`🔭 천체 고르기 — ${shownCount}/${SPACE_OBJECTS.length}`}>
            <div className={`grid grid-cols-2 gap-2 ${space.motion ? "" : "space-still"}`}>
              {SPACE_OBJECTS.map((o) => {
                const shown = !space.hidden.includes(o.key);
                return (
                  <button key={o.key} type="button" aria-pressed={shown} onClick={() => set({ hidden: shown ? [...space.hidden, o.key] : space.hidden.filter((x) => x !== o.key) })} className={`space-chip ${shown ? "on" : "off"}`}>
                    <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-void"><SpaceObject k={o.key} size={46} /></span>
                    <span className="min-w-0 flex-1">
                      <b className="block truncate text-[13px]">{o.name}</b>
                      <span className="block truncate text-[11px] text-sub">{o.desc}</span>
                    </span>
                    <span className="text-sm">{shown ? "✅" : "⬜"}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          <button type="button" onClick={() => update("space", () => DEFAULT_SPACE)} className="chunk-ghost w-full rounded-2xl py-2.5 text-sm font-bold">↺ 처음 모습으로</button>
          <p className="pb-6 text-center text-[11px] text-sub">이 기기에만 저장돼. 기록을 지우거나 예시를 열어도 남아 있어.</p>
        </div>
      </div>
    </>
  );
}
