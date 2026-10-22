from django.db import models

from apps.common import ids
from apps.common.catalog import LENSES, PACKS


class ProjectQuerySet(models.QuerySet):
    def alive(self):
        return self.filter(deleted_at__isnull=True)


class Project(models.Model):
    FORMAT_CHOICES = [("paper", "논문"), ("research", "리서치"), ("campaign", "캠페인"), ("service", "서비스"), ("product", "제품")]
    RHYTHM_CHOICES = [(2, "2문 1역"), (3, "3문 1역"), (4, "4문 1역")]

    id = models.CharField(primary_key=True, max_length=40, default=ids.project_id, editable=False)
    student = models.ForeignKey("accounts.Student", on_delete=models.CASCADE, related_name="projects", verbose_name="학생")
    name = models.CharField("이름", max_length=40)
    description = models.CharField("설명", max_length=200, blank=True)
    emoji = models.CharField("이모지", max_length=8, blank=True, default="✨")
    packs = models.JSONField("팩", default=list, blank=True, help_text=f"{', '.join(PACKS)} 중에서")
    format = models.CharField("초안 형식", max_length=10, choices=FORMAT_CHOICES, blank=True)

    # 리듬 — 서버만 바꾼다
    rhythm = models.PositiveSmallIntegerField("리듬", choices=RHYTHM_CHOICES, default=2)
    answer_only = models.BooleanField("⚡ 답만", default=False)
    counter = models.PositiveSmallIntegerField("이번 마디 질문 수", default=0)
    bar_index = models.PositiveIntegerField("마디 번호", default=0)
    later_streak = models.PositiveSmallIntegerField("[나중에] 연속", default=0)

    checks = models.JSONField("체크 칸", default=dict, blank=True)
    plan_filename = models.CharField("기획서 파일 이름", max_length=100, blank=True)
    plan_md = models.TextField("기획서.md", blank=True)
    is_example = models.BooleanField("예시 프로젝트", default=False)

    created_at = models.DateTimeField("만든 시각", auto_now_add=True)
    updated_at = models.DateTimeField("고친 시각", auto_now=True, db_index=True)
    deleted_at = models.DateTimeField("지운 시각", null=True, blank=True)

    objects = ProjectQuerySet.as_manager()

    class Meta:
        verbose_name = verbose_name_plural = "프로젝트"
        ordering = ["-updated_at"]
        indexes = [models.Index(fields=["student", "-updated_at"], name="idx_project_student_updated")]

    def __str__(self):
        return f"{self.emoji} {self.name}"


class Message(models.Model):
    """대화 한 줄. 공통 칸은 컬럼, 종류마다 다른 칸은 body(JSON)."""

    KIND_CHOICES = [
        ("user", "학생"),
        ("answer", "답"),
        ("coach", "코치"),
        ("rq", "역질문"),
        ("deepPick", "심화 렌즈 고르기"),
        ("deepQ", "심화 질문"),
    ]

    id = models.CharField(primary_key=True, max_length=40, default=ids.message_id, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="messages", verbose_name="프로젝트")
    kind = models.CharField("종류", max_length=10, choices=KIND_CHOICES)
    turn = models.ForeignKey("coaching.Turn", on_delete=models.SET_NULL, null=True, blank=True, related_name="messages", verbose_name="턴")
    rq = models.ForeignKey("coaching.ReverseQuestion", on_delete=models.SET_NULL, null=True, blank=True, related_name="messages", verbose_name="역질문")
    body = models.JSONField("내용", default=dict, blank=True)
    created_at = models.DateTimeField("만든 시각", auto_now_add=True)

    class Meta:
        verbose_name = verbose_name_plural = "메시지"
        ordering = ["created_at"]
        indexes = [models.Index(fields=["project", "created_at"], name="idx_message_project_time")]

    def __str__(self):
        return f"[{self.get_kind_display()}] {self.preview}"

    @property
    def preview(self) -> str:
        text = self.body.get("text") or self.body.get("md") or ""
        return text.replace("\n", " ")[:60]


class Note(models.Model):
    """심화 대화의 생각 노트."""

    LENS_CHOICES = [(k, k) for k in LENSES]

    id = models.CharField(primary_key=True, max_length=40, default=ids.note_id, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="notes", verbose_name="프로젝트")
    lens = models.CharField("렌즈", max_length=12, choices=[("philosophy", "철학"), ("psychology", "심리학"), ("sociology", "사회학")])
    level = models.PositiveSmallIntegerField("깊이", default=0, help_text="0~2 = L1~L3, 3 = 확장")
    question = models.TextField("질문", blank=True)
    text = models.TextField("학생의 말")
    created_at = models.DateTimeField("만든 시각", auto_now_add=True)

    class Meta:
        verbose_name = verbose_name_plural = "생각 노트"
        ordering = ["-created_at"]

    def __str__(self):
        return self.text[:40]
