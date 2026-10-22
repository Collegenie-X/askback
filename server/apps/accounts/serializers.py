import re

from django.conf import settings
from django.utils import timezone
from rest_framework import serializers

from .models import Goal, Student

YM_RE = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")


class InterestsField(serializers.ListField):
    child = serializers.CharField(max_length=20)

    def __init__(self, **kwargs):
        kwargs.setdefault("max_length", 10)
        kwargs.setdefault("required", False)
        super().__init__(**kwargs)


class StudentSerializer(serializers.ModelSerializer):
    current_project_id = serializers.CharField(read_only=True, allow_null=True)
    usage = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = ["id", "nickname", "grade", "interests", "valid_count", "idk_count", "current_project_id", "intro_seen", "usage", "created_at"]

    def get_usage(self, obj: Student):
        from apps.coaching.models import Turn

        today = timezone.localdate()
        turns = Turn.objects.filter(student=obj, created_at__date=today).count()
        return {"today": {"turns": turns, "limit": settings.ASKBACK["DAILY_TURN_LIMIT"]}}


class DeviceIssueSerializer(serializers.Serializer):
    nickname = serializers.CharField(min_length=1, max_length=20)
    grade = serializers.CharField(max_length=10, required=False, allow_blank=True, default="")
    interests = InterestsField()


class StudentUpdateSerializer(serializers.ModelSerializer):
    interests = InterestsField()
    current_project_id = serializers.CharField(required=False, allow_null=True)

    class Meta:
        model = Student
        fields = ["nickname", "grade", "interests", "intro_seen", "current_project_id"]
        extra_kwargs = {"nickname": {"required": False, "min_length": 1}}

    def validate_current_project_id(self, value):
        if value is None:
            return None
        from apps.projects.models import Project

        if not Project.objects.alive().filter(pk=value, student=self.instance).exists():
            raise serializers.ValidationError("내 프로젝트가 아니야.")
        return value

    def update(self, instance, validated_data):
        if "current_project_id" in validated_data:
            instance.current_project_id = validated_data.pop("current_project_id")
        return super().update(instance, validated_data)


class GoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Goal
        fields = ["ym", "text", "updated_at"]
        read_only_fields = ["ym", "updated_at"]


def validate_ym(ym: str) -> str:
    if not YM_RE.match(ym):
        raise serializers.ValidationError({"ym": "YYYY-MM 형식이어야 해."})
    return ym
