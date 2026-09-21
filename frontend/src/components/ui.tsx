"use client";

import { useState, type ReactNode } from "react";
import { useApp, type View } from "./AppContext";

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <button type="button" aria-label="닫기" className="fade scrim absolute inset-0" onClick={onClose} />
      <div className="sheet panel scroll relative max-h-[86%] rounded-t-3xl px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
        <h2 className="mb-3 text-base font-bold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function PageHeader({ title, sub, back, right }: { title: string; sub?: string; back?: View; right?: ReactNode }) {
  const { go, openDrawer } = useApp();
  return (
    <header className="flex items-center gap-1 border-b border-line bg-paper px-2 py-2.5">
      {back ? (
        <button type="button" aria-label="뒤로" onClick={() => go(back)} className="grid h-9 w-9 place-items-center rounded-full text-xl active:bg-sand">
          ‹
        </button>
      ) : (
        <button type="button" aria-label="메뉴" onClick={openDrawer} className="menu-btn grid h-9 w-9 place-items-center rounded-full text-lg active:bg-sand">
          ☰
        </button>
      )}
      <div className="min-w-0 flex-1 px-1">
        <h1 className="truncate text-[15px] font-bold">{title}</h1>
        {sub && <p className="truncate text-[11px] text-sub">{sub}</p>}
      </div>
      {right}
    </header>
  );
}

export function Card({ n, title, children, tone = "card" }: { n?: string; title?: string; children: ReactNode; tone?: "card" | "mission" }) {
  return (
    <section className={`rounded-2xl border p-4 ${tone === "mission" ? "border-clay bg-clay-soft" : "border-line bg-card"}`}>
      {title && (
        <h3 className="mb-2.5 flex items-center gap-2 text-[13px] font-bold text-sub">
          {n && <span className="grid h-5 w-5 place-items-center rounded-full bg-ink text-[11px] text-paper">{n}</span>}
          {title}
        </h3>
      )}
      {children}
    </section>
  );
}

export function Empty({ emoji, children }: { emoji: string; children: ReactNode }) {
  return (
    <div className="px-8 py-16 text-center">
      <p className="text-4xl">{emoji}</p>
      <p className="mt-3 text-sm leading-relaxed text-sub">{children}</p>
    </div>
  );
}

// 핵심만 보여주고, 누르면 펼친다
export function Fold({ title, summary, defaultOpen = false, tone = "card", children }: { title: ReactNode; summary?: ReactNode; defaultOpen?: boolean; tone?: "card" | "plain" | "mission"; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  const box = tone === "plain" ? "" : tone === "mission" ? "rounded-2xl border border-clay bg-clay-soft" : "rounded-2xl border border-line bg-card";
  return (
    <section className={box}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className={`flex w-full items-center gap-2 text-left ${tone === "plain" ? "rounded-xl bg-sand px-3.5 py-2.5" : "px-4 py-3"}`}>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-bold">{title}</span>
          {!open && summary && <span className="mt-0.5 block truncate text-xs text-sub">{summary}</span>}
        </span>
        <span className="shrink-0 text-[11px] font-bold text-sub">{open ? "접기 ▴" : "펼치기 ▾"}</span>
      </button>
      {open && <div className={`fade ${tone === "plain" ? "pt-3" : "space-y-3 border-t border-line px-4 py-3"}`}>{children}</div>}
    </section>
  );
}
