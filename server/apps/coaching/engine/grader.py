"""역질문 다듬기 · 채점 (설계서 §4-6). 점수는 서버만 매긴다."""
import json
import re
from dataclasses import dataclass

from apps.common import catalog
from apps.llm import client as llm
from apps.llm import validate

from ..models import ReverseQuestion
from .analyzer import similarity
from .context import context_of

JOKE = re.compile(r"^(몰라|모름|ㅁㄹ|글쎄|아무거나|ㅋ+|ㅎ+|\.+|\?+)[\sㅋㅎ~!.]*$")
REASON = re.compile(r"(때문|니까|라서|해서|으면|면 |왜냐|그래서|대신)")


@dataclass
class Grade:
    score: int
    reason: str
    feedback: str
    llm_call: object | None = None


def refine_rq(rq: ReverseQuestion, bar: list[dict], project, student) -> ReverseQuestion:
    """요소 템플릿 문장을 이 마디의 구체적인 말로 다듬는다. 실패하면 템플릿 그대로."""
    el = catalog.element_by_id(rq.element) or {}
    axis = next((a for a in catalog.axes() if a["key"] == rq.axis), None)
    payload = {
        "마디": bar,
        "평가요소": f"{rq.element} {el.get('name', '')}".strip(),
        "형태": rq.form,
        "확인할_축": f"{axis['emoji']} {axis['name']} — {axis['desc']}" if axis else "설계 전반",
    }
    result = llm.call("rq", json.dumps(payload, ensure_ascii=False), context=context_of(project, student), student=student, project=project)
    rq.refine_call = result.call
    if not result.ok:
        return rq
    out = validate.fix_rq(result.data, rq.form, {"question": rq.question, "options": rq.options})
    rq.question = out["question"]
    rq.benefit = out["benefit"] or rq.benefit
    rq.options = out["options"] if rq.form == "F1" else None
    rq.hint = out["hint"]
    rq.example = out["example"]
    rq.coach_view = out["coach_view"]
    rq.expected_points = out["expected_points"]
    return rq


def _local_grade(rq: ReverseQuestion, answer: str, option_score: int | None, last_answer_md: str) -> Grade:
    add = catalog.element_add(rq.element)
    text = answer.strip()
    quote = text[:28] + "…" if len(text) > 28 else text
    if option_score is None and JOKE.match(text):
        return Grade(0, "가볍게 넘긴 답", "ㅋㅋ 알겠어. 하던 거 하자.")

    if option_score is not None:
        score, reason = option_score, "보기에서 고름"
    else:
        score = 3 if len(text) >= 18 and REASON.search(text) else 2 if len(text) >= 8 else 1
        reason = {3: "자기 말로 이유까지 말함", 2: "자기 말로 대체로 답함"}.get(score, "짧게 방향만 말함")
    copied = option_score is None and similarity(text, last_answer_md[:400]) > 0.55
    if copied:
        score, reason = min(score, 1), "직전 답과 표현이 거의 같음"
    if rq.hint_stage > 0:
        score, reason = min(score, 1), reason + " · 힌트 후"
    plus = "이번엔 네 말로 한 줄만 다시 말해 볼래?" if copied else add["good"] if score >= 2 else add["weak"]
    return Grade(score, reason, f'"{quote}" — 그렇게 봤구나. {plus} 계속 갈래, 이걸 먼저 볼래?')


def grade(rq: ReverseQuestion, answer: str, option_score: int | None, last_answer_md: str, project, student) -> Grade:
    if option_score is None:
        payload = {
            "역질문": rq.question,
            "expected_points": rq.expected_points,
            "학생의_답": answer,
            "hint_stage": rq.hint_stage,
            "직전_AI_답": last_answer_md[:1500],
        }
        result = llm.call("feedback", json.dumps(payload, ensure_ascii=False), context=context_of(project, student), student=student, project=project)
        if result.ok:
            out = validate.fix_feedback(result.data)
            score = out["score"]
            # 모델 판단에 규칙을 맡기지 않는다 — 힌트 · 베끼기 상한은 서버가 다시 건다
            if rq.hint_stage > 0 or similarity(answer, last_answer_md[:400]) > 0.55:
                score = min(score, 1)
            return Grade(score, out["reason_one_line"], out["feedback_md"], result.call)
        local = _local_grade(rq, answer, None, last_answer_md)
        local.llm_call = result.call
        return local
    return _local_grade(rq, answer, option_score, last_answer_md)


def hint_text(rq: ReverseQuestion) -> str:
    """힌트 3단 — 방향 → 비슷한 예 → 코치의 관점."""
    return {1: rq.hint, 2: rq.example, 3: rq.coach_view}.get(rq.hint_stage, "")
