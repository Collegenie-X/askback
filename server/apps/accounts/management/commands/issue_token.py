"""학생 + 기기 토큰을 바로 만든다 (개발 · 시연용).

python manage.py issue_token --nickname 민준 --grade 중2
python manage.py issue_token --student usr_xxx      # 기존 학생에게 기기 하나 더
"""
from django.core.management.base import BaseCommand, CommandError

from apps.accounts.models import Student
from apps.accounts.tokens import issue_device


class Command(BaseCommand):
    help = "학생과 기기 토큰을 발급해 토큰 원문을 출력합니다."

    def add_arguments(self, parser):
        parser.add_argument("--nickname", default="테스트학생")
        parser.add_argument("--grade", default="중2")
        parser.add_argument("--student", help="이미 있는 학생 ID")

    def handle(self, *args, nickname, grade, student, **options):
        if student:
            try:
                target = Student.objects.get(pk=student)
            except Student.DoesNotExist as exc:
                raise CommandError(f"학생 {student} 가 없어요.") from exc
        else:
            target = Student.objects.create(nickname=nickname, grade=grade)
        token = issue_device(target, "manage.py issue_token")
        self.stdout.write(self.style.SUCCESS(f"학생: {target.id} ({target.nickname})"))
        self.stdout.write(f"토큰: {token}")
        self.stdout.write("요청 헤더 → Authorization: Bearer <토큰>")
