from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.exceptions import ApiError
from apps.common.throttling import ImportThrottle

from .services import import_local


class ImportLocalView(APIView):
    """POST /import/local — 브라우저에 쌓인 기록(exportAll() 결과)을 한 번에 올린다."""

    throttle_classes = [ImportThrottle]

    def post(self, request):
        size = int(request.META.get("CONTENT_LENGTH") or 0)
        if size > settings.ASKBACK["IMPORT_MAX_BYTES"]:
            raise ApiError("PAYLOAD_TOO_LARGE", "옮길 기록이 5MB 를 넘어. 사진을 빼고 다시 내보내 줘.", status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)
        if not isinstance(request.data, dict) or "projects" not in request.data:
            raise ApiError("VALIDATION_FAILED", "exportAll() 로 내보낸 JSON 을 그대로 보내 줘.", 422)
        return Response(import_local(request.user, request.data))
