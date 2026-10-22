"""API 바깥은 camelCase, 서버 안은 snake_case.

키만 바꾸고 값은 건드리지 않는다. 'O1' · 'E6' · 한국어 키 · '2026-10' 같은 키는 그대로 남는다.
"""
import re
from typing import Any

_SNAKE_PART = re.compile(r"_([a-z0-9])")
_CAMEL_HUMP = re.compile(r"(?<=[a-z0-9])([A-Z])")


def to_camel(key: Any) -> Any:
    if not isinstance(key, str) or "_" not in key or key.startswith("_"):
        return key
    return _SNAKE_PART.sub(lambda m: m.group(1).upper(), key)


def to_snake(key: Any) -> Any:
    if not isinstance(key, str):
        return key
    return _CAMEL_HUMP.sub(lambda m: "_" + m.group(1).lower(), key)


def camelize(data: Any) -> Any:
    if isinstance(data, dict):
        return {to_camel(k): camelize(v) for k, v in data.items()}
    if isinstance(data, (list, tuple)):
        return [camelize(v) for v in data]
    return data


def snakeize(data: Any) -> Any:
    if isinstance(data, dict):
        return {to_snake(k): snakeize(v) for k, v in data.items()}
    if isinstance(data, list):
        return [snakeize(v) for v in data]
    return data
