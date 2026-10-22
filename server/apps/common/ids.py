"""ID 만들기 — 브라우저(lib/db.ts uid)와 같은 모양: 접두사 + 시각(36진수) + 랜덤.

브라우저에서 옮겨 온 기록의 ID를 그대로 쓸 수 있도록 접두사 규칙을 맞춘다.
마이그레이션이 직렬화할 수 있게 접두사마다 모듈 수준 함수를 둔다.
"""
import secrets
import string
import time

_ALPHABET = string.digits + string.ascii_lowercase


def _base36(n: int) -> str:
    out = ""
    while n:
        n, r = divmod(n, 36)
        out = _ALPHABET[r] + out
    return out or "0"


def new_id(prefix: str) -> str:
    return f"{prefix}_{_base36(int(time.time() * 1000))}{secrets.token_hex(3)}"


def student_id() -> str:
    return new_id("usr")


def device_id() -> str:
    return new_id("dev")


def project_id() -> str:
    return new_id("prj")


def message_id() -> str:
    return new_id("m")


def note_id() -> str:
    return new_id("note")


def turn_id() -> str:
    return new_id("t")


def rq_id() -> str:
    return new_id("rq")


def report_id() -> str:
    return new_id("rpt")


def llm_call_id() -> str:
    return new_id("llm")
