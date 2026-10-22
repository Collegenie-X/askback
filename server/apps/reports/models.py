from django.db import models

from apps.common import ids


class Report(models.Model):
    """10문 리포트 — "스마트 화분 · 1번째 리포트". 수치는 집계로만, 코멘트는 수치에서만 나온다."""

    id = models.CharField(primary_key=True, max_length=40, default=ids.report_id, editable=False)
    project = models.ForeignKey("projects.Project", on_delete=models.CASCADE, related_name="reports", verbose_name="프로젝트")
    seq = models.PositiveIntegerField("몇 번째")
    window_index = models.PositiveIntegerField("리포트 구간")
    headline = models.CharField("한 줄 제목", max_length=200)
    turn_from = models.PositiveIntegerField("첫 질문 번호")
    turn_to = models.PositiveIntegerField("끝 질문 번호")
    stage = models.CharField("주된 단계", max_length=2)
    stats = models.JSONField("통계", default=dict, help_text="mix · roles · six · text · elements · stuck · best · mix_comment")
    last_mission = models.JSONField("지난 미션 결과", null=True, blank=True)
    next_mission = models.JSONField("다음 미션", default=dict)
    opened = models.BooleanField("열어 봄", default=False)
    imported = models.BooleanField("브라우저에서 옮겨 옴", default=False)
    legacy_index = models.PositiveIntegerField("브라우저 번호", null=True, blank=True)
    period_from = models.DateTimeField("구간 시작")
    period_to = models.DateTimeField("구간 끝")
    created_at = models.DateTimeField("만든 시각", auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = verbose_name_plural = "리포트"
        ordering = ["project", "seq"]
        constraints = [models.UniqueConstraint(fields=["project", "seq"], name="uniq_report_project_seq")]

    def __str__(self):
        return self.title

    @property
    def title(self) -> str:
        return f"{self.project.name} · {self.seq}번째 리포트"
