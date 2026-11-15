"use client";

// 화면 시뮬레이터 본체 — 화면 명세 하나(project)를 정해진 부품으로 그린다. /sim 페이지와 대화창 다이얼로그가 같이 쓴다.
// 돌려 보기: 버튼을 누르면 값이 바뀌고 화면이 넘어간다. 규칙이 붙은 버튼은 처음 누를 때 "어느 규칙이야?"를 되묻는다.
// 고치기: 전부 손으로 — 칸 · 규칙 · 값 · 버튼 동작 · 보이는 조건 · 사이트맵 (AI 0회).
// 🖍 연필: 화면 위에 긋고 번호 메모를 꽂는다 — 설계서 · 명세.md의 "추가 요청"으로 다음 도구에 넘어간다.
// 화면 배치 — 왼쪽 ① 기획(규칙 · 기기), 가운데 ② 앱 화면, 오른쪽 ③ 흐름 · 기록. 글은 줄이고 그림(SVG)으로 보여 준다.
import { useEffect, useState, type ReactNode } from "react";
import { encodeShare, type Block, type BlockType, type Cond, type Hardware, type Project, type Screen, type Sketch } from "@/lib/sim";
import SketchLayer, { EMPTY_SKETCH, NUM, type PenTool } from "./SketchLayer";
import Stickies from "./Stickies";
import { Big, Chart, Chips, Progress, Table } from "./SimBlocks";
import { BOARD_LEGEND, clip, FlowTree, menuGroups, ScoreRing, SiteMap, SpecBoard, splitIcon, test, Wiring } from "./SimViz";

type Vals = Record<string, number>;
type Change = { icon: string; label: string; from: number; to: number };
type Flip = { label: string; on: boolean };
type SketchMap = Record<string, Sketch | undefined>; // 화면 id → 연필 · 스티커
const hasInk = (k?: Sketch) => Boolean(k && (k.lines.length || k.notes.length || k.stickies?.length));
type Log = { id: string; act: string; changes: Change[]; flips: Flip[]; to?: string };

const PALETTE: [BlockType, string][] = [["big", "🔠 큰 숫자"], ["stat", "🔢 숫자"], ["chart", "📈 차트"], ["progress", "📶 막대 기록"], ["table", "🧾 표"], ["chips", "🏷 칩"], ["text", "📝 글"], ["button", "🔘 버튼"], ["notice", "🔔 알림"], ["list", "📋 목록"], ["image", "🖼 그림"]];
const TYPE_NAME = Object.fromEntries(PALETTE) as Record<BlockType, string>;

const initVals = (p: Project): Vals => Object.fromEntries(Object.entries(p.state).map(([k, v]) => [k, v.value]));
const fill = (s: string | undefined, v: Vals) => (s ?? "").replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? "?"));
const condText = (c: Cond, p: Project) => `${p.state[c.key]?.label ?? c.key} ${c.op} ${c.value}`;
const uid = () => Math.random().toString(36).slice(2, 8);
const OPS: Cond["op"][] = ["<", "<=", ">", ">=", "==", "!="];
const OP_NAME: Record<Cond["op"], string> = { "<": "<", "<=": "≤", ">": ">", ">=": "≥", "==": "=", "!=": "≠" };
// 출력 램프가 바뀐 것만 — 켜짐 · 꺼짐이 뒤집힌 것
const flips = (hw: Hardware | undefined, before: Vals, after: Vals): Flip[] =>
  (hw?.outputs ?? []).filter((o) => test(o.onIf, before) !== test(o.onIf, after)).map((o) => ({ label: o.label, on: test(o.onIf, after) }));
export function toMd(p: Project) {
  const title = (id?: string) => p.screens.find((s) => s.id === id)?.title ?? "";
  const edges = p.screens.flatMap((s) => s.blocks.filter((b) => b.type === "button" && b.go && title(b.go)).map((b) => `    ${s.id} -->|"${b.text}"| ${b.go}`));
  const rows = (s: Screen) =>
    s.blocks.map((b) => {
      const what =
        b.type === "list" || b.type === "chips" ? (b.items ?? []).join(" / ")
        : b.type === "chart" || b.type === "progress" ? `${b.text ?? ""} — ${(b.data ?? []).map((d) => `${d.label} ${d.note ?? d.value}`).join(" · ")}`
        : b.type === "table" ? `${b.text ?? ""} — ${(b.cols ?? []).join(" · ")} (${b.rows?.length ?? 0}줄)`
        : `${b.text ?? ""}${b.val ? ` ${b.val}` : ""}${b.bind ? ` ({${b.bind}})` : ""}`;
      const does = [b.do?.map((a) => `${p.state[a.key]?.label ?? a.key} ${a.op === "add" ? (a.value >= 0 ? "+" : "") + a.value : "= " + a.value}`).join(", "), b.go ? `→ ${title(b.go)}` : "", b.showIf ? `보이는 조건: ${condText(b.showIf, p)}` : "", b.disabledIf ? `막히는 조건: ${condText(b.disabledIf, p)}` : ""].filter(Boolean).join(" · ");
      return `| ${TYPE_NAME[b.type]} | ${what} | ${does || "—"} | ${b.rule ?? "—"} |`;
    });
  return [
    `# ${p.emoji} ${p.name} — 화면 명세`,
    "",
    `> ${p.oneLine}`,
    "",
    p.menu?.length ? "## 1. 사이트맵 · 화면 흐름 (메뉴마다 한 묶음)" : "## 1. 화면 흐름",
    "",
    "```mermaid",
    "flowchart TB",
    ...(p.menu?.length
      ? menuGroups(p).flatMap((g) => [`    subgraph ${g.id || "lost"}["${g.title}${g.path ? ` ${g.path}` : ""}"]`, ...g.screens.map((s) => `        ${s.id}["${s.title}"]`), "    end"])
      : p.screens.map((s) => `    ${s.id}["${s.title}"]`)),
    ...edges,
    "```",
    "",
    "## 2. 규칙",
    "",
    ...(p.rules.length ? p.rules.map((r) => `- **${r.id}** ${r.text}`) : ["- (아직 정한 규칙이 없다)"]),
    "",
    "## 3. 기억하는 값",
    "",
    "| 값 | 처음 | 범위 |",
    "|---|---|---|",
    ...Object.values(p.state).map((v) => `| ${v.label} | ${v.value}${v.unit} | ${v.min}~${v.max}${v.unit} |`),
    "",
    "## 4. 화면 칸",
    ...p.screens.flatMap((s) => ["", `### ${s.title}${s.id === p.start ? " (첫 화면)" : ""}`, "", "| 칸 | 내용 | 누르면 · 조건 | 규칙 |", "|---|---|---|---|", ...rows(s)]),
    ...(p.hardware && (p.hardware.inputs.length || p.hardware.outputs.length)
      ? [
          "",
          "## 5. 하드웨어 — 시뮬레이터에서는 가짜로 돌린다",
          "",
          "| 방향 | 기기 | 값 · 켜지는 조건 | 규칙 |",
          "|---|---|---|---|",
          ...p.hardware.inputs.map((i) => `| 📥 입력 | ${i.device} | ${p.state[i.key]?.label ?? i.key} (${p.state[i.key]?.min}~${p.state[i.key]?.max}${p.state[i.key]?.unit ?? ""}) | — |`),
          ...p.hardware.outputs.map((o) => `| 📤 출력 | ${o.device} | ${o.label}: ${condText(o.onIf, p)} | ${o.rule ?? "—"} |`),
        ]
      : []),
    ...(p.screens.some((s) => s.sketch?.notes.length || s.sketch?.lines.length || s.sketch?.stickies?.length)
      ? [
          "",
          "## 6. 🖍 연필 메모 — 다음 도구에 전할 추가 요청",
          "",
          "> 화면 위에 연필로 그은 선 · 번호 메모다. 위치는 대략이고, 설계도 SVG에 같이 그려져 있다.",
          ...p.screens.filter((s) => s.sketch?.notes.length || s.sketch?.lines.length || s.sketch?.stickies?.length).flatMap((s) => ["", `### ${s.title}`, "", ...s.sketch!.notes.map((n, i) => `- ${"①②③④⑤⑥⑦⑧⑨⑩⑪⑫"[i]} ${n.text || "(메모 없음)"}`), ...(s.sketch!.stickies ?? []).map((t) => `- 📒 스티커: ${t.text.replace(/\n+/g, " / ") || "(빈 스티커)"}`), ...(s.sketch!.lines.length ? [`- ✏️ 손으로 그은 선 ${s.sketch!.lines.length}개`] : [])]),
        ]
      : []),
    "",
  ].join("\n");
}

export const segClass = (on: boolean) => `rounded-full border px-3.5 py-1.5 text-[13px] font-bold transition ${on ? "border-clay bg-clay text-[#1a1300]" : "border-line bg-sand text-ink hover:border-clay"}`;
export const cardClass = "rounded-2xl border border-line bg-card p-4";

/** 카드 머리 — 아이콘 · 이름 · 오른쪽 덧붙임 */
function Head({ icon, children, right }: { icon: string; children: ReactNode; right?: ReactNode }) {
  return (
    <h2 className="sim-h">
      <span className="sim-h-i" aria-hidden>{icon}</span>
      <span className="mr-auto">{children}</span>
      {right}
    </h2>
  );
}

export default function SimStage({ project, onChange, title, sub, actions, top, onResetAll, focusRule, onJump }: {
  project: Project;
  onChange: (next: Project) => void;
  title: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode; // 헤더 오른쪽 끝 — 앱으로 · 닫기
  top?: ReactNode; // 왼쪽 맨 위 — 프로젝트 고르기
  onResetAll?: () => void;
  focusRule?: string; // 대화에서 "📱 화면에서 눌러 보기"로 들어왔을 때 — 그 규칙과 버튼을 빛낸다
  onJump?: (q: number) => void; // 규칙의 💬 Q 번호를 누르면 그 질문이 있는 대화로 돌아간다
}) {
  const screenOf = (ruleId?: string) => project.screens.find((s) => s.blocks.some((b) => b.type === "button" && b.rule === ruleId))?.id;
  const [focus, setFocus] = useState<string | undefined>(focusRule);
  const [screenId, setScreenId] = useState(() => screenOf(focusRule) ?? project.start);
  const [vals, setVals] = useState<Vals>(() => initVals(project));
  const [edit, setEdit] = useState(false);
  const [askOn, setAskOn] = useState(false); // 되묻기 퀴즈 — 처음엔 꺼 둔다 (돌려 보기를 막지 않게)
  const [quiz, setQuiz] = useState<{ block: Block; picked?: string } | null>(null);
  const [explained, setExplained] = useState<Record<string, boolean>>({});
  const [log, setLog] = useState<Log[]>([]);
  const [modal, setModal] = useState<null | { kind: "spec"; tab: "board" | "md" } | { kind: "share"; url: string }>(null);
  const [copied, setCopied] = useState(false);
  const [pen, setPen] = useState(false); // 🖍 연필 모드
  const [tool, setTool] = useState<PenTool>("pencil");
  const [noteAt, setNoteAt] = useState<number | null>(null); // 방금 꽂은 메모 — 그 글칸에 커서
  const [sel, setSel] = useState<string | null>(null); // ✏️ 고치기에서 고르는 칸
  const [hist, setHist] = useState<{ past: SketchMap[]; future: SketchMap[] }>({ past: [], future: [] }); // 연필 · 스티커 히스토리
  const [mapTab, setMapTab] = useState<"site" | "flow">(project.menu?.length ? "site" : "flow");
  const [siteEdit, setSiteEdit] = useState(false);

  useEffect(() => {
    if (!pen) return;
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z" || (e.target as HTMLElement).closest("input, textarea")) return;
      e.preventDefault();
      document.getElementById(e.shiftKey ? "sim-redo" : "sim-undo")?.click();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pen]);

  const screen = project.screens.find((s) => s.id === screenId) ?? project.screens[0];
  const ruleButtons = project.screens.flatMap((s) => s.blocks).filter((b) => b.type === "button" && b.rule);
  const okCount = ruleButtons.filter((b) => explained[b.id]).length;
  const val = (k: string) => vals[k] ?? project.state[k]?.value ?? 0;
  const allVals: Vals = Object.fromEntries(Object.keys(project.state).map((k) => [k, val(k)]));
  const hw = project.hardware;
  const hwInputs = (hw?.inputs ?? []).filter((i) => project.state[i.key]);
  const hwOutputs = hw?.outputs ?? [];
  const hasHw = hwInputs.length > 0 || hwOutputs.length > 0;
  const plainKeys = Object.keys(project.state).filter((k) => !hwInputs.some((i) => i.key === k));

  const slide = (k: string, n: number) => {
    const next = { ...allVals, [k]: n };
    const f = flips(hw, allVals, next);
    const v = project.state[k];
    if (f.length) setLog((l) => [{ id: uid(), act: `🎛 ${splitIcon(v.label).icon || v.label} ${n}${v.unit}`, changes: [], flips: f }, ...l].slice(0, 6));
    setVals(next);
  };

  const restart = () => {
    setScreenId(project.start);
    setVals(initVals(project));
    setQuiz(null);
    setLog([]);
  };
  const change = (fn: (p: Project) => void) => {
    const next = structuredClone(project);
    fn(next);
    onChange(next);
  };

  const run = (b: Block) => {
    const next = { ...allVals };
    const changes: Change[] = [];
    for (const a of b.do ?? []) {
      const v = project.state[a.key];
      if (!v) continue;
      const before = next[a.key];
      next[a.key] = Math.max(v.min, Math.min(v.max, a.op === "add" ? before + a.value : a.value));
      if (before !== next[a.key]) changes.push({ icon: splitIcon(v.label).icon || "•", label: v.label, from: before, to: next[a.key] });
    }
    const to = project.screens.find((s) => s.id === b.go);
    setVals(next);
    if (to) setScreenId(to.id);
    setLog((l) => [{ id: uid(), act: b.text ?? "", changes, flips: flips(project.hardware, allVals, next), to: to?.title }, ...l].slice(0, 6));
  };
  const press = (b: Block) => {
    if (quiz) return; // 되묻기에 답하기 전에는 뒤의 버튼이 눌리지 않는다
    if (askOn && b.rule && !(b.id in explained) && project.rules.length > 1) setQuiz({ block: b });
    else run(b);
  };
  const answer = (ruleId: string) => {
    if (!quiz || quiz.picked) return;
    setQuiz({ ...quiz, picked: ruleId });
    setExplained((e) => ({ ...e, [quiz.block.id]: ruleId === quiz.block.rule }));
  };
  const closeQuiz = () => {
    if (!quiz) return;
    const b = quiz.block;
    setQuiz(null);
    run(b);
  };
  const pickRule = (id?: string) => {
    const next = focus === id ? undefined : id;
    setFocus(next);
    const sid = screenOf(next);
    if (sid && !edit) setScreenId(sid);
  };

  const editBlock = (id: string, fn: (b: Block) => void) => change((p) => p.screens.forEach((s) => s.blocks.forEach((b) => b.id === id && fn(b))));
  const addBlock = (type: BlockType) =>
    change((p) => {
      const s = p.screens.find((x) => x.id === screen.id);
      const base: Block = { id: `b${uid()}`, type, text: type === "button" ? "새 버튼" : type === "notice" ? "🔔 새 알림" : type === "image" ? "🖼 그림 자리" : type === "stat" ? "숫자 이름" : "새 글" };
      if (type === "stat") base.bind = Object.keys(p.state)[0];
      if (type === "list") base.items = ["첫째", "둘째"];
      if (type === "big") Object.assign(base, { text: "오늘", val: "4:12:30", sub: "가장 잘된 날 기준" });
      if (type === "chips") base.items = ["*1주", "1달", "3달"];
      if (type === "chart") Object.assign(base, { text: "📈 최근 7일", chart: "bar", unit: "분", data: ["월", "화", "수", "목", "금", "토", "일"].map((label, i) => ({ label, value: 180 + i * 12 })) });
      if (type === "progress") Object.assign(base, { text: "📶 오늘의 기록", unit: "분", data: [{ label: "국어", value: 40, value2: 40 }, { label: "수학", value: 90, value2: 90 }] });
      if (type === "table") Object.assign(base, { text: "🧾 표", cols: ["이름", "값"], rows: [["첫째", "1"], ["둘째", "2"]] });
      s?.blocks.push(base);
    });
  const moveBlock = (id: string) =>
    change((p) => {
      const s = p.screens.find((x) => x.id === screen.id);
      const i = s?.blocks.findIndex((b) => b.id === id) ?? -1;
      if (s && i > 0) [s.blocks[i - 1], s.blocks[i]] = [s.blocks[i], s.blocks[i - 1]];
    });
  const moveDown = (id: string) =>
    change((p) => {
      const s = p.screens.find((x) => x.id === screen.id);
      const i = s?.blocks.findIndex((b) => b.id === id) ?? -1;
      if (s && i >= 0 && i < s.blocks.length - 1) [s.blocks[i + 1], s.blocks[i]] = [s.blocks[i], s.blocks[i + 1]];
    });
  const dupBlock = (id: string) => {
    const nid = `b${uid()}`;
    change((p) => {
      const s = p.screens.find((x) => x.id === screen.id);
      const i = s?.blocks.findIndex((b) => b.id === id) ?? -1;
      if (s && i >= 0 && s.blocks.length < 24) s.blocks.splice(i + 1, 0, { ...structuredClone(s.blocks[i]), id: nid });
    });
    setSel(nid);
  };
  const removeBlock = (id: string) =>
    change((p) => {
      const s = p.screens.find((x) => x.id === screen.id);
      if (s) s.blocks = s.blocks.filter((b) => b.id !== id);
    });
  const addScreen = () => {
    const id = `s${uid()}`;
    change((p) => p.screens.push({ id, title: "새 화면", blocks: [{ id: `b${uid()}`, type: "text", text: "여기에 무엇을 보여 줄까?" }] }));
    setScreenId(id);
  };

  // ── 사이트맵 고치기 — 메뉴 이름 · 주소, 화면 이름 · 메뉴 옮기기 · 첫 화면 · 더하기 · 지우기 ──
  const groups = menuGroups(project);
  const menuOn = (project.menu?.length ?? 0) > 0;
  const setMenu = (id: string, key: "title" | "path", v: string) => change((p) => { const m = p.menu?.find((x) => x.id === id); if (m) m[key] = v; });
  const addMenu = () => change((p) => { (p.menu ??= []).push({ id: `m${uid()}`, title: "🆕 새 메뉴", path: "/new" }); });
  const makeMenu = () => change((p) => { p.menu = [{ id: "main", title: "🏠 메인", path: "/" }]; p.screens.forEach((s) => (s.group = "main")); });
  const removeMenu = (id: string) => change((p) => { p.menu = p.menu?.filter((m) => m.id !== id); if (!p.menu?.length) delete p.menu; });
  const screenSet = (id: string, fn: (s: Screen) => void) => change((p) => { const s = p.screens.find((x) => x.id === id); if (s) fn(s); });
  const addScreenIn = (group: string) => {
    const id = `s${uid()}`;
    change((p) => p.screens.push({ id, title: "🆕 새 화면", ...(group ? { group } : {}), blocks: [{ id: `b${uid()}`, type: "text", text: "여기에 무엇을 보여 줄까?" }] }));
    setScreenId(id);
  };
  const removeScreen = (id: string) => {
    if (project.screens.length <= 1) return;
    change((p) => {
      p.screens = p.screens.filter((s) => s.id !== id);
      p.screens.forEach((s) => s.blocks.forEach((b) => b.go === id && delete b.go));
      if (p.start === id) p.start = p.screens[0].id;
    });
    if (screenId === id) setScreenId(project.start === id ? project.screens.find((s) => s.id !== id)!.id : project.start);
  };
  const screenFull = project.screens.length >= 12;

  // ── 규칙 · 값 손으로 고치기 ──
  const addRule = () => change((p) => { const n = Math.max(0, ...p.rules.map((r) => Number(r.id.replace(/\D/g, "")) || 0)) + 1; p.rules.push({ id: `R${n}`, text: "새 규칙 — 언제 · 얼마나 · 무엇을" }); });
  const removeRule = (id: string) => change((p) => {
    p.rules = p.rules.filter((r) => r.id !== id);
    p.screens.forEach((s) => s.blocks.forEach((b) => b.rule === id && delete b.rule));
    p.hardware?.outputs.forEach((o) => o.rule === id && delete o.rule);
  });
  const addValue = () => change((p) => { const k = `v${uid()}`; p.state[k] = { label: "🔢 새 값", value: 0, min: 0, max: 10, unit: "" }; });
  const removeValue = (k: string) => change((p) => {
    delete p.state[k];
    p.screens.forEach((s) => s.blocks.forEach((b) => {
      if (b.bind === k) delete b.bind;
      if (b.do) b.do = b.do.filter((a) => a.key !== k);
      if (b.showIf?.key === k) delete b.showIf;
      if (b.disabledIf?.key === k) delete b.disabledIf;
    }));
    if (p.hardware) p.hardware = { inputs: p.hardware.inputs.filter((i) => i.key !== k), outputs: p.hardware.outputs.filter((o) => o.onIf.key !== k) };
  });
  const firstKey = Object.keys(project.state)[0];
  // ── 🖍 스케치 ──
  // 연필 · 스티커는 화면마다 붙지만, 히스토리는 모든 화면을 한 장으로 찍어 둔다 → 전체 초기화도 되돌릴 수 있다
  const mapNow = (): SketchMap => Object.fromEntries(project.screens.map((s) => [s.id, s.sketch]));
  const applyMap = (m: SketchMap) => change((p) => p.screens.forEach((s) => { const k = m[s.id]; if (hasInk(k)) s.sketch = k; else delete s.sketch; }));
  const commit = (m: SketchMap) => {
    setHist((h) => ({ past: [...h.past.slice(-49), mapNow()], future: [] }));
    applyMap(m);
  };
  const setSketch = (next: Sketch, record = true) => (record ? commit : applyMap)({ ...mapNow(), [screen.id]: next });
  const undo = () => {
    if (!hist.past.length) return;
    setHist({ past: hist.past.slice(0, -1), future: [mapNow(), ...hist.future] });
    applyMap(hist.past[hist.past.length - 1]);
  };
  const redo = () => {
    if (!hist.future.length) return;
    setHist({ past: [...hist.past, mapNow()], future: hist.future.slice(1) });
    applyMap(hist.future[0]);
  };
  const clearAll = () => commit({});
  const sketch = screen.sketch ?? EMPTY_SKETCH;
  const noteCount = project.screens.reduce((n, s) => n + (s.sketch?.notes.length ?? 0) + (s.sketch?.stickies?.length ?? 0), 0);
  const inkAny = project.screens.some((s) => hasInk(s.sketch));

  const share = async () => {
    const url = `${location.origin}/sim#s=${await encodeShare(project)}`;
    setCopied(false);
    setModal({ kind: "share", url });
  };
  const copy = (text: string) => navigator.clipboard?.writeText(text).then(() => setCopied(true), () => {});
  // 설계도 SVG 내려받기 — 화면에 그린 그림을 그대로 파일로
  const downloadBoard = () => {
    const el = document.getElementById("sim-board-svg");
    if (!el) return;
    const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(el)}`], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${project.name}_화면설계도.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const view = (b: Block, all = false) => {
    if (!all && b.showIf && !test(b.showIf, allVals)) return null;
    if (b.type === "text") return <p key={b.id} className="sim-text">{fill(b.text, allVals)}</p>;
    if (b.type === "image") return <div key={b.id} className="sim-image">{b.text}</div>;
    if (b.type === "big") return <Big key={b.id} b={b} />;
    if (b.type === "chart") return <Chart key={b.id} b={b} />;
    if (b.type === "progress") return <Progress key={b.id} b={b} />;
    if (b.type === "table") return <Table key={b.id} b={b} />;
    if (b.type === "chips") return <Chips key={b.id} b={b} />;
    if (b.type === "notice") return <div key={b.id} className={`sim-notice ${b.tone === "good" ? "good" : "warn"}`}>{fill(b.text, allVals)}</div>;
    if (b.type === "list") return <ul key={b.id} className="sim-list">{(b.items ?? []).map((it, i) => <li key={i}>{fill(it, allVals)}</li>)}</ul>;
    if (b.type === "stat") {
      const v = b.bind ? project.state[b.bind] : undefined;
      return (
        <div key={b.id} className="sim-stat">
          <span>{b.text}</span>
          <b>{b.val ?? (v && b.bind ? val(b.bind) : "?")}<small>{b.unit ?? v?.unit}</small></b>
        </div>
      );
    }
    const off = test(b.disabledIf, allVals);
    return (
      <button key={b.id} type="button" disabled={off} onClick={() => press(b)} className={`sim-btn ${focus && b.rule === focus ? "sim-focus" : ""}`}>
        {fill(b.text, allVals)}
        {b.rule && <span className={`sim-tag ${explained[b.id] ? "ok" : b.id in explained ? "miss" : ""}`}>{explained[b.id] ? "✅" : b.id in explained ? "🔁" : "❓"} {b.rule}</span>}
        {off && <span className="sim-off">🔒 지금은 막혀 있어</span>}
      </button>
    );
  };

  const condEdit = (label: string, c: Cond | undefined, set: (c: Cond | undefined) => void) => (
    <label className="sim-cond">{label}
      <select aria-label={`${label} 값`} value={c?.key ?? ""} onChange={(e) => set(e.target.value ? { key: e.target.value, op: c?.op ?? ">=", value: c?.value ?? 1 } : undefined)}>
        <option value="">(항상)</option>
        {Object.entries(project.state).map(([k, v]) => <option key={k} value={k}>{clip(v.label, 10)}</option>)}
      </select>
      {c && (
        <>
          <select aria-label="비교" className="op" value={c.op} onChange={(e) => set({ ...c, op: e.target.value as Cond["op"] })}>{OPS.map((o) => <option key={o} value={o}>{OP_NAME[o]}</option>)}</select>
          <input aria-label="기준 값" type="number" className="num" value={c.value} onChange={(e) => set({ ...c, value: Number(e.target.value) || 0 })} />
        </>
      )}
    </label>
  );

  const editor = (b: Block, i: number) => (
    <div key={b.id} className="sim-edit">
      <div className="flex items-center gap-1.5">
        <span className="shrink-0 text-[11px] font-bold text-[#6b7280]">{TYPE_NAME[b.type]}</span>
        <input
          aria-label="칸 내용"
          value={b.type === "list" || b.type === "chips" ? (b.items ?? []).join(", ") : b.text ?? ""}
          onChange={(e) => editBlock(b.id, (x) => (b.type === "list" || b.type === "chips" ? (x.items = e.target.value.split(",").map((t) => t.trimStart())) : (x.text = e.target.value)))}
        />
        <button type="button" aria-label="위로" disabled={i === 0} onClick={() => moveBlock(b.id)}>↑</button>
        <button type="button" aria-label="아래로" disabled={i === screen.blocks.length - 1} onClick={() => moveDown(b.id)}>↓</button>
        <button type="button" aria-label="복제" onClick={() => dupBlock(b.id)}>⧉</button>
        <button type="button" aria-label="지우기" onClick={() => { removeBlock(b.id); setSel(null); }}>🗑</button>
      </div>
      {(b.type === "big" || b.type === "stat") && (
        <label>고정 값
          <input value={b.val ?? ""} placeholder={b.type === "stat" ? "(비우면 기억하는 값)" : "4:12:30"} onChange={(e) => editBlock(b.id, (x) => { if (e.target.value) x.val = e.target.value; else delete x.val; })} />
        </label>
      )}
      {(b.type === "big" || b.type === "stat" || b.type === "chart" || b.type === "progress") && (
        <label>단위
          <input value={b.unit ?? ""} placeholder="분 · 시간 · % · 명" onChange={(e) => editBlock(b.id, (x) => { if (e.target.value) x.unit = e.target.value.slice(0, 8); else delete x.unit; })} />
        </label>
      )}
      {(b.type === "big" || b.type === "chart" || b.type === "progress" || b.type === "table") && (
        <label>아래 설명
          <input value={b.sub ?? ""} onChange={(e) => editBlock(b.id, (x) => { if (e.target.value) x.sub = e.target.value; else delete x.sub; })} />
        </label>
      )}
      {b.type === "chart" && (
        <label>차트
          <select value={b.chart ?? "bar"} onChange={(e) => editBlock(b.id, (x) => { x.chart = e.target.value as "bar" | "line" | "donut"; })}>
            <option value="bar">📊 막대</option>
            <option value="line">📈 꺾은선</option>
            <option value="donut">🍩 도넛</option>
          </select>
        </label>
      )}
      {(b.type === "chart" || b.type === "progress") && (
        <label className="sim-area">데이터 — 줄마다 &ldquo;이름, 값, 목표, 오른쪽 글&rdquo;
          <textarea
            rows={Math.min(8, (b.data?.length ?? 1) + 1)}
            defaultValue={(b.data ?? []).map((d) => [d.label, d.value, d.value2 ?? "", d.note ?? ""].join(", ").replace(/(, )+$/, "")).join("\n")}
            onChange={(e) => editBlock(b.id, (x) => {
              x.data = e.target.value.split("\n").map((l) => l.split(",").map((t) => t.trim())).filter((c) => c[0]).slice(0, 14).map(([label, v, v2, note]) => ({ label, value: Number(v) || 0, ...(v2 ? { value2: Number(v2) || 0 } : {}), ...(note ? { note } : {}) }));
            })}
          />
        </label>
      )}
      {b.type === "table" && (
        <label className="sim-area">표 — 첫 줄은 머리, 칸은 | 로 나눠
          <textarea
            rows={Math.min(8, (b.rows?.length ?? 1) + 2)}
            defaultValue={[b.cols ?? [], ...(b.rows ?? [])].map((r) => r.join(" | ")).join("\n")}
            onChange={(e) => editBlock(b.id, (x) => {
              const [head, ...rest] = e.target.value.split("\n").filter((l) => l.trim()).map((l) => l.split("|").map((t) => t.trim()).slice(0, 6));
              x.cols = head ?? [];
              x.rows = rest.slice(0, 10);
            })}
          />
        </label>
      )}
      {b.type === "stat" && (
        <label>보여 줄 값
          <select value={b.bind ?? ""} onChange={(e) => editBlock(b.id, (x) => (x.bind = e.target.value))}>
            {Object.entries(project.state).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </label>
      )}
      {b.type === "button" && (
        <>
          <label>누르면 갈 화면
            <select value={b.go ?? ""} onChange={(e) => editBlock(b.id, (x) => (x.go = e.target.value || undefined))}>
              <option value="">(안 움직임)</option>
              {project.screens.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </label>
          <label>따르는 규칙
            <select value={b.rule ?? ""} onChange={(e) => editBlock(b.id, (x) => (x.rule = e.target.value || undefined))}>
              <option value="">(없음)</option>
              {project.rules.map((r) => <option key={r.id} value={r.id}>{r.id} {r.text}</option>)}
            </select>
          </label>
          {/* 누르면 바뀌는 값 — "순공 + 10", "콤보 = 0" */}
          <div className="sim-acts">
            <span>누르면 값</span>
            {(b.do ?? []).map((a, k) => (
              <div key={k} className="sim-act">
                <select aria-label="바꿀 값" value={a.key} onChange={(e) => editBlock(b.id, (x) => { x.do![k].key = e.target.value; })}>
                  {Object.entries(project.state).map(([sk, v]) => <option key={sk} value={sk}>{clip(v.label, 9)}</option>)}
                </select>
                <select aria-label="어떻게" className="op" value={a.op} onChange={(e) => editBlock(b.id, (x) => { x.do![k].op = e.target.value as "set" | "add"; })}>
                  <option value="add">＋</option>
                  <option value="set">＝</option>
                </select>
                <input aria-label="얼마나" type="number" className="num" value={a.value} onChange={(e) => editBlock(b.id, (x) => { x.do![k].value = Number(e.target.value) || 0; })} />
                <button type="button" aria-label="동작 지우기" onClick={() => editBlock(b.id, (x) => { x.do = x.do!.filter((_, j) => j !== k); if (!x.do.length) delete x.do; })}>✕</button>
              </div>
            ))}
            {firstKey && (b.do?.length ?? 0) < 6 && <button type="button" className="add" onClick={() => editBlock(b.id, (x) => { (x.do ??= []).push({ key: firstKey, op: "add", value: 1 }); })}>＋ 동작</button>}
          </div>
          {condEdit("막히는 조건", b.disabledIf, (c) => editBlock(b.id, (x) => { if (c) x.disabledIf = c; else delete x.disabledIf; }))}
        </>
      )}
      {b.type === "notice" && (
        <label>알림 뜻
          <select value={b.tone === "good" ? "good" : "warn"} onChange={(e) => editBlock(b.id, (x) => { x.tone = e.target.value; })}>
            <option value="good">✅ 잘하고 있어</option>
            <option value="warn">⚠️ 조심해</option>
          </select>
        </label>
      )}
      {condEdit("보이는 조건", b.showIf, (c) => editBlock(b.id, (x) => { if (c) x.showIf = c; else delete x.showIf; }))}
    </div>
  );

  return (
    <>
      {/* 머리 — 이름 · 모드(돌려 보기 / 고치기) · 내보내기(설계서 / 공유) */}
      <header className="sim-top">
        <div className="mr-auto min-w-0">
          <h1 className="text-[20px] font-black">{title}</h1>
          {sub && <p className="mt-0.5 text-[13px] text-sub">{sub}</p>}
        </div>
        <div className="sim-seg" role="group" aria-label="모드">
          <button type="button" aria-pressed={!edit && !pen} className={!edit && !pen ? "on" : ""} onClick={() => { setEdit(false); setPen(false); }}>▶️ 돌려 보기</button>
          <button type="button" aria-pressed={edit} className={edit ? "on" : ""} onClick={() => { setEdit(true); setPen(false); setQuiz(null); setSel(null); }}>✏️ 고치기</button>
          <button type="button" aria-pressed={pen} className={pen ? "on" : ""} onClick={() => { setPen(true); setEdit(false); setQuiz(null); }}>🖍 연필{noteCount ? ` ${noteCount}` : ""}</button>
        </div>
        <div className="sim-tools">
          <button type="button" onClick={() => { setCopied(false); setModal({ kind: "spec", tab: "board" }); }}>📐 설계서</button>
          <button type="button" onClick={share}>🔗 공유</button>
        </div>
        {actions}
      </header>

      <div className="sim-grid">
        {/* ① 기획 — 규칙 · 기기 · 상황 */}
        <section className="sim-colm order-2 lg:order-1">
          <p className="sim-col"><b>1</b>기획 — 규칙 · 기기</p>
          {top}
          <div className={cardClass}>
            <Head icon="📜" right={project.rules.length > 0 && <span className="sim-h-r">눌러서 버튼 찾기</span>}>규칙 {project.rules.length}개</Head>
            {edit ? (
              <div className="sim-se">
                {project.rules.map((r) => (
                  <div key={r.id} className="sim-se-row">
                    <b className="sim-rid">{r.id}</b>
                    <input aria-label={`${r.id} 규칙`} value={r.text} onChange={(e) => change((p) => { const x = p.rules.find((y) => y.id === r.id); if (x) x.text = e.target.value; })} />
                    <button type="button" aria-label={`${r.id} 지우기`} onClick={() => removeRule(r.id)}>🗑</button>
                  </div>
                ))}
                <button type="button" className="sim-se-add menu" disabled={project.rules.length >= 12} onClick={addRule}>➕ 규칙</button>
              </div>
            ) : project.rules.length === 0 ? (
              <p className="text-[13px] leading-relaxed text-sub">아직 없어. 대화에서 &ldquo;언제 · 얼마나 · 무엇을 막을지&rdquo;를 정하면 생겨.</p>
            ) : (
              <ol className="sim-rules">
                {project.rules.map((r) => {
                  const [head, ...tail] = r.text.split(" — ");
                  const on = focus === r.id;
                  return (
                    <li key={r.id} className={`sim-rule ${on ? "on" : ""}`}>
                      <button type="button" className="sim-rule-b" aria-expanded={on} title={r.text} onClick={() => pickRule(r.id)}>
                        <b className="sim-rid">{r.id}</b>
                        <span className="min-w-0">
                          <span className="block">{head}</span>
                          {on && tail.length > 0 && <span className="sim-rule-more">{tail.join(" — ")}</span>}
                        </span>
                      </button>
                      {r.from !== undefined && (onJump ? (
                        <button type="button" className="sim-from" title={`Q${r.from}에서 정한 규칙 — 대화로 돌아가기`} onClick={() => onJump(r.from!)}>💬Q{r.from}</button>
                      ) : <span className="sim-from" title={`대화 Q${r.from}에서 정함`}>💬Q{r.from}</span>)}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
          {hasHw && (
            <div className={`${cardClass} sim-hw`}>
              <Head icon="🔌" right={<span className="sim-h-r">가짜로 돌려</span>}>기기 배선도</Head>
              <Wiring project={project} vals={allVals} onSlide={slide} focus={focus} onFocus={setFocus} />
            </div>
          )}
          {edit && (
            <div className={cardClass}>
              <Head icon="🔢" right={<span className="sim-h-r">처음 · 최소~최대 · 단위</span>}>기억하는 값 {Object.keys(project.state).length}개</Head>
              <div className="sim-se">
                {Object.entries(project.state).map(([k, v]) => {
                  const setV = (fn: (x: Project["state"][string]) => void) => change((p) => fn(p.state[k]));
                  return (
                    <div key={k} className="sim-vrow">
                      <input aria-label="값 이름" className="name" value={v.label} onChange={(e) => setV((x) => { x.label = e.target.value; })} />
                      <input aria-label="처음" type="number" value={v.value} onChange={(e) => setV((x) => { x.value = Number(e.target.value) || 0; })} />
                      <input aria-label="최소" type="number" value={v.min} onChange={(e) => setV((x) => { x.min = Number(e.target.value) || 0; })} />
                      <input aria-label="최대" type="number" value={v.max} onChange={(e) => setV((x) => { x.max = Number(e.target.value) || 0; })} />
                      <input aria-label="단위" className="unit" value={v.unit} onChange={(e) => setV((x) => { x.unit = e.target.value.slice(0, 8); })} />
                      <button type="button" aria-label={`${v.label} 지우기`} onClick={() => removeValue(k)}>🗑</button>
                    </div>
                  );
                })}
                <button type="button" className="sim-se-add menu" onClick={addValue}>➕ 값</button>
              </div>
            </div>
          )}
          {!edit && plainKeys.length > 0 && (
            <div className={cardClass}>
              <Head icon="🎛" right={<button type="button" className="sim-link" onClick={restart}>↺ 처음 상태</button>}>상황 바꾸기</Head>
              <div className="sim-knobs">
                {plainKeys.map((k) => {
                  const v = project.state[k];
                  const { icon, rest } = splitIcon(v.label);
                  return (
                    <label key={k} className="sim-knob" title={v.label}>
                      <span className="sim-knob-t"><span>{icon} {clip(rest, 8)}</span><b>{val(k)}<small>{v.unit}</small></b></span>
                      <input type="range" min={v.min} max={v.max} value={val(k)} onChange={(e) => slide(k, Number(e.target.value))} />
                    </label>
                  );
                })}
              </div>
            </div>
          )}
          {!edit && plainKeys.length === 0 && <button type="button" className="sim-link" onClick={restart}>↺ 처음 상태로</button>}
        </section>

        {/* ② 앱 화면 — 폰 · 책상 위 기기 · 연필 메모 */}
        <section className="sim-colm order-1 lg:order-2">
          <p className="sim-col"><b>2</b>앱 화면</p>
          <div className="sim-phone">
            <div className="sim-bar">
              {edit ? <input aria-label="화면 이름" value={screen.title} onChange={(e) => change((p) => { const s = p.screens.find((x) => x.id === screen.id); if (s) s.title = e.target.value; })} /> : <span>{screen.title}</span>}
            </div>
            <div className="sim-body">
              <div className="sim-canvas">
                {edit
                  ? screen.blocks.map((b, i) => (
                      <div key={b.id} className={`sim-pick ${sel === b.id ? "on" : ""}`}>
                        <button type="button" className="sim-pick-hit" aria-label={`${TYPE_NAME[b.type]} 고치기`} aria-expanded={sel === b.id} onClick={() => setSel(sel === b.id ? null : b.id)} />
                        <span className="sim-pick-tag">{TYPE_NAME[b.type]}{b.showIf ? " · 조건" : ""}</span>
                        <div className="sim-pick-prev">{view(b, true)}</div>
                        {sel === b.id && editor(b, i)}
                      </div>
                    ))
                  : screen.blocks.map((b) => view(b))}
                {!edit && <SketchLayer key={screen.id} sketch={screen.sketch} active={pen} tool={tool} onChange={setSketch} onNote={setNoteAt} />}
                {!edit && <Stickies key={`st${screen.id}`} sketch={screen.sketch} onChange={setSketch} onText={(k) => setSketch(k, false)} />}
              </div>
              {edit && (
                <div className="sim-palette">
                  <p>➕ 칸 더하기</p>
                  {PALETTE.map(([t, name]) => <button key={t} type="button" onClick={() => addBlock(t)}>{name}</button>)}
                </div>
              )}
              {!edit && screen.blocks.length === 0 && <p className="sim-text">빈 화면이야. ✏️ 고치기에서 칸을 더해 봐.</p>}
            </div>
            {menuOn && (
              <nav className="sim-tabs" aria-label="앱 메뉴">
                {groups.filter((g) => g.id && g.screens.length).map((g) => {
                  const { icon, rest } = splitIcon(g.title);
                  return (
                    <button key={g.id} type="button" className={screen.group === g.id ? "on" : ""} onClick={() => !quiz && setScreenId(g.screens[0].id)} title={g.path}>
                      <span aria-hidden>{icon || "▫️"}</span>{clip(rest || g.title, 5)}
                    </button>
                  );
                })}
              </nav>
            )}
            {quiz && (
              <div className="sim-quiz" role="dialog" aria-label="되묻기">
                <p className="text-[12px] font-bold text-[#7c3aed]">🙋 잠깐, 되물을게</p>
                <p className="mt-1 text-[15px] font-black">「{quiz.block.text}」 — 어느 규칙을 따라?</p>
                <div className="mt-3 space-y-1.5">
                  {project.rules.map((r) => {
                    const right = quiz.picked && r.id === quiz.block.rule;
                    const wrong = quiz.picked === r.id && !right;
                    return <button key={r.id} type="button" disabled={!!quiz.picked} onClick={() => answer(r.id)} className={`sim-opt ${right ? "right" : wrong ? "wrong" : ""}`}><b>{r.id}</b> {r.text.split(" — ")[0]}</button>;
                  })}
                  <button type="button" disabled={!!quiz.picked} onClick={() => answer("?")} className={`sim-opt ${quiz.picked === "?" ? "wrong" : ""}`}>🤷 모르겠어</button>
                </div>
                {quiz.picked && (
                  <>
                    <p className="mt-3 text-[13px] font-bold">{quiz.picked === quiz.block.rule ? "✅ 맞아! 이 버튼은 네가 설명할 수 있어." : `🔁 ${quiz.block.rule}였어. 규칙을 한 번 더 보고 가자.`}</p>
                    <button type="button" className="sim-btn mt-2" onClick={closeQuiz}>계속하기 →</button>
                  </>
                )}
              </div>
            )}
          </div>

          {hwOutputs.length > 0 && (
            <div className="sim-strip" aria-label="책상 위 기기">
              {hwOutputs.map((o) => <span key={o.id} className={`sim-chip ${test(o.onIf, allVals) ? "on" : ""}`} title={o.device}><i className="sim-lamp" aria-hidden />{o.label}</span>)}
            </div>
          )}

          <div className={`${cardClass} sim-talk ${pen ? "pen" : ""}`}>
            <Head icon="🖍" right={pen ? <span className="sim-h-r">폰 위에 그려</span> : <button type="button" className="sim-link" onClick={() => { setPen(true); setEdit(false); }}>연필 켜기</button>}>연필 · 스티커 · {clip(screen.title, 8)}</Head>
            {pen && (
              <div className="sim-pentools" role="toolbar" aria-label="연필 도구">
                {([["pencil", "✏️ 연필"], ["red", "🔴 빨강"], ["note", "📍 메모"], ["sticky", "📒 스티커"], ["erase", "🧽 지우개"]] as [PenTool, string][]).map(([t, name]) => <button key={t} type="button" aria-pressed={tool === t} className={tool === t ? "on" : ""} onClick={() => setTool(t)}>{name}</button>)}
              </div>
            )}
            {pen && tool === "erase" && <p className="mb-2 text-[12px] text-sub">🧽 지울 선 · 메모 위를 문질러. 스티커는 ✕로 떼.</p>}
            {pen && tool === "sticky" && <p className="mb-2 text-[12px] text-sub">📒 폰을 누른 자리에 스티커가 붙어. 막대를 끌어 옮기고, 귀퉁이로 크기를 바꿔.</p>}
            {sketch.notes.length === 0 ? (
              <p className="text-[12.5px] leading-relaxed text-sub">{pen ? "📍 메모를 고르고 폰을 누르면 ① 번호가 꽂혀. 여기에 하고 싶은 말을 적어." : "화면에 더하고 싶은 걸 연필로 그려서 남겨 — 설계서 · 명세.md에 \"추가 요청\"으로 같이 간다."}</p>
            ) : (
              <ol className="sim-notes">
                {sketch.notes.map((n, i) => (
                  <li key={i}>
                    <b>{NUM[i]}</b>
                    <input
                      aria-label={`메모 ${i + 1}`}
                      value={n.text}
                      autoFocus={noteAt === i}
                      placeholder="예: 여기에 과목별 막대그래프"
                      onChange={(e) => setSketch({ ...sketch, notes: sketch.notes.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) }, false)}
                    />
                    <button type="button" aria-label={`메모 ${i + 1} 지우기`} onClick={() => setSketch({ ...sketch, notes: sketch.notes.filter((_, j) => j !== i) })}>✕</button>
                  </li>
                ))}
              </ol>
            )}
            {(inkAny || hist.past.length > 0 || hist.future.length > 0) && (
              <div className="sim-clear">
                <span>✏️ {sketch.lines.length} · 📍 {sketch.notes.length} · 📒 {sketch.stickies?.length ?? 0}</span>
                <button type="button" id="sim-undo" disabled={!hist.past.length} onClick={undo} title="뒤로 (⌘Z)">↶ 뒤로</button>
                <button type="button" id="sim-redo" disabled={!hist.future.length} onClick={redo} title="앞으로 (⇧⌘Z)">↷ 앞으로</button>
                <button type="button" disabled={!hasInk(screen.sketch)} onClick={() => setSketch(EMPTY_SKETCH)}>🗑 이 화면</button>
                <button type="button" className="all" disabled={!inkAny} onClick={clearAll} title="모든 화면의 연필 · 메모 · 스티커 — 뒤로로 되돌릴 수 있어">🧨 전체 초기화</button>
              </div>
            )}
          </div>
        </section>

        {/* ③ 흐름 · 기록 — 화면 트리 · 설명 점수 · 방금 일어난 일 */}
        <section className="sim-colm order-3">
          <p className="sim-col"><b>3</b>흐름 · 기록</p>
          <div className={cardClass}>
            <Head
              icon="🗺"
              right={
                <>
                  <div className="sim-seg sm" role="tablist" aria-label="보기">
                    <button type="button" role="tab" aria-selected={mapTab === "site"} className={mapTab === "site" ? "on" : ""} onClick={() => setMapTab("site")}>사이트맵</button>
                    <button type="button" role="tab" aria-selected={mapTab === "flow"} className={mapTab === "flow" ? "on" : ""} onClick={() => setMapTab("flow")}>흐름</button>
                  </div>
                  {mapTab === "site" && <button type="button" className={`sim-pen ${siteEdit ? "on" : ""}`} aria-pressed={siteEdit} title="사이트맵 고치기" onClick={() => setSiteEdit(!siteEdit)}>✏️</button>}
                </>
              }
            >
              {mapTab === "site" ? "사이트맵" : "화면 흐름"}
            </Head>
            {mapTab === "site" ? (
              menuOn ? (
                <SiteMap project={project} current={screen.id} onPick={setScreenId} />
              ) : (
                <div className="sim-empty">
                  <p>아직 메뉴가 없어 — 화면 {project.screens.length}장이 한 묶음이야.</p>
                  <button type="button" className={segClass(true)} onClick={() => { makeMenu(); setSiteEdit(true); }}>🗂 메뉴로 묶기</button>
                </div>
              )
            ) : (
              <FlowTree project={project} current={screen.id} onPick={setScreenId} />
            )}
            <p className="sim-legend">
              {mapTab === "site" ? (
                <><span><i className="sim-dot start" />첫 화면</span><span><i className="sim-dot cur" />지금 화면</span><span><i className="sim-dot go" />버튼으로 가는 곳</span></>
              ) : (
                <><span>↩ 돌아가기</span><span>→ 건너가기</span><span>○ 누르는 버튼</span></>
              )}
            </p>
            {mapTab === "site" && siteEdit && menuOn && (
              <div className="sim-se">
                {groups.map((g) => (
                  <div key={g.id || "lost"} className="sim-se-g">
                    <div className="sim-se-row head">
                      {g.id ? (
                        <>
                          <input aria-label="메뉴 이름" value={g.title} onChange={(e) => setMenu(g.id, "title", e.target.value)} />
                          <input aria-label="주소" className="path" value={g.path ?? ""} placeholder="/주소" onChange={(e) => setMenu(g.id, "path", e.target.value)} />
                          <button type="button" aria-label={`${g.title} 메뉴 지우기`} title={g.screens.length ? "화면을 다른 메뉴로 옮겨야 지울 수 있어" : "메뉴 지우기"} disabled={g.screens.length > 0} onClick={() => removeMenu(g.id)}>🗑</button>
                        </>
                      ) : <b className="px-1 text-[12.5px]">{g.title}</b>}
                    </div>
                    {g.screens.map((sc) => (
                      <div key={sc.id} className={`sim-se-row ${sc.id === screen.id ? "cur" : ""}`}>
                        <button type="button" className={`star ${sc.id === project.start ? "on" : ""}`} aria-label="첫 화면으로" aria-pressed={sc.id === project.start} title="첫 화면으로" onClick={() => change((p) => { p.start = sc.id; })}>★</button>
                        <input aria-label="화면 이름" value={sc.title} onFocus={() => setScreenId(sc.id)} onChange={(e) => screenSet(sc.id, (x) => { x.title = e.target.value; })} />
                        <select aria-label="메뉴 옮기기" value={sc.group && project.menu?.some((m) => m.id === sc.group) ? sc.group : ""} onChange={(e) => screenSet(sc.id, (x) => { if (e.target.value) x.group = e.target.value; else delete x.group; })}>
                          {project.menu?.map((m) => <option key={m.id} value={m.id}>{clip(m.title, 8)}</option>)}
                          <option value="">📦 메뉴 밖</option>
                        </select>
                        <button type="button" aria-label={`${sc.title} 지우기`} disabled={project.screens.length <= 1} onClick={() => removeScreen(sc.id)}>🗑</button>
                      </div>
                    ))}
                    <button type="button" className="sim-se-add" disabled={screenFull} onClick={() => addScreenIn(g.id)}>➕ 화면</button>
                  </div>
                ))}
                <button type="button" className="sim-se-add menu" disabled={(project.menu?.length ?? 0) >= 8} onClick={addMenu}>➕ 메뉴 더하기</button>
                {screenFull && <p className="sim-h-r">화면은 12장까지야.</p>}
              </div>
            )}
            {edit && mapTab === "flow" && <button type="button" className="mt-2 w-full rounded-xl border border-dashed border-line py-2 text-[13px] font-bold text-sub hover:border-clay" disabled={screenFull} onClick={addScreen}>➕ 화면 더하기</button>}
          </div>
          <div className={`${cardClass} sim-score`}>
            <ScoreRing ok={okCount} total={ruleButtons.length} />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-black">🙋 설명한 버튼</p>
              <label className="sim-switch">
                <input type="checkbox" checked={askOn} onChange={(e) => setAskOn(e.target.checked)} />
                <i aria-hidden />처음 누를 때 되묻기
              </label>
              <button type="button" className="sim-link" onClick={() => setExplained({})}>↺ 다시 풀기</button>
            </div>
          </div>
          <div className={cardClass}>
            <Head icon="🧾">방금 일어난 일</Head>
            {log.length === 0 ? (
              <p className="text-[13px] text-sub">폰의 버튼을 눌러 봐.</p>
            ) : (
              <ol className="sim-log">
                {log.map((l, i) => (
                  <li key={l.id} className={i === 0 ? "now" : ""}>
                    <b>{l.act}</b>
                    <span className="sim-chgs">
                      {l.changes.map((c) => <span key={c.label} className="sim-chg" title={c.label}>{c.icon} {c.from}→<b>{c.to}</b></span>)}
                      {l.flips.map((f) => <span key={f.label} className={`sim-chg ${f.on ? "on" : "off"}`}>{f.on ? "💡" : "⚫"} {clip(splitIcon(f.label).rest || f.label, 8)}</span>)}
                      {l.to && <span className="sim-chg go">→ {clip(l.to, 10)}</span>}
                      {!l.changes.length && !l.flips.length && !l.to && <span className="sim-chg off">🤔 변화 없음</span>}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
          {edit && onResetAll && <button type="button" className="sim-link" onClick={onResetAll}>🧹 고친 것 모두 지우고 처음으로</button>}
        </section>
      </div>

      {modal && (
        <div className="sim-modal" role="dialog" aria-label={modal.kind === "spec" ? "화면 설계서" : "공유 링크"} onClick={() => setModal(null)}>
          <div onClick={(e) => e.stopPropagation()} className={modal.kind === "spec" ? "wide" : ""}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="mr-auto text-[15px] font-black">{modal.kind === "spec" ? `📐 ${project.name} 화면 설계서` : "🔗 공유 링크"}</h2>
              {modal.kind === "spec" && (
                <div className="sim-seg sm" role="tablist">
                  <button type="button" role="tab" aria-selected={modal.tab === "board"} className={modal.tab === "board" ? "on" : ""} onClick={() => setModal({ kind: "spec", tab: "board" })}>🖼 설계도</button>
                  <button type="button" role="tab" aria-selected={modal.tab === "md"} className={modal.tab === "md" ? "on" : ""} onClick={() => { setCopied(false); setModal({ kind: "spec", tab: "md" }); }}>📄 명세.md</button>
                </div>
              )}
              {modal.kind === "spec" && modal.tab === "board" ? (
                <button type="button" className={segClass(true)} onClick={downloadBoard}>⬇ SVG</button>
              ) : (
                <button type="button" className={segClass(copied)} onClick={() => copy(modal.kind === "spec" ? toMd(project) : modal.url)}>{copied ? "✅ 복사됨" : "📋 복사"}</button>
              )}
              <button type="button" className={segClass(false)} onClick={() => setModal(null)}>닫기</button>
            </div>
            {modal.kind === "spec" ? (
              modal.tab === "board" ? (
                <div className="sim-board-wrap">
                  <div className="sim-board-top">
                    {menuOn && (
                      <div className="sim-board-flow">
                        <p className="sim-col"><b>A</b>사이트맵 — 메뉴 {project.menu!.length}개</p>
                        <SiteMap project={project} current={screen.id} onPick={(id) => { setScreenId(id); setModal(null); }} />
                      </div>
                    )}
                    <div className="sim-board-flow">
                      <p className="sim-col"><b>{menuOn ? "B" : "A"}</b>화면 흐름 — 버튼으로 넘어가는 길</p>
                      <FlowTree project={project} current={screen.id} onPick={(id) => { setScreenId(id); setModal(null); }} />
                    </div>
                  </div>
                  <div className="sim-board-sheets">
                    <p className="sim-col"><b>{menuOn ? "C" : "B"}</b>화면 {project.screens.length}장{menuOn ? " — 메뉴별" : ""}</p>
                    <div className="overflow-x-auto rounded-xl"><SpecBoard project={project} id="sim-board-svg" /></div>
                    <p className="sim-legend">{BOARD_LEGEND.map(([k, v]) => <span key={k}><b>{k}</b> {v}</span>)}</p>
                  </div>
                </div>
              ) : (
                <pre>{toMd(project)}</pre>
              )
            ) : (
              <>
                <input readOnly value={modal.url} aria-label="공유 링크" onFocus={(e) => e.target.select()} className="w-full rounded-xl border border-line bg-void px-3 py-2.5 text-[12.5px] text-sub" />
                <p className="mt-3 text-[12.5px] leading-relaxed text-sub">🔒 서버에 저장 안 함 · 로그인 없음 · 받은 사람이 고쳐도 내 것은 그대로.</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
