// 되묻기 다듬기 · 채점 규칙 — 브라우저(engine.ts)와 서버(firebase/functions)가 같이 쓴다.
// 화면 · 저장소를 모르는 순수 함수만 둔다. Claude 호출 자체는 각자(브라우저 /api/turn · 서버 llm/claude.ts) 한다.
import { similarity } from "./analyzer";
import { AXIS } from "./rq";
import type { FeedbackOut, RQOut } from "./schemas";
import type { ReverseQuestion } from "./types";

export interface FeedbackResult {
  score: number;
  reason: string;
  feedback: string;
}

/** Claude rq 태스크에 보낼 입력 — 마디(질문 · 답 쌍) + 평가 요소 + 형태 + 확인할 축 */
export function rqInput(base: ReverseQuestion, bar: { q: string; a: string }[], elementName: string) {
  const axis = base.axis ? AXIS[base.axis] : null;
  return JSON.stringify({
    마디: bar,
    평가요소: `${base.element} ${elementName}`,
    형태: base.form,
    확인할_축: axis ? `${axis.emoji} ${axis.name} — ${axis.desc}` : "설계 전반",
  });
}

/** Claude 가 다듬은 되묻기를 템플릿 위에 덮는다 (보기는 F1 이고 2개 이상일 때만) */
export function applyRQ(base: ReverseQuestion, out: RQOut): ReverseQuestion {
  return {
    ...base,
    question: out.question,
    benefit: out.benefit || base.benefit,
    options: base.form === "F1" && out.options.length >= 2 ? out.options.slice(0, 3) : base.options,
    hint: out.hint,
    example: out.example,
    coachView: out.coach_view,
    expectedPoints: out.expected_points,
  };
}

/** Claude feedback 태스크에 보낼 입력 */
export function feedbackInput(rq: ReverseQuestion, answer: string, lastAnswerMd: string) {
  return JSON.stringify({ 역질문: rq.question, expected_points: rq.expectedPoints, 학생의_답: answer, hint_stage: rq.hintStage, 직전_AI_답: lastAnswerMd.slice(0, 1500) });
}

/** Claude 채점 결과 → 0~3 점으로 */
export function fromFeedback(out: FeedbackOut): FeedbackResult {
  return { score: Math.max(0, Math.min(3, Math.round(out.score))), reason: out.reason_one_line, feedback: out.feedback_md };
}

const JOKE = /^(몰라|모름|ㅁㄹ|글쎄|아무거나|ㅋ+|ㅎ+|\.+|\?+)[\sㅋㅎ~!.]*$/;
const REASON = /(때문|니까|라서|해서|으면|면 |왜냐|그래서|대신)/;

/** Claude 없이 채점 — 보기 점수 · 길이 · 이유 표현 · 직전 답 베끼기 · 힌트 사용 */
export function localGrade(rq: ReverseQuestion, answer: string, optionScore: number | null, lastAnswerMd: string, add: { good: string; weak: string }): FeedbackResult {
  const text = answer.trim();
  const quote = text.length > 28 ? text.slice(0, 28) + "…" : text;
  if (optionScore === null && JOKE.test(text)) {
    return { score: 0, reason: "가볍게 넘긴 답", feedback: "ㅋㅋ 알겠어. 하던 거 하자." };
  }
  let score = optionScore ?? (text.length >= 18 && REASON.test(text) ? 3 : text.length >= 8 ? 2 : 1);
  let reason = optionScore !== null ? "보기에서 고름" : score === 3 ? "자기 말로 이유까지 말함" : score === 2 ? "자기 말로 대체로 답함" : "짧게 방향만 말함";
  const copied = optionScore === null && similarity(text, lastAnswerMd.slice(0, 400)) > 0.55;
  if (copied) {
    score = Math.min(score, 1);
    reason = "직전 답과 표현이 거의 같음";
  }
  if (rq.hintStage > 0) {
    score = Math.min(score, 1);
    reason += " · 힌트 후";
  }
  const receive = `"${quote}" — 그렇게 봤구나.`;
  const plus = copied ? "이번엔 네 말로 한 줄만 다시 말해 볼래?" : score >= 2 ? add.good : add.weak;
  return { score, reason, feedback: `${receive} ${plus} 계속 갈래, 이걸 먼저 볼래?` };
}

/** '잘 모르겠어'를 골랐을 때 */
export function idkFeedback(coachView: string): FeedbackResult {
  return { score: 0, reason: "'잘 모르겠어'를 고름", feedback: `괜찮아, 모른다고 말하는 게 제일 정직한 재료야. ${coachView} 거기서부터 생각해 보면 돼.` };
}
