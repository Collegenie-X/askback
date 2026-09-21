"use client";

// 아이템 초안 — 프로젝트는 다섯 형식 중 하나를 고르고, 채팅으로 그 형식의 체크 칸을 하나씩 채운다.
// 형식에 따라 질문 버튼과 체크 방향이 달라지고, 채운 초안은 .md 한 장으로 내보낸다.
import data from "@/data/formats.json";
import lenses from "@/data/lenses.json";
import roles from "@/data/roles.json";
import { read, update } from "./db";
import type { FormatKey, Project } from "./types";

export const FORMAT_KEYS = Object.keys(data.formats) as FormatKey[];
export const formatOf = (project: Project) => (project.format ? data.formats[project.format] : null);

export function draftProgress(project: Project) {
  const checks = formatOf(project)?.checks ?? [];
  const done = checks.filter((c) => project.checks?.[c.key]).length;
  return { done, total: checks.length, next: checks.find((c) => !project.checks?.[c.key]) ?? null };
}

export function setFormat(projectId: string, format: FormatKey) {
  update("projects", (prev) => prev.map((p) => (p.id === projectId ? { ...p, format, checks: p.format === format ? p.checks : {} } : p)));
}

export function setCheck(projectId: string, key: string, text: string) {
  update("projects", (prev) => prev.map((p) => (p.id === projectId ? { ...p, checks: { ...p.checks, [key]: text.trim() }, updatedAt: Date.now() } : p)));
}

// 코치에게 가는 맥락 — 형식과 빈칸을 알면 답이 초안을 채우는 쪽으로 간다
export function draftContext(project: Project) {
  const f = formatOf(project);
  if (!f) return "";
  const rows = f.checks.map((c) => `- ${c.label}: ${project.checks?.[c.key] || "(아직 비어 있음)"}`);
  return [
    `초안 형식: ${f.name} — ${f.draft}`,
    `이 형식에서 설계란: 기획 = ${f.design.plan} / 알고리즘 = ${f.design.algo} / 전체 구조 = ${f.design.arch}`,
    `나중으로 미루는 것: ${f.design.later}`,
    `형식별 코칭 지침:`,
    ...f.coach.map((c) => `- ${c}`),
    `초안 체크 칸 (학생이 정한 것):`,
    ...rows,
    `답은 이 형식에 맞추고, 비어 있는 칸을 학생이 스스로 정하도록 돕는다. 칸을 대신 채워 주지 않는다.`,
  ].join("\n");
}

// 형식을 고른 직후 코치가 하는 말 — 무엇을 설계하는지, 질문과 되묻기가 어떻게 달라지는지 밝힌다
export function formatIntro(key: FormatKey) {
  const f = data.formats[key];
  const P = data.principle;
  return [
    `**${f.emoji} ${f.name}** 초안으로 가자. 완성품이 아니라 **설계가 담긴 한 장짜리 초안**이야.`,
    ``,
    `**${P.title}** — 여기서 네가 쥘 것은 세 가지야:`,
    ...P.axes.map((a) => `- ${a.emoji} **${a.name}** — ${f.design[a.key as "plan" | "algo" | "arch"]}`),
    ``,
    `${f.design.later} 같은 건 **나중**이야. ${P.coach}`,
    ``,
    `채울 칸은 ${f.checks.length}개야:`,
    ...f.checks.map((c, i) => `${i + 1}. **${c.label}** — ${c.done}`),
    ``,
    `입력창 위 버튼이 **${f.name}** 질문으로 바뀌었어. 첫 칸 **${f.checks[0].label}**부터 눌러서 물어봐. 답을 보고 네가 정했으면 **✅ 초안에 적기**로 한 줄 남기면 돼.`,
  ].join("\n");
}

/* ---------- 프로젝트 → .md 내보내기 ---------- */

const day = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// 답 안의 제목이 문서 구조를 깨지 않게 아래 단계로 내린다
function demote(md: string, by: number) {
  let fence = false;
  return md.split("\n").map((line) => {
    if (/^\s*```/.test(line)) fence = !fence;
    const h = !fence && line.match(/^(#{1,6})\s+(.*)/);
    return h ? `${"#".repeat(Math.min(6, h[1].length + by))} ${h[2]}` : line;
  }).join("\n");
}

export function exportFilename(project: Project, full: boolean) {
  return `${project.name.replace(/[^\w가-힣]+/g, "_")}_${full ? "전체기록" : "초안"}_${day(Date.now())}.md`;
}

export function projectMd(project: Project, full: boolean): string {
  const profile = read("profile");
  const f = formatOf(project);
  const turns = read("turns").filter((t) => t.projectId === project.id);
  const messages = read("messages").filter((m) => m.projectId === project.id);
  const rqs = read("rqs").filter((r) => r.projectId === project.id && r.status === "answered");
  const notes = read("notes").filter((n) => n.projectId === project.id);
  const answerOf = (turnId: string) => {
    const m = messages.find((x) => x.kind === "answer" && x.turnId === turnId);
    return m && m.kind === "answer" ? m : null;
  };
  const p = draftProgress(project);
  const L: string[] = [
    `# ${project.emoji} ${project.name}`,
    ``,
    `> ${project.desc || "한 줄 설명 없음"}`,
    `>`,
    `> ${profile?.name ?? "학생"} · ${day(Date.now())} · 질문 ${turns.length}개${f ? ` · ${f.emoji} ${f.name} 초안 ${p.done}/${p.total}` : ""}`,
    ``,
  ];
  if (f) {
    L.push(`## 1. 기초 초안 — ${f.emoji} ${f.name}`, ``, `_${f.draft}_`, ``);
    f.checks.forEach((c) => {
      const mine = project.checks?.[c.key];
      L.push(`### ${mine ? "✅" : "⬜"} ${c.label}`, ``, mine || `_아직 비어 있어 — ${c.done}_`, ``);
    });
  }

  const calls = [...new Set(turns.flatMap((t) => answerOf(t.id)?.yourCall ?? []))];
  const assumed = [...new Set(turns.flatMap((t) => answerOf(t.id)?.assumptions ?? []))];
  if (calls.length || assumed.length) {
    L.push(`## 2. 내가 정할 것 · AI가 가정한 것`, ``);
    if (calls.length) L.push(`**🫵 내가 정할 것**`, ``, ...calls.map((c) => `- [ ] ${c}`), ``);
    if (assumed.length) L.push(`**📌 AI가 가정한 것 — 맞는지 확인하기**`, ``, ...assumed.map((c) => `- ${c}`), ``);
  }
  if (!full) return L.join("\n");

  L.push(`## 3. 질문과 답`, ``);
  if (!turns.length) L.push(`아직 질문이 없어.`, ``);
  turns.forEach((t) => {
    const a = answerOf(t.id);
    const o = t.analysis.openness;
    L.push(`### Q${t.n}. ${t.question.replace(/\s+/g, " ").slice(0, 80)}`, ``, `> ${t.question.replace(/\n/g, "\n> ")}`, ``);
    L.push(`_${day(t.createdAt)} · ${o === "NA" ? "판별 불가" : roles.openness[o].short} · ${t.analysis.stage}${t.role ? ` · AI 역할: ${roles.roles[t.role].name}` : ""}_`, ``);
    if (a) L.push(demote(a.md, 3), ``);
  });
  if (rqs.length) {
    L.push(`## 4. 코치가 되물은 것과 내 답`, ``);
    rqs.forEach((r) => L.push(`- **Q.** ${r.question}`, `  - **내 답:** ${r.answer ?? ""}`, ...(r.feedback ? [`  - **코치:** ${r.feedback.replace(/\s+/g, " ")}`] : [])));
    L.push(``);
  }
  if (notes.length) {
    L.push(`## 5. 생각 노트`, ``);
    notes.forEach((n) => L.push(`- ${lenses[n.lens].emoji} ${lenses[n.lens].name} — “${n.text}”`));
    L.push(``);
  }
  return L.join("\n");
}
