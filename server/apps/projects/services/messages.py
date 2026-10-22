"""대화 메시지 쓰기 — 모든 앱이 이 함수 하나로 메시지를 남긴다."""
from ..models import Message, Project


def push_message(project: Project, kind: str, body: dict | None = None, *, turn=None, rq=None) -> Message:
    return Message.objects.create(project=project, kind=kind, body=body or {}, turn=turn, rq=rq)


def coach(project: Project, md: str, actions: list[dict] | None = None) -> Message:
    body = {"md": md}
    if actions:
        body["actions"] = actions
    return push_message(project, "coach", body)
