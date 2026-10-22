from django.contrib import admin
from django.utils.html import format_html

from apps.coaching.admin import pretty_json

from .models import Report
from .services.markdown import report_to_md


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("title", "headline", "stage", "open_questions", "opened", "imported", "created_at")
    list_filter = ("stage", "opened", "imported", "created_at")
    search_fields = ("headline", "project__name", "project__student__nickname")
    list_select_related = ("project",)
    date_hierarchy = "created_at"
    readonly_fields = (
        "id", "project", "seq", "window_index", "turn_from", "turn_to", "stage", "period_from", "period_to",
        "created_at", "legacy_index", "imported", "stats_pretty", "last_mission", "markdown_preview",
    )
    fieldsets = (
        (None, {"fields": ("project", "seq", "headline", "stage", "opened", "next_mission")}),
        ("미리 보기 (.md)", {"fields": ("markdown_preview",)}),
        ("통계 원본", {"classes": ("collapse",), "fields": ("stats_pretty", "last_mission")}),
        ("기록", {"classes": ("collapse",), "fields": ("id", "window_index", "turn_from", "turn_to", "period_from", "period_to", "imported", "legacy_index", "created_at")}),
    )

    def has_add_permission(self, request):
        return False  # 리포트는 10번째 질문이 만든다

    @admin.display(description="열린 질문")
    def open_questions(self, obj):
        mix = obj.stats.get("mix", {})
        return mix.get("O3", 0) + mix.get("O4", 0)

    @admin.display(description="통계")
    def stats_pretty(self, obj):
        return pretty_json(obj.stats)

    @admin.display(description=".md")
    def markdown_preview(self, obj):
        return format_html("<pre style='white-space:pre-wrap;max-width:900px'>{}</pre>", report_to_md(obj, obj.project.student.nickname))
