"""역질문 고르기 (설계서 §4-5) — 브라우저 lib/rq.ts 와 같은 점수식.

점수 = 0.4 관련성 + 0.3 약함 + 0.2 오래됨 + 0.1 트리거, 그리고 구간 · 팩 · 형식 · 축 보정.
"""
import re
from dataclasses import dataclass

from apps.common import catalog

from ..models import ReverseQuestion, Turn
from .analyzer import topic_of

_BUILDING = re.compile(r"(코드|짜\s?줘|만들)")


@dataclass
class Picked:
    element: dict
    form: str
    pack: str
    scores: dict[str, float]


def relevance(el_id: str, bar: list[Turn], project, project_turns: int, rqs: list[ReverseQuestion]) -> float:
    last = bar[-1]
    text = " ".join(t.question for t in bar)
    os_ = [t.openness for t in bar]
    stage = last.stage
    building = stage == "구현" or bool(_BUILDING.search(text))

    def has(pattern: str) -> bool:
        return bool(re.search(pattern, text))

    if el_id == "E1":
        return 0.8 if building else 0.4
    if el_id == "E2":
        return 0.5
    if el_id == "E3":
        return 0.9 if ("O3" in os_ or "O4" in os_) else 0.5 if "O2" in os_ else 0.3
    if el_id == "E4":
        return 0.35 if "O4" in os_ else 0.7 if ("O2" in os_ or "O3" in os_) else 0.4
    if el_id == "E5":
        return 0.85 if building else 0.35
    if el_id == "E6":
        return 0.8 if all(t.six["criteria"] < 0.5 for t in bar) else 0.4
    if el_id == "E7":
        return 0.8 if building or stage == "검증" else 0.3
    if el_id == "E8":
        return 0.8 if has(r"(바꿔|고쳐|수정|다시|버전|전에는)") else 0.2
    # 기획 — 사람과 범위. 만들기 시작할 때 오히려 세게 묻는다
    if el_id == "E9":
        return 0.9 if project_turns <= 2 or has(r"(누구|사용자|쓸 사람|대상|왜)") else 0.55
    if el_id == "E10":
        return 0.8 if building or has(r"(기능|추가|더 넣|다 만들|욕심)") else 0.5
    # 전체 구조 — 칸이 둘 이상 생긴 뒤에
    if el_id == "E11":
        return (0.9 if has(r"(서버|저장|연결|보내|구조|화면|올려)") else 0.6) if project_turns >= 3 else 0.3
    if el_id == "E12":
        return (0.9 if has(r"(서버|인터넷|와이파이|전원|꺼|끊|멈추|맡)") else 0.5) if project_turns >= 3 else 0.0
    if el_id in ("M1", "M2", "M3", "M4"):
        return 0.6 if stage in ("구현", "설계") else 0.35
    if el_id in ("S1", "S2", "S3", "S4"):
        return 0.8 if has(r"(발표|시연|제출|공유|보여|친구)") else 0.35
    if el_id == "C1":
        return 0.6 if stage in ("탐색", "설계") else 0.4
    if el_id in ("C2", "C3", "C4"):
        # 이웃(C1)이 정해진 뒤에만
        c1 = any(r.project_id == project.id and r.element == "C1" and (r.score or 0) >= 2 for r in rqs)
        return 0.55 if c1 else 0.0
    if el_id in ("A1", "A2", "A3", "A4"):
        return 0.5 if project_turns >= 5 else 0.0  # 돌아가는 게 생긴 뒤에
    if el_id.startswith("F"):
        # 형식 전용 — 설계를 정하는 단계에서 제일 세고, 코드로 달려갈 때도 설계로 한 번 끌어온다
        return 0.8 if stage in ("탐색", "설계") else 0.7 if stage == "구현" else 0.5
    return 0.0


def trigger(el_id: str, bar: list[Turn], student_turns: list[Turn]) -> float:
    last = bar[-1]
    text = last.question
    if el_id == "E6" and re.search(r"(골라줘|정해줘|뭐가 나아|어떤 게 좋)", text):
        return 1.0  # T1
    if el_id == "E3" and any(t.openness == "O3" for t in bar):
        return 0.6  # T2
    if el_id == "E1":
        c = last.concepts[0] if last.concepts else None
        if c and sum(1 for t in student_turns if c in t.concepts) >= 3:
            return 1.0  # T3
    if el_id == "E8" and re.search(r"(원래대로|되돌|다시 처음)", text):
        return 1.0  # T4
    if el_id == "E7" and last.openness == "NA":
        return 1.0  # T6
    return 0.0


def next_form(el: dict, rqs: list[ReverseQuestion]) -> str:
    """고르기 → 빈칸 → 한두 문장. 2점 이상이면 한 단 올리고, 0점이면 처음으로."""
    if "f1" not in el:
        return "F3"
    past = [r for r in rqs if r.element == el["id"] and r.status == "answered"]
    last = past[-1] if past else None
    if last is None or (last.score or 0) <= 0:
        return "F1"
    order = ["F1", "F2", "F3"]
    idx = order.index(last.form)
    return order[min(2, idx + 1)] if (last.score or 0) >= 2 else last.form


def pick_element(bar: list[Turn], project, student_turns: list[Turn], rqs: list[ReverseQuestion], window_index: int) -> Picked | None:
    """bar: 이번 마디의 턴들 · student_turns: 학생의 모든 턴 · rqs: 학생의 모든 역질문."""
    candidates = [
        e for e in catalog.all_elements()
        if (e["pack"] in project.packs if "pack" in e else e["format"] == project.format if "format" in e else True)
    ]
    format_ids = {e["id"] for e in catalog.all_elements() if "format" in e}
    in_window = [r for r in rqs if r.project_id == project.id and r.window_index == window_index]
    pack_asked = sum(1 for r in in_window if r.pack)
    format_asked = sum(1 for r in in_window if r.element in format_ids)
    project_turns = sum(1 for t in student_turns if t.project_id == project.id)
    # 세 축 고루 묻기 — 한 리포트(10문) 안에서 기획 · 알고리즘 · 전체 구조가 다 한 번은 확인되게
    axis_asked = {a for a in (catalog.axis_of(r.element) for r in in_window) if a}
    n_axes = len(catalog.axes())

    scores: dict[str, float] = {}
    best: dict | None = None
    for el in candidates:
        rel = relevance(el["id"], bar, project, project_turns, rqs)
        if rel < 0.3:
            continue  # 억지 질문 금지
        past = [r for r in rqs if r.element == el["id"] and r.status == "answered"][-3:]
        weak = (3 - sum(r.score or 0 for r in past) / len(past)) / 3 if past else 0.5
        last_asked = next((r for r in reversed(rqs) if r.element == el["id"]), None)
        stale = min(1.0, (project.bar_index - last_asked.bar_index) / 5) if last_asked else 1.0
        score = 0.4 * rel + 0.3 * weak + 0.2 * stale + 0.1 * trigger(el["id"], bar, student_turns)
        if any(r.element == el["id"] for r in in_window):
            score *= 0.3
        if "pack" in el:
            score *= 1.25 if pack_asked < 2 else 0.3  # 10문당 팩 2개 목표
        if "format" in el:
            score *= 1.3 if format_asked < 3 else 0.6  # 설계를 묻는 게 먼저
        ax = el.get("axis")
        if ax and ax not in axis_asked:
            score *= 1.35  # 아직 안 물은 축을 앞으로
        if ax and ax in axis_asked and len(axis_asked) < n_axes:
            score *= 0.75  # 같은 축만 파고들지 않게
        scores[el["id"]] = round(score, 2)
        if best is None or score > scores[best["id"]]:
            best = el

    if best is None:
        return None
    top = dict(sorted(scores.items(), key=lambda kv: kv[1], reverse=True)[:3])
    return Picked(element=best, form=next_form(best, rqs), pack=best.get("pack", ""), scores=top)


def build_rq(picked: Picked, last_turn: Turn, window_index: int, bar_index: int) -> ReverseQuestion:
    """요소 템플릿으로 역질문을 만든다 (저장 전). Claude 가 있으면 refine 으로 문장을 다듬는다."""
    el = picked.element
    key = picked.form.lower()
    tpl = el.get(key) or el["f3"]
    return ReverseQuestion(
        project_id=last_turn.project_id,
        turn=last_turn,
        window_index=window_index,
        bar_index=bar_index,
        element=el["id"],
        pack=picked.pack,
        form=picked.form,
        axis=el.get("axis", ""),
        question=tpl["q"].replace("{{topic}}", topic_of(last_turn.question)),
        benefit=tpl.get("benefit", ""),
        options=tpl.get("options") if picked.form == "F1" else None,
        hint=el.get("hint", ""),
        example=el.get("example", ""),
        coach_view=el.get("coachView", ""),
        expected_points=el.get("expected", []),
        selection_scores=picked.scores,
        status="open",
    )


def color_of(score: int | None) -> str:
    if score is None:
        return "➖"
    return "🟢" if score >= 2 else "🟡" if score == 1 else "⚪"
