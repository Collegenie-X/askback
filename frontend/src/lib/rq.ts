// 역질문 선택 (설계서 v3 §4.4) — 점수 = 0.4 관련성 + 0.3 약함 + 0.2 오래됨 + 0.1 트리거
import elements from "@/data/elements.json";
import formats from "@/data/formats.json";
import type { Form, FormatKey, PackKey, Project, ReverseQuestion, RQOption, Turn } from "./types";
import { topicOf } from "./analyzer";

type BaseEl = (typeof elements.base)[number];
type PackEl = (typeof elements.packs)[number];
// 형식 전용 요소 — 코드 줄이 아니라 그 형식의 설계(기획·알고리즘·구조)를 묻는다 (formats.json 의 rq)
type FormatEl = (typeof formats.formats)[FormatKey]["rq"][number] & { format: FormatKey; icon: string };
export type ElementDef = BaseEl | PackEl | FormatEl;

const FORMAT_ELEMENTS: FormatEl[] = (Object.keys(formats.formats) as FormatKey[]).flatMap((k) => formats.formats[k].rq.map((e) => ({ ...e, format: k, icon: formats.formats[k].emoji })));
export const ALL_ELEMENTS: ElementDef[] = [...elements.base, ...elements.packs, ...FORMAT_ELEMENTS];

export function elementById(id: string): ElementDef | undefined {
  return ALL_ELEMENTS.find((e) => e.id === id);
}

export function elementAdd(id: string) {
  const el = elementById(id);
  if (el && "add" in el) return el.add;
  return { good: "네 말로 또렷하게 정리했어. 이건 그대로 기록에 남길 만해.", weak: "지금은 한 줄이어도 돼. 프로젝트가 나아가면 이 칸이 다시 보일 거야." };
}

function relevance(id: string, bar: Turn[], project: Project, projectTurns: number, rqs: ReverseQuestion[]): number {
  const last = bar[bar.length - 1];
  const text = bar.map((t) => t.question).join(" ");
  const os = bar.map((t) => t.analysis.openness);
  const stage = last.analysis.stage;
  const building = stage === "구현" || /(코드|짜\s?줘|만들)/.test(text);
  switch (id) {
    case "E1": return building ? 0.8 : 0.4;
    case "E2": return 0.5;
    case "E3": return os.includes("O3") || os.includes("O4") ? 0.9 : os.includes("O2") ? 0.5 : 0.3;
    case "E4": return os.includes("O4") ? 0.35 : os.includes("O2") || os.includes("O3") ? 0.7 : 0.4;
    case "E5": return building ? 0.85 : 0.35;
    case "E6": return bar.every((t) => t.analysis.six.criteria < 0.5) ? 0.8 : 0.4;
    case "E7": return building || stage === "검증" ? 0.8 : 0.3;
    case "E8": return /(바꿔|고쳐|수정|다시|버전|전에는)/.test(text) ? 0.8 : 0.2;
    case "M1": case "M2": case "M3": case "M4": return stage === "구현" || stage === "설계" ? 0.6 : 0.35;
    case "S1": case "S2": case "S3": case "S4": return /(발표|시연|제출|공유|보여|친구)/.test(text) ? 0.8 : 0.35;
    case "C1": return stage === "탐색" || stage === "설계" ? 0.6 : 0.4;
    case "C2": case "C3": case "C4": {
      // 이웃이 정해진 뒤에만 (§11)
      const c1 = rqs.find((r) => r.projectId === project.id && r.element === "C1" && (r.score ?? 0) >= 2);
      return c1 ? 0.55 : 0;
    }
    case "A1": case "A2": case "A3": case "A4": return projectTurns >= 5 ? 0.5 : 0; // 돌아가는 게 생긴 뒤에
    default:
      // 형식 전용(F*) — 설계를 정하는 단계에서 제일 세고, 코드로 달려갈 때도 설계로 한 번 끌어온다
      if (id.startsWith("F")) return stage === "탐색" || stage === "설계" ? 0.8 : stage === "구현" ? 0.7 : 0.5;
      return 0;
  }
}

function trigger(id: string, bar: Turn[], allTurns: Turn[]): number {
  const last = bar[bar.length - 1];
  const text = last.question;
  if (id === "E6" && /(골라줘|정해줘|뭐가 나아|어떤 게 좋)/.test(text)) return 1; // T1
  if (id === "E3" && bar.some((t) => t.analysis.openness === "O3")) return 0.6; // T2
  if (id === "E1") {
    const c = last.analysis.concepts[0];
    if (c && allTurns.filter((t) => t.analysis.concepts.includes(c)).length >= 3) return 1; // T3
  }
  if (id === "E8" && /(원래대로|되돌|다시 처음)/.test(text)) return 1; // T4
  if (id === "E7" && last.analysis.openness === "NA") return 1; // T6
  return 0;
}

function nextForm(id: string, rqs: ReverseQuestion[], el: ElementDef): Form {
  const hasF1 = "f1" in el;
  if (!hasF1) return "F3";
  const past = rqs.filter((r) => r.element === id && r.status === "answered");
  const last = past[past.length - 1];
  if (!last || (last.score ?? 0) <= 0) return "F1";
  const order: Form[] = ["F1", "F2", "F3"];
  const idx = order.indexOf(last.form);
  if ((last.score ?? 0) >= 2) return order[Math.min(2, idx + 1)];
  return last.form;
}

export interface Picked {
  element: ElementDef;
  form: Form;
  pack: PackKey | null;
  scores: Record<string, number>;
}

export function pickElement(bar: Turn[], project: Project, allTurns: Turn[], rqs: ReverseQuestion[], windowIndex: number): Picked | null {
  const candidates = ALL_ELEMENTS.filter((e) => ("pack" in e ? project.packs.includes(e.pack as PackKey) : "format" in e ? e.format === project.format : true));
  const inWindow = rqs.filter((r) => r.projectId === project.id && r.windowIndex === windowIndex);
  const packAsked = inWindow.filter((r) => r.pack).length;
  const formatAsked = inWindow.filter((r) => FORMAT_ELEMENTS.some((e) => e.id === r.element)).length;
  const projectTurns = allTurns.filter((t) => t.projectId === project.id).length;
  const scores: Record<string, number> = {};
  let best: ElementDef | null = null;

  for (const el of candidates) {
    const rel = relevance(el.id, bar, project, projectTurns, rqs);
    if (rel < 0.3) continue; // 억지 질문 금지
    const past = rqs.filter((r) => r.element === el.id && r.status === "answered").slice(-3);
    const weak = past.length ? (3 - past.reduce((s, r) => s + (r.score ?? 0), 0) / past.length) / 3 : 0.5;
    const lastAsked = [...rqs].reverse().find((r) => r.element === el.id);
    const stale = lastAsked ? Math.min(1, (project.barIndex - lastAsked.barIndex) / 5) : 1;
    let score = 0.4 * rel + 0.3 * weak + 0.2 * stale + 0.1 * trigger(el.id, bar, allTurns);
    if (inWindow.some((r) => r.element === el.id)) score *= 0.3;
    if ("pack" in el) score *= packAsked < 2 ? 1.25 : 0.3; // 10문당 팩 2개 목표
    if ("format" in el) score *= formatAsked < 3 ? 1.3 : 0.6; // 설계를 묻는 게 먼저 — 10문당 3개까지 앞세운다
    scores[el.id] = Math.round(score * 100) / 100;
    if (!best || score > scores[best.id]) best = el;
  }
  if (!best) return null;
  const top = Object.fromEntries(Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 3));
  return { element: best, form: nextForm(best.id, rqs, best), pack: "pack" in best ? (best.pack as PackKey) : null, scores: top };
}

export function buildRQ(p: Picked, lastTurn: Turn, ids: { id: string; now: number }, windowIndex: number, barIndex: number): ReverseQuestion {
  const el = p.element;
  const key = p.form.toLowerCase() as "f1" | "f2" | "f3";
  const tpl = (key in el ? (el as BaseEl)[key] : el.f3) as { q: string; options?: RQOption[] };
  return {
    id: ids.id,
    projectId: lastTurn.projectId,
    turnId: lastTurn.id,
    windowIndex,
    barIndex,
    element: el.id,
    pack: p.pack,
    form: p.form,
    question: tpl.q.replace("{{topic}}", topicOf(lastTurn.question)),
    options: p.form === "F1" ? tpl.options : undefined,
    hint: el.hint,
    example: el.example,
    coachView: el.coachView,
    expectedPoints: "expected" in el ? el.expected : [],
    selectionScores: p.scores,
    status: "open",
    hintStage: 0,
    createdAt: ids.now,
  };
}

export function colorOf(score: number | null | undefined) {
  if (score === null || score === undefined) return "➖";
  return score >= 2 ? "🟢" : score === 1 ? "🟡" : "⚪";
}

export const FORM_LABEL: Record<Form, string> = { F1: "고르기", F2: "빈칸", F3: "한두 문장" };
