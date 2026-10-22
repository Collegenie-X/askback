"""프로젝트 만들기 · 고치기 · 지우기."""
from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.common.exceptions import ApiError

from ..models import Project
from .drafts import check_keys, format_intro
from .messages import coach


@transaction.atomic
def create_project(student, *, name: str, description: str = "", emoji: str = "✨", packs=None, format: str = "") -> tuple[Project, list]:
    project = Project.objects.create(
        student=student, name=name, description=description, emoji=emoji or "✨", packs=packs or [], format=format or ""
    )
    student.current_project = project
    student.save(update_fields=["current_project", "updated_at"])

    hello = f"안녕, {student.nickname}! " if student.nickname else "안녕! "
    md = f"{hello}**{project.name}** 얘기를 같이 해보자."
    if project.format:
        md += f"\n\n{format_intro(project.format)}"
    md += "\n\n뭐든 물어봐. 먼저 최선의 답을 줄게. 그리고 두 번 묻고 나면 내가 한 번 되물을게 — 입력창 옆 점 ●○ 이 그 리듬이야."
    return project, [coach(project, md)]


def update_project(project: Project, data: dict) -> Project:
    if "format" in data and data["format"] != project.format:
        project.checks = {}  # 형식이 바뀌면 체크 칸은 새로 채운다
    if "rhythm" in data and project.counter >= data["rhythm"]:
        project.counter = 0
    for field, value in data.items():
        setattr(project, field, value)
    project.save()
    return project


def set_check(project: Project, key: str, text: str) -> Project:
    if key not in check_keys(project):
        raise ApiError("UNKNOWN_CHECK", f"'{key}' 는 이 형식의 체크 칸이 아니야.", 422, {"allowed": check_keys(project)})
    project.checks = {**project.checks, key: text.strip()}
    project.save(update_fields=["checks", "updated_at"])
    return project


def clear_check(project: Project, key: str) -> Project:
    project.checks = {k: v for k, v in project.checks.items() if k != key}
    project.save(update_fields=["checks", "updated_at"])
    return project


def soft_delete(project: Project) -> None:
    project.deleted_at = timezone.now()
    project.save(update_fields=["deleted_at", "updated_at"])
    student = project.student
    if student.current_project_id == project.id:
        student.current_project = None
        student.save(update_fields=["current_project", "updated_at"])


def restore(project: Project) -> Project:
    limit = timezone.now() - timedelta(days=settings.ASKBACK["SOFT_DELETE_DAYS"])
    if project.deleted_at is None:
        return project
    if project.deleted_at < limit:
        raise ApiError("RESTORE_EXPIRED", "지운 지 너무 오래돼서 되살릴 수 없어.", 410)
    project.deleted_at = None
    project.save(update_fields=["deleted_at", "updated_at"])
    return project


def purge_expired() -> int:
    """30일 지난 지운 프로젝트를 실제로 삭제 (예약 작업에서 부른다)."""
    limit = timezone.now() - timedelta(days=settings.ASKBACK["SOFT_DELETE_DAYS"])
    n, _ = Project.objects.filter(deleted_at__lt=limit).delete()
    return n
