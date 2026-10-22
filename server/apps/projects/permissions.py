"""남의 기록은 404 — 있는지조차 알려주지 않는다."""
from django.shortcuts import get_object_or_404

from .models import Note, Project


def my_project(request, pk: str, *, include_deleted: bool = False) -> Project:
    qs = Project.objects.filter(student=request.user)
    if not include_deleted:
        qs = qs.alive()
    return get_object_or_404(qs, pk=pk)


def my_note(request, pk: str) -> Note:
    return get_object_or_404(Note.objects.filter(project__student=request.user, project__deleted_at__isnull=True), pk=pk)
