"""역할별 시스템 프롬프트. 원본은 frontend/src/data/prompts.json — 서버는 읽고 공통 출력 규칙만 덧붙인다.

시스템 프롬프트는 학생마다 바뀌지 않아야 캐시가 맞는다. 날짜 · 이름 · 무작위 값은 절대 넣지 않는다.
"""
import hashlib
from functools import lru_cache

from apps.common import catalog

OUTPUT_RULES = """
## 출력 형식
- 정해진 JSON 스키마의 모든 키를 빠짐없이 채운다. 값이 없으면 문자열은 null(허용된 칸만), 배열은 []로 둔다. 빈 문자열 ""은 쓰지 않는다.
- enum 값은 표기 그대로 쓴다 (O3, 설계, F1). 번역하거나 설명을 붙이지 않는다.
- 숫자 칸에는 숫자만 넣는다 (six는 0, 0.5, 1 중 하나).
- 마크다운은 _md 로 끝나는 칸에만 쓴다. 다른 칸은 한 줄 평문이다.
- JSON 밖에 다른 말을 쓰지 않는다.
""".strip()


@lru_cache(maxsize=None)
def system_text(task: str) -> str:
    lines = catalog.prompts()[task]["system"]
    return "\n".join(lines) + "\n\n" + OUTPUT_RULES


@lru_cache(maxsize=None)
def version(task: str) -> str:
    """어느 프롬프트로 만든 답인지 추적하는 짧은 해시."""
    return hashlib.sha256(system_text(task).encode()).hexdigest()[:8]
