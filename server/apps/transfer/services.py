"""브라우저 localStorage(askback:v1:*) ↔ 서버 DB.

가져오기 규칙 (설계서 §3-11)
- 같은 ID 가 이미 있으면 건너뛴다 → 두 번 눌러도 안전
- 불러온 예시 프로젝트 · 예시 리포트는 건너뛴다 → 내 기록이 아니다
- 점수 · 리포트는 받되 imported 로 표시 → 서버가 계산한 것과 구분
- 사진(data URL)은 옮기지 않는다
"""
from datetime import datetime
from datetime import timezone as dt_timezone

from django.db import transaction
from django.utils import timezone

from apps.accounts.models import Goal, Student
from apps.coaching.models import ReverseQuestion, Turn
from apps.common.catalog import CHIP_KINDS, FORMS, OPENNESS_KEYS, ROLE_KEYS, SIX_KEYS, STAGES
from apps.projects.models import Message, Note, Project
from apps.reports.models import Report

_MESSAGE_COMMON = {"id", "project_id", "created_at", "kind", "turn_id", "rq_id", "images"}
_REPORT_STATS = ("mix", "roles", "six", "text", "elements", "stuck", "best", "mix_comment")


def _dt(ms) -> datetime:
    if isinstance(ms, (int, float)):
        return datetime.fromtimestamp(ms / 1000, tz=dt_timezone.utc)
    return timezone.now()


def _ms(dt: datetime | None) -> int | None:
    return int(dt.timestamp() * 1000) if dt else None


def _pick(value, allowed, default):
    return value if value in allowed else default


def _set_times(model, rows: list, times: dict[str, datetime], fields=("created_at",)) -> None:
    """auto_now_add 는 넣은 값을 덮어쓰므로, 만든 뒤에 원래 시각으로 되돌린다."""
    for obj in rows:
        for f in fields:
            setattr(obj, f, times[obj.pk])
    if rows:
        model.objects.bulk_update(rows, list(fields), batch_size=500)


@transaction.atomic
def import_local(student: Student, data: dict) -> dict:
    state = data.get("state") or {}
    demo_project = state.get("demo_project_id")
    profile = data.get("profile") or {}
    warnings: list[str] = []
    skipped = {"examples": 0, "duplicates": 0}

    # 학생
    if profile.get("name") and student.valid_count == 0:
        student.nickname = str(profile["name"])[:20]
        student.grade = str(profile.get("grade") or "")[:10]
        student.interests = list(profile.get("interests") or [])[:10]
    student.valid_count = max(student.valid_count, int(state.get("valid_count") or 0))
    student.idk_count = max(student.idk_count, int(state.get("idk_count") or 0))
    student.intro_seen = student.intro_seen or bool(data.get("intro_seen"))

    # 프로젝트
    existing = set(Project.objects.filter(pk__in=[p.get("id") for p in data.get("projects") or []]).values_list("pk", flat=True))
    projects, ptimes = [], {}
    for p in data.get("projects") or []:
        pid = p.get("id")
        if not pid or pid in existing:
            skipped["duplicates"] += bool(pid)
            continue
        if pid == demo_project:
            skipped["examples"] += 1
            continue
        plan = p.get("plan") or {}
        obj = Project(
            id=pid, student=student, name=str(p.get("name") or "프로젝트")[:40], description=str(p.get("desc") or "")[:200],
            emoji=p.get("emoji") or "✨", packs=list(p.get("packs") or []), format=p.get("format") or "",
            rhythm=_pick(p.get("rhythm"), (2, 3, 4), 2), answer_only=bool(p.get("answer_only")),
            counter=int(p.get("counter") or 0), bar_index=int(p.get("bar_index") or 0), later_streak=int(p.get("later_streak") or 0),
            checks=p.get("checks") or {}, plan_filename=plan.get("filename") or "", plan_md=plan.get("md") or "",
        )
        projects.append(obj)
        ptimes[pid] = _dt(p.get("created_at"))
    Project.objects.bulk_create(projects)
    _set_times(Project, projects, ptimes)
    mine = {p.pk for p in projects}

    # 턴
    turns, ttimes = [], {}
    for t in data.get("turns") or []:
        if t.get("project_id") not in mine or Turn.objects.filter(pk=t.get("id")).exists():
            continue
        a = t.get("analysis") or {}
        obj = Turn(
            id=t["id"], project_id=t["project_id"], student=student, n=int(t.get("n") or 0),
            window_index=int(t.get("window_index") or 1), bar_index=int(t.get("bar_index") or 0), question=t.get("question") or "",
            openness=_pick(a.get("openness"), OPENNESS_KEYS, "NA"), stage=_pick(a.get("stage"), STAGES, "탐색"), analysis=a,
            role=_pick(t.get("role"), ROLE_KEYS, None), chip_used=_pick(t.get("chip_used"), CHIP_KINDS, None),
            source=_pick(t.get("source"), ("claude", "local"), "local"),
        )
        obj.six = {k: (a.get("six") or {}).get(k, 0) for k in SIX_KEYS}
        turns.append(obj)
        ttimes[obj.pk] = _dt(t.get("created_at"))
    Turn.objects.bulk_create(turns)
    _set_times(Turn, turns, ttimes)
    turn_ids = {t.pk for t in turns}

    # 역질문
    rqs, rtimes = [], {}
    for r in data.get("rqs") or []:
        if r.get("project_id") not in mine or r.get("turn_id") not in turn_ids:
            continue
        status = _pick(r.get("status"), ("open", "answered", "later"), "later")
        obj = ReverseQuestion(
            id=r["id"], project_id=r["project_id"], turn_id=r["turn_id"], window_index=int(r.get("window_index") or 1),
            bar_index=int(r.get("bar_index") or 0), element=r.get("element") or "", pack=r.get("pack") or "",
            form=_pick(r.get("form"), FORMS, "F3"), axis=r.get("axis") or "", question=r.get("question") or "",
            benefit=(r.get("benefit") or "")[:300], options=r.get("options"), hint=r.get("hint") or "", example=r.get("example") or "",
            coach_view=r.get("coach_view") or "", expected_points=r.get("expected_points") or [], selection_scores=r.get("selection_scores") or {},
            status="later" if status == "open" else status,  # 옮긴 뒤에 열린 채로 두지 않는다
            hint_stage=int(r.get("hint_stage") or 0), answer=r.get("answer") or "", score=r.get("score"),
            reason=(r.get("reason") or "")[:300], feedback=r.get("feedback") or "",
            answered_at=_dt(r["answered_at"]) if r.get("answered_at") else None,
        )
        rqs.append(obj)
        rtimes[obj.pk] = _dt(r.get("created_at"))
    ReverseQuestion.objects.bulk_create(rqs)
    _set_times(ReverseQuestion, rqs, rtimes)
    rq_ids = {r.pk for r in rqs}

    # 메시지
    messages, mtimes, images = [], {}, 0
    for m in data.get("messages") or []:
        if m.get("project_id") not in mine or not m.get("id"):
            continue
        images += len(m.get("images") or [])
        body = {k: v for k, v in m.items() if k not in _MESSAGE_COMMON}
        obj = Message(
            id=m["id"], project_id=m["project_id"], kind=m.get("kind") or "coach", body=body,
            turn_id=m.get("turn_id") if m.get("turn_id") in turn_ids else None,
            rq_id=m.get("rq_id") if m.get("rq_id") in rq_ids else None,
        )
        messages.append(obj)
        mtimes[obj.pk] = _dt(m.get("created_at"))
    Message.objects.bulk_create(messages, ignore_conflicts=True)
    _set_times(Message, [x for x in messages if Message.objects.filter(pk=x.pk).exists()], mtimes)
    if images:
        warnings.append(f"사진 {images}장은 옮기지 않았어 (서버에는 사진 원본을 두지 않아).")

    # 생각 노트
    notes, ntimes = [], {}
    for n in data.get("notes") or []:
        if n.get("project_id") not in mine or not n.get("id"):
            continue
        obj = Note(id=n["id"], project_id=n["project_id"], lens=n.get("lens") or "philosophy", level=int(n.get("level") or 0), question=n.get("question") or "", text=n.get("text") or "")
        notes.append(obj)
        ntimes[obj.pk] = _dt(n.get("created_at"))
    Note.objects.bulk_create(notes, ignore_conflicts=True)
    _set_times(Note, notes, ntimes)

    # 리포트
    reports, rptimes = [], {}
    for r in data.get("reports") or []:
        if r.get("example") or r.get("seed"):
            skipped["examples"] += 1
            continue
        if r.get("project_id") not in mine or not r.get("seq"):
            continue
        tr = r.get("turn_range") or [0, 0]
        obj = Report(
            project_id=r["project_id"], seq=int(r["seq"]), window_index=int(r["seq"]), headline=(r.get("headline") or "")[:200],
            turn_from=int(tr[0] or 0), turn_to=int(tr[1] or 0), stage=_pick(r.get("stage"), STAGES, "탐색"),
            stats={k: r.get(k) for k in _REPORT_STATS}, last_mission=r.get("last_mission"), next_mission=r.get("next_mission") or {},
            opened=bool(r.get("opened")), imported=True, legacy_index=r.get("index"),
            period_from=_dt(r.get("from")), period_to=_dt(r.get("to")),
        )
        reports.append(obj)
    Report.objects.bulk_create(reports, ignore_conflicts=True)
    saved_reports = list(Report.objects.filter(project_id__in=mine))
    for rep in saved_reports:
        src = next((r for r in data.get("reports") or [] if r.get("project_id") == rep.project_id and r.get("seq") == rep.seq), None)
        rptimes[rep.pk] = _dt(src.get("created_at")) if src else rep.created_at
    _set_times(Report, saved_reports, rptimes)

    # 목표
    goals = data.get("goals") or {}
    for ym, text in goals.items():
        if isinstance(text, str) and text.strip() and len(ym) == 7:
            Goal.objects.get_or_create(student=student, ym=ym, defaults={"text": text[:300]})

    if demo_project or state.get("current_project_id") in mine:
        student.current_project_id = state.get("current_project_id") if state.get("current_project_id") in mine else student.current_project_id
    student.save()
    return {
        "imported": {
            "projects": len(projects), "messages": len(messages), "turns": len(turns), "rqs": len(rqs),
            "reports": len(reports), "notes": len(notes), "goals": len(goals),
        },
        "skipped": skipped,
        "warnings": warnings,
    }


def export_student(student: Student) -> dict:
    """브라우저의 exportAll() 과 같은 구성. 시각은 ms 숫자로."""
    projects = list(Project.objects.alive().filter(student=student))
    pids = [p.pk for p in projects]
    return {
        "version": "askback:v1",
        "profile": {"name": student.nickname, "grade": student.grade, "interests": student.interests, "created_at": _ms(student.created_at)},
        "state": {"current_project_id": student.current_project_id, "valid_count": student.valid_count, "idk_count": student.idk_count},
        "intro_seen": student.intro_seen,
        "projects": [
            {
                "id": p.pk, "name": p.name, "desc": p.description, "emoji": p.emoji, "packs": p.packs, "format": p.format or None,
                "rhythm": p.rhythm, "answer_only": p.answer_only, "counter": p.counter, "bar_index": p.bar_index,
                "later_streak": p.later_streak, "checks": p.checks,
                "plan": {"filename": p.plan_filename, "md": p.plan_md} if p.plan_md else None,
                "created_at": _ms(p.created_at), "updated_at": _ms(p.updated_at),
            }
            for p in projects
        ],
        "messages": [
            {"id": m.pk, "project_id": m.project_id, "kind": m.kind, "turn_id": m.turn_id, "rq_id": m.rq_id, **m.body, "created_at": _ms(m.created_at)}
            for m in Message.objects.filter(project_id__in=pids)
        ],
        "turns": [
            {
                "id": t.pk, "project_id": t.project_id, "n": t.n, "window_index": t.window_index, "bar_index": t.bar_index,
                "question": t.question, "analysis": t.analysis, "role": t.role, "chip_used": t.chip_used, "source": t.source,
                "created_at": _ms(t.created_at),
            }
            for t in Turn.objects.filter(project_id__in=pids)
        ],
        "rqs": [
            {
                "id": r.pk, "project_id": r.project_id, "turn_id": r.turn_id, "window_index": r.window_index, "bar_index": r.bar_index,
                "element": r.element, "pack": r.pack or None, "form": r.form, "axis": r.axis or None, "question": r.question,
                "benefit": r.benefit, "options": r.options, "hint": r.hint, "example": r.example, "coach_view": r.coach_view,
                "expected_points": r.expected_points, "selection_scores": r.selection_scores, "status": r.status,
                "hint_stage": r.hint_stage, "answer": r.answer, "score": r.score, "reason": r.reason, "feedback": r.feedback,
                "created_at": _ms(r.created_at), "answered_at": _ms(r.answered_at),
            }
            for r in ReverseQuestion.objects.filter(project_id__in=pids)
        ],
        "notes": [
            {"id": n.pk, "project_id": n.project_id, "lens": n.lens, "level": n.level, "question": n.question, "text": n.text, "created_at": _ms(n.created_at)}
            for n in Note.objects.filter(project_id__in=pids)
        ],
        "reports": [
            {
                "index": r.legacy_index or i + 1, "project_id": r.project_id, "seq": r.seq, "headline": r.headline,
                "turn_range": [r.turn_from, r.turn_to], "projects": [r.project.name], "stage": r.stage, **r.stats,
                "last_mission": r.last_mission, "next_mission": r.next_mission, "opened": r.opened,
                "from": _ms(r.period_from), "to": _ms(r.period_to), "created_at": _ms(r.created_at),
            }
            for i, r in enumerate(Report.objects.filter(project_id__in=pids).select_related("project").order_by("created_at"))
        ],
        "goals": {g.ym: g.text for g in student.goals.all()},
    }
