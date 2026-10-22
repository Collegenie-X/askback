from django.contrib import admin
from django.db.models import Avg, Count, Q, Sum

from .models import LLMCall


@admin.register(LLMCall)
class LLMCallAdmin(admin.ModelAdmin):
    list_display = ("created_at", "task", "status", "model", "effort", "input_tokens", "output_tokens", "cache_read_tokens", "latency_ms", "student")
    list_filter = ("task", "status", "model", "effort", "prompt_version")
    search_fields = ("id", "student__nickname", "project__name", "error_code")
    date_hierarchy = "created_at"
    readonly_fields = [f.name for f in LLMCall._meta.fields]
    list_select_related = ("student",)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        """목록 위에 지금 필터 기준 합계 — 토큰 · 캐시 적중률 · 평균 지연 · 실패율."""
        response = super().changelist_view(request, extra_context)
        try:
            qs = response.context_data["cl"].queryset
        except (AttributeError, KeyError):
            return response
        agg = qs.aggregate(
            calls=Count("id"),
            failed=Count("id", filter=~Q(status="ok")),
            input=Sum("input_tokens"),
            output=Sum("output_tokens"),
            cache_read=Sum("cache_read_tokens"),
            latency=Avg("latency_ms"),
        )
        total_in = (agg["input"] or 0) + (agg["cache_read"] or 0)
        response.context_data["summary"] = {
            **agg,
            "cache_rate": round(100 * (agg["cache_read"] or 0) / total_in, 1) if total_in else 0,
            "fail_rate": round(100 * agg["failed"] / agg["calls"], 1) if agg["calls"] else 0,
            "latency": round(agg["latency"] or 0),
        }
        return response
