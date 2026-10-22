"""심화 대화 (철학 · 심리학 · 사회학 렌즈). 2문 1역 카운터에 들어가지 않는다."""
import json

from apps.common import catalog
from apps.llm import client as llm
from apps.llm import validate

from .context import context_of


def _fill(text: str, project) -> str:
    return text.replace("{{project}}", project.name)


def deep_question(lens: str, level: int, project) -> str:
    L = catalog.lenses()[lens]
    if level >= 3:
        return f"**확장 질문**\n\n{_fill(L['extension'], project)}"
    item = L["levels"][level]
    return f"**{L['emoji']} {L['name']} · L{level + 1}**\n\n{item['q']}\n\n> {_fill(item['coach'], project)}"


def deep_reply(lens: str, level: int, text: str, project, student) -> tuple[str, str | None]:
    L = catalog.lenses()[lens]
    payload = {
        "렌즈": L["name"],
        "지금_깊이": "확장" if level >= 3 else f"L{level + 1}",
        "다음_깊이": "확장" if level >= 2 else f"L{level + 2}",
        "학생의_말": text,
    }
    result = llm.call("deep", json.dumps(payload, ensure_ascii=False), context=context_of(project, student), student=student, project=project)
    if result.ok:
        out = validate.fix_deep(result.data)
        return out["reply_md"], out["next_question"]
    quote = text[:30] + "…" if len(text) > 30 else text
    return f'"{quote}" — {L["receive"]} 생각 노트에 적어 뒀어.', None
