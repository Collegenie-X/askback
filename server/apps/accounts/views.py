from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.throttling import DeviceIssueThrottle

from . import serializers as s
from .models import Device, Goal, Student
from .tokens import issue_device


class DeviceView(APIView):
    """POST: 익명 기기 토큰 발급(학생도 같이 만든다) · DELETE: 지금 기기 로그아웃."""

    def get_permissions(self):
        return [AllowAny()] if self.request.method == "POST" else super().get_permissions()

    def get_throttles(self):
        return [DeviceIssueThrottle()] if self.request.method == "POST" else super().get_throttles()

    def post(self, request):
        data = s.DeviceIssueSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        with transaction.atomic():
            student = Student.objects.create(**data.validated_data)
            token = issue_device(student, request.META.get("HTTP_USER_AGENT", ""))
        return Response({"token": token, "user": s.StudentSerializer(student).data}, status=status.HTTP_201_CREATED)

    def delete(self, request):
        if isinstance(request.auth, Device):
            Device.objects.filter(pk=request.auth.pk).update(revoked_at=timezone.now())
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    def get(self, request):
        return Response(s.StudentSerializer(request.user).data)

    def patch(self, request):
        data = s.StudentUpdateSerializer(request.user, data=request.data, partial=True)
        data.is_valid(raise_exception=True)
        student = data.save()
        return Response(s.StudentSerializer(student).data)

    def delete(self, request):
        """전부 지우기 — 학생의 모든 기록을 즉시 삭제. Claude 호출 기록은 익명 통계로만 남는다."""
        request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ExportView(APIView):
    """내 데이터 전부 — 브라우저의 exportAll() 과 같은 구성."""

    def get(self, request):
        from apps.transfer.services import export_student

        return Response(export_student(request.user))


class GoalListView(APIView):
    def get(self, request):
        return Response(s.GoalSerializer(request.user.goals.all(), many=True).data)


class GoalDetailView(APIView):
    def put(self, request, ym: str):
        s.validate_ym(ym)
        data = s.GoalSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        goal, _ = Goal.objects.update_or_create(student=request.user, ym=ym, defaults={"text": data.validated_data["text"]})
        return Response(s.GoalSerializer(goal).data)

    def delete(self, request, ym: str):
        Goal.objects.filter(student=request.user, ym=ym).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
