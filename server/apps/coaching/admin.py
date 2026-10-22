import json

from django.contrib import admin
from django.utils.html import format_html

from apps.common import catalog

from .engine.rq_picker import color_of
from .models import ReverseQuestion, Turn


def pretty_json(value) -> str:
    return format_html("<pre style='white-space:pre-wrap;max-width:900px'>{}</pre>", json.dumps(value, ensure_ascii=False, indent=2))


class RQInline(admin.TabularInline):
    model = ReverseQuestion
    extra = 0
    fields = ("element", "form", "axis", "question", "status", "score", "hint_stage")
    readonly_fields = fields
    can_delete = False
    show_change_link = True


@admin.register(Turn)
class TurnAdmin(admin.ModelAdmin):
    list_display = ("n", "short_question", "project", "openness", "stage", "six_count", "role", "source", "created_at")
    list_filter = ("openness", "stage", "role", "source", "chip_used", "created_at")
    search_fields = ("question", "project__name", "student__nickname")
    list_select_related = ("project",)
    date_hierarchy = "created_at"
    readonly_fields = [f.name for f in Turn._meta.fields if f.name != "analysis"] + ["analysis_pretty"]
    exclude = ("analysis",)
    inlines = [RQInline]

    def has_add_permission(self, request):
        return False  # 턴은 질문으로만 생긴다

    @admin.display(description="질문")
    def short_question(self, obj):
        return obj.question[:50]

    @admin.display(description="6요소")
    def six_count(self, obj):
        got = [catalog.roles()["six"][k]["short"] for k, v in obj.six.items() if v >= 0.5]
        return f"{len(got)} {''.join(got)}"

    @admin.display(description="분석 원본")
    def analysis_pretty(self, obj):
        return pretty_json(obj.analysis)


@admin.register(ReverseQuestion)
class ReverseQuestionAdmin(admin.ModelAdmin):
    list_display = ("element_label", "form", "axis", "short_question", "status", "score_color", "hint_stage", "project", "created_at")
    list_filter = ("status", "form", "axis", "element", "created_at")
    search_fields = ("question", "answer", "project__name")
    list_select_related = ("project",)
    readonly_fields = ("id", "project", "turn", "window_index", "bar_index", "element", "pack", "form", "axis", "selection_scores", "refine_call", "grade_call", "created_at", "answered_at")
    fieldsets = (
        ("물음", {"fields": ("project", "turn", "element", "pack", "form", "axis", "question", "benefit", "options")}),
        ("힌트 3단", {"fields": ("hint", "example", "coach_view", "expected_points")}),
        ("답과 채점", {"fields": ("status", "hint_stage", "answer", "score", "reason", "feedback", "answered_at")}),
        ("기록", {"classes": ("collapse",), "fields": ("id", "window_index", "bar_index", "selection_scores", "refine_call", "grade_call", "created_at")}),
    )

    @admin.display(description="요소", ordering="element")
    def element_label(self, obj):
        el = catalog.element_by_id(obj.element) or {}
        return f"{el.get('icon', '')} {obj.element} {el.get('name', '')}"

    @admin.display(description="물음")
    def short_question(self, obj):
        return obj.question[:50]

    @admin.display(description="판정", ordering="score")
    def score_color(self, obj):
        return color_of(obj.score) if obj.status == "answered" else "➖"
