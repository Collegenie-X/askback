"use client";

import { useEffect, useRef, type ReactNode } from "react";

// 화면에 들어올 때 한 번 떠오른다. 안쪽의 .stg(차례로 등장) · .draw(선 그리기) · .grow(막대 자라기)도 이때 시작한다.
export default function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      el.classList.add("in");
      io.disconnect();
    }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`rv ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>{children}</div>;
}
