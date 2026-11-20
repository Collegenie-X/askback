// 10문 리포트의 문장 세 개를 Claude 에게 맡기는 규칙 — 브라우저(engine.ts)와 서버가 같이 쓴다.
//   숫자(열림 분포 · 6요소 · 되묻기 점수 · 미션 기준)  → report.ts 규칙. 같은 기록이면 언제나 같은 숫자.
//   문장(제목 · 베스트 질문 이유 · 다음 미션 말투)     → Claude. 실패하면 규칙 문장 그대로.
import roles from "@/data/roles.json";
import { elementById } from "./rq";
import type { ReportOut } from "./schemas";
import type { Project, Turn, WindowReport } from "./types";

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

/** Claude report 태스크에 보낼 입력 */
export function reportInput(r: WindowReport, turns: Turn[], project: Pick<Project, "name" | "desc">) {
  return JSON.stringify({
    프로젝트: `${project.name}${project.desc ? ` — ${project.desc}` : ""}`,
    국면: r.stage,
    질문들: turns.map((t, i) => `Q${r.turnRange[0] + i}. ${clip(t.question, 300)}`),
    집계: {
      열림: r.mix,
      실은_것: Object.fromEntries(Object.entries(r.six).map(([k, n]) => [roles.six[k as keyof typeof roles.six].name, n])),
      되묻기: r.elements.map((e) => `${elementById(e.element)?.name ?? e.element}: ${e.status === "answered" ? `${e.score}점` : "나중에"}`),
      걸린_개념: r.stuck.map((s) => `${s.concept} ${s.countInWindow}번`),
    },
    베스트_질문: r.best ? { 번호: `Q${r.best.turnN}`, 질문: r.best.text, 앱의_근거: r.best.reason } : null,
    다음_미션: { 규칙_문장: r.nextMission.text, 근거: r.nextMission.basis, 확인_기준: r.nextMission.check },
    지난_미션: r.lastMission ? `${r.lastMission.text} → ${r.lastMission.detail}` : null,
  });
}

/** Claude 문장을 덮는다 — 숫자 칸은 건드리지 않는다. 빈 문장이 오면 규칙 문장을 남긴다 */
export function applyReport(r: WindowReport, out: ReportOut): WindowReport {
  const headline = out.headline.trim();
  const reason = out.best_reason.trim();
  const mission = out.mission_text.trim();
  return {
    ...r,
    headline: headline ? clip(headline, 60) : r.headline,
    best: r.best && reason ? { ...r.best, reason } : r.best,
    nextMission: mission && !r.nextMission.editedByStudent ? { ...r.nextMission, text: clip(mission, 80) } : r.nextMission,
    writtenBy: "claude",
  };
}
