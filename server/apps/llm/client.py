"""Claude 호출 어댑터 — 작업(task)마다 모델 · effort · 스키마 · 시간 제한이 다르다.

실패하면 None 을 돌려주고, 부르는 쪽(코칭 엔진)이 로컬 답 카드로 폴백한다.
호출은 성공 · 실패 모두 LLMCall 에 한 줄씩 남는다.
"""
import json
import logging
import os
import time
from dataclasses import dataclass
from functools import lru_cache

import anthropic
from django.conf import settings
from pydantic import ValidationError

from . import prompts
from .models import LLMCall
from .schemas import SCHEMAS, output_schema

logger = logging.getLogger("apps.llm")

FALLBACK_BETA = "server-side-fallback-2026-07-01"
_DATA_URL_TYPES = ("image/jpeg", "image/png", "image/webp", "image/gif")


@dataclass
class LLMResult:
    data: dict | None
    call: LLMCall | None

    @property
    def ok(self) -> bool:
        return self.data is not None


def _config() -> dict:
    return settings.ASKBACK["LLM"]


def is_live() -> bool:
    """키가 있고 꺼 두지 않았으면 Claude 를 쓴다."""
    has_key = bool(os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN"))
    return bool(_config()["ENABLED"]) and has_key


@lru_cache(maxsize=1)
def _client() -> anthropic.Anthropic:
    return anthropic.Anthropic(max_retries=_config()["MAX_RETRIES"])


@lru_cache(maxsize=None)
def _schema(task: str) -> dict:
    return output_schema(SCHEMAS[task])


def _image_blocks(images: list[str] | None) -> list[dict]:
    blocks = []
    for url in (images or [])[: settings.ASKBACK["MAX_IMAGES"]]:
        head, _, data = url.partition(";base64,")
        media_type = head.removeprefix("data:")
        if media_type in _DATA_URL_TYPES and data:
            blocks.append({"type": "image", "source": {"type": "base64", "media_type": media_type, "data": data}})
    return blocks


def build_request(task: str, input_text: str, *, context: str = "", history=None, images=None) -> dict:
    spec = _config()["TASKS"][task]
    text = f"<context>\n{context}\n</context>\n\n{input_text}" if context else input_text
    image_blocks = _image_blocks(images)
    content = [*image_blocks, {"type": "text", "text": text}] if image_blocks else text
    messages = [*(history or []), {"role": "user", "content": content}]
    request = {
        "model": spec["model"],
        "max_tokens": spec["max_tokens"],
        "thinking": {"type": "adaptive"},
        # 바뀌지 않는 시스템 프롬프트 끝에 캐시 지점 — 학생 · 프로젝트 맥락은 마지막 user 메시지에
        "system": [{"type": "text", "text": prompts.system_text(task), "cache_control": {"type": "ephemeral"}}],
        "messages": messages,
        "output_config": {"effort": spec["effort"], "format": {"type": "json_schema", "schema": _schema(task)}},
        "timeout": spec["timeout"],
    }
    if _config()["FALLBACKS"]:
        request["extra_headers"] = {"anthropic-beta": FALLBACK_BETA}
        request["extra_body"] = {"fallbacks": "default"}
    return request


def _usage(response) -> dict:
    u = getattr(response, "usage", None)
    return {
        "input_tokens": getattr(u, "input_tokens", 0) or 0,
        "output_tokens": getattr(u, "output_tokens", 0) or 0,
        "cache_read_tokens": getattr(u, "cache_read_input_tokens", 0) or 0,
        "cache_write_tokens": getattr(u, "cache_creation_input_tokens", 0) or 0,
    }


def _record(task: str, request: dict, attempt: int, started: float, *, student, project, status: str, response=None, error_code: str = "") -> LLMCall:
    return LLMCall.objects.create(
        student=student,
        project=project,
        task=task,
        model=getattr(response, "model", None) or request["model"],
        effort=request["output_config"]["effort"],
        prompt_version=prompts.version(task),
        attempt=attempt,
        latency_ms=int((time.monotonic() - started) * 1000),
        stop_reason=getattr(response, "stop_reason", "") or "",
        status=status,
        error_code=error_code[:80],
        **(_usage(response) if response is not None else {}),
    )


def _parse(task: str, response) -> dict:
    text = next(b.text for b in response.content if b.type == "text")
    return SCHEMAS[task].model_validate(json.loads(text)).model_dump()


def call(task: str, input_text: str, *, context: str = "", history=None, images=None, student=None, project=None) -> LLMResult:
    """Claude 를 한 번 부른다. 형식이 깨졌으면 한 번만 다시 부른다. 실패는 LLMResult(None, call)."""
    if not is_live():
        return LLMResult(None, None)
    request = build_request(task, input_text, context=context, history=history, images=images)
    last_call = None
    for attempt in (1, 2):
        started = time.monotonic()
        try:
            response = _client().messages.create(**request)
        except anthropic.APITimeoutError:
            return LLMResult(None, _record(task, request, attempt, started, student=student, project=project, status="timeout", error_code="timeout"))
        except anthropic.APIStatusError as exc:
            code = f"{exc.status_code}:{type(exc).__name__}"
            logger.warning("Claude %s 호출 실패 %s", task, code)
            return LLMResult(None, _record(task, request, attempt, started, student=student, project=project, status="error", error_code=code))
        except anthropic.APIConnectionError:
            return LLMResult(None, _record(task, request, attempt, started, student=student, project=project, status="error", error_code="connection"))

        if response.stop_reason == "refusal":
            return LLMResult(None, _record(task, request, attempt, started, student=student, project=project, status="refusal", response=response))
        if response.stop_reason == "max_tokens":  # 잘린 JSON 은 쓰지 않는다
            return LLMResult(None, _record(task, request, attempt, started, student=student, project=project, status="truncated", response=response))
        try:
            data = _parse(task, response)
        except (StopIteration, json.JSONDecodeError, ValidationError) as exc:
            last_call = _record(task, request, attempt, started, student=student, project=project, status="invalid", response=response, error_code=type(exc).__name__)
            continue
        return LLMResult(data, _record(task, request, attempt, started, student=student, project=project, status="ok", response=response))
    return LLMResult(None, last_call)
