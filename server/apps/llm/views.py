from django.conf import settings
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from . import prompts
from .client import is_live


class HealthView(APIView):
    """서버가 살아 있는지 · Claude 를 쓰는지 (예전 GET /api/turn 자리)."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        tasks = settings.ASKBACK["LLM"]["TASKS"]
        return Response(
            {
                "ok": True,
                "live": is_live(),
                "tasks": {k: {"model": v["model"], "effort": v["effort"], "prompt_version": prompts.version(k)} for k, v in tasks.items()},
            }
        )
