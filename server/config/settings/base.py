"""공통 설정. 환경별 차이는 dev.py · prod.py · test.py 에서만 덮어쓴다."""
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent  # server/
REPO_DIR = BASE_DIR.parent  # askback/
load_dotenv(BASE_DIR / ".env")


def env(name: str, default: str | None = None) -> str | None:
    return os.environ.get(name, default)


def env_bool(name: str, default: bool = False) -> bool:
    value = os.environ.get(name)
    return default if value is None else value.strip().lower() in {"1", "true", "yes", "on"}


def env_int(name: str, default: int) -> int:
    value = os.environ.get(name)
    return default if value in (None, "") else int(value)


def env_list(name: str, default: str = "") -> list[str]:
    return [x.strip() for x in (os.environ.get(name) or default).split(",") if x.strip()]


SECRET_KEY = env("DJANGO_SECRET_KEY", "dev-only-insecure-key-change-me")
DEBUG = env_bool("DJANGO_DEBUG", False)
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "apps.common",
    "apps.accounts",
    "apps.projects",
    "apps.coaching",
    "apps.reports",
    "apps.llm",
    "apps.transfer",
    "apps.devtools",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# SQLite — WAL 모드로 읽기와 쓰기가 서로 덜 막히게 하고, 쓰기 트랜잭션은 처음부터 잠근다(IMMEDIATE).
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": env("ASKBACK_SQLITE_PATH", str(BASE_DIR / "db.sqlite3")),
        "OPTIONS": {
            "timeout": 20,
            "transaction_mode": "IMMEDIATE",
            "init_command": "PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; PRAGMA foreign_keys=ON;",
        },
    }
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "ko-kr"
TIME_ZONE = "Asia/Seoul"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# 브라우저 앱(Next.js)이 다른 포트에서 부른다
CORS_ALLOWED_ORIGINS = env_list("ASKBACK_CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
CORS_ALLOW_HEADERS = ["authorization", "content-type", "idempotency-key", "if-match", "accept"]

APPEND_SLASH = False  # API 주소는 끝에 / 를 붙이지 않는다

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["apps.accounts.authentication.DeviceTokenAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_RENDERER_CLASSES": ["apps.common.renderers.EnvelopeJSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["apps.common.parsers.CamelCaseJSONParser"],
    "EXCEPTION_HANDLER": "apps.common.exceptions.api_exception_handler",
    "UNAUTHENTICATED_USER": None,
    "DEFAULT_THROTTLE_RATES": {
        "turns": env("ASKBACK_RATE_TURNS", "10/min"),
        "device": env("ASKBACK_RATE_DEVICE", "20/hour"),
        "import": "5/hour",
    },
}

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "loggers": {"apps": {"handlers": ["console"], "level": env("ASKBACK_LOG_LEVEL", "INFO")}},
}

# ---- AskBack 전용 ----
ASKBACK = {
    # 코칭 데이터의 원본은 프런트 저장소 한 곳 — 서버는 읽기만 한다
    "DATA_DIR": Path(env("ASKBACK_DATA_DIR", str(REPO_DIR / "frontend" / "src" / "data"))),
    "ANSWERS_DIR": Path(env("ASKBACK_ANSWERS_DIR", str(REPO_DIR / "frontend" / "public" / "answers"))),
    "DAILY_TURN_LIMIT": env_int("ASKBACK_DAILY_TURN_LIMIT", 60),
    "HISTORY_LINES": 12,
    "HISTORY_LINE_CHARS": 1200,
    "MAX_QUESTION_CHARS": 4000,
    "MAX_IMAGES": 3,
    "MAX_IMAGE_BYTES": 1_500_000,
    "DEVICE_IDLE_DAYS": 90,
    "IDEMPOTENCY_HOURS": 24,
    "SOFT_DELETE_DAYS": 30,
    "IMPORT_MAX_BYTES": 5_000_000,
    "LLM": {
        "ENABLED": env_bool("ASKBACK_LLM_ENABLED", True),
        "FALLBACKS": env_bool("ASKBACK_LLM_FALLBACKS", True),  # 거절 시 서버 측 대체 모델
        "MAX_RETRIES": env_int("ASKBACK_LLM_MAX_RETRIES", 1),
        "TASKS": {
            "answer": {
                "model": env("ASKBACK_MODEL_ANSWER", env("ASKBACK_MODEL", "claude-opus-5-5")),
                "effort": env("ASKBACK_EFFORT_ANSWER", "medium"),
                "max_tokens": 16000,
                "timeout": env_int("ASKBACK_TIMEOUT_ANSWER", 45),
            },
            "rq": {
                "model": env("ASKBACK_MODEL_RQ", env("ASKBACK_MODEL", "claude-opus-5-5")),
                "effort": env("ASKBACK_EFFORT_RQ", "low"),
                "max_tokens": 4000,
                "timeout": env_int("ASKBACK_TIMEOUT_SHORT", 15),
            },
            "feedback": {
                "model": env("ASKBACK_MODEL_FEEDBACK", env("ASKBACK_MODEL", "claude-opus-5-5")),
                "effort": env("ASKBACK_EFFORT_FEEDBACK", "low"),
                "max_tokens": 4000,
                "timeout": env_int("ASKBACK_TIMEOUT_SHORT", 15),
            },
            "deep": {
                "model": env("ASKBACK_MODEL_DEEP", env("ASKBACK_MODEL", "claude-opus-5-5")),
                "effort": env("ASKBACK_EFFORT_DEEP", "low"),
                "max_tokens": 4000,
                "timeout": env_int("ASKBACK_TIMEOUT_SHORT", 15),
            },
        },
    },
}
