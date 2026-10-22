from django.contrib import admin
from django.db.models import Count, Q
from django.utils import timezone

from .models import Device, Goal, Student


class DeviceInline(admin.TabularInline):
    model = Device
    extra = 0
    fields = ("user_agent", "created_at", "last_seen_at", "revoked_at")
    readonly_fields = fields
    can_delete = False
    show_change_link = True


class GoalInline(admin.TabularInline):
    model = Goal
    extra = 0
    fields = ("ym", "text")


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("nickname", "grade", "project_count", "valid_count", "idk_count", "device_count", "created_at")
    list_filter = ("grade", "intro_seen", "created_at")
    search_fields = ("id", "nickname")
    readonly_fields = ("id", "valid_count", "idk_count", "created_at", "updated_at")
    fields = ("id", "nickname", "grade", "interests", "current_project", "intro_seen", "valid_count", "idk_count", "created_at", "updated_at")
    raw_id_fields = ("current_project",)
    inlines = [DeviceInline, GoalInline]

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            _projects=Count("projects", filter=Q(projects__deleted_at__isnull=True), distinct=True),
            _devices=Count("devices", filter=Q(devices__revoked_at__isnull=True), distinct=True),
        )

    @admin.display(description="프로젝트", ordering="_projects")
    def project_count(self, obj):
        return obj._projects

    @admin.display(description="기기", ordering="_devices")
    def device_count(self, obj):
        return obj._devices


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ("student", "user_agent", "created_at", "last_seen_at", "is_active")
    list_filter = ("revoked_at",)
    search_fields = ("student__nickname", "user_agent")
    readonly_fields = ("id", "student", "token_hash", "user_agent", "created_at", "last_seen_at")
    actions = ["revoke"]

    def has_add_permission(self, request):
        return False  # 토큰 원문을 보여줄 곳이 없으니 관리 화면에서는 만들지 않는다 (issue_token 명령을 쓴다)

    @admin.display(description="사용 중", boolean=True)
    def is_active(self, obj):
        return obj.revoked_at is None

    @admin.action(description="선택한 기기 토큰 폐기")
    def revoke(self, request, queryset):
        n = queryset.filter(revoked_at__isnull=True).update(revoked_at=timezone.now())
        self.message_user(request, f"{n}개 토큰을 폐기했어요.")


@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ("student", "ym", "text", "updated_at")
    list_filter = ("ym",)
    search_fields = ("student__nickname", "text")
