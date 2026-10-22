"""더미 DB 채우기 (개발 전용).

python manage.py seed_dummy                 # 학생 10명 · 지난 30일 · 로컬 엔진
python manage.py seed_dummy --reset         # 예전 더미를 지우고 다시
python manage.py seed_dummy --admin         # /admin 로그인용 개발 관리자도 만든다
python manage.py seed_dummy --extra 2 --days 14 --seed 3

따로 떼어 둔 DB 파일에 만들고 싶으면:
ASKBACK_SQLITE_PATH=dummy.sqlite3 python manage.py migrate
ASKBACK_SQLITE_PATH=dummy.sqlite3 python manage.py seed_dummy --admin
"""
import os

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.devtools import dummy

DEFAULT_ADMIN_PASSWORD = "askback-dev-1234"  # 개발 DB 전용 — README · .env.example 에 적어 둔 값


class Command(BaseCommand):
    help = "실제 코칭 엔진에 시나리오 질문을 흘려 보내 더미 학생 · 프로젝트 · 턴 · 역질문 · 리포트를 만듭니다."

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="seed_dummy 로 만든 학생을 먼저 지운다")
        parser.add_argument("--days", type=int, default=30, help="질문을 흩어 놓을 기간(일)")
        parser.add_argument("--extra", type=int, default=None, help="추가 학생 수 (0~6, 기본 전부)")
        parser.add_argument("--seed", type=int, default=7, help="난수 씨앗 — 같은 값이면 같은 결과")
        parser.add_argument("--no-llm-calls", action="store_true", help="가짜 Claude 호출 기록을 만들지 않는다")
        parser.add_argument("--use-claude", action="store_true", help="실제 Claude 로 답한다 (비용 발생!)")
        parser.add_argument("--admin", action="store_true", help="개발용 관리자 계정을 만든다")
        parser.add_argument("--admin-username", default="admin")
        parser.add_argument("--force", action="store_true", help="DEBUG=False 에서도 실행")

    def handle(self, *args, **o):
        if not settings.DEBUG and not o["force"]:
            raise CommandError("개발 전용 명령이에요. DEBUG=False 에서는 --force 를 붙여야 해요.")
        if "prod" in os.environ.get("DJANGO_SETTINGS_MODULE", ""):
            raise CommandError("운영 설정(config.settings.prod)에서는 실행할 수 없어요.")
        if o["use_claude"]:
            self.stdout.write(self.style.WARNING("⚠️ 실제 Claude 를 부릅니다 — 질문 약 100개 분량의 비용이 듭니다."))

        if o["reset"]:
            self.stdout.write(f"예전 더미 학생 {dummy.reset()}명을 지웠어요.")

        self.stdout.write("더미 데이터를 만드는 중… (코칭 엔진으로 질문을 하나씩 처리합니다)")
        report = dummy.Seeder(
            days=o["days"], extra=o["extra"], seed=o["seed"], use_claude=o["use_claude"], llm_calls=not o["no_llm_calls"],
        ).run()

        if o["admin"]:
            password = os.environ.get("ASKBACK_DUMMY_ADMIN_PASSWORD", DEFAULT_ADMIN_PASSWORD)
            created = dummy.ensure_admin(o["admin_username"], password)
            self.stdout.write(f"관리자 '{o['admin_username']}' " + ("만들었어요 (비밀번호는 README 참고)." if created else "이미 있어서 그대로 뒀어요."))

        path = settings.BASE_DIR / "dummy_tokens.json"
        dummy.write_tokens(report, path)

        self.stdout.write(self.style.SUCCESS("\n완료 — " + " · ".join(f"{k} {v}" for k, v in report.counts.items())))
        self.stdout.write(f"\n{'학생':<6} {'프로젝트':<18} {'질문':>4} {'리포트':>4}  ID")
        for s in report.students:
            mark = " (지움)" if s["deleted"] else ""
            self.stdout.write(f"{s['nickname']:<6} {s['project'][:16]:<18} {s['turns']:>4} {s['reports']:>4}  {s['project_id']}{mark}")
        self.stdout.write(f"\n학생별 기기 토큰 → {path.name}  (Authorization: Bearer <token>)")
