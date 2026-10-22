"""답변기 (설계서 §4-4) — ① Claude(answer 작업) → ② 실패하면 로컬 답 카드(answers.json + public/answers/*.md)."""
import re
from dataclasses import dataclass, field

from apps.common import catalog
from apps.llm import client as llm
from apps.llm import validate

_VAR = re.compile(r"\{\{(\w+)\}\}")


@dataclass
class AnswerResult:
    md: str
    analysis: dict
    source: str  # "claude" | "local"
    role_reason: str = ""
    risk_note: str | None = None
    assumptions: list[str] = field(default_factory=list)
    your_call: list[str] = field(default_factory=list)
    emotional: bool = False
    llm_call: object | None = None


def _fill(md: str, values: dict) -> str:
    return _VAR.sub(lambda m: values.get(m.group(1), ""), md)


def _role_reason(openness: str) -> str:
    role = catalog.role_of(openness)
    return catalog.roles()["roles"][role]["reason"] if role else ""


def local_answer(question: str, analysis: dict, project, image_count: int = 0) -> AnswerResult:
    """키워드가 가장 많이 맞는 답 카드를 고른다. 없으면 개방도별 기본 카드."""
    data = catalog.answers()
    o = analysis["openness"]
    q = question.lower()
    hay = f"{question} {project.name} {project.description}".lower()
    best, best_score = None, None
    for card in data["cards"]:
        if o not in card["openness"]:
            continue
        in_question = sum(1 for k in card["keywords"] if k.lower() in q)
        if not in_question:
            continue
        score = in_question + 0.5 * sum(1 for k in card["keywords"] if k.lower() in hay) - 0.3 * card["openness"].index(o)
        if best_score is None or score > best_score:
            best, best_score = card, score

    file = best["file"] if best else data["fallback"][o]
    md = catalog.answer_card(file) or "답 카드를 불러오지 못했어. 잠시 뒤에 다시 물어봐 줄래?"
    # 답한 뒤에는 열린 질문으로 되묻는다 — 서버 없이 돌 때도 같은 모양으로 끝난다
    if "되물을게" not in md:
        line = validate.ask_line(o, len(question))
        if line:
            md = f"{md.rstrip()}\n\n---\n\n{line}"
    md = _fill(md, {"question": question.replace("\n", " "), "project": project.name})
    assumptions = list(best["assumptions"]) if best else list(data["fallbackAssumptions"])

    if image_count:
        # 사진 속은 읽지 못했다고 솔직하게 말한다
        note = (
            f"> 📷 사진 {image_count}장 받았어. 지금은 Claude 없이 도는 중이라 **사진 속 내용은 읽지 못해**. "
            "사진에서 봐줬으면 하는 걸 글로 한 줄만 보태 줄래?\n\n"
        )
        md = note + ("" if "로컬 데모 엔진" in md else md)
        assumptions = ["사진 속 내용은 보지 못했어 — 글로 쓴 것만 읽었어", *assumptions]

    return AnswerResult(
        md=md,
        analysis=analysis,
        source="local",
        role_reason=_role_reason(o),
        risk_note=(best or {}).get("risk"),
        assumptions=assumptions,
        your_call=list((best or {}).get("yourCall", [])),
    )


def generate_answer(question: str, analysis: dict, project, student, history: list[dict], images: list[str] | None = None) -> AnswerResult:
    from .context import context_of

    result = llm.call("answer", question, context=context_of(project, student), history=history, images=images, student=student, project=project)
    if not result.ok:
        local = local_answer(question, analysis, project, image_count=len(images or []))
        local.llm_call = result.call
        return local

    out = validate.fix_answer(result.data, seed=len(question))
    merged = {
        **analysis,
        "openness": out["openness"],
        "six": out["six"],
        "stage": out["stage"],
        "concepts": out["concepts"] or analysis["concepts"],
    }
    return AnswerResult(
        md=out["answer_md"],
        analysis=merged,
        source="claude",
        role_reason=out["role_reason"],
        risk_note=out["risk_note"],
        assumptions=out["assumptions"],
        your_call=out["your_call"],
        emotional=out["emotional"],
        llm_call=result.call,
    )
