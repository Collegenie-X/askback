"""Claude 에 보내는 <context> 블록과 대화 기록 (설계서 §5-2 · §5-3).

학생 실명 · 학교 · 기기 정보는 넣지 않는다.
"""
from django.conf import settings

from apps.projects.models import Message
from apps.projects.services.drafts import draft_context, plan_outline


def context_of(project, student) -> str:
    interests = ", ".join(student.interests) if student.interests else "없음"
    lines = [
        f"학생: {student.nickname or '학생'} ({student.grade or '학년 모름'}) · 관심: {interests}",
        f"프로젝트: {project.name}" + (f" — {project.description}" if project.description else ""),
        draft_context(project),
    ]
    outline = plan_outline(project)
    if outline:
        lines.append(f"기획서 요약: {outline}")
    return "\n".join(x for x in lines if x)


def history_of(project) -> list[dict]:
    """최근 대화 12줄 — user · assistant 를 번갈아. 심화 대화는 넣지 않는다."""
    cfg = settings.ASKBACK
    rows = Message.objects.filter(project=project, kind__in=["user", "answer"]).order_by("-created_at")[: cfg["HISTORY_LINES"] * 2]
    out: list[dict] = []
    for m in reversed(list(rows)):
        if m.kind == "user" and not m.body.get("deep"):
            out.append({"role": "user", "content": (m.body.get("text") or "")[: cfg["HISTORY_LINE_CHARS"]]})
        elif m.kind == "answer":
            out.append({"role": "assistant", "content": (m.body.get("md") or "")[: cfg["HISTORY_LINE_CHARS"]]})
    # API 규칙: 같은 역할이 연달아 오지 않게, 첫 메시지는 user
    merged: list[dict] = []
    for item in out:
        if merged and merged[-1]["role"] == item["role"]:
            merged[-1] = item  # 답이 없던 질문(관문에 걸린 것)은 뒤의 것으로 덮는다
        else:
            merged.append(item)
    while merged and merged[0]["role"] != "user":
        merged.pop(0)
    while merged and merged[-1]["role"] != "assistant":
        merged.pop()  # 이번 질문이 마지막 user 로 붙으니, 기록은 assistant 로 끝나야 한다
    return merged[-cfg["HISTORY_LINES"] :]
