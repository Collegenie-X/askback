"use client";

// 📒 스티커 — 맥의 '스티커' 앱처럼 화면 위에 붙이는 메모지.
// 위 막대를 잡고 끌기 · 오른쪽 아래 귀퉁이로 크기 바꾸기 · 막대를 두 번 눌러 접기 · 색 6가지 · ✕ 떼기.
// 끌기 · 크기 바꾸기는 손을 뗄 때 한 번만 저장한다 (히스토리 한 걸음). 글은 칠 때마다 바로 저장.
import { useRef, useState, type PointerEvent } from "react";
import type { Sketch, Sticky } from "@/lib/sim";

export const STICKY_COLORS: Sticky["color"][] = ["yellow", "blue", "green", "pink", "purple", "gray"];
const COLOR_NAME: Record<Sticky["color"], string> = { yellow: "노랑", blue: "파랑", green: "초록", pink: "분홍", purple: "보라", gray: "회색" };
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const r3 = (n: number) => Math.round(n * 1000) / 1000;

export default function Stickies({ sketch, onChange, onText }: {
  sketch?: Sketch;
  onChange: (next: Sketch) => void; // 히스토리에 남는 바꿈 — 끌기 · 크기 · 색 · 접기 · 떼기
  onText: (next: Sketch) => void; // 히스토리에 안 남는 바꿈 — 글 치기
}) {
  const box = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ i: number; kind: "move" | "size"; sx: number; sy: number; o: Sticky; now: Sticky } | null>(null);
  const list = sketch?.stickies ?? [];
  if (!sketch || !list.length) return <div ref={box} className="sim-stickies" />;

  const put = (i: number, s: Sticky, record = true) => {
    const next = { ...sketch, stickies: list.map((x, j) => (j === i ? s : x)) };
    (record ? onChange : onText)(next);
  };
  const start = (e: PointerEvent<HTMLElement>, i: number, kind: "move" | "size") => {
    if ((e.target as HTMLElement).closest("button")) return; // 막대 위 단추는 끌기가 아니다
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    setDrag({ i, kind, sx: e.clientX, sy: e.clientY, o: list[i], now: list[i] });
  };
  const move = (e: PointerEvent<HTMLElement>) => {
    if (!drag) return;
    const r = box.current!.getBoundingClientRect();
    const dx = (e.clientX - drag.sx) / r.width, dy = (e.clientY - drag.sy) / r.height;
    const o = drag.o;
    const now = drag.kind === "move"
      ? { ...o, x: r3(clamp(o.x + dx, 0, 1 - o.w)), y: r3(clamp(o.y + dy, 0, 0.97)) }
      : { ...o, w: r3(clamp(o.w + dx, 0.25, 1 - o.x)), h: r3(clamp(o.h + dy, 0.06, 1 - o.y)) };
    setDrag({ ...drag, now });
  };
  const end = () => {
    if (drag && (drag.now.x !== drag.o.x || drag.now.y !== drag.o.y || drag.now.w !== drag.o.w || drag.now.h !== drag.o.h)) put(drag.i, drag.now);
    setDrag(null);
  };

  return (
    <div ref={box} className="sim-stickies">
      {list.map((raw, i) => {
        const s = drag?.i === i ? drag.now : raw;
        return (
          <div key={i} className={`sim-sticky ${s.color} ${s.min ? "min" : ""} ${drag?.i === i ? "drag" : ""}`} style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, width: `${s.w * 100}%`, height: s.min ? undefined : `${s.h * 100}%` }}>
            <div className="bar" onPointerDown={(e) => start(e, i, "move")} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onDoubleClick={() => put(i, { ...s, min: !s.min })} title="끌어서 옮기기 · 두 번 눌러 접기">
              <button type="button" className="x" aria-label="스티커 떼기" onClick={() => onChange({ ...sketch, stickies: list.filter((_, j) => j !== i) })}>✕</button>
              {s.min ? <span className="peek">{s.text.split("\n")[0] || "스티커"}</span> : (
                <span className="dots">
                  {STICKY_COLORS.map((c) => <button key={c} type="button" className={`dot ${c} ${c === s.color ? "on" : ""}`} aria-label={`${COLOR_NAME[c]} 스티커`} onClick={() => put(i, { ...s, color: c })} />)}
                </span>
              )}
              <button type="button" className="fold" aria-label={s.min ? "펼치기" : "접기"} onClick={() => put(i, { ...s, min: !s.min })}>{s.min ? "▸" : "▾"}</button>
            </div>
            {!s.min && (
              <>
                <textarea aria-label={`스티커 ${i + 1}`} value={s.text} placeholder="여기에 적어 — 예: 이 차트는 1주 · 1달로 바꿔 보기" onChange={(e) => put(i, { ...s, text: e.target.value.slice(0, 400) }, false)} onPointerDown={(e) => e.stopPropagation()} />
                <span className="grip" aria-hidden onPointerDown={(e) => start(e, i, "size")} onPointerMove={move} onPointerUp={end} onPointerCancel={end} />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
