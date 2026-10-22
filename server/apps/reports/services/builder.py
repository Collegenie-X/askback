"""10문 리포트 작성기 (설계서 §4-7) — 브라우저 lib/report.ts buildWindowReport 와 같은 계산."""
import re
from collections import Counter

from django.utils import timezone

from apps.common import catalog
from apps.common.catalog import O_KEYS, OPENNESS_KEYS, ROLE_KEYS, SIX_KEYS

from ..models import Report
from .missions import eval_mission, pick_mission

LENGTH_KEYS = ["short", "mid", "long"]
LENGTH_INFO = {
    "short": {"emoji": "✏️", "name": "짧은 질문", "range": "40자 미만"},
    "mid": {"emoji": "📝", "name": "보통 질문", "range": "40~119자"},
    "long": {"emoji": "📜", "name": "긴 질문", "range": "120자 이상"},
}
OPEN_WEIGHT = {"O1": 0, "O2": 1, "O3": 3, "O4": 3, "O5": 0.5, "NA": 0}


def chars_of(q: str) -> int:
    return len(re.sub(r"\s+", " ", q).strip())


def length_key(chars: int) -> str:
    return "short" if chars < 40 else "mid" if chars < 120 else "long"


def text_stats(turns, first_n: int) -> dict:
    buckets = {k: {"count": 0, "avg_six": 0.0, "open": 0} for k in LENGTH_KEYS}
    rows = []
    for i, t in enumerate(turns):
        chars = chars_of(t.question)
        six = sum(1 for k in SIX_KEYS if t.six[k] >= 0.5)
        b = buckets[length_key(chars)]
        b["count"] += 1
        b["avg_six"] += six
        b["open"] += 1 if t.openness in ("O3", "O4") else 0
        rows.append({"n": first_n + i, "chars": chars})
    for b in buckets.values():
        b["avg_six"] = round(b["avg_six"] / b["count"], 1) if b["count"] else 0
    by = sorted(rows, key=lambda x: x["chars"])
    return {
        "count": len(rows),
        "avg": round(sum(x["chars"] for x in rows) / len(rows)) if rows else 0,
        "min": by[0]["chars"] if by else 0,
        "max": by[-1]["chars"] if by else 0,
        "buckets": buckets,
        "shortest": by[0] if by else None,
        "longest": by[-1] if by else None,
    }


def text_comment(t: dict) -> str:
    if not t["count"]:
        return "아직 질문이 없어."
    b = t["buckets"]
    short, mid, long = b["short"], b["mid"], b["long"]
    filled = [k for k in LENGTH_KEYS if b[k]["count"] > 0]
    rich = sorted(filled, key=lambda k: b[k]["avg_six"], reverse=True)[0]
    if short["count"] >= t["count"] * 0.6:
        return f"질문 {t['count']}개 중 {short['count']}개가 40자 미만이야. 짧은 질문엔 평균 {short['avg_six']}가지만 실렸어 — ‘왜 하는지’ 한 줄만 보태도 답이 너에게 맞춰져."
    if long["count"] and long["avg_six"] >= max(short["avg_six"], mid["avg_six"]) + 1:
        return f"긴 질문(120자 이상) {long['count']}개엔 평균 {long['avg_six']}가지를 실었어. 길어서 좋은 게 아니라, 목적·조건·기준을 적다 보니 길어진 거야."
    if long["count"] and long["avg_six"] < mid["avg_six"]:
        return f"긴 질문이 {long['count']}개인데 실은 건 평균 {long['avg_six']}가지뿐이야. 길이보다 ‘무엇을 실었나’가 중요해 — 코드·설명을 붙이기 전에 목적 한 줄 먼저."
    return f"평균 {t['avg']}자로 물었어. {LENGTH_INFO[rich]['name']}일 때 가장 많이(평균 {b[rich]['avg_six']}가지) 실었어."


def make_headline(mix: dict, roles_count: dict, six: dict) -> str:
    roles = catalog.roles()
    open_ = mix["O3"] + mix["O4"]
    active = [k for k in ROLE_KEYS if roles_count[k] > 0]
    top = sorted(active, key=lambda k: roles_count[k], reverse=True)[0] if active else None
    weak = sorted(["criteria", "verify", "constraint", "why"], key=lambda k: six[k])[0]
    if mix["O4"] >= 3:
        lead = f"다른 길을 {mix['O4']}번 물었다"
    elif open_ >= 5:
        lead = f"방법을 열어 두고 {open_}번 물었다"
    elif top:
        lead = f"AI를 {roles['roles'][top]['name']} 자리에 {roles_count[top]}번 앉혔다"
    else:
        lead = "질문 10개를 돌아봤다"
    weak_name = re.sub(r" \(.*\)", "", roles["six"][weak]["name"])
    return f"{lead} — 다음은 ‘{weak_name}’ 한 줄"


def mix_comment(mix: dict, prev: Report | None, stage: str) -> str:
    open_ = mix["O3"] + mix["O4"]
    if mix["NA"] >= 5:
        return "이번엔 코드·에러를 주로 붙여넣었어. 다음엔 '뭘 하려던 중인지' 한 줄만 같이 줘도 달라져."
    if prev is None:
        return "여기가 출발점이야. 다음 리포트부터는 이 막대와 나란히 볼 수 있어."
    prev_mix = prev.stats.get("mix", {})
    prev_open = prev_mix.get("O3", 0) + prev_mix.get("O4", 0)
    if open_ > prev_open:
        return f"열린 질문이 지난 리포트 {prev_open}번 → 이번 {open_}번. AI를 코더 이상으로 쓰기 시작했어."
    if open_ < prev_open:
        tail = "구현 단계라면 자연스러운 흐름이야." if stage == "구현" else "막혔을 때 한 번 넓혀 물어보는 것도 방법이야."
        return f"열린 질문이 {prev_open}번 → {open_}번으로 줄었어. {tail}"
    counted = 10 - mix["NA"]
    return f"열린 질문은 지난 리포트와 같은 {open_}번이야. " + (f"좁은 질문이 {mix['O2']}번으로 가장 많았어." if counted else "")


def build_window_report(project, seq: int, turns: list, rqs: list, student_turns: list, prev: Report | None) -> Report:
    """turns: 이 구간의 턴 10개 · rqs: 이 구간의 역질문 · student_turns: 학생의 모든 턴 (걸린 곳 합계용)."""
    mix = {k: 0 for k in OPENNESS_KEYS}
    roles_count = {k: 0 for k in ROLE_KEYS}
    six = {k: 0 for k in SIX_KEYS}
    stages: Counter = Counter()
    concepts: Counter = Counter()
    for t in turns:
        mix[t.openness] += 1
        if t.role:
            roles_count[t.role] += 1
        for k in SIX_KEYS:
            if t.six[k] >= 0.5:
                six[k] += 1
        stages[t.stage] += 1
        concepts.update(t.concepts)
    stage = stages.most_common(1)[0][0] if stages else "탐색"

    stuck = sorted(
        (
            {"concept": c, "count_in_window": n, "count_total": sum(1 for t in student_turns if c in t.concepts)}
            for c, n in concepts.items()
            if n >= 2
        ),
        key=lambda x: x["count_total"],
        reverse=True,
    )[:2]

    first_n = (seq - 1) * 10 + 1
    best = None
    if turns:
        scored = [(OPEN_WEIGHT[t.openness] + sum(t.six.values()) + (0.5 if t.chip_used else 0), i, t) for i, t in enumerate(turns)]
        _, i, top = max(scored, key=lambda x: (x[0], -x[1]))
        filled = [catalog.roles()["six"][k]["short"] for k in SIX_KEYS if top.six[k] >= 0.5]
        why = {"O4": "다른 길과 그 대가를 물었어.", "O3": "목표와 조건을 주고 방법을 물었어."}.get(top.openness, "이번 질문들 중 가장 많은 맥락을 실은 질문이야.")
        best = {"turn_n": first_n + i, "text": top.question, "reason": why + (f" 질문에 {'·'.join(filled)}을(를) 실었어." if filled else "")}

    elements = [
        {"element": r.element, "form": r.form, "score": (r.score or 0) if r.status == "answered" else None, "hint_stage": r.hint_stage, "status": r.status}
        for r in rqs
    ]
    answered = sum(1 for r in rqs if r.status == "answered")
    last_mission = eval_mission(prev.next_mission, turns, rqs) if prev and prev.next_mission else None
    stats = {
        "mix": mix,
        "roles": roles_count,
        "six": six,
        "text": text_stats(turns, first_n),
        "elements": elements,
        "stuck": stuck,
        "best": best,
        "mix_comment": mix_comment(mix, prev, stage),
    }
    now = timezone.now()
    return Report(
        project=project,
        seq=seq,
        window_index=seq,
        headline=make_headline(mix, roles_count, six),
        turn_from=first_n,
        turn_to=first_n + len(turns) - 1,
        stage=stage,
        stats=stats,
        last_mission=last_mission,
        next_mission=pick_mission(six, mix, answered, prev.next_mission if prev else None, last_mission["result"] if last_mission else None, elements),
        period_from=turns[0].created_at if turns else now,
        period_to=turns[-1].created_at if turns else now,
    )


def open_total(mix: dict) -> int:
    return max(1, sum(mix.get(k, 0) for k in O_KEYS))
