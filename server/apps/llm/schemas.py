"""Claude 구조화 출력 스키마 — 브라우저 lib/schemas.ts 와 같은 모양.

pydantic 모델 하나로 ① Claude 에 보낼 JSON Schema 와 ② 받은 JSON 검증을 같이 한다.
'몇 개까지' 같은 내용 규칙은 스키마가 아니라 validate.py 에서 고친다 (스키마는 모양만).
"""
from typing import Literal

from pydantic import BaseModel, ConfigDict

Level = Literal[0, 0.5, 1]


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Six(_Strict):
    why: Level
    context: Level
    constraint: Level
    criteria: Level
    verify: Level
    discard: Level


class AnswerOut(_Strict):
    openness: Literal["O1", "O2", "O3", "O4", "O5", "NA"]
    six: Six
    stage: Literal["탐색", "설계", "구현", "검증"]
    concepts: list[str]
    emotional: bool
    answer_md: str
    assumptions: list[str]
    your_call: list[str]
    risk_note: str | None
    role_reason: str


class RQOption(_Strict):
    label: str
    score: int


class RQOut(_Strict):
    question: str
    benefit: str
    options: list[RQOption]
    hint: str
    example: str
    coach_view: str
    expected_points: list[str]


class FeedbackOut(_Strict):
    score: float
    reason_one_line: str
    feedback_md: str


class DeepOut(_Strict):
    reply_md: str
    next_question: str


SCHEMAS: dict[str, type[_Strict]] = {"answer": AnswerOut, "rq": RQOut, "feedback": FeedbackOut, "deep": DeepOut}


def output_schema(model: type[BaseModel]) -> dict:
    """pydantic JSON Schema → Claude output_config.format 용 스키마.

    $defs 를 펼치고, 모든 객체에 additionalProperties: false 와 required(전체 키)를 붙이고, title 은 뺀다.
    """
    raw = model.model_json_schema()
    defs = raw.pop("$defs", {})

    def walk(node):
        if isinstance(node, dict):
            if "$ref" in node:
                return walk(defs[node["$ref"].split("/")[-1]])
            out = {k: walk(v) for k, v in node.items() if k not in ("title", "default")}
            if out.get("type") == "object" and "properties" in out:
                out["additionalProperties"] = False
                out["required"] = list(out["properties"].keys())
            return out
        if isinstance(node, list):
            return [walk(x) for x in node]
        return node

    return walk(raw)
