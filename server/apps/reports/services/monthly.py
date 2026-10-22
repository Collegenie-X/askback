"""월간 리포트 — 그 달의 10문 리포트를 모아 요소 지도 · 걸린 곳 · 처방 · 목표를 만든다."""
from collections import defaultdict
from datetime import datetime

from django.utils import timezone

from apps.accounts.models import Goal
from apps.common import catalog
from apps.coaching.engine.rq_picker import color_of
from apps.projects.models import Note

from ..models import Report
from .markdown import elements_line


def _month_bounds(ym: str):
    y, m = map(int, ym.split("-"))
    tz = timezone.get_current_timezone()
    start = datetime(y, m, 1, tzinfo=tz)
    end = datetime(y + (m == 12), 1 if m == 12 else m + 1, 1, tzinfo=tz)
    return start, end


def build_monthly(student, ym: str) -> dict:
    start, end = _month_bounds(ym)
    reports = list(
        Report.objects.filter(project__student=student, project__deleted_at__isnull=True, created_at__gte=start, created_at__lt=end)
        .select_related("project")
        .order_by("created_at")
    )

    element_map: dict[str, dict] = defaultdict(lambda: {"scores": [], "forms": []})
    stuck_total: dict[str, int] = defaultdict(int)
    for r in reports:
        for e in r.stats.get("elements", []):
            element_map[e["element"]]["scores"].append(e["score"])
            element_map[e["element"]]["forms"].append(e["form"])
        for st in r.stats.get("stuck", []):
            stuck_total[st["concept"]] += st["count_in_window"]
    elements = [
        {"id": k, "icon": (catalog.element_by_id(k) or {}).get("icon", ""), "name": (catalog.element_by_id(k) or {}).get("name", k), **v}
        for k, v in element_map.items()
    ]
    stuck = sorted(({"concept": c, "total": n} for c, n in stuck_total.items()), key=lambda x: x["total"], reverse=True)
    missions = [{"report": r.title, "text": r.last_mission["text"], "result": r.last_mission["result"]} for r in reports if r.last_mission]

    n = len(reports) or 1
    prescriptions = []
    if stuck and stuck[0]["total"] >= 3:
        c = stuck[0]["concept"]
        prescriptions.append({
            "kind": "📚 지식", "title": f"'{c}' 제대로 한 번 잡기", "basis": f"이번 달 '걸린 곳'에 {stuck[0]['total']}회 올랐어.",
            "action": "40분 개념 학습 1회 + 그 개념만 쓰는 아주 작은 연습 1개", "effect": "같은 곳에서 멈추는 시간이 줄어.",
            "promise": f"'{c}' 관련 질문이 오면 그 부분부터 풀어서 설명할게.",
        })

    def six_avg(k: str) -> float:
        return sum(r.stats["six"][k] for r in reports) / n

    low = sorted(["criteria", "verify", "constraint"], key=six_avg)[0]
    if reports and six_avg(low) < 4:
        prescriptions.append({
            "kind": "🧭 습관", "title": f"'{catalog.six_name(low)}' 먼저 적기",
            "basis": f"6요소 중 {catalog.six_name(low)}이(가) 리포트 {len(reports)}장 평균 {six_avg(low):.1f}/10.",
            "action": "질문을 보내기 전에 그 한 줄만 덧붙이기", "effect": "내 답이 '누구에게나 맞는 답'에서 '너에게 맞는 답'으로 바뀌어.",
            "promise": "다음 달 첫 미션으로 이미 넣어뒀어.",
        })
    scored = [(e, [s for s in e["scores"] if s is not None]) for e in elements]
    weak = sorted(((e, sum(v) / len(v)) for e, v in scored if v), key=lambda x: x[1])
    if weak and weak[0][1] < 1.5:
        e = weak[0][0]
        prescriptions.append({
            "kind": "🛠 기술", "title": f"{e['icon']} '{e['name']}' 연습", "basis": f"돌아보기에서 {e['name']}이(가) {''.join(color_of(s) for s in e['scores'])} 였어.",
            "action": "넘겨 둔 이 요소 질문을 하나만 다시 열어 네 말로 답해보기", "effect": "고르기(F1)에서 한두 문장(F3)으로 넘어가.",
            "promise": "이 요소는 당분간 고르기 형태로 가볍게 물을게.",
        })

    last = reports[-1] if reports else None
    goal_draft = ""
    if last:
        mix = last.stats["mix"]
        goal_draft = f"{last.next_mission.get('text', '').rstrip('.')} — 그리고 열린 질문을 리포트 한 장에 {min(6, mix['O3'] + mix['O4'] + 1)}번 이상."
    goal = Goal.objects.filter(student=student, ym=ym).values_list("text", flat=True).first() or ""
    notes = list(Note.objects.filter(project__student=student, created_at__gte=start, created_at__lt=end).order_by("-created_at")[:2])
    y, m = ym.split("-")
    return {
        "ym": ym,
        "label": f"{y}년 {int(m)}월",
        "mini": len(reports) < 2,
        "reports": [
            {"id": r.id, "title": r.title, "headline": r.headline, "created_at": r.created_at, "mix": r.stats["mix"], "roles": r.stats["roles"], "elements_line": elements_line(r.stats.get("elements", []))}
            for r in reports
        ],
        "element_map": elements,
        "stuck": stuck,
        "missions": missions,
        "prescriptions": prescriptions[:3],
        "notes": [{"id": x.id, "lens": x.lens, "text": x.text} for x in notes],
        "goal": goal,
        "goal_draft": goal_draft,
    }


def monthly_to_md(mo: dict, name: str) -> str:
    L = [f"# 📘 {name}의 {mo['label']} 월간 리포트" + (" (미니)" if mo["mini"] else ""), "", "## 1. 이번 달의 리포트", "", "| 리포트 | 날짜 | 돌아보기 |", "|---|---|---|"]
    for r in mo["reports"]:
        d = timezone.localtime(r["created_at"])
        L.append(f"| {r['title']} | {d.month}/{d.day} | {r['elements_line']} |")
    L += ["", "## 2. 질문 믹스의 변화", "", "| 리포트 | 지시 | 좁은 | 열린 | 대안 | 맨 열린 |", "|---|---|---|---|---|---|"]
    for r in mo["reports"]:
        x = r["mix"]
        L.append(f"| {r['title']} | {x['O1']} | {x['O2']} | {x['O3']} | {x['O4']} | {x['O5']} |")
    L += ["", "## 3. 평가 요소 지도"]
    L += [f"- {e['icon']} {e['name']} {''.join(color_of(s) for s in e['scores'])} ({e['forms'][0]}→{e['forms'][-1]})" for e in mo["element_map"]]
    L += ["", "## 4. 걸린 곳", "\n".join(f"- {s['concept']} {s['total']}회" for s in mo["stuck"]) or "- 반복해서 걸린 곳은 없었어."]
    icon = {"done": "✅", "partial": "➖"}
    L += ["", "## 5. 미션 기록", "\n".join(f"- {icon.get(m['result'], '◻️')} {m['text']}" for m in mo["missions"]) or "- 아직 없어."]
    L += ["", "## 6. 📚 공부 처방"]
    for i, p in enumerate(mo["prescriptions"]):
        L += [f"### {'①②③'[i]} {p['kind']} — {p['title']}", f"- 근거: {p['basis']}", f"- 행동: {p['action']}", f"- 기대 효과: {p['effect']}", f"- 내가 도울게: {p['promise']}", ""]
    if not mo["prescriptions"]:
        L += ["이번 달은 처방할 만큼 뚜렷한 구멍이 안 보여. 데이터가 더 쌓이면 다시 볼게.", ""]
    L += ["## 7. 가장 깊었던 생각", "\n\n".join(f'> "{n["text"]}"' for n in mo["notes"]) or "심화 대화를 열면 여기에 네 문장이 모여."]
    L += ["", "## 8. 다음 달 목표", mo["goal"] or mo["goal_draft"] or "—"]
    return "\n".join(L)
