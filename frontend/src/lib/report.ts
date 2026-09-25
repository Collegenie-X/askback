// 리포트 작성기 (설계서 v3 §7) — 수치는 집계로만 만들고, 코멘트는 수치에서만 나온다.
import missions from "@/data/missions.json";
import roles from "@/data/roles.json";
import type { LengthKey, Mission, Note, Openness, Project, ReverseQuestion, RoleKey, SixKey, Stage, TextStats, Turn, WindowReport } from "./types";
import { AXES, axisOf, colorOf, elementById, FORM_LABEL } from "./rq";

export const O_KEYS: Openness[] = ["O1", "O2", "O3", "O4", "O5"];
export const SIX_KEYS: SixKey[] = ["why", "context", "constraint", "criteria", "verify", "discard"];
export const ROLE_KEYS: RoleKey[] = ["typist", "coder", "engineer", "architect", "encyclopedia"];

export function fmtDate(ts: number) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
export function ymOf(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* ---------- 리포트 이름 · 번호 — 프로젝트마다 1번째부터 따로 센다 ---------- */

const sameProject = (r: WindowReport, projectId: string | null | undefined, projectName: string) => (r.projectId ? r.projectId === projectId : r.projects[0] === projectName);

export function reportsOf(reports: WindowReport[], projectId: string | null | undefined, projectName: string) {
  return reports.filter((r) => sameProject(r, projectId, projectName)).sort((a, b) => a.index - b.index);
}
export function seqOf(r: WindowReport, reports: WindowReport[]) {
  if (r.seq) return r.seq;
  return reportsOf(reports, r.projectId, r.projects[0] ?? "").findIndex((x) => x.index === r.index) + 1 || 1;
}
/** "스마트 화분 · 1번째 리포트" — 모든 화면과 .md가 이 이름 하나만 쓴다 */
export function reportTitle(r: WindowReport, reports: WindowReport[]) {
  return `${r.projects[0] ?? "프로젝트"} · ${seqOf(r, reports)}번째 리포트`;
}
/** 리포트 제목 — 이 10문을 한 줄로. 저장된 제목이 없으면(예전 기록) 숫자에서 만든다 */
export function reportHeadline(r: WindowReport) {
  return r.headline ?? makeHeadline(r.mix, r.roles, r.six);
}
function makeHeadline(mix: Record<Openness, number>, rl: Record<RoleKey, number>, six: Record<SixKey, number>) {
  const open = mix.O3 + mix.O4;
  const top = ROLE_KEYS.filter((k) => rl[k] > 0).sort((a, b) => rl[b] - rl[a])[0];
  const weak = (["criteria", "verify", "constraint", "why"] as SixKey[]).sort((a, b) => six[a] - six[b])[0];
  const lead = mix.O4 >= 3 ? `다른 길을 ${mix.O4}번 물었다` : open >= 5 ? `방법을 열어 두고 ${open}번 물었다` : top ? `AI를 ${roles.roles[top].name} 자리에 ${rl[top]}번 앉혔다` : "질문 10개를 돌아봤다";
  return `${lead} — 다음은 ‘${roles.six[weak].name.replace(/ \(.*\)/, "")}’ 한 줄`;
}

/** 그 프로젝트 안에서의 질문 번호 구간 — 1번째 리포트는 Q1~10, 2번째는 Q11~20 */
export function reportRange(r: WindowReport, reports: WindowReport[]): [number, number] {
  const q = seqOf(r, reports);
  return [(q - 1) * 10 + 1, q * 10];
}
/** 한 줄 부제 — "Q1~10 · 9/21" */
export function reportSub(r: WindowReport, reports: WindowReport[]) {
  const [a, b] = reportRange(r, reports);
  return `질문 Q${a}~Q${b} · ${fmtDate(r.from) === fmtDate(r.to) ? fmtDate(r.to) : `${fmtDate(r.from)}~${fmtDate(r.to)}`}`;
}
/** 지금 프로젝트에서 다음 리포트까지 쌓인 질문 수 (0~9) */
export function windowCountOf(projectId: string | null | undefined, projectName: string, turns: Turn[], reports: WindowReport[]) {
  if (!projectId) return 0;
  const mine = turns.filter((t) => t.projectId === projectId).length;
  return Math.max(0, mine - reportsOf(reports, projectId, projectName).length * 10) % 10;
}

/* ---------- 글자 수 분석 ---------- */

export const LENGTH_KEYS: LengthKey[] = ["short", "mid", "long"];
export const LENGTH_INFO: Record<LengthKey, { emoji: string; name: string; range: string; color: string }> = {
  short: { emoji: "✏️", name: "짧은 질문", range: "40자 미만", color: "#b7b3d6" },
  mid: { emoji: "📝", name: "보통 질문", range: "40~119자", color: "#5cb8ff" },
  long: { emoji: "📜", name: "긴 질문", range: "120자 이상", color: "#3fe0c0" },
};
export const lengthKeyOf = (chars: number): LengthKey => (chars < 40 ? "short" : chars < 120 ? "mid" : "long");
const charsOf = (q: string) => q.replace(/\s+/g, " ").trim().length;

export function buildTextStats(turns: Turn[], numberOf: (t: Turn, i: number) => number = (_, i) => i + 1): TextStats {
  const buckets = { short: { count: 0, avgSix: 0, open: 0 }, mid: { count: 0, avgSix: 0, open: 0 }, long: { count: 0, avgSix: 0, open: 0 } };
  const rows = turns.map((t, i) => ({ n: numberOf(t, i), chars: charsOf(t.question), six: SIX_KEYS.filter((k) => t.analysis.six[k] >= 0.5).length, open: t.analysis.openness === "O3" || t.analysis.openness === "O4" }));
  rows.forEach((x) => {
    const b = buckets[lengthKeyOf(x.chars)];
    b.count++;
    b.avgSix += x.six;
    if (x.open) b.open++;
  });
  LENGTH_KEYS.forEach((k) => (buckets[k].avgSix = buckets[k].count ? Math.round((buckets[k].avgSix / buckets[k].count) * 10) / 10 : 0));
  const by = [...rows].sort((a, b) => a.chars - b.chars);
  return {
    count: rows.length,
    avg: rows.length ? Math.round(rows.reduce((s, x) => s + x.chars, 0) / rows.length) : 0,
    min: by[0]?.chars ?? 0,
    max: by[by.length - 1]?.chars ?? 0,
    buckets,
    shortest: by[0] ? { n: by[0].n, chars: by[0].chars } : null,
    longest: by.length ? { n: by[by.length - 1].n, chars: by[by.length - 1].chars } : null,
  };
}

/** 글자 수 코멘트 — 숫자에서만 나온다 */
export function textComment(t: TextStats): string {
  const { short, mid, long } = t.buckets;
  const rich = LENGTH_KEYS.filter((k) => t.buckets[k].count > 0).sort((a, b) => t.buckets[b].avgSix - t.buckets[a].avgSix)[0];
  if (!t.count) return "아직 질문이 없어.";
  if (short.count >= t.count * 0.6) return `질문 ${t.count}개 중 ${short.count}개가 40자 미만이야. 짧은 질문엔 평균 ${short.avgSix}가지만 실렸어 — ‘왜 하는지’ 한 줄만 보태도 답이 너에게 맞춰져.`;
  if (long.count && long.avgSix >= Math.max(short.avgSix, mid.avgSix) + 1) return `긴 질문(120자 이상) ${long.count}개엔 평균 ${long.avgSix}가지를 실었어. 길어서 좋은 게 아니라, 목적·조건·기준을 적다 보니 길어진 거야.`;
  if (long.count && long.avgSix < mid.avgSix) return `긴 질문이 ${long.count}개인데 실은 건 평균 ${long.avgSix}가지뿐이야. 길이보다 ‘무엇을 실었나’가 중요해 — 코드·설명을 붙이기 전에 목적 한 줄 먼저.`;
  return `평균 ${t.avg}자로 물었어. ${LENGTH_INFO[rich].name}일 때 가장 많이(평균 ${t.buckets[rich].avgSix}가지) 실었어.`;
}

function evalMission(m: Mission, turns: Turn[], rqs: ReverseQuestion[]): WindowReport["lastMission"] {
  let got = 0;
  if (m.check.type === "openness") got = turns.filter((t) => t.analysis.openness === m.check.key).length;
  if (m.check.type === "six") got = turns.filter((t) => t.analysis.six[m.check.key as SixKey] >= 0.5).length;
  if (m.check.type === "rq") got = rqs.filter((r) => r.status === "answered").length;
  if (m.check.type === "axis") got = rqs.filter((r) => axisOf(r.element) === m.check.key).length;
  const result = got >= m.check.target ? "done" : got > 0 ? "partial" : "missed";
  const detail = result === "done" ? `${got}번 해냈어. ✅` : result === "partial" ? `${got}번 해봤어. 목표는 ${m.check.target}번이었어. ➖` : "이번엔 못 했어. 괜찮아 — 더 작게 쪼개 볼게.";
  return { text: m.text, result, detail };
}

function pickMission(six: Record<SixKey, number>, mix: Record<Openness, number>, answered: number, prev: WindowReport | null, prevResult: string | null, elements: WindowReport["elements"] = []): Mission {
  // 코드보다 먼저 정할 세 가지 중, 이번 열 문에서 한 번도 확인 안 한 칸
  const thinAxis = elements.length ? AXES.find((a) => !elements.some((e) => axisOf(e.element) === a.key)) : undefined;
  const sixOrder: SixKey[] = ["criteria", "verify", "constraint", "why"];
  const lowest = [...sixOrder].sort((a, b) => six[a] - six[b])[0];
  let key: string;
  let basis: string;
  if (six[lowest] <= 3) {
    key = lowest;
    basis = `6요소 중 ${roles.six[lowest].name}이(가) 이번 리포트에서 ${six[lowest]}/10으로 가장 비어 있어.`;
  } else if (thinAxis) {
    // 📐 코드보다 먼저 정할 세 가지 중, 이번에 한 번도 확인 안 한 칸부터
    key = `axis:${thinAxis.key}`;
    basis = `이번 리포트에서 ${thinAxis.emoji} ${thinAxis.name}(${thinAxis.desc})를 확인한 되묻기가 0번이었어.`;
  } else if (mix.O4 === 0) {
    key = "O4";
    basis = "이번 리포트에 대안을 물은 질문(O4)이 0번이었어.";
  } else if (mix.O3 + mix.O4 < 3) {
    key = "O3";
    basis = `열린 질문(O3+O4)이 ${mix.O3 + mix.O4}번뿐이었어.`;
  } else if (answered < 2) {
    key = "rq";
    basis = `돌아보기 질문에 답한 게 ${answered}번이었어.`;
  } else {
    key = "verify";
    basis = "질문 폭은 고르게 섞였어. 다음은 '확인하는 습관'이야.";
  }
  const def = missions.find((m) => m.key === key) ?? missions[0];
  // 같은 미션을 연속으로 못 했으면 더 작게 쪼갠다 (§7.4)
  const shrink = prev?.nextMission.key === key && prevResult === "missed";
  return {
    key,
    text: shrink ? def.small : def.text,
    basis: shrink ? basis + " 지난 리포트에서 못 해서 더 작게 쪼갰어." : basis,
    check: { ...(def.check as Mission["check"]), target: shrink ? 1 : def.check.target },
    editedByStudent: false,
  };
}

export function buildWindowReport(index: number, seq: number, projectId: string, turns: Turn[], rqs: ReverseQuestion[], allTurns: Turn[], projects: Project[], prev: WindowReport | null, now: number): WindowReport {
  const mix = { O1: 0, O2: 0, O3: 0, O4: 0, O5: 0, NA: 0 } as Record<Openness, number>;
  const roleCount = { typist: 0, coder: 0, engineer: 0, architect: 0, encyclopedia: 0 } as Record<RoleKey, number>;
  const six = { why: 0, context: 0, constraint: 0, criteria: 0, verify: 0, discard: 0 } as Record<SixKey, number>;
  const stageCount: Record<string, number> = {};
  const conceptCount: Record<string, number> = {};
  turns.forEach((t) => {
    mix[t.analysis.openness]++;
    if (t.role) roleCount[t.role]++;
    SIX_KEYS.forEach((k) => t.analysis.six[k] >= 0.5 && six[k]++);
    stageCount[t.analysis.stage] = (stageCount[t.analysis.stage] ?? 0) + 1;
    t.analysis.concepts.forEach((c) => (conceptCount[c] = (conceptCount[c] ?? 0) + 1));
  });
  const stage = (Object.entries(stageCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "탐색") as Stage;

  const stuck = Object.entries(conceptCount)
    .filter(([, n]) => n >= 2)
    .map(([concept, n]) => ({ concept, countInWindow: n, countTotal: allTurns.filter((t) => t.analysis.concepts.includes(concept)).length }))
    .sort((a, b) => b.countTotal - a.countTotal)
    .slice(0, 2);

  // 이번 판의 질문: 개방도 가중 + 6요소 합
  const weight: Record<Openness, number> = { O1: 0, O2: 1, O3: 3, O4: 3, O5: 0.5, NA: 0 };
  const scored = turns.map((t) => ({ t, s: weight[t.analysis.openness] + SIX_KEYS.reduce((a, k) => a + t.analysis.six[k], 0) + (t.chipUsed ? 0.5 : 0) }));
  const top = scored.sort((a, b) => b.s - a.s)[0];
  let best: WindowReport["best"] = null;
  if (top) {
    const filled = SIX_KEYS.filter((k) => top.t.analysis.six[k] >= 0.5).map((k) => roles.six[k].short);
    const o = top.t.analysis.openness;
    const why = o === "O4" ? "다른 길과 그 대가를 물었어." : o === "O3" ? "목표와 조건을 주고 방법을 물었어." : "이번 질문들 중 가장 많은 맥락을 실은 질문이야.";
    best = { turnN: (seq - 1) * 10 + turns.indexOf(top.t) + 1, text: top.t.question, reason: `${why}${filled.length ? ` 질문에 ${filled.join("·")}을(를) 실었어.` : ""}` };
  }

  const lastMission = prev ? evalMission(prev.nextMission, turns, rqs) : null;
  const elements: WindowReport["elements"] = rqs.map((r) => ({ element: r.element, form: r.form, score: r.status === "answered" ? (r.score ?? 0) : null, hintStage: r.hintStage, status: r.status }));
  const answered = rqs.filter((r) => r.status === "answered").length;
  const open = mix.O3 + mix.O4;
  const prevOpen = prev ? prev.mix.O3 + prev.mix.O4 : 0;
  const counted = 10 - mix.NA;
  let mixComment: string;
  if (mix.NA >= 5) mixComment = "이번엔 코드·에러를 주로 붙여넣었어. 다음엔 '뭘 하려던 중인지' 한 줄만 같이 줘도 달라져.";
  else if (!prev) mixComment = "여기가 출발점이야. 다음 리포트부터는 이 막대와 나란히 볼 수 있어.";
  else if (open > prevOpen) mixComment = `열린 질문이 지난 리포트 ${prevOpen}번 → 이번 ${open}번. AI를 코더 이상으로 쓰기 시작했어.`;
  else if (open < prevOpen) mixComment = `열린 질문이 ${prevOpen}번 → ${open}번으로 줄었어. ${stage === "구현" ? "구현 단계라면 자연스러운 흐름이야." : "막혔을 때 한 번 넓혀 물어보는 것도 방법이야."}`;
  else mixComment = `열린 질문은 지난 리포트와 같은 ${open}번이야. ${counted ? `좁은 질문이 ${mix.O2}번으로 가장 많았어.` : ""}`;

  return {
    index,
    projectId,
    seq,
    headline: makeHeadline(mix, roleCount, six),
    text: buildTextStats(turns, (_, i) => (seq - 1) * 10 + i + 1),
    createdAt: now,
    from: turns[0]?.createdAt ?? now,
    to: turns[turns.length - 1]?.createdAt ?? now,
    turnRange: [(seq - 1) * 10 + 1, (seq - 1) * 10 + turns.length],
    projects: [projects.find((p) => p.id === projectId)?.name ?? "프로젝트"],
    stage,
    mix,
    roles: roleCount,
    six,
    elements,
    stuck,
    lastMission,
    mixComment,
    best,
    nextMission: pickMission(six, mix, answered, prev, lastMission?.result ?? null, elements),
    opened: false,
  };
}

/* ---------- Markdown 내보내기 ---------- */

const bar = (n: number, max = 10) => "▇".repeat(Math.round((n / max) * 10)) || "·";

export function rolesLine(r: Record<RoleKey, number>) {
  return ROLE_KEYS.filter((k) => r[k] > 0).map((k) => `${roles.roles[k].emoji}${r[k]}`).join(" ") || "—";
}

export function elementsLine(els: WindowReport["elements"]) {
  return els.length ? els.map((e) => colorOf(e.score)).join("") : "(없음)";
}

/** 리포트의 여덟 칸 — 화면(ReportBody)과 .md가 같은 순서 · 같은 이름을 쓴다. 데이터가 없어도 칸은 빠지지 않는다. */
export const REPORT_SECTIONS = [
  { n: "①", title: "한눈에 보기" },
  { n: "②", title: "질문 유형 — 어떤 폭으로 물었나" },
  { n: "③", title: "질문 길이 — 글자 수와 실은 것" },
  { n: "④", title: "질문에 실은 것 — 여섯 가지" },
  { n: "⑤", title: "되묻기 돌아보기" },
  { n: "⑥", title: "걸린 곳" },
  { n: "⑦", title: "베스트 질문" },
  { n: "⑧", title: "미션 — 지난 미션 → 다음 미션" },
] as const;

export function reportToMd(r: WindowReport, reports: WindowReport[], name: string): string {
  const ref = roles.stageMix[r.stage];
  const total = Math.max(1, O_KEYS.reduce((n, k) => n + r.mix[k], 0));
  const top = ROLE_KEYS.filter((k) => r.roles[k] > 0).sort((a, b) => r.roles[b] - r.roles[a])[0];
  const h = (i: number) => `## ${REPORT_SECTIONS[i].n} ${REPORT_SECTIONS[i].title}`;
  const L = [`# 📄 ${reportTitle(r, reports)}`, ``, `## “${reportHeadline(r)}”`, ``, `> ${name} · ${reportSub(r, reports)}`, ``];

  L.push(h(0), `- 🌅 열린 질문 ${r.mix.O3 + r.mix.O4}/${total}`, `- 🪑 AI를 가장 많이 앉힌 자리: ${top ? `${roles.roles[top].emoji} ${roles.roles[top].name} ${r.roles[top]}번` : "—"}`, `- 📏 질문 평균 길이: ${r.text ? `${r.text.avg}자 (${r.text.min}~${r.text.max}자)` : "기록 없음"}`, `- 🧭 되묻기 ${r.elements.length}번 ${elementsLine(r.elements)}`, ``);

  L.push(h(1), ``, `| 유형 | AI의 자리 | 막대 | 횟수 |`, `|---|---|---|---|`);
  O_KEYS.forEach((k) => {
    const o = roles.openness[k as Exclude<Openness, "NA">];
    const role = roles.roles[o.role as RoleKey];
    L.push(`| ${o.label} | ${role.emoji} ${role.name} | ${bar(r.mix[k])} | ${r.mix[k]} |`);
  });
  L.push(``, `참고 (${r.stage} 단계에서 흔히 잘 통하는 비율) 좁은 질문 ${ref.O2}% · 열린 질문 ${ref.O3}% · 대안 질문 ${ref.O4}%`, ``, `> 💬 ${r.mixComment}`, ``);

  L.push(h(2));
  if (r.text) {
    L.push(``, `| 길이 | 횟수 | 실은 것(평균) | 열린 질문 |`, `|---|---|---|---|`);
    LENGTH_KEYS.forEach((k) => L.push(`| ${LENGTH_INFO[k].emoji} ${LENGTH_INFO[k].name} (${LENGTH_INFO[k].range}) | ${r.text!.buckets[k].count} | ${r.text!.buckets[k].avgSix}가지 | ${r.text!.buckets[k].open} |`));
    L.push(``, `> 💬 ${textComment(r.text)}`, ``);
  } else L.push(`질문 원문이 남아 있지 않아 글자 수를 셀 수 없어.`, ``);

  L.push(h(3), SIX_KEYS.map((k) => `${roles.six[k].name} ${r.six[k]}/${total}`).join(" · "), ``);

  L.push(h(4));
  if (r.elements.length === 0) L.push(`이번엔 되묻기에 답한 기록이 없어.`);
  r.elements.forEach((e) => {
    const el = elementById(e.element);
    L.push(`- ${el?.icon ?? ""} ${el?.name ?? e.element} ${e.status === "answered" ? colorOf(e.score) : "➖ 나중에"} ${FORM_LABEL[e.form]}(${e.form})${e.hintStage ? " · 힌트 후" : ""}`);
  });
  // 📐 세 축 — 코드보다 먼저 정할 세 가지 중 이번에 무엇을 확인했나
  if (r.elements.length) {
    const thin = AXES.filter((a) => !r.elements.some((e) => axisOf(e.element) === a.key));
    L.push(``, `**📐 이번에 확인한 세 축** — ${AXES.map((a) => `${a.emoji} ${a.name} ${r.elements.filter((e) => axisOf(e.element) === a.key).length}`).join(" · ")}`);
    L.push(thin.length ? `> ${thin.map((a) => `${a.emoji} ${a.name}`).join(" · ")}는 이번에 한 번도 안 물었어 — ${thin[0].desc}.` : `> 세 축을 다 확인했어.`);
  }
  L.push(``);

  L.push(h(5));
  if (r.stuck.length === 0) L.push(`같은 개념을 두 번 이상 물은 곳은 없었어.`);
  r.stuck.forEach((s) => L.push(`- **${s.concept}** 관련 질문이 이번에 ${s.countInWindow}번. 지금까지 합쳐 ${s.countTotal}번째야.`));
  L.push(``);

  L.push(h(6), ...(r.best ? [`> "${r.best.text}" — Q${r.best.turnN}`, ``, `💬 ${r.best.reason}`] : [`이번엔 뽑지 않았어.`]), ``);

  L.push(h(7), r.lastMission ? `- 지난 미션: "${r.lastMission.text}" → ${r.lastMission.detail}` : `- 지난 미션: 아직 없어.`, `- 다음 미션 (하나만 · 바꿔도 돼): **${r.nextMission.text}**`, `  ← ${r.nextMission.basis}`);
  return L.join("\n");
}

/* ---------- 🔎 질문 분석 .md — 내가 매번 뭘 물었고, 그 질문이 답을 어떻게 바꿨나 ---------- */

/** 빠진 칸을 채우는 한 줄 초안 — 다음에 같은 걸 물을 때 이 줄만 보태면 된다 */
const SIX_FIX: Record<SixKey, string> = {
  why: "이건 ___를 위한 거야 — ___가 되면 성공이야.",
  context: "지금 상황은 ___이고, 쓰는 사람은 ___야.",
  constraint: "___까지 해야 하고, ___는 못 써.",
  criteria: "잘 됐다는 건 ___로 재서 ___일 때야.",
  verify: "맞는지 확인하려면 ___를 해보면 돼.",
  discard: "이번엔 ___는 안 할래.",
};

export interface QuestionDocInput {
  turns: Turn[];
  rqs: ReverseQuestion[];
  /** 그 질문의 답이 기획서에 남긴 한 줄 (있으면) */
  planNoteOf?: (turnId: string) => string | undefined;
}

/** 리포트 한 장이 덮는 질문들을, 한 개씩 뜯어 본 문서. 숫자는 전부 그 질문에서 직접 센 것이다. */
export function questionsToMd(r: WindowReport, reports: WindowReport[], name: string, src: QuestionDocInput): string {
  const [from, to] = r.turnRange;
  const mine = src.turns.filter((t) => (r.projectId ? t.projectId === r.projectId : true) && t.n >= from && t.n <= to).sort((a, b) => a.n - b.n);
  const seq = seqOf(r, reports);
  const L: string[] = [
    `# 🔎 질문 분석 — ${r.projects[0] ?? "내 프로젝트"} · ${seq}번째 리포트`,
    ``,
    `> ${name} · 질문 Q${from}~Q${to} · ${mine.length}개`,
    `>`,
    `> 답이 아니라 **내가 한 질문**을 본다. 질문의 폭이 AI를 어느 자리에 앉혔고, 무엇을 실었고 무엇을 빠뜨렸는지 — 하나씩.`,
    ``,
    `## 한눈에`,
    ``,
    `| # | 질문 | 유형 → AI의 자리 | 실은 것 | 글자 | 🧭 되묻기 |`,
    `|---|---|---|---|---|---|`,
  ];

  const rqOf = (t: Turn) => src.rqs.find((q) => q.turnId === t.id);
  mine.forEach((t) => {
    const o = t.analysis.openness;
    const info = o === "NA" ? null : roles.openness[o];
    const role = info ? roles.roles[info.role as RoleKey] : null;
    const six = SIX_KEYS.filter((k) => t.analysis.six[k] >= 0.5);
    const chars = t.question.replace(/\s+/g, " ").trim().length;
    const q = rqOf(t);
    L.push(
      `| Q${t.n} | ${t.question.replace(/\s+/g, " ").trim().slice(0, 28)}… | ${info ? `${info.short} → ${role?.emoji} ${role?.name}` : "판별 불가"} | ${six.length}/6 | ${chars}자 | ${q ? `${colorOf(q.score ?? null)} ${elementById(q.element)?.name ?? q.element}` : "—"} |`,
    );
  });
  L.push(``, `---`, ``);

  mine.forEach((t) => {
    const o = t.analysis.openness;
    const info = o === "NA" ? null : roles.openness[o];
    const role = info ? roles.roles[info.role as RoleKey] : null;
    const got = SIX_KEYS.filter((k) => t.analysis.six[k] >= 0.5);
    const miss = SIX_KEYS.filter((k) => t.analysis.six[k] < 0.5);
    const chars = t.question.replace(/\s+/g, " ").trim().length;
    const len = LENGTH_INFO[lengthKeyOf(chars)];
    const plan = src.planNoteOf?.(t.id);
    const q = rqOf(t);

    L.push(`## Q${t.n}`, ``, `> ${t.question.replace(/\n+/g, "\n> ")}`, ``);
    L.push(
      `| 본 것 | 값 |`,
      `|---|---|`,
      `| 질문의 폭 | ${info ? `**${info.label}** (${o}) — ${info.shape}` : "코드·에러만 붙인 질문이라 폭을 판별하지 않았어"} |`,
      `| 그래서 AI는 | ${role ? `${role.emoji} **${role.name}** 자리에 앉았다 — 얻는 것 ${info!.gain} · 잃는 것 ${info!.lose}` : "—"} |`,
      `| 글자 수 | ${chars}자 (${len.emoji} ${len.name}) |`,
      `| 실은 것 | ${SIX_KEYS.map((k) => `${roles.six[k].name} ${t.analysis.six[k] >= 0.5 ? "✅" : "⬜"}`).join(" · ")} |`,
      `| 이 질문이 남긴 것 | ${plan ?? "기획서에 새로 담긴 칸은 없었어"} |`,
      ``,
    );
    L.push(got.length ? `**잘한 것** — ${got.map((k) => roles.six[k].name).join(" · ")}을(를) 실어서, 답이 네 프로젝트 쪽으로 좁혀졌어.` : `**잘한 것** — 아직 실은 칸이 없어. 한 칸만 보태도 답이 달라져.`);
    if (miss.length) {
      L.push(``, `**빠진 것** — ${miss.map((k) => roles.six[k].name).join(" · ")}`, ``, `다음에 같은 걸 물을 땐 이 한 줄만 보태 봐:`, ``, ...miss.slice(0, 2).map((k) => `- ${roles.six[k].name} — \`${SIX_FIX[k]}\``));
    } else L.push(``, `**빠진 것** — 없어. 여섯 칸을 다 실었어.`);

    if (q) {
      const el = elementById(q.element);
      const ax = axisOf(q.element);
      const axis = AXES.find((a) => a.key === (q.axis ?? ax));
      L.push(
        ``,
        `### 🧭 이 질문 뒤의 되묻기 — ${el?.icon ?? ""} ${el?.name ?? q.element}${axis ? ` (${axis.emoji} ${axis.name})` : ""} · ${FORM_LABEL[q.form]}`,
        ``,
        `- **물음** — ${q.question}`,
        ...(q.benefit ? [`- **왜 묻나** — ${q.benefit}`] : []),
        `- **내 답** — ${q.status === "answered" ? (q.answer ?? "(적지 않음)") : q.status === "later" ? "나중에로 넘김" : "아직 안 답함"}`,
        `- **판정** — ${colorOf(q.score ?? null)}${q.hintStage ? ` · 힌트 ${q.hintStage}단까지 열고` : ""} ${q.reason ?? ""}`,
      );
    }
    L.push(``, `---`, ``);
  });

  L.push(`## 이번 구간을 한 줄로`, ``, `> 💬 ${r.mixComment}`, ``);
  if (r.text) L.push(`> 📏 ${textComment(r.text)}`, ``);
  if (r.best) L.push(`**🏅 이번의 베스트 질문** — Q${r.best.turnN} “${r.best.text}”`, ``, `💬 ${r.best.reason}`, ``);
  L.push(`**🚩 다음 미션** — ${r.nextMission.text}`, `  ← ${r.nextMission.basis}`);
  return L.join("\n");
}

/* ---------- 월간 (§7.5) ---------- */

export interface Prescription {
  kind: "📚 지식" | "🛠 기술" | "🧭 습관";
  title: string;
  basis: string;
  action: string;
  effect: string;
  promise: string;
}

export interface Monthly {
  ym: string;
  label: string;
  mini: boolean;
  reports: WindowReport[];
  all: WindowReport[]; // 번호를 매길 때 쓰는 전체 리포트
  elementMap: { id: string; icon: string; name: string; scores: (number | null)[]; forms: string[] }[];
  stuck: { concept: string; total: number }[];
  missions: { index: number; text: string; result: string }[];
  prescriptions: Prescription[];
  notes: Note[];
  goalDraft: string;
}

export function buildMonthly(ym: string, all: WindowReport[], notes: Note[]): Monthly {
  const reports = all.filter((r) => ymOf(r.createdAt) === ym).sort((a, b) => a.index - b.index);
  const [y, m] = ym.split("-");
  const map = new Map<string, { scores: (number | null)[]; forms: string[] }>();
  reports.forEach((r) => r.elements.forEach((e) => {
    const cur = map.get(e.element) ?? { scores: [], forms: [] };
    cur.scores.push(e.score);
    cur.forms.push(e.form);
    map.set(e.element, cur);
  }));
  const elementMap = [...map.entries()].map(([id, v]) => ({ id, icon: elementById(id)?.icon ?? "", name: elementById(id)?.name ?? id, ...v }));

  const stuckTotal: Record<string, number> = {};
  reports.forEach((r) => r.stuck.forEach((s) => (stuckTotal[s.concept] = (stuckTotal[s.concept] ?? 0) + s.countInWindow)));
  const stuck = Object.entries(stuckTotal).map(([concept, total]) => ({ concept, total })).sort((a, b) => b.total - a.total);

  const missionsLog = all
    .filter((r) => r.lastMission && ymOf(r.createdAt) === ym)
    .map((r) => ({ index: r.index - 1, text: r.lastMission!.text, result: r.lastMission!.result }));

  const n = reports.length || 1;
  const prescriptions: Prescription[] = [];
  if (stuck[0] && stuck[0].total >= 3) {
    prescriptions.push({
      kind: "📚 지식",
      title: `'${stuck[0].concept}' 제대로 한 번 잡기`,
      basis: `이번 달 '걸린 곳'에 ${stuck[0].total}회 올랐어.`,
      action: "40분 개념 학습 1회 + 그 개념만 쓰는 아주 작은 연습 1개",
      effect: "같은 곳에서 멈추는 시간이 줄어.",
      promise: `'${stuck[0].concept}' 관련 질문이 오면 그 부분부터 풀어서 설명할게.`,
    });
  }
  const sixAvg = (k: SixKey) => reports.reduce((s, r) => s + r.six[k], 0) / n;
  const lowSix = (["criteria", "verify", "constraint"] as SixKey[]).sort((a, b) => sixAvg(a) - sixAvg(b))[0];
  if (reports.length && sixAvg(lowSix) < 4) {
    prescriptions.push({
      kind: "🧭 습관",
      title: `'${roles.six[lowSix].name}' 먼저 적기`,
      basis: `6요소 중 ${roles.six[lowSix].name}이(가) 리포트 ${reports.length}장 평균 ${sixAvg(lowSix).toFixed(1)}/10.`,
      action: "질문을 보내기 전에 그 한 줄만 덧붙이기",
      effect: "내 답이 '누구에게나 맞는 답'에서 '너에게 맞는 답'으로 바뀌어.",
      promise: "다음 달 첫 미션으로 이미 넣어뒀어.",
    });
  }
  const weakEl = elementMap
    .map((e) => ({ e, avg: e.scores.filter((s): s is number => s !== null).reduce((a, b) => a + b, 0) / Math.max(1, e.scores.filter((s) => s !== null).length) }))
    .filter((x) => x.e.scores.some((s) => s !== null))
    .sort((a, b) => a.avg - b.avg)[0];
  if (weakEl && weakEl.avg < 1.5) {
    prescriptions.push({
      kind: "🛠 기술",
      title: `${weakEl.e.icon} '${weakEl.e.name}' 연습`,
      basis: `돌아보기에서 ${weakEl.e.name}이(가) ${weakEl.e.scores.map((s) => colorOf(s)).join("")} 였어.`,
      action: "넘겨 둔 이 요소 질문을 하나만 다시 열어 네 말로 답해보기",
      effect: "고르기(F1)에서 한두 문장(F3)으로 넘어가.",
      promise: "이 요소는 당분간 고르기 형태로 가볍게 물을게.",
    });
  }

  const first = reports[0];
  const last = reports[reports.length - 1];
  const goalDraft = last ? `${last.nextMission.text.replace(/\.$/, "")} — 그리고 열린 질문을 리포트 한 장에 ${Math.min(6, (last.mix.O3 + last.mix.O4) + 1)}번 이상.` : "";
  void first;
  return {
    ym,
    label: `${y}년 ${Number(m)}월`,
    mini: reports.length < 2,
    reports,
    all,
    elementMap,
    stuck,
    missions: missionsLog,
    prescriptions: prescriptions.slice(0, 3),
    notes: notes.filter((x) => ymOf(x.createdAt) === ym).slice(-2),
    goalDraft,
  };
}

export function monthlyToMd(mo: Monthly, name: string, goal: string): string {
  const L = [`# 📘 ${name}의 ${mo.label} 월간 리포트${mo.mini ? " (미니)" : ""}`, ``, `## 1. 이번 달의 리포트`, ``, `| 리포트 | 날짜 | 역할 | 돌아보기 |`, `|---|---|---|---|`];
  mo.reports.forEach((r) => L.push(`| ${reportTitle(r, mo.all)} | ${fmtDate(r.createdAt)} | ${rolesLine(r.roles)} | ${elementsLine(r.elements)} |`));
  L.push(``, `## 2. 질문 믹스의 변화`, ``, `| 리포트 | 지시 | 좁은 | 열린 | 대안 | 맨 열린 |`, `|---|---|---|---|---|---|`);
  mo.reports.forEach((r) => L.push(`| ${reportTitle(r, mo.all)} | ${r.mix.O1} | ${r.mix.O2} | ${r.mix.O3} | ${r.mix.O4} | ${r.mix.O5} |`));
  L.push(``, `## 3. 평가 요소 지도`);
  mo.elementMap.forEach((e) => L.push(`- ${e.icon} ${e.name} ${e.scores.map((s) => colorOf(s)).join("")} (${e.forms[0]}→${e.forms[e.forms.length - 1]})`));
  L.push(``, `## 4. 걸린 곳`, mo.stuck.length ? mo.stuck.map((s) => `- ${s.concept} ${s.total}회`).join("\n") : "- 반복해서 걸린 곳은 없었어.");
  L.push(``, `## 5. 미션 기록`, mo.missions.length ? mo.missions.map((m) => `- ${m.result === "done" ? "✅" : m.result === "partial" ? "➖" : "◻️"} ${m.text}`).join("\n") : "- 아직 없어.");
  L.push(``, `## 6. 📚 공부 처방`);
  mo.prescriptions.forEach((p, i) => L.push(`### ${"①②③"[i]} ${p.kind} — ${p.title}`, `- 근거: ${p.basis}`, `- 행동: ${p.action}`, `- 기대 효과: ${p.effect}`, `- 내가 도울게: ${p.promise}`, ``));
  if (!mo.prescriptions.length) L.push("이번 달은 처방할 만큼 뚜렷한 구멍이 안 보여. 데이터가 더 쌓이면 다시 볼게.", ``);
  L.push(`## 7. 가장 깊었던 생각`, mo.notes.length ? mo.notes.map((n) => `> "${n.text}"`).join("\n\n") : "심화 대화를 열면 여기에 네 문장이 모여.");
  L.push(``, `## 8. 다음 달 목표`, goal || mo.goalDraft || "—");
  return L.join("\n");
}

export type { Stage };
