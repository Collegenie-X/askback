from django.contrib import admin

from .models import IdempotencyKey


@admin.register(IdempotencyKey)
class IdempotencyKeyAdmin(admin.ModelAdmin):
    list_display = ("key", "student", "status_code", "created_at")
    list_filter = ("status_code",)
    search_fields = ("key", "student__nickname")
    readonly_fields = ("student", "key", "request_hash", "status_code", "response", "created_at")

    def has_add_permission(self, request):
        return False
