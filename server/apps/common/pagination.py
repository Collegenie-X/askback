"""커서 페이지 — 대화가 길어져도 일정한 속도로 넘긴다. 응답은 { data, meta: { nextCursor } }."""
from urllib.parse import parse_qs, urlparse

from rest_framework.pagination import CursorPagination
from rest_framework.response import Response


def _cursor_of(url: str | None) -> str | None:
    if not url:
        return None
    return parse_qs(urlparse(url).query).get("cursor", [None])[0]


class CursorPage(CursorPagination):
    page_size = 50
    max_page_size = 100
    page_size_query_param = "limit"
    ordering = "-created_at"

    def get_paginated_response(self, data):
        return Response({"data": data, "meta": {"next_cursor": _cursor_of(self.get_next_link())}})


class NewestFirstPage(CursorPage):
    """최근 것부터 잘라 오되, 한 페이지 안은 오래된 → 최근 순서로 돌려준다 (대화 화면용)."""

    def get_paginated_response(self, data):
        return Response({"data": list(reversed(data)), "meta": {"next_cursor": _cursor_of(self.get_next_link())}})


class UpdatedPage(CursorPage):
    page_size = 20
    ordering = "-updated_at"
