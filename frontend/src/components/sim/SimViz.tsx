"use client";

// 화면 시뮬레이터의 그림 패널 — 글 대신 그림으로 보여 준다.
// FlowTree: 화면 흐름을 위 → 아래 트리로 (첫 화면이 맨 위, 버튼으로 처음 닿는 화면이 한 칸 아래)
// Wiring:   하드웨어를 배선도로 (왼쪽 입력 → 가운데 앱 → 오른쪽 출력 램프)
// ScoreRing: 설명한 버튼 수를 고리로
import type { KeyboardEvent } from "react";
import type { Cond, Project } from "@/lib/sim";
import { pathOf } from "./SketchLayer";

type Vals = Record<string, number>;

const EMOJI = /^\s*((?:\p{Regional_Indicator}{2}|\p{Extended_Pictographic})(?:️|⃣)?(?:‍\p{Extended_Pictographic}️?)*)\s*/u;
/** "📗 순공" → { icon: "📗", rest: "순공" } */
export const splitIcon = (s = "") => {
  const m = s.match(EMOJI);
  return m ? { icon: m[1], rest: s.slice(m[0].length) } : { icon: "", rest: s };
};
export const clip = (s: string, n: number) => {
  const a = Array.from(s);
  return a.length > n ? `${a.slice(0, n - 1).join("")}…` : s;
};
export const test = (c: Cond | undefined, v: Vals) => {
  if (!c) return false;
  const a = v[c.key] ?? 0;
  return c.op === "<" ? a < c.value : c.op === "<=" ? a <= c.value : c.op === ">" ? a > c.value : c.op === ">=" ? a >= c.value : c.op === "!=" ? a !== c.value : a === c.value;
};
const OP: Record<Cond["op"], string> = { "<": "<", "<=": "≤", ">": ">", ">=": "≥", "==": "=", "!=": "≠" };
/** 조건을 짧게 — "⏳ ≥ 6초" */
export const condShort = (c: Cond, p: Project) => {
  const v = p.state[c.key];
  return `${splitIcon(v?.label).icon || v?.label || c.key} ${OP[c.op]} ${c.value}${v?.unit ?? ""}`;
};

/* ───────────── 화면 흐름 트리 ───────────── */

type Link = { from: string; to: string; texts: string[] };
const NW = 112, NH = 52, GX = 12, GY = 50, TOP = 18;

function layout(p: Project) {
  const ids = new Set(p.screens.map((s) => s.id));
  const pairs = new Map<string, Link>();
  for (const s of p.screens)
    for (const b of s.blocks)
      if (b.type === "button" && b.go && ids.has(b.go) && b.go !== s.id) {
        const k = `${s.id}>${b.go}`;
        const l = pairs.get(k) ?? { from: s.id, to: b.go, texts: [] };
        l.texts.push(b.text ?? "");
        pairs.set(k, l);
      }
  const links = [...pairs.values()];
  // 첫 화면부터 너비 우선으로 — 처음 닿는 연결이 트리 줄기, 나머지는 노드 안의 ↩ · → 표시
  const start = ids.has(p.start) ? p.start : p.screens[0].id;
  const level = new Map<string, number>([[start, 0]]);
  const parent = new Map<string, string>();
  const order = [start];
  for (let i = 0; i < order.length; i++)
    for (const l of links)
      if (l.from === order[i] && !level.has(l.to)) {
        level.set(l.to, level.get(order[i])! + 1);
        parent.set(l.to, order[i]);
        order.push(l.to);
      }
  const lost = Math.max(...level.values()) + 1; // 어떤 버튼으로도 못 가는 화면 — 맨 아래 줄
  for (const s of p.screens)
    if (!level.has(s.id)) {
      level.set(s.id, lost);
      order.push(s.id);
    }
  const rows: string[][] = [];
  for (const id of order) (rows[level.get(id)!] ??= []).push(id);
  const cols = Math.max(...rows.map((r) => r?.length ?? 0));
  const W = cols * NW + (cols - 1) * GX;
  const pos = new Map<string, { x: number; y: number }>();
  rows.forEach((r, ri) => {
    const x0 = (W - (r.length * NW + (r.length - 1) * GX)) / 2;
    r.forEach((id, i) => pos.set(id, { x: x0 + i * (NW + GX), y: TOP + ri * (NH + GY) }));
  });
  const H = TOP + rows.length * (NH + GY) - GY + 4;
  return { links, level, parent, pos, W, H, start, lostRow: lost, unreachable: order.filter((id) => level.get(id) === lost && !parent.has(id) && id !== start) };
}

export function FlowTree({ project, current, onPick }: { project: Project; current: string; onPick: (id: string) => void }) {
  const { links, level, parent, pos, W, H, start, unreachable } = layout(project);
  const title = (id: string) => project.screens.find((s) => s.id === id)?.title ?? "";
  const icon = (id: string) => splitIcon(title(id)).icon || (id === start ? "🏁" : "▫️");
  return (
    <svg viewBox={`-2 0 ${W + 4} ${H}`} className="sim-tree" role="group" aria-label="화면 흐름">
      <defs>
        <marker id="sim-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#4b5a8f" /></marker>
        <marker id="sim-arr-on" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#ffc83d" /></marker>
      </defs>
      {/* 줄기 — 부모 아래 가운데 → 자식 위 가운데, ㄱ자 선 */}
      {[...parent.entries()].map(([child, par]) => {
        const a = pos.get(par)!, b = pos.get(child)!;
        const x1 = a.x + NW / 2, y1 = a.y + NH, x2 = b.x + NW / 2, y2 = b.y;
        const mid = y1 + 14;
        const on = par === current;
        const l = links.find((k) => k.from === par && k.to === child)!;
        return (
          <g key={child} className={on ? "on" : ""}>
            <path d={`M${x1},${y1} V${mid} H${x2} V${y2 - 1}`} className="sim-edge" markerEnd={`url(#sim-arr${on ? "-on" : ""})`} />
            <g className="sim-edge-tag">
              <title>{l.texts.join(" · ")}</title>
              <circle cx={x2} cy={y2 - 18} r="11" />
              <text x={x2} y={y2 - 14} textAnchor="middle">{splitIcon(l.texts[0]).icon || "🔘"}</text>
            </g>
          </g>
        );
      })}
      {unreachable.length > 0 && <text x={W / 2} y={pos.get(unreachable[0])!.y - 8} textAnchor="middle" className="sim-tree-note">{project.menu?.length ? "메뉴(탭)로 가는 화면" : "닿는 버튼이 없는 화면"}</text>}
      {project.screens.map((s) => {
        const p = pos.get(s.id)!;
        const { rest } = splitIcon(s.title);
        const extra = links.filter((l) => l.from === s.id && parent.get(l.to) !== s.id);
        const on = s.id === current;
        const pick = () => onPick(s.id);
        const tip = [s.title, ...links.filter((l) => l.from === s.id).map((l) => `${l.texts.join(" · ")} → ${title(l.to)}`)].join("\n");
        return (
          <g key={s.id} className={`sim-node ${on ? "on" : ""}`} role="button" tabIndex={0} aria-label={`${s.title} 화면으로`} aria-pressed={on} onClick={pick} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), pick())}>
            <title>{tip}</title>
            {s.id === start && <text x={p.x + 6} y={p.y - 5} className="sim-tree-note" textAnchor="start">▼ 시작</text>}
            <rect x={p.x} y={p.y} width={NW} height={NH} rx="12" />
            <text x={p.x + NW / 2} y={p.y + (extra.length ? 22 : 31)} textAnchor="middle" className="sim-node-t">{icon(s.id)} {clip(rest || s.title, 7)}</text>
            {extra.length > 0 && (
              <text x={p.x + NW / 2} y={p.y + 41} textAnchor="middle" className="sim-node-x">
                {extra.map((l) => `${level.get(l.to)! <= level.get(s.id)! ? "↩" : "→"}${icon(l.to)}`).join("  ")}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ───────────── 사이트맵 — 앱 → 메뉴 → 화면, 위에서 아래로 ───────────── */

export type MenuGroup = { id: string; title: string; path?: string; screens: Project["screens"] };
/** 메뉴별로 화면을 묶는다. 어느 메뉴에도 안 속한 화면은 맨 끝 "메뉴 밖" 묶음 */
export function menuGroups(p: Project): MenuGroup[] {
  const menu = p.menu ?? [];
  const ids = new Set(menu.map((m) => m.id));
  const out: MenuGroup[] = menu.map((m) => ({ ...m, screens: p.screens.filter((s) => s.group === m.id) }));
  const lost = p.screens.filter((s) => !s.group || !ids.has(s.group));
  if (lost.length) out.push({ id: "", title: "📦 메뉴 밖", screens: lost });
  return out;
}

const CW = 104, CG = 8, MH = 44, SH = 32, SG = 7, ROOT = 38, BUS = 66, MY = 80;
export function SiteMap({ project, current, onPick }: { project: Project; current: string; onPick: (id: string) => void }) {
  const groups = menuGroups(project);
  const n = Math.max(groups.length, 1);
  const W = n * CW + (n - 1) * CG;
  const tall = Math.max(1, ...groups.map((g) => g.screens.length));
  const H = MY + MH + 14 + tall * (SH + SG) + 4;
  const cur = project.screens.find((s) => s.id === current);
  // 지금 화면의 버튼이 가는 곳 — 그 화면들에 테두리와 버튼 이모지를 단다
  const goes = new Map<string, string>();
  for (const b of cur?.blocks ?? []) if (b.type === "button" && b.go && b.go !== current && !goes.has(b.go)) goes.set(b.go, splitIcon(b.text).icon || "🔘");
  const curGroup = groups.find((g) => g.screens.some((s) => s.id === current))?.id;
  const key = (e: KeyboardEvent, fn: () => void) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), fn());
  return (
    <svg viewBox={`-2 0 ${W + 4} ${H}`} className="sim-tree sim-site" role="group" aria-label="사이트맵">
      {/* 앱 → 메뉴: 위에서 버스선으로 갈라진다 */}
      <rect x={W / 2 - 74} y="2" width="148" height={ROOT} rx="19" className="sim-site-root" />
      <text x={W / 2} y="26" textAnchor="middle" className="sim-node-t">{project.emoji} {clip(project.name, 10)}</text>
      <path d={`M${W / 2},${ROOT + 2} V${BUS}`} className="sim-edge" />
      {n > 1 && <path d={`M${CW / 2},${BUS} H${W - CW / 2}`} className="sim-edge" />}
      {groups.map((g, gi) => {
        const x = gi * (CW + CG);
        const onG = g.id === curGroup;
        const first = g.screens[0]?.id;
        return (
          <g key={g.id || "lost"}>
            <path d={`M${x + CW / 2},${BUS} V${MY}`} className={`sim-edge ${onG ? "hot" : ""}`} />
            <g className={`sim-node sim-menu ${onG ? "cur" : ""}`} role="button" tabIndex={first ? 0 : -1} aria-label={`${g.title} 메뉴`} onClick={() => first && onPick(first)} onKeyDown={(e) => first && key(e, () => onPick(first))}>
              <title>{`${g.title}${g.path ? ` (${g.path})` : ""} — 화면 ${g.screens.length}장`}</title>
              <rect x={x} y={MY} width={CW} height={MH} rx="12" />
              <text x={x + CW / 2} y={MY + 19} textAnchor="middle" className="sim-node-t">{clip(g.title, 8)}</text>
              <text x={x + CW / 2} y={MY + 35} textAnchor="middle" className="sim-node-x">{g.path ? clip(g.path, 13) : `${g.screens.length}장`}</text>
            </g>
            {g.screens.length > 0 && <path d={`M${x + 8},${MY + MH} V${MY + MH + 14 + (g.screens.length - 1) * (SH + SG) + SH / 2}`} className={`sim-edge ${onG ? "hot" : ""}`} />}
            {g.screens.map((s, si) => {
              const y = MY + MH + 14 + si * (SH + SG);
              const on = s.id === current;
              const go = goes.get(s.id);
              const { icon, rest } = splitIcon(s.title);
              return (
                <g key={s.id}>
                  <path d={`M${x + 8},${y + SH / 2} H${x + 16}`} className={`sim-edge ${onG ? "hot" : ""}`} />
                  <g className={`sim-node ${on ? "on" : ""} ${go ? "go" : ""}`} role="button" tabIndex={0} aria-label={`${s.title} 화면으로`} aria-pressed={on} onClick={() => onPick(s.id)} onKeyDown={(e) => key(e, () => onPick(s.id))}>
                    <title>{s.title}{s.id === project.start ? " · 첫 화면" : ""}{go ? " · 지금 화면에서 버튼으로 갈 수 있어" : ""}</title>
                    <rect x={x + 16} y={y} width={CW - 16} height={SH} rx="9" />
                    <text x={x + 24} y={y + 20.5} className="sim-node-s">{icon ? `${icon} ` : ""}{clip(rest || s.title, icon ? 5 : 6)}</text>
                    {s.id === project.start && <circle cx={x + 16} cy={y} r="4.5" className="sim-start-dot" />}
                    {go && (
                      <g className="sim-go-tag">
                        <circle cx={x + CW - 2} cy={y + SH / 2} r="9.5" />
                        <text x={x + CW - 2} y={y + SH / 2 + 4} textAnchor="middle">{go}</text>
                      </g>
                    )}
                  </g>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

/* ───────────── 하드웨어 배선도 ───────────── */

export function Wiring({ project, vals, onSlide, focus, onFocus }: {
  project: Project;
  vals: Vals;
  onSlide: (key: string, n: number) => void;
  focus?: string;
  onFocus: (rule?: string) => void;
}) {
  const ins = (project.hardware?.inputs ?? []).filter((i) => project.state[i.key]);
  const outs = project.hardware?.outputs ?? [];
  const ROW = 92;
  const H = Math.max(ins.length, outs.length, 1) * ROW;
  const yOf = (k: number, n: number) => ((k + 0.5) * H) / n;
  const anyIn = ins.some((i) => vals[i.key] > project.state[i.key].min);
  return (
    <div className="sim-wire" style={{ height: H }}>
      <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden>
        {ins.map((i, k) => {
          const y = yOf(k, ins.length);
          return <path key={i.key} d={`M33,${y} C39,${y} 39,${H / 2} 44,${H / 2}`} className={`sim-w ${vals[i.key] > project.state[i.key].min ? "in" : ""}`} />;
        })}
        {outs.map((o, k) => {
          const y = yOf(k, outs.length);
          return <path key={o.id} d={`M56,${H / 2} C61,${H / 2} 61,${y} 67,${y}`} className={`sim-w ${test(o.onIf, vals) ? "out" : ""}`} />;
        })}
      </svg>
      <div className="sim-wire-col" style={{ left: 0 }}>
        <span className="sim-wire-h">📥 입력</span>
        {ins.map((i) => {
          const v = project.state[i.key];
          const { icon } = splitIcon(v.label);
          return (
            <label key={i.key} className="sim-in" title={`${i.device} — ${v.label}`}>
              <span className="sim-in-dev">{clip(i.device, 14)}</span>
              <b>{icon} {vals[i.key]}<small>{v.unit}</small></b>
              <input type="range" min={v.min} max={v.max} value={vals[i.key]} onChange={(e) => onSlide(i.key, Number(e.target.value))} aria-label={v.label} />
            </label>
          );
        })}
      </div>
      <div className={`sim-brain ${anyIn ? "on" : ""}`} title="앱이 규칙으로 판정한다">
        <span>💻</span>
        <small>규칙</small>
      </div>
      <div className="sim-wire-col" style={{ right: 0 }}>
        <span className="sim-wire-h">📤 출력</span>
        {outs.map((o) => {
          const on = test(o.onIf, vals);
          return (
            <div key={o.id} className={`sim-o ${on ? "on" : ""} ${focus && o.rule === focus ? "focus" : ""}`} title={`${o.device} — 켜지는 조건: ${condShort(o.onIf, project)}`}>
              <span className="sim-o-top"><i className="sim-lamp" aria-hidden /><b>{o.label}</b></span>
              <span className="sim-o-cond">
                {condShort(o.onIf, project)}
                {o.rule && <button type="button" className="sim-rid sm" onClick={() => onFocus(focus === o.rule ? undefined : o.rule)}>{o.rule}</button>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────── 설명 점수 고리 ───────────── */

export function ScoreRing({ ok, total }: { ok: number; total: number }) {
  const r = 24, c = 2 * Math.PI * r, f = total ? ok / total : 0;
  return (
    <svg viewBox="0 0 60 60" className="sim-ring" role="img" aria-label={`${total}개 중 ${ok}개 설명함`}>
      <circle cx="30" cy="30" r={r} className="bg" />
      <circle cx="30" cy="30" r={r} className="fg" strokeDasharray={`${c * f} ${c}`} transform="rotate(-90 30 30)" />
      <text x="30" y="35" textAnchor="middle">{ok}<tspan className="of">/{total}</tspan></text>
    </svg>
  );
}

/* ───────────── 화면 설계도 — 화면마다 와이어프레임 한 장. 내려받을 수 있게 색은 속성으로 박는다 ───────────── */

const PW = 196, PAD = 12, GAP = 22, HEAD = 34;
const blockH = (b: Project["screens"][number]["blocks"][number]) =>
  b.type === "image" ? 58 : b.type === "text" ? 30 : b.type === "stat" ? 34 : b.type === "notice" ? 26 : b.type === "button" ? 30
  : b.type === "big" ? 56 : b.type === "chart" ? (b.chart === "donut" ? 74 : 86) : b.type === "chips" ? 20
  : b.type === "progress" ? 22 + 13 * Math.min(8, b.data?.length ?? 1) : b.type === "table" ? 22 + 13 * Math.min(7, (b.rows?.length ?? 0) + 1)
  : 8 + 18 * Math.max(1, b.items?.length ?? 1);
const NUM = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫";

export function SpecBoard({ project, id }: { project: Project; id?: string }) {
  // 줄 나누기 — 메뉴가 있으면 메뉴마다 한 줄(최대 4장씩), 없으면 3장씩
  const groups = project.menu?.length ? menuGroups(project).filter((g) => g.screens.length) : [{ id: "", title: "", screens: project.screens }];
  const cols = project.menu?.length ? Math.min(4, Math.max(...groups.map((g) => g.screens.length))) : Math.min(project.screens.length, 3);
  const lines = groups.flatMap((g) => Array.from({ length: Math.ceil(g.screens.length / cols) }, (_, k) => ({ label: k === 0 ? `${g.title}${g.path ? `  ${g.path}` : ""}` : "", screens: g.screens.slice(k * cols, k * cols + cols) })));
  const order = lines.flatMap((l) => l.screens); // 번호는 그린 순서대로
  const idx = (sid?: string) => order.findIndex((s) => s.id === sid);
  const inner = (s: Project["screens"][number]) => s.blocks.reduce((h, b) => h + blockH(b) + 7, 0);
  const LBL = 28;
  const rowH = lines.map((l) => Math.max(200, ...l.screens.map((s) => HEAD + 26 + inner(s) + PAD)));
  const rowY: number[] = [];
  let acc = 4;
  lines.forEach((l, r) => {
    if (l.label) acc += LBL;
    rowY.push(acc);
    acc += rowH[r] + 30 + GAP;
  });
  const W = cols * PW + (cols - 1) * GAP + 8;
  // 맨 아래 — 🖍 연필 메모 목록 (다음 도구에 전할 추가 요청)
  const memo = order.flatMap((s, i) => [
    ...(s.sketch?.notes ?? []).map((n, k) => ({ key: `${s.id}n${k}`, text: `${NUM[i]} ${clip(s.title, 10)} · ${"①②③④⑤⑥⑦⑧⑨⑩⑪⑫"[k]} ${clip(n.text || "(메모 없음)", Math.floor(W / 13) - 12)}` })),
    ...(s.sketch?.stickies ?? []).map((t, k) => ({ key: `${s.id}s${k}`, text: `${NUM[i]} ${clip(s.title, 10)} · 📒 ${clip(t.text.replace(/\n+/g, " / ") || "(빈 스티커)", Math.floor(W / 13) - 12)}` })),
  ]);
  const memoY = acc - GAP + 8;
  const H = memoY + (memo.length ? 34 + memo.length * 20 : 0) + 4;
  const font = "Pretendard, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif";
  return (
    <svg id={id} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} width={W} height={H} fontFamily={font} className="sim-board" role="img" aria-label={`${project.name} 화면 설계도 — 화면 ${order.length}장`}>
      <rect width={W} height={H} fill="#f4f6fb" />
      {lines.map((l, r) =>
        l.label ? (
          <g key={`l${r}`}>
            <rect x="4" y={rowY[r] - LBL + 2} width={W - 8} height="22" rx="11" fill="#1b2038" />
            <text x="16" y={rowY[r] - LBL + 17.5} fontSize="12" fontWeight="900" fill="#ffc83d">{l.label}</text>
            <text x={W - 16} y={rowY[r] - LBL + 17.5} fontSize="11" fontWeight="700" fill="#c7d0ff" textAnchor="end">화면 {groups.find((g) => l.screens[0] && g.screens.includes(l.screens[0]))?.screens.length ?? l.screens.length}장</text>
          </g>
        ) : null,
      )}
      {lines.flatMap((l, r) => l.screens.map((s, c) => ({ s, r, c }))).map(({ s, r, c }) => {
        const i = idx(s.id);
        const PH = rowH[r];
        const x = 4 + c * (PW + GAP), y = rowY[r];
        let cy = y + 30 + HEAD + 14;
        const start = s.id === project.start;
        return (
          <g key={s.id}>
            <text x={x + 4} y={y + 18} fontSize="13" fontWeight="900" fill="#1b2038">{NUM[i] ?? i + 1} {clip(s.title, 12)}</text>
            {start && <text x={x + PW - 4} y={y + 18} fontSize="10.5" fontWeight="800" fill="#d97706" textAnchor="end">▶ 첫 화면</text>}
            <rect x={x} y={y + 26} width={PW} height={PH} rx="20" fill="#fff" stroke="#1b2038" strokeWidth="2.5" />
            <rect x={x + PW / 2 - 22} y={y + 32} width="44" height="5" rx="2.5" fill="#dfe3f0" />
            <line x1={x} x2={x + PW} y1={y + 30 + HEAD} y2={y + 30 + HEAD} stroke="#dfe3f0" strokeWidth="1.5" />
            <text x={x + PW / 2} y={y + 30 + HEAD - 9} fontSize="11.5" fontWeight="900" textAnchor="middle" fill="#1b2038">{clip(s.title, 14)}</text>
            {s.blocks.map((b) => {
              const h = blockH(b), bx = x + PAD, bw = PW - PAD * 2, by = cy;
              cy += h + 7;
              const cond = b.showIf ? { strokeDasharray: "4 3" } : {};
              const tgt = idx(b.go);
              const t = b.text ?? "";
              return (
                <g key={b.id}>
                  {b.type === "big" && (
                    <>
                      <rect x={bx} y={by} width={bw} height={h} rx="10" fill="#fff" stroke="#c8cee0" strokeWidth="1.5" />
                      {b.text && <text x={bx + bw / 2} y={by + 13} fontSize="9" fontWeight="700" textAnchor="middle" fill="#6b7280">{clip(b.text, 18)}</text>}
                      <text x={bx + bw / 2} y={by + 36} fontSize="20" fontWeight="900" textAnchor="middle" fill="#1b2038">{clip(`${b.val ?? ""}${b.unit ?? ""}`, 12)}</text>
                      {b.sub && <text x={bx + bw / 2} y={by + 50} fontSize="8.5" fontWeight="700" textAnchor="middle" fill="#9aa1b8">{clip(b.sub, 26)}</text>}
                    </>
                  )}
                  {b.type === "chips" && (b.items ?? []).slice(0, 5).map((c, k, a) => {
                    const cw = (bw - (a.length - 1) * 4) / a.length;
                    return (
                      <g key={k}>
                        <rect x={bx + k * (cw + 4)} y={by + 1} width={cw} height="17" rx="8.5" fill={c.startsWith("*") ? "#1b2038" : "#fff"} stroke="#1b2038" strokeWidth="1.2" />
                        <text x={bx + k * (cw + 4) + cw / 2} y={by + 13} fontSize="9" fontWeight="800" textAnchor="middle" fill={c.startsWith("*") ? "#fff" : "#1b2038"}>{clip(c.replace(/^\*/, ""), 5)}</text>
                      </g>
                    );
                  })}
                  {b.type === "chart" && (() => {
                    const d = b.data ?? [];
                    const max = Math.max(1, ...d.map((x) => Math.max(x.value, x.value2 ?? 0)));
                    const top = by + 18, base = by + h - 8, step = (bw - 16) / Math.max(1, d.length);
                    const yv = (v: number) => base - (v / max) * (base - top);
                    const xi = (i: number) => bx + 8 + step * i + step / 2;
                    return (
                      <>
                        <rect x={bx} y={by} width={bw} height={h} rx="10" fill="#fff" stroke="#c8cee0" strokeWidth="1.5" />
                        <text x={bx + 8} y={by + 12} fontSize="9" fontWeight="800" fill="#4b5574">{clip(b.text ?? "", 20)}</text>
                        {b.chart === "donut" ? (
                          <>
                            <circle cx={bx + 34} cy={by + 44} r="20" fill="none" stroke="#eef0f7" strokeWidth="9" />
                            <circle cx={bx + 34} cy={by + 44} r="20" fill="none" stroke="#1b2038" strokeWidth="9" strokeDasharray={`${(2 * Math.PI * 20 * (d[0]?.value ?? 0)) / Math.max(1, d.reduce((a, x) => a + x.value, 0))} 999`} transform={`rotate(-90 ${bx + 34} ${by + 44})`} />
                            {d.slice(0, 4).map((x, k) => <text key={k} x={bx + 66} y={by + 28 + k * 12} fontSize="8.5" fontWeight="700" fill="#4b5574">{clip(`${x.label} ${x.note ?? x.value}`, 16)}</text>)}
                          </>
                        ) : b.chart === "line" ? (
                          <>
                            {d.some((x) => x.value2 !== undefined) && <path d={d.map((x, i) => `${i ? "L" : "M"}${xi(i)},${yv(x.value2 ?? x.value)}`).join(" ")} fill="none" stroke="#9aa1b8" strokeWidth="1.4" strokeDasharray="3 2" />}
                            <path d={d.map((x, i) => `${i ? "L" : "M"}${xi(i)},${yv(x.value)}`).join(" ")} fill="none" stroke="#1b2038" strokeWidth="2" />
                          </>
                        ) : (
                          d.map((x, i) => <rect key={i} x={xi(i) - Math.min(8, step * 0.3)} y={yv(x.value)} width={Math.min(16, step * 0.6)} height={base - yv(x.value)} rx="2" fill="#1b2038" />)
                        )}
                        {b.chart !== "donut" && <line x1={bx + 6} x2={bx + bw - 6} y1={base} y2={base} stroke="#c8cee0" />}
                      </>
                    );
                  })()}
                  {b.type === "progress" && (
                    <>
                      <rect x={bx} y={by} width={bw} height={h} rx="10" fill="#fff" stroke="#c8cee0" strokeWidth="1.5" />
                      <text x={bx + 8} y={by + 13} fontSize="9" fontWeight="800" fill="#4b5574">{clip(b.text ?? "", 20)}</text>
                      {(b.data ?? []).slice(0, 8).map((x, k) => {
                        const yy = by + 22 + k * 13, goal = x.value2 ?? Math.max(1, ...(b.data ?? []).map((q) => q.value));
                        return (
                          <g key={k}>
                            <text x={bx + 8} y={yy + 6} fontSize="8" fontWeight="700" fill="#4b5574">{clip(x.label, 4)}</text>
                            <rect x={bx + 40} y={yy} width={bw - 84} height="7" rx="3.5" fill="#eef0f7" />
                            <rect x={bx + 40} y={yy} width={(bw - 84) * Math.min(1, x.value / goal)} height="7" rx="3.5" fill="#1b2038" />
                            <text x={bx + bw - 8} y={yy + 6.5} fontSize="8" fontWeight="800" textAnchor="end" fill="#1b2038">{clip(x.note ?? `${x.value}`, 6)}</text>
                          </g>
                        );
                      })}
                    </>
                  )}
                  {b.type === "table" && (
                    <>
                      <rect x={bx} y={by} width={bw} height={h} rx="10" fill="#fff" stroke="#c8cee0" strokeWidth="1.5" />
                      <text x={bx + 8} y={by + 13} fontSize="9" fontWeight="800" fill="#4b5574">{clip(b.text ?? "", 20)}</text>
                      {[b.cols ?? [], ...(b.rows ?? [])].slice(0, 7).map((r, k) => (
                        <g key={k}>
                          {k > 0 && <line x1={bx + 6} x2={bx + bw - 6} y1={by + 16 + k * 13} y2={by + 16 + k * 13} stroke="#eef0f7" />}
                          {r.map((c, j) => <text key={j} x={bx + 8 + (j * (bw - 16)) / r.length} y={by + 26 + k * 13} fontSize="8" fontWeight={k ? 600 : 900} fill={k ? "#4b5574" : "#1b2038"}>{clip(c, Math.max(3, Math.floor(26 / r.length)))}</text>)}
                        </g>
                      ))}
                    </>
                  )}
                  {b.type === "image" && (
                    <>
                      <rect x={bx} y={by} width={bw} height={h} rx="8" fill="#eef0f7" stroke="#b9c0d8" strokeDasharray="4 3" />
                      <path d={`M${bx},${by + h} L${bx + bw},${by}`} stroke="#d5dae8" />
                      <path d={`M${bx},${by} L${bx + bw},${by + h}`} stroke="#d5dae8" />
                      <text x={bx + bw / 2} y={by + h / 2 + 4} fontSize="10.5" fontWeight="700" textAnchor="middle" fill="#6b7280">{clip(t, 16)}</text>
                    </>
                  )}
                  {b.type === "text" && [0, 1].map((k) => <rect key={k} x={bx} y={by + 6 + k * 12} width={k ? bw * 0.62 : bw} height="6" rx="3" fill="#d5dae8" />)}
                  {b.type === "stat" && (
                    <>
                      <rect x={bx} y={by} width={bw} height={h} rx="8" fill="#fff" stroke="#c8cee0" strokeWidth="1.5" />
                      <text x={bx + 9} y={by + 21} fontSize="10.5" fontWeight="700" fill="#4b5574">{clip(t, 9)}</text>
                      <text x={bx + bw - 9} y={by + 23} fontSize="15" fontWeight="900" textAnchor="end" fill="#1b2038">{b.val ? `${b.val}${b.unit ?? ""}` : b.bind ? `${project.state[b.bind]?.value ?? "?"}${project.state[b.bind]?.unit ?? ""}` : "?"}</text>
                    </>
                  )}
                  {b.type === "notice" && (
                    <>
                      <rect x={bx} y={by} width={bw} height={h} rx="7" fill={b.tone === "good" ? "#e2f7ef" : "#ffe9e4"} stroke={b.tone === "good" ? "#aee5cf" : "#ffc4b8"} strokeWidth="1.5" {...cond} />
                      <text x={bx + 8} y={by + 17} fontSize="10" fontWeight="800" fill={b.tone === "good" ? "#0b6b4f" : "#b42318"}>{clip(t, 17)}</text>
                    </>
                  )}
                  {b.type === "list" && (
                    <>
                      <rect x={bx} y={by} width={bw} height={h} rx="8" fill="#fff" stroke="#c8cee0" strokeWidth="1.5" />
                      {(b.items ?? [""]).map((_, k) => (
                        <g key={k}>
                          <circle cx={bx + 10} cy={by + 13 + k * 18} r="2.5" fill="#9aa1b8" />
                          <rect x={bx + 18} y={by + 10 + k * 18} width={bw * (k % 2 ? 0.55 : 0.75)} height="6" rx="3" fill="#d5dae8" />
                        </g>
                      ))}
                    </>
                  )}
                  {b.type === "button" && (
                    <>
                      <rect x={bx} y={by + 2} width={bw} height={h - 2} rx="9" fill="#1b2038" />
                      <rect x={bx} y={by} width={bw} height={h - 2} rx="9" fill="#fff" stroke="#1b2038" strokeWidth="1.8" {...cond} />
                      <text x={bx + 9} y={by + 18} fontSize="10.5" fontWeight="900" fill="#1b2038">{clip(t, b.rule || tgt >= 0 ? 10 : 17)}</text>
                      {tgt >= 0 && (
                        <>
                          <rect x={bx + bw - 30} y={by + 6} width="25" height="16" rx="8" fill="#fff4d6" stroke="#f0b429" />
                          <text x={bx + bw - 17.5} y={by + 18} fontSize="10" fontWeight="900" textAnchor="middle" fill="#92400e">→{NUM[tgt]}</text>
                        </>
                      )}
                      {b.rule && (
                        <>
                          <rect x={bx + bw - (tgt >= 0 ? 60 : 32)} y={by + 6} width="27" height="16" rx="8" fill="#ede9fe" />
                          <text x={bx + bw - (tgt >= 0 ? 46.5 : 18.5)} y={by + 18} fontSize="9.5" fontWeight="900" textAnchor="middle" fill="#6d28d9">{b.rule}</text>
                        </>
                      )}
                    </>
                  )}
                </g>
              );
            })}
            {s.sketch && (() => {
              const top = y + 30 + HEAD + 6, bh = y + 26 + PH - PAD - top, bx = x + 4, bw = PW - 8;
              return (
                <g>
                  {s.sketch.lines.map((l, k) => <path key={k} d={pathOf(l.p, bw, bh, bx, top)} fill="none" stroke={l.c === "red" ? "#e5484d" : "#6b6f80"} strokeWidth={l.c === "red" ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />)}
                  {(s.sketch.stickies ?? []).map((t, k) => {
                    const sw = t.w * bw, sh = t.min ? 14 : t.h * bh, sx = bx + t.x * bw, sy = top + t.y * bh;
                    const fill = { yellow: "#fff7a8", blue: "#d3eaff", green: "#d7f7c8", pink: "#ffd9e5", purple: "#e8dcff", gray: "#eeeeee" }[t.color];
                    const per = Math.max(4, Math.floor(sw / 7.5));
                    const lines = t.text.split("\n").flatMap((l) => (l ? l.match(new RegExp(`.{1,${per}}`, "gu")) ?? [""] : [""])).slice(0, Math.max(0, Math.floor((sh - 12) / 11)));
                    return (
                      <g key={`s${k}`}>
                        <rect x={sx + 1.5} y={sy + 2} width={sw} height={sh} rx="2" fill="#1b2038" opacity="0.12" />
                        <rect x={sx} y={sy} width={sw} height={sh} rx="2" fill={fill} stroke="#00000022" />
                        <rect x={sx} y={sy} width={sw} height="5" rx="2" fill="#00000012" />
                        {lines.map((l, j) => <text key={j} x={sx + 4} y={sy + 15 + j * 11} fontSize="8.5" fontWeight="700" fill="#2b2b2b">{l}</text>)}
                      </g>
                    );
                  })}
                  {s.sketch.notes.map((n, k) => (
                    <g key={`n${k}`}>
                      <circle cx={bx + n.x * bw} cy={top + n.y * bh} r="8" fill="#e5484d" stroke="#fff" strokeWidth="1.5" />
                      <text x={bx + n.x * bw} y={top + n.y * bh + 3.5} fontSize="9.5" fontWeight="900" textAnchor="middle" fill="#fff">{k + 1}</text>
                    </g>
                  ))}
                </g>
              );
            })()}
          </g>
        );
      })}
      {memo.length > 0 && (
        <g>
          <rect x="4" y={memoY} width={W - 8} height={26 + memo.length * 20} rx="12" fill="#fff" stroke="#e5484d" strokeDasharray="5 4" />
          <text x="16" y={memoY + 19} fontSize="12.5" fontWeight="900" fill="#e5484d">🖍 연필 메모 · 📒 스티커 — 다음 도구에 전할 추가 요청</text>
          {memo.map((m, k) => <text key={m.key} x="16" y={memoY + 40 + k * 20} fontSize="11.5" fontWeight="700" fill="#1b2038">{m.text}</text>)}
        </g>
      )}
    </svg>
  );
}

/** 설계도 범례 — 그림 속 기호가 무엇인지 */
export const BOARD_LEGEND: [string, string][] = [["→②", "누르면 ② 화면으로"], ["R3", "따르는 규칙"], ["- - -", "조건이 맞을 때만 보임"], ["▭ ╳", "그림 자리"], ["❶ 빨간 핀", "연필 메모"]];
