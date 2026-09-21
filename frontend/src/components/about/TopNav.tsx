"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LogoMark } from "../Art";

// 상단 메뉴 — 지금 보는 섹션에 불이 들어오고, 아래 금색 줄이 읽은 만큼 자란다
export default function TopNav({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState("top");
  const bar = useRef<HTMLSpanElement>(null);
  const pill = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
      const line = window.innerHeight * 0.35;
      let now = "top";
      for (const it of items) {
        const el = document.getElementById(it.id);
        if (el && el.getBoundingClientRect().top <= line) now = it.id;
      }
      setActive(now);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [items]);

  // 모바일: 불 들어온 메뉴가 알약 안에서 보이게 따라간다
  useEffect(() => {
    const el = pill.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (el && pill.current) pill.current.scrollTo({ left: el.offsetLeft - 40, behavior: "smooth" });
  }, [active]);

  return (
    <header className="topnav sticky top-0 z-30 border-b border-line">
      <div className="mx-auto flex max-w-[1200px] items-center gap-3 px-4 py-2.5 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <LogoMark size={30} />
          <b className="hidden text-base font-extrabold sm:block">AskBack</b>
        </Link>
        <nav ref={pill} aria-label="소개 메뉴" className="pill noscroll relative mx-auto flex min-w-0 items-center gap-0.5 overflow-x-auto rounded-full p-1">
          <a href="#top" aria-current={active === "top" ? "page" : undefined}>소개</a>
          {items.map((n) => <a key={n.id} href={`#${n.id}`} aria-current={active === n.id ? "page" : undefined}>{n.label}</a>)}
        </nav>
        <Link href="/" className="cta shrink-0 rounded-full px-3.5 py-2 text-[13px] font-bold text-white">앱 열기 →</Link>
      </div>
      <span ref={bar} aria-hidden className="progress absolute bottom-0 left-0 block h-[2px] w-full origin-left" />
    </header>
  );
}
