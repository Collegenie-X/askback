"use client";

import { useEffect } from "react";
import { Galaxy } from "./Space";
import { Wordmark } from "./Art";

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
        <Wordmark size={40} />
        <p className="mt-3 text-sm text-sub">아이디어에 불꽃, 설계는 내가</p>
        <p className="mt-1 text-xs text-gold">✦ 열린 질문 하나가 제품의 설계도로 ✦</p>
      </div>
      <div className="rise mt-8 flex gap-1.5" style={{ animationDelay: "0.8s" }}>
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
    </button>
  );
}
