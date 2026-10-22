"""칩 (설계서 §4-5) — 답 밑에 붙는 '다음에 이렇게 물어볼래?' 초안. 최대 2개."""
from apps.common import catalog


def chips_for(analysis: dict, recent_openness: list[str], project) -> list[dict]:
    chips: list[dict] = []
    o = analysis["openness"]
    tail = [*recent_openness, o]
    threshold = 5 if analysis["stage"] == "구현" else 3  # 구현 단계에선 넓히기 문턱을 높인다
    narrow_run = tail[-threshold:]
    goal = project.description or "___"

    # 코드 · 완성본으로 달려가는 중이면 설계(알고리즘 · 구조)로 돌아가는 질문을 먼저 권한다
    f = catalog.format_of(project.format)
    if f and (analysis["stage"] == "구현" or o in ("O1", "O2")):
        chips.append({"kind": "widen", "draft": f["design"]["back"]})
    if len(narrow_run) >= threshold and all(x in ("O1", "O2") for x in narrow_run):
        chips.append({"kind": "widen", "draft": f"지금 내가 짜고 있는 이 구조 자체가 맞는 방향일까? 내 목표는 {goal}이고 제약은 ___야."})
    if o in ("O5", "O3"):
        chips.append({"kind": "narrow", "draft": f"그중에서 ___ 부분을 내 상황({goal})에 맞게 구체적으로 알려줘."})
    if o == "O3":
        chips.append({"kind": "alt", "draft": "이 방식 말고 다른 방식 2개와, 각각 잃는 걸 알려줘. 내 제약은 ___야."})
    return chips[:2]
