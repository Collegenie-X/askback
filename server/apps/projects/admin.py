from django.contrib import admin
from django.db.models import Count
from django.utils import timezone
from django.utils.html import format_html

from apps.coaching.models import Turn
from apps.reports.models import Report

from .models import Message, Note, Project


class TurnInline(admin.TabularInline):
    model = Turn
    extra = 0
    fields = ("n", "question", "openness", "stage", "role", "source", "created_at")
    readonly_fields = fields
    can_delete = False
    show_change_link = True
    ordering = ("-created_at",)


class ReportInline(admin.TabularInline):
    model = Report
    extra = 0
    fields = ("seq", "headline", "stage", "opened", "created_at")
    readonly_fields = fields
    can_delete = False
    show_change_link = True


class DeletedFilter(admin.SimpleListFilter):
    title = "지운 프로젝트"
    parameter_name = "deleted"

    def lookups(self, request, model_admin):
        return [("no", "살아 있음"), ("yes", "지움")]

    def queryset(self, request, queryset):
        if self.value() == "no":
            return queryset.filter(deleted_at__isnull=True)
        if self.value() == "yes":
            return queryset.filter(deleted_at__isnull=False)
        return queryset


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("label", "student", "format", "rhythm_dots", "turn_count", "report_count", "is_example", "is_alive", "updated_at")
    list_filter = (DeletedFilter, "format", "rhythm", "is_example", "answer_only")
    search_fields = ("id", "name", "description", "student__nickname")
    list_select_related = ("student",)
    readonly_fields = ("id", "counter", "bar_index", "later_streak", "created_at", "updated_at", "deleted_at")
    raw_id_fields = ("student",)
    fieldsets = (
        (None, {"fields": ("id", "student", "emoji", "name", "description", "format", "packs", "is_example")}),
        ("리듬 (서버가 바꾼다)", {"fields": ("rhythm", "answer_only", "counter", "bar_index", "later_streak")}),
        ("초안 · 기획서", {"fields": ("checks", "plan_filename", "plan_md")}),
        ("기록", {"fields": ("created_at", "updated_at", "deleted_at")}),
    )
    inlines = [ReportInline, TurnInline]
    actions = ["soft_delete", "restore"]

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(_turns=Count("turns", distinct=True), _reports=Count("reports", distinct=True))

    @admin.display(description="프로젝트", ordering="name")
    def label(self, obj):
        return f"{obj.emoji} {obj.name}"

    @admin.display(description="리듬")
    def rhythm_dots(self, obj):
        return "●" * obj.counter + "○" * max(0, obj.rhythm - obj.counter)

    @admin.display(description="질문", ordering="_turns")
    def turn_count(self, obj):
        return obj._turns

    @admin.display(description="리포트", ordering="_reports")
    def report_count(self, obj):
        return obj._reports

    @admin.display(description="살아 있음", boolean=True)
    def is_alive(self, obj):
        return obj.deleted_at is None

    @admin.action(description="선택한 프로젝트 지우기 (30일 안에 복구 가능)")
    def soft_delete(self, request, queryset):
        n = queryset.filter(deleted_at__isnull=True).update(deleted_at=timezone.now())
        self.message_user(request, f"{n}개 프로젝트를 지웠어요.")

    @admin.action(description="선택한 프로젝트 되살리기")
    def restore(self, request, queryset):
        n = queryset.filter(deleted_at__isnull=False).update(deleted_at=None)
        self.message_user(request, f"{n}개 프로젝트를 되살렸어요.")


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("created_at", "kind", "preview_text", "project")
    list_filter = ("kind", "created_at")
    search_fields = ("project__name", "body")
    list_select_related = ("project",)
    readonly_fields = ("id", "project", "kind", "turn", "rq", "created_at", "body_pretty")
    exclude = ("body",)
    date_hierarchy = "created_at"

    def has_add_permission(self, request):
        return False

    @admin.display(description="내용")
    def preview_text(self, obj):
        return obj.preview

    @admin.display(description="내용 원본")
    def body_pretty(self, obj):
        from apps.coaching.admin import pretty_json

        return pretty_json(obj.body)


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ("created_at", "lens", "level_label", "short_text", "project")
    list_filter = ("lens", "level")
    search_fields = ("text", "project__name")
    list_select_related = ("project",)

    @admin.display(description="깊이", ordering="level")
    def level_label(self, obj):
        return "확장" if obj.level >= 3 else f"L{obj.level + 1}"

    @admin.display(description="학생의 말")
    def short_text(self, obj):
        return format_html("{}", obj.text[:60])
