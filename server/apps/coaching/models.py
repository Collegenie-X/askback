from django.db import models
from django.db.models import Q

from apps.common import ids
from apps.common.catalog import SIX_KEYS

OPENNESS_CHOICES = [("O1", "O1 지시"), ("O2", "O2 좁은"), ("O3", "O3 열린"), ("O4", "O4 대안"), ("O5", "O5 맨 열린"), ("NA", "NA 판별 불가")]
STAGE_CHOICES = [("탐색", "탐색"), ("설계", "설계"), ("구현", "구현"), ("검증", "검증")]
ROLE_CHOICES = [("typist", "받아쓰기"), ("coder", "코더"), ("engineer", "엔지니어"), ("architect", "아키텍트"), ("encyclopedia", "백과사전")]
CHIP_CHOICES = [("widen", "넓히기"), ("narrow", "좁히기"), ("alt", "다른 길")]
FORM_CHOICES = [("F1", "고르기"), ("F2", "빈칸"), ("F3", "한두 문장")]
AXIS_CHOICES = [("plan", "🧭 기획"), ("algo", "🔀 알고리즘"), ("arch", "🏗 전체 구조")]


class Turn(models.Model):
    """유효 질문 한 번. 기록이라 고치거나 지우지 않는다 (리포트의 근거)."""

    id = models.CharField(primary_key=True, max_length=40, default=ids.turn_id, editable=False)
    project = models.ForeignKey("projects.Project", on_delete=models.CASCADE, related_name="turns", verbose_name="프로젝트")
    student = models.ForeignKey("accounts.Student", on_delete=models.CASCADE, related_name="turns", verbose_name="학생")
    n = models.PositiveIntegerField("전체 번호")
    window_index = models.PositiveIntegerField("리포트 구간")
    bar_index = models.PositiveIntegerField("마디")
    question = models.TextField("질문")

    # 리포트에서 세는 값은 컬럼으로 꺼낸다 — analysis 는 원본 보관
    openness = models.CharField("개방도", max_length=2, choices=OPENNESS_CHOICES)
    stage = models.CharField("단계", max_length=2, choices=STAGE_CHOICES)
    six_why = models.FloatField("왜", default=0)
    six_context = models.FloatField("맥락", default=0)
    six_constraint = models.FloatField("제약", default=0)
    six_criteria = models.FloatField("기준", default=0)
    six_verify = models.FloatField("확인", default=0)
    six_discard = models.FloatField("버릴 것", default=0)
    analysis = models.JSONField("분석 원본", default=dict)

    role = models.CharField("AI의 자리", max_length=12, choices=ROLE_CHOICES, null=True, blank=True)
    chip_used = models.CharField("누른 칩", max_length=6, choices=CHIP_CHOICES, null=True, blank=True)
    source = models.CharField("답 출처", max_length=6, choices=[("claude", "Claude"), ("local", "로컬")])
    llm_call = models.ForeignKey("llm.LLMCall", on_delete=models.SET_NULL, null=True, blank=True, related_name="+", verbose_name="Claude 호출")
    created_at = models.DateTimeField("시각", auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = verbose_name_plural = "턴 (유효 질문)"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["project", "window_index"], name="idx_turn_project_window"),
            models.Index(fields=["student", "created_at"], name="idx_turn_student_time"),
        ]

    def __str__(self):
        return f"Q{self.n} {self.question[:30]}"

    @property
    def six(self) -> dict:
        return {k: getattr(self, f"six_{k}") for k in SIX_KEYS}

    @six.setter
    def six(self, value: dict) -> None:
        for k in SIX_KEYS:
            setattr(self, f"six_{k}", float(value.get(k, 0)))

    @property
    def concepts(self) -> list[str]:
        return self.analysis.get("concepts", [])


class ReverseQuestion(models.Model):
    """역질문 — 마디(2문)마다 학생이 방금의 설계를 '진짜 아는지' 확인한다."""

    STATUS_CHOICES = [("open", "열림"), ("answered", "답함"), ("later", "나중에")]

    id = models.CharField(primary_key=True, max_length=40, default=ids.rq_id, editable=False)
    project = models.ForeignKey("projects.Project", on_delete=models.CASCADE, related_name="rqs", verbose_name="프로젝트")
    turn = models.ForeignKey(Turn, on_delete=models.CASCADE, related_name="rqs", verbose_name="뒤따른 턴")
    window_index = models.PositiveIntegerField("리포트 구간")
    bar_index = models.PositiveIntegerField("마디")
    element = models.CharField("평가 요소", max_length=8, db_index=True)
    pack = models.CharField("팩", max_length=8, blank=True)
    form = models.CharField("형태", max_length=2, choices=FORM_CHOICES)
    axis = models.CharField("축", max_length=4, choices=AXIS_CHOICES, blank=True)
    question = models.TextField("물음")
    benefit = models.CharField("답하면 세지는 것", max_length=300, blank=True)
    options = models.JSONField("보기", null=True, blank=True)
    hint = models.TextField("힌트", blank=True)
    example = models.TextField("예", blank=True)
    coach_view = models.TextField("코치의 관점", blank=True)
    expected_points = models.JSONField("기대 요소", default=list, blank=True)
    selection_scores = models.JSONField("선택 점수", default=dict, blank=True)

    status = models.CharField("상태", max_length=8, choices=STATUS_CHOICES, default="open")
    hint_stage = models.PositiveSmallIntegerField("힌트 단계", default=0)
    answer = models.TextField("학생 답", blank=True)
    score = models.PositiveSmallIntegerField("점수(0~3)", null=True, blank=True)
    reason = models.CharField("채점 근거", max_length=300, blank=True)
    feedback = models.TextField("피드백", blank=True)
    refine_call = models.ForeignKey("llm.LLMCall", on_delete=models.SET_NULL, null=True, blank=True, related_name="+", verbose_name="다듬기 호출")
    grade_call = models.ForeignKey("llm.LLMCall", on_delete=models.SET_NULL, null=True, blank=True, related_name="+", verbose_name="채점 호출")
    created_at = models.DateTimeField("시각", auto_now_add=True)
    answered_at = models.DateTimeField("답한 시각", null=True, blank=True)

    class Meta:
        verbose_name = verbose_name_plural = "역질문"
        ordering = ["created_at"]
        indexes = [models.Index(fields=["project", "element", "status"], name="idx_rq_project_element")]
        constraints = [
            # 열린 역질문은 프로젝트마다 하나뿐
            models.UniqueConstraint(fields=["project"], condition=Q(status="open"), name="uniq_open_rq_per_project"),
        ]

    def __str__(self):
        return f"{self.element} {self.form} · {self.question[:30]}"
