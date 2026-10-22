"""리포트 여덟 칸 — 화면 · API · .md 가 같은 순서 · 같은 이름을 쓴다. 데이터가 없어도 칸은 빠지지 않는다."""
from django.utils import timezone

from apps.coaching.engine.rq_picker import color_of

from ..models import Report

REPORT_SECTIONS = [
    ("①", "한눈에 보기"),
    ("②", "질문 유형 — 어떤 폭으로 물었나"),
    ("③", "질문 길이 — 글자 수와 실은 것"),
    ("④", "질문에 실은 것 — 여섯 가지"),
    ("⑤", "되묻기 돌아보기"),
    ("⑥", "걸린 곳"),
    ("⑦", "베스트 질문"),
    ("⑧", "미션 — 지난 미션 → 다음 미션"),
]


def _md(dt) -> str:
    d = timezone.localtime(dt)
    return f"{d.month}/{d.day}"


def report_range(report: Report) -> str:
    a, b = _md(report.period_from), _md(report.period_to)
    return f"질문 Q{report.turn_from}~Q{report.seq * 10} · {a if a == b else f'{a}~{b}'}"


def sections_of(report: Report) -> dict:
    s = report.stats
    return {
        "glance": {"stage": report.stage, "roles": s.get("roles", {})},
        "mix": {**s.get("mix", {}), "comment": s.get("mix_comment", "")},
        "length": s.get("text") or {},
        "six": s.get("six", {}),
        "rqs": [{**e, "color": color_of(e.get("score"))} for e in s.get("elements", [])],
        "stuck": s.get("stuck", []),
        "best": s.get("best"),
        "mission": {"last": report.last_mission, "next": report.next_mission},
    }
