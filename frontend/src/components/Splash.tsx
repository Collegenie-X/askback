"use client";

import { useEffect } from "react";
import { Galaxy } from "./Space";

export default function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <button type="button" onClick={onDone} className="flex flex-1 flex-col items-center justify-center gap-2">
      <div className="spark float">
        <Galaxy size={230} />
      </div>
      <div className="rise text-center" style={{ animationDelay: "0.4s" }}>
        <p className="bg-gradient-to-r from-[#8fe9ff] via-[#c9b8ff] to-[#ffd98a] bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">AskBack</p>
        <p className="mt-2 text-sm text-sub">열고 · 좁히고 · 되묻는다</p>
        <p className="mt-1 text-xs text-gold">✦ 질문의 폭이 우주의 크기를 정한다 ✦</p>
      </div>
      <div className="rise mt-8 flex gap-1.5" style={{ animationDelay: "0.8s" }}>
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
    </button>
  );
}
