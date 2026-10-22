"""학생과 기기 토큰. 관리자(교사·운영자)는 Django 기본 User 로 /admin 에 들어온다 — 학생과 섞지 않는다."""
from django.db import models

from apps.common import ids


class Student(models.Model):
    """localStorage 의 profile + state + introSeen 을 합친 것. 실명 · 학교 · 연락처는 받지 않는다."""

    id = models.CharField(primary_key=True, max_length=40, default=ids.student_id, editable=False)
    nickname = models.CharField("닉네임", max_length=20)
    grade = models.CharField("학년", max_length=10, blank=True)
    interests = models.JSONField("관심사", default=list, blank=True)
    valid_count = models.PositiveIntegerField("유효 질문 수", default=0)
    idk_count = models.PositiveIntegerField("'잘 모르겠어' 수", default=0)
    current_project = models.ForeignKey(
        "projects.Project", on_delete=models.SET_NULL, null=True, blank=True, related_name="+", verbose_name="마지막으로 연 프로젝트"
    )
    intro_seen = models.BooleanField("온보딩 소개 봄", default=False)
    created_at = models.DateTimeField("가입 시각", auto_now_add=True)
    updated_at = models.DateTimeField("고친 시각", auto_now=True)

    class Meta:
        verbose_name = verbose_name_plural = "학생"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.nickname} ({self.grade or '학년 모름'})"

    # DRF 의 IsAuthenticated 가 보는 값 — 기기 토큰으로 들어온 학생은 늘 인증된 상태
    @property
    def is_authenticated(self) -> bool:
        return True

    @property
    def is_anonymous(self) -> bool:
        return False


class Device(models.Model):
    """익명 기기 토큰. 원문은 발급 응답에서 한 번만 보여주고, DB 에는 해시만 둔다."""

    id = models.CharField(primary_key=True, max_length=40, default=ids.device_id, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="devices", verbose_name="학생")
    token_hash = models.CharField("토큰 해시", max_length=64, unique=True)
    user_agent = models.CharField("기기 정보", max_length=200, blank=True)
    created_at = models.DateTimeField("발급 시각", auto_now_add=True)
    last_seen_at = models.DateTimeField("마지막 사용", auto_now_add=True)
    revoked_at = models.DateTimeField("폐기 시각", null=True, blank=True)

    class Meta:
        verbose_name = verbose_name_plural = "기기 토큰"
        ordering = ["-last_seen_at"]

    def __str__(self):
        return f"{self.student.nickname} · {self.user_agent[:30] or self.id}"


class Goal(models.Model):
    """월간 리포트의 '다음 달 목표' — "2026-10" → 한 줄."""

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="goals", verbose_name="학생")
    ym = models.CharField("년-월", max_length=7)
    text = models.CharField("목표", max_length=300)
    updated_at = models.DateTimeField("고친 시각", auto_now=True)

    class Meta:
        verbose_name = verbose_name_plural = "월 목표"
        ordering = ["-ym"]
        constraints = [models.UniqueConstraint(fields=["student", "ym"], name="uniq_goal_student_ym")]

    def __str__(self):
        return f"{self.ym} {self.text[:20]}"
