from django.db import models


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField("만든 시각", auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField("고친 시각", auto_now=True)

    class Meta:
        abstract = True


class IdempotencyKey(models.Model):
    """같은 Idempotency-Key 로 다시 온 요청에는 저장해 둔 응답을 그대로 돌려준다 (Claude 는 한 번만)."""

    student = models.ForeignKey("accounts.Student", on_delete=models.CASCADE, related_name="idempotency_keys", verbose_name="학생")
    key = models.CharField("키", max_length=100)
    request_hash = models.CharField("요청 해시", max_length=64)
    status_code = models.PositiveSmallIntegerField("응답 코드")
    response = models.JSONField("응답")
    created_at = models.DateTimeField("만든 시각", auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = verbose_name_plural = "멱등 키"
        constraints = [models.UniqueConstraint(fields=["student", "key"], name="uniq_idempotency_student_key")]

    def __str__(self):
        return f"{self.key} ({self.status_code})"
