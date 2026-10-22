"""테스트용 — Claude 를 부르지 않고 로컬 엔진으로만 돈다."""
from .base import *  # noqa: F401,F403
from .base import ASKBACK, REST_FRAMEWORK

DEBUG = False
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}}

ASKBACK = {**ASKBACK, "LLM": {**ASKBACK["LLM"], "ENABLED": False}}
REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    "DEFAULT_THROTTLE_RATES": {"turns": "1000/min", "device": "1000/min", "import": "1000/min"},
}
