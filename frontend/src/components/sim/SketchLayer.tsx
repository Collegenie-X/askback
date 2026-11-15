"use client";

// 🖍 연필 레이어 — 폰 화면 위에 손으로 긋고, 번호 메모(①②)를 꽂고, 🧽 지우개로 문질러 지운다. AI를 부르지 않는다.
// 좌표는 화면 칸 영역의 0~1 비율로 저장한다 → 폰 크기가 달라도, 설계도(SVG)에 옮겨 그려도 같은 자리.
// 한 번 긋기 · 한 번 문지르기가 끝날 때만 onChange — 그래야 히스토리(뒤로 · 앞으로)가 한 걸음씩 쌓인다.
import { useRef, useState, type PointerEvent } from "react";
import type { Sketch } from "@/lib/sim";

export type PenTool = "pencil" | "red" | "note" | "sticky" | "erase";
export const NUM = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫";
export const EMPTY_SKETCH: Sketch = { lines: [], notes: [] };
const r3 = (n: number) => Math.round(Math.min(1, Math.max(0, n)) * 1000) / 1000;
/** [x0, y0, x1, y1, …] → SVG 경로 (0~1000 좌표) */
export const pathOf = (p: number[], sx = 1000, sy = 1000, ox = 0, oy = 0) =>
  p.reduce((d, v, i) => (i % 2 ? d : `${d}${i ? " L" : "M"}${(ox + v * sx).toFixed(1)},${(oy + p[i + 1] * sy).toFixed(1)}`), "");

// 지우개 — 화면 픽셀로 이만큼 가까우면 그 선 · 메모를 지운다
const ERASE_PX = 14;

export default function SketchLayer({ sketch, active, tool, onChange, onNote }: {
  sketch?: Sketch;
  active: boolean; // 연필 모드일 때만 그린다 — 아니면 보기만
  tool: PenTool;
  onChange: (next: Sketch) => void;
  onNote?: (index: number) => void; // 메모를 꽂으면 그 번호의 글칸으로
}) {
  const box = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState<number[] | null>(null); // 지금 긋는 선
  const [rub, setRub] = useState<Sketch | null>(null); // 지우개로 문지르는 동안의 모습
  const sk = rub ?? sketch ?? EMPTY_SKETCH;

  const at = (e: PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    return [r3((e.clientX - r.left) / r.width), r3((e.clientY - r.top) / r.height)];
  };
  // 지우개가 닿은 선 · 메모를 뺀다 (가로 · 세로 비율이 달라서 픽셀로 잰다)
  const erase = (from: Sketch, e: PointerEvent): Sketch => {
    const r = box.current!.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    const near = (x: number, y: number) => Math.hypot(x * r.width - px, y * r.height - py) < ERASE_PX;
    const lines = from.lines.filter((l) => !l.p.some((v, i) => i % 2 === 0 && near(v, l.p[i + 1])));
    const notes = from.notes.filter((n) => !near(n.x, n.y));
    return lines.length === from.lines.length && notes.length === from.notes.length ? from : { ...from, lines, notes };
  };
  const capture = (e: PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId); // 폰 밖으로 끌어도 이어지게
    } catch {}
  };

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (!active) return;
    e.preventDefault();
    const base = sketch ?? EMPTY_SKETCH;
    if (tool === "erase") {
      capture(e);
      setRub(erase(base, e));
      return;
    }
    const [x, y] = at(e);
    if (tool === "sticky") {
      const st = base.stickies ?? [];
      if (st.length >= 12) return;
      onChange({ ...base, stickies: [...st, { x: Math.min(x, 0.5), y: Math.min(y, 0.9), w: 0.5, h: 0.16, color: "yellow", text: "" }] });
      return;
    }
    if (tool === "note") {
      if (base.notes.length >= 12) return;
      onChange({ ...base, notes: [...base.notes, { x, y, text: "" }] });
      onNote?.(base.notes.length);
      return;
    }
    if (base.lines.length >= 60) return;
    capture(e);
    setLive([x, y]);
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (rub) {
      const next = erase(rub, e);
      if (next !== rub) setRub(next);
      return;
    }
    if (!live) return;
    const [x, y] = at(e);
    const [lx, ly] = live.slice(-2);
    if (Math.hypot(x - lx, y - ly) < 0.006 || live.length >= 800) return; // 너무 촘촘한 점은 버린다
    setLive([...live, x, y]);
  };
  const up = () => {
    if (rub) {
      if (rub !== sketch && (rub.lines.length !== (sketch?.lines.length ?? 0) || rub.notes.length !== (sketch?.notes.length ?? 0))) onChange(rub);
      setRub(null);
      return;
    }
    if (live && live.length >= 4) onChange({ ...(sketch ?? EMPTY_SKETCH), lines: [...(sketch?.lines ?? []), { c: tool === "red" ? "red" : "pencil", p: live }] });
    setLive(null);
  };

  return (
    <div ref={box} className={`sim-sketch ${active ? "on" : ""} ${active ? tool : ""}`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} aria-hidden={!active}>
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="none">
        {sk.lines.map((l, i) => <path key={i} d={pathOf(l.p)} className={`sim-ink ${l.c}`} />)}
        {live && <path d={pathOf(live)} className={`sim-ink ${tool === "red" ? "red" : "pencil"}`} />}
      </svg>
      {sk.notes.map((n, i) => (
        <span key={i} className="sim-pin" style={{ left: `${n.x * 100}%`, top: `${n.y * 100}%` }} title={n.text || "메모를 적어 줘"}>{NUM[i]}</span>
      ))}
    </div>
  );
}
