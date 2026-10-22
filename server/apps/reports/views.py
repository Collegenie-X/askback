from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.serializers import validate_ym
from apps.projects.permissions import my_project

from . import serializers as s
from .models import Report
from .services.markdown import report_to_md
from .services.monthly import build_monthly, monthly_to_md


def _my_report(request, pk: str) -> Report:
    qs = Report.objects.select_related("project").filter(project__student=request.user, project__deleted_at__isnull=True)
    return get_object_or_404(qs, pk=pk)


def _markdown(text: str, filename: str) -> HttpResponse:
    response = HttpResponse(text, content_type="text/markdown; charset=utf-8")
    response["Content-Disposition"] = f"inline; filename*=UTF-8''{filename}"
    return response


class ProjectReportListView(ListAPIView):
    serializer_class = s.ReportSummarySerializer
    pagination_class = None

    def get_queryset(self):
        return my_project(self.request, self.kwargs["pk"]).reports.select_related("project").order_by("seq")


class ReportDetailView(APIView):
    def get(self, request, pk):
        return Response(s.ReportSerializer(_my_report(request, pk)).data)

    def patch(self, request, pk):
        report = _my_report(request, pk)
        data = s.ReportPatchSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        v = data.validated_data
        if "opened" in v:
            report.opened = v["opened"]
        if "next_mission" in v:
            report.next_mission = {**report.next_mission, "text": v["next_mission"]["text"], "edited_by_student": True}
        report.save(update_fields=["opened", "next_mission"])
        return Response(s.ReportSerializer(report).data)


class ReportMarkdownView(APIView):
    def get(self, request, pk):
        report = _my_report(request, pk)
        return _markdown(report_to_md(report, request.user.nickname), f"report-{report.seq}.md")


class MonthlyView(APIView):
    def get(self, request, ym):
        return Response(build_monthly(request.user, validate_ym(ym)))


class MonthlyMarkdownView(APIView):
    def get(self, request, ym):
        mo = build_monthly(request.user, validate_ym(ym))
        return _markdown(monthly_to_md(mo, request.user.nickname), f"monthly-{ym}.md")
