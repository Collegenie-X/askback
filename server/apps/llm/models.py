from django.db import models

from apps.common import ids


class LLMCall(models.Model):
    """Claude 호출 한 번 = 한 줄. 학생 원문은 넣지 않는다 (본문은 turns · messages 에 이미 있다)."""

    TASK_CHOICES = [("answer", "답"), ("rq", "역질문 다듬기"), ("feedback", "채점"), ("deep", "심화")]
    STATUS_CHOICES = [
        ("ok", "성공"),
        ("invalid", "형식 불일치"),
        ("refusal", "거절"),
        ("truncated", "잘림"),
        ("error", "오류"),
        ("timeout", "시간 초과"),
    ]

    id = models.CharField(primary_key=True, max_length=40, default=ids.llm_call_id, editable=False)
    student = models.ForeignKey("accounts.Student", on_delete=models.SET_NULL, null=True, blank=True, related_name="llm_calls", verbose_name="학생")
    project = models.ForeignKey("projects.Project", on_delete=models.SET_NULL, null=True, blank=True, related_name="llm_calls", verbose_name="프로젝트")
    task = models.CharField("작업", max_length=10, choices=TASK_CHOICES)
    model = models.CharField("모델", max_length=40)
    effort = models.CharField("effort", max_length=10, blank=True)
    prompt_version = models.CharField("프롬프트 버전", max_length=16)
    attempt = models.PositiveSmallIntegerField("시도", default=1)
    input_tokens = models.PositiveIntegerField("입력 토큰", default=0)
    output_tokens = models.PositiveIntegerField("출력 토큰", default=0)
    cache_read_tokens = models.PositiveIntegerField("캐시 읽기 토큰", default=0)
    cache_write_tokens = models.PositiveIntegerField("캐시 쓰기 토큰", default=0)
    latency_ms = models.PositiveIntegerField("걸린 시간(ms)", default=0)
    stop_reason = models.CharField("멈춘 이유", max_length=20, blank=True)
    status = models.CharField("결과", max_length=10, choices=STATUS_CHOICES)
    error_code = models.CharField("오류", max_length=80, blank=True)
    created_at = models.DateTimeField("시각", auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = verbose_name_plural = "Claude 호출"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["student", "created_at"], name="idx_llm_student_time"),
            models.Index(fields=["task", "created_at"], name="idx_llm_task_time"),
        ]

    def __str__(self):
        return f"{self.task} · {self.status} · {self.latency_ms}ms"
