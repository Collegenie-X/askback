"""스키마를 통과한 출력에 서버가 한 번 더 거는 내용 규칙 (설계서 §5-6 2단계 · 3단계).

모델 판단에 규칙을 맡기지 않는다 — 고칠 수 있으면 고치고, 고칠 수 없으면 템플릿 값을 쓴다.
"""
import re

from apps.common import catalog

ASK_MARK = "🙋"
MAX_MD = 12000
MAX_LINE = 300
_SCORE_TALK = re.compile(r"[^.!?\n]*(\d\s*점|/\s*3|등급)[^.!?\n]*[.!?]?\s*")


def _cut(text: str | None, limit: int) -> str | None:
    if text is None:
        return None
    text = text.strip()
    return text if len(text) <= limit else text[: limit - 1] + "…"


def ask_line(openness: str, seed: int) -> str:
    asks = catalog.answers()["asks"].get(openness) or []
    if not asks:
        return ""
    return f"🙋 **하나만 되물을게** — {asks[seed % len(asks)]}"


def fix_answer(out: dict, seed: int) -> dict:
    md = _cut(out["answer_md"], MAX_MD) or ""
    if ASK_MARK not in md[-400:]:
        line = ask_line(out["openness"], seed)
        if line:
            md = f"{md.rstrip()}\n\n---\n\n{line}"
    return {
        **out,
        "answer_md": md,
        "concepts": [c.strip() for c in out["concepts"] if c.strip()][:3],
        "assumptions": [_cut(x, MAX_LINE) for x in out["assumptions"]][:4],
        "your_call": [_cut(x, MAX_LINE) for x in out["your_call"]][:3],
        "risk_note": _cut(out["risk_note"], MAX_LINE) or None,
        "role_reason": _cut(out["role_reason"], MAX_LINE) or "",
    }


def fix_rq(out: dict, form: str, template: dict) -> dict:
    """form 에 맞지 않는 보기 · 빈칸은 요소 템플릿 값으로 바꾼다."""
    question = _cut(out["question"], 400) or template["question"]
    options = out["options"]
    if form == "F1":
        if len(options) != 3:
            options = template.get("options") or []
        options = [{"label": _cut(o["label"], 120), "score": max(0, min(3, int(o["score"])))} for o in options]
    else:
        options = []
    if form == "F2" and "___" not in question:
        question = template["question"]
    return {
        **out,
        "question": question,
        "options": options,
        "benefit": _cut(out["benefit"], MAX_LINE),
        "hint": _cut(out["hint"], MAX_LINE),
        "example": _cut(out["example"], MAX_LINE),
        "coach_view": _cut(out["coach_view"], MAX_LINE),
        "expected_points": [_cut(x, 80) for x in out["expected_points"]][:3],
    }


def fix_feedback(out: dict) -> dict:
    """점수 · 등급을 말하는 문장은 지운다 (점수는 화면에 숫자로 보여주지 않는다)."""
    md = _SCORE_TALK.sub("", out["feedback_md"]).strip() or out["feedback_md"]
    return {
        "score": max(0, min(3, round(out["score"]))),
        "reason_one_line": _cut(out["reason_one_line"], MAX_LINE),
        "feedback_md": _cut(md, 800),
    }


def fix_deep(out: dict) -> dict:
    return {"reply_md": _cut(out["reply_md"], 800), "next_question": _cut(out["next_question"], 400)}
