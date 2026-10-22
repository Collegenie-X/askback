"""코칭 데이터 카탈로그 — 원본은 frontend/src/data/*.json (한 곳에서만 고친다).

서버는 읽기만 한다. 파일은 처음 쓸 때 한 번 읽고 메모리에 둔다.
"""
import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from django.conf import settings

SIX_KEYS = ["why", "context", "constraint", "criteria", "verify", "discard"]
O_KEYS = ["O1", "O2", "O3", "O4", "O5"]
OPENNESS_KEYS = [*O_KEYS, "NA"]
ROLE_KEYS = ["typist", "coder", "engineer", "architect", "encyclopedia"]
STAGES = ["탐색", "설계", "구현", "검증"]
PACKS = ["maker", "share", "collab", "ai"]
FORMS = ["F1", "F2", "F3"]
FORM_LABEL = {"F1": "고르기", "F2": "빈칸", "F3": "한두 문장"}
CHIP_KINDS = ["widen", "narrow", "alt"]
LENSES = ["philosophy", "psychology", "sociology"]


def data_dir() -> Path:
    return Path(settings.ASKBACK["DATA_DIR"])


@lru_cache(maxsize=None)
def load(name: str) -> Any:
    with open(data_dir() / name, encoding="utf-8") as f:
        return json.load(f)


def prompts() -> dict:
    return load("prompts.json")


def roles() -> dict:
    return load("roles.json")


def formats() -> dict:
    return load("formats.json")


def answers() -> dict:
    return load("answers.json")


def missions() -> list:
    return load("missions.json")


def lenses() -> dict:
    return load("lenses.json")


def concepts() -> list:
    return load("concepts.json")


def format_keys() -> list[str]:
    return list(formats()["formats"].keys())


def format_of(key: str | None) -> dict | None:
    return formats()["formats"].get(key) if key else None


def axes() -> list[dict]:
    """세 축 — 🧭 기획 · 🔀 알고리즘 · 🏗 전체 구조"""
    return formats()["principle"]["axes"]


@lru_cache(maxsize=None)
def all_elements() -> tuple[dict, ...]:
    """기본(E*) + 팩(M·S·C·A) + 형식 전용(F*) 평가 요소."""
    data = load("elements.json")
    out = [*data["base"], *data["packs"]]
    for key, f in formats()["formats"].items():
        out.extend({**el, "format": key, "icon": f["emoji"]} for el in f["rq"])
    return tuple(out)


def element_by_id(element_id: str) -> dict | None:
    return next((e for e in all_elements() if e["id"] == element_id), None)


def axis_of(element_id: str) -> str | None:
    el = element_by_id(element_id)
    return el.get("axis") if el else None


def element_add(element_id: str) -> dict:
    el = element_by_id(element_id)
    if el and "add" in el:
        return el["add"]
    return {
        "good": "네 말로 또렷하게 정리했어. 이건 그대로 기록에 남길 만해.",
        "weak": "지금은 한 줄이어도 돼. 프로젝트가 나아가면 이 칸이 다시 보일 거야.",
    }


def role_of(openness: str) -> str | None:
    return None if openness == "NA" else roles()["openness"][openness]["role"]


def six_name(key: str) -> str:
    return roles()["six"][key]["name"]


def answer_card(file: str) -> str | None:
    path = Path(settings.ASKBACK["ANSWERS_DIR"]) / file
    try:
        return path.read_text(encoding="utf-8")
    except OSError:
        return None
