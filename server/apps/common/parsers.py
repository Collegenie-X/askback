from rest_framework.parsers import JSONParser

from .camel import snakeize


class CamelCaseJSONParser(JSONParser):
    """요청 본문의 camelCase 키를 snake_case 로 바꿔서 serializer 에 넘긴다."""

    def parse(self, stream, media_type=None, parser_context=None):
        return snakeize(super().parse(stream, media_type, parser_context))
