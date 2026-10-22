"""기기 토큰 발급 · 해시."""
import hashlib
import secrets

from .models import Device, Student

TOKEN_PREFIX = "abk_"


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def issue_device(student: Student, user_agent: str = "") -> str:
    """새 토큰을 만들고 원문을 돌려준다. 원문은 어디에도 저장되지 않는다."""
    raw = TOKEN_PREFIX + secrets.token_urlsafe(32)
    Device.objects.create(student=student, token_hash=hash_token(raw), user_agent=user_agent[:200])
    return raw
