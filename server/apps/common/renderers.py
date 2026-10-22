"""성공은 { "data": … , "meta"?: … }, 실패는 { "error": … } — 모든 응답이 같은 봉투를 쓴다."""
from rest_framework.renderers import JSONRenderer

from .camel import camelize

_ENVELOPE_KEYS = {"data", "meta"}


def is_enveloped(data) -> bool:
    if not isinstance(data, dict):
        return False
    if set(data) == {"error"}:
        return True
    return "data" in data and set(data) <= _ENVELOPE_KEYS


class EnvelopeJSONRenderer(JSONRenderer):
    charset = "utf-8"

    def render(self, data, accepted_media_type=None, renderer_context=None):
        if data is None:
            return b""
        if not is_enveloped(data):
            data = {"data": data}
        return super().render(camelize(data), accepted_media_type, renderer_context)
