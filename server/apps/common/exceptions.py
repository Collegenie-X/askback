"""오류 봉투 { "error": { "code", "message", "details"? } } — 설계서 §6 오류 코드."""
import logging

from django.conf import settings
from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.http import Http404
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler

from .camel import to_camel

logger = logging.getLogger("apps.common")


class ApiError(exceptions.APIException):
    """업무 오류. code 는 화면이 분기할 때 쓰는 고정 문자열."""

    def __init__(self, code: str, message: str, status_code: int = status.HTTP_400_BAD_REQUEST, details=None):
        super().__init__(detail=message)
        self.code = code
        self.status_code = status_code
        self.details = details


_DRF_CODES = [
    (exceptions.ValidationError, "VALIDATION_FAILED", status.HTTP_422_UNPROCESSABLE_ENTITY),
    (exceptions.NotAuthenticated, "UNAUTHORIZED", status.HTTP_401_UNAUTHORIZED),
    (exceptions.AuthenticationFailed, "UNAUTHORIZED", status.HTTP_401_UNAUTHORIZED),
    (exceptions.PermissionDenied, "FORBIDDEN", status.HTTP_403_FORBIDDEN),
    (exceptions.NotFound, "NOT_FOUND", status.HTTP_404_NOT_FOUND),
    (exceptions.MethodNotAllowed, "METHOD_NOT_ALLOWED", status.HTTP_405_METHOD_NOT_ALLOWED),
    (exceptions.UnsupportedMediaType, "UNSUPPORTED_MEDIA_TYPE", status.HTTP_415_UNSUPPORTED_MEDIA_TYPE),
    (exceptions.ParseError, "BAD_REQUEST", status.HTTP_400_BAD_REQUEST),
    (exceptions.Throttled, "RATE_LIMITED", status.HTTP_429_TOO_MANY_REQUESTS),
]

_MESSAGES = {
    "VALIDATION_FAILED": "보낸 값을 다시 확인해 줘.",
    "UNAUTHORIZED": "기기 토큰이 없거나 만료됐어.",
    "FORBIDDEN": "이 기록에는 접근할 수 없어.",
    "NOT_FOUND": "찾는 기록이 없어.",
    "RATE_LIMITED": "잠깐 쉬었다 가자. 조금 뒤에 다시 보내 줘.",
    "BAD_REQUEST": "요청을 읽지 못했어. JSON 형식인지 확인해 줘.",
}


def _flatten(detail, prefix: str = "") -> list[dict]:
    """{"text": ["…"], "items": {"0": {...}}} → [{"field": "text", "messages": [...]}]"""
    if isinstance(detail, dict):
        out = []
        for key, value in detail.items():
            name = f"{prefix}.{to_camel(str(key))}" if prefix else to_camel(str(key))
            out.extend(_flatten(value, name))
        return out
    if isinstance(detail, list) and detail and all(not isinstance(x, (dict, list)) for x in detail):
        return [{"field": prefix or "nonField", "messages": [str(x) for x in detail]}]
    if isinstance(detail, list):
        out = []
        for i, value in enumerate(detail):
            out.extend(_flatten(value, f"{prefix}[{i}]"))
        return out
    return [{"field": prefix or "nonField", "messages": [str(detail)]}]


def _error(code: str, message: str, status_code: int, details=None, headers=None) -> Response:
    body = {"code": code, "message": message}
    if details:
        body["details"] = details
    return Response({"error": body}, status=status_code, headers=headers)


def api_exception_handler(exc, context):
    if isinstance(exc, ApiError):
        return _error(exc.code, str(exc.detail), exc.status_code, exc.details)
    if isinstance(exc, Http404):
        exc = exceptions.NotFound()
    elif isinstance(exc, DjangoPermissionDenied):
        exc = exceptions.PermissionDenied()

    response = exception_handler(exc, context)
    if response is None:
        logger.exception("처리하지 못한 오류", exc_info=exc)
        if settings.DEBUG:
            return None  # 개발 중에는 Django 오류 화면으로
        return _error("INTERNAL", "서버에서 문제가 생겼어. 잠시 뒤에 다시 해 줘.", status.HTTP_500_INTERNAL_SERVER_ERROR)

    for cls, code, status_code in _DRF_CODES:
        if isinstance(exc, cls):
            break
    else:
        code, status_code = "ERROR", response.status_code

    headers = {k: v for k, v in response.items() if k in ("Retry-After", "WWW-Authenticate")}
    if isinstance(exc, exceptions.ValidationError):
        return _error(code, _MESSAGES[code], status_code, _flatten(exc.detail), headers)
    if isinstance(exc, exceptions.Throttled):
        details = {"retryAfter": exc.wait} if exc.wait else None
        return _error(code, _MESSAGES[code], status_code, details, headers)
    detail = response.data.get("detail") if isinstance(response.data, dict) else None
    return _error(code, str(detail) if detail else _MESSAGES.get(code, "요청을 처리하지 못했어."), status_code, headers=headers)
