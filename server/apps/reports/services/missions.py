"""미션 — 지난 미션 채점 → 가장 약한 칸으로 다음 미션 (설계서 §4-7 ⑧)."""
from apps.common import catalog


def eval_mission(mission: dict, turns, rqs) -> dict:
    check = mission["check"]
    if check["type"] == "openness":
        got = sum(1 for t in turns if t.openness == check["key"])
    elif check["type"] == "six":
        got = sum(1 for t in turns if t.six[check["key"]] >= 0.5)
    elif check["type"] == "rq":
        got = sum(1 for r in rqs if r.status == "answered")
    elif check["type"] == "axis":
        got = sum(1 for r in rqs if catalog.axis_of(r.element) == check["key"])
    else:
        got = 0
    result = "done" if got >= check["target"] else "partial" if got > 0 else "missed"
    detail = {
        "done": f"{got}번 해냈어. ✅",
        "partial": f"{got}번 해봤어. 목표는 {check['target']}번이었어. ➖",
        "missed": "이번엔 못 했어. 괜찮아 — 더 작게 쪼개 볼게.",
    }[result]
    return {"text": mission["text"], "result": result, "detail": detail}


def pick_mission(six: dict, mix: dict, answered: int, prev_mission: dict | None, prev_result: str | None, elements: list[dict]) -> dict:
    axes = catalog.axes()
    thin_axis = next((a for a in axes if not any(catalog.axis_of(e["element"]) == a["key"] for e in elements)), None) if elements else None
    six_order = ["criteria", "verify", "constraint", "why"]
    lowest = sorted(six_order, key=lambda k: six[k])[0]

    if six[lowest] <= 3:
        key = lowest
        basis = f"6요소 중 {catalog.six_name(lowest)}이(가) 이번 리포트에서 {six[lowest]}/10으로 가장 비어 있어."
    elif thin_axis:
        key = f"axis:{thin_axis['key']}"
        basis = f"이번 리포트에서 {thin_axis['emoji']} {thin_axis['name']}({thin_axis['desc']})를 확인한 되묻기가 0번이었어."
    elif mix["O4"] == 0:
        key, basis = "O4", "이번 리포트에 대안을 물은 질문(O4)이 0번이었어."
    elif mix["O3"] + mix["O4"] < 3:
        key, basis = "O3", f"열린 질문(O3+O4)이 {mix['O3'] + mix['O4']}번뿐이었어."
    elif answered < 2:
        key, basis = "rq", f"돌아보기 질문에 답한 게 {answered}번이었어."
    else:
        key, basis = "verify", "질문 폭은 고르게 섞였어. 다음은 '확인하는 습관'이야."

    all_missions = catalog.missions()
    d = next((m for m in all_missions if m["key"] == key), all_missions[0])
    # 같은 미션을 연속으로 못 했으면 더 작게 쪼갠다
    shrink = bool(prev_mission) and prev_mission.get("key") == key and prev_result == "missed"
    return {
        "key": key,
        "text": d["small"] if shrink else d["text"],
        "basis": basis + (" 지난 리포트에서 못 해서 더 작게 쪼갰어." if shrink else ""),
        "check": {**d["check"], "target": 1 if shrink else d["check"]["target"]},
        "edited_by_student": False,
    }
