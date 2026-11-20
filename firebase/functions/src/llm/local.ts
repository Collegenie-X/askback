// 로컬 답 카드 — API 키가 없거나 Claude 가 실패했을 때도 같은 모양으로 답한다.
// frontend/src/lib/engine.ts 의 localAnswer 와 같은 규칙 (카드는 frontend/public/answers/*.md).
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import answers from "@front/data/answers.json";
import type { Analysis } from "@front/lib/types";

export interface LocalAnswer {
  md: string;
  assumptions: string[];
  yourCall: string[];
  riskNote?: string;
}

async function card(file: string) {
  try {
    return await readFile(join(__dirname, "answers", file), "utf8");
  } catch {
    return "답 카드를 불러오지 못했어. 잠시 뒤에 다시 물어봐 줄래?";
  }
}

const fill = (md: string, vars: Record<string, string>) => md.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");

export async function localAnswer(question: string, analysis: Analysis, project: { name: string; desc: string }): Promise<LocalAnswer> {
  const hay = `${question} ${project.name} ${project.desc}`.toLowerCase();
  let best: { score: number; card: (typeof answers.cards)[number] } | null = null;
  for (const c of answers.cards) {
    if (!c.openness.includes(analysis.openness)) continue;
    const inQuestion = c.keywords.filter((k) => question.toLowerCase().includes(k.toLowerCase())).length;
    if (!inQuestion) continue;
    const score = inQuestion + c.keywords.filter((k) => hay.includes(k.toLowerCase())).length * 0.5 - c.openness.indexOf(analysis.openness) * 0.3;
    if (!best || score > best.score) best = { score, card: c };
  }
  const file = best ? best.card.file : (answers.fallback as Record<string, string>)[analysis.openness];
  let md = await card(file);
  // 답한 뒤에는 열린 질문으로 되묻는다
  const asks = (answers.asks as Record<string, string[]>)[analysis.openness] ?? [];
  if (asks.length && !md.includes("되물을게")) md = `${md.trimEnd()}\n\n---\n\n🙋 **하나만 되물을게** — ${asks[question.length % asks.length]}`;
  return {
    md: fill(md, { question: question.replace(/\n/g, " "), project: project.name }),
    assumptions: best ? best.card.assumptions : answers.fallbackAssumptions,
    yourCall: best && "yourCall" in best.card ? (best.card.yourCall as string[]) : [],
    riskNote: best?.card.risk ?? undefined,
  };
}
