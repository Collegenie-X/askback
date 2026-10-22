"""Idempotency-Key 헤더 처리. 네트워크 재시도로 같은 질문이 두 번 와도 Claude 는 한 번만 부른다."""
import hashlib
import json
from datetime import timedelta

from django.conf import settings
from django.db import IntegrityError
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from .exceptions import ApiError
from .models import IdempotencyKey

HEADER = "HTTP_IDEMPOTENCY_KEY"


def _hash(path: str, data) -> str:
    raw = json.dumps({"path": path, "data": data}, sort_keys=True, ensure_ascii=False, default=str)
    return hashlib.sha256(raw.encode()).hexdigest()


class Idempotency:
    """with 문 없이 쓰는 작은 도우미.

    idem = Idempotency(request)
    if (cached := idem.replay()): return cached
    ... 처리 ...
    return idem.save(Response(payload, status=201))
    """

    def __init__(self, request):
        self.student = request.user
        self.key = (request.META.get(HEADER) or "").strip()[:100]
        self.hash = _hash(request.path, request.data) if self.key else ""

    def replay(self) -> Response | None:
        if not self.key:
            return None
        since = timezone.now() - timedelta(hours=settings.ASKBACK["IDEMPOTENCY_HOURS"])
        found = IdempotencyKey.objects.filter(student=self.student, key=self.key, created_at__gte=since).first()
        if not found:
            return None
        if found.request_hash != self.hash:
            raise ApiError("IDEMPOTENCY_MISMATCH", "같은 Idempotency-Key 로 다른 내용을 보냈어. 새 키로 보내 줘.", status.HTTP_409_CONFLICT)
        response = Response(found.response, status=found.status_code)
        response["Idempotent-Replay"] = "true"
        return response

    def save(self, response: Response) -> Response:
        if self.key and response.status_code < 500:
            try:
                IdempotencyKey.objects.update_or_create(
                    student=self.student,
                    key=self.key,
                    defaults={"request_hash": self.hash, "status_code": response.status_code, "response": response.data},
                )
            except IntegrityError:
                pass  # 같은 키가 동시에 두 번 — 먼저 저장된 쪽을 둔다
        return response
