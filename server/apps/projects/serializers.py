from rest_framework import serializers

from apps.common import catalog

from .models import Message, Note, Project
from .services.drafts import draft_progress


class ProjectSerializer(serializers.ModelSerializer):
    plan = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id", "name", "description", "emoji", "packs", "format", "rhythm", "answer_only",
            "counter", "bar_index", "later_streak", "checks", "plan", "progress", "is_example",
            "created_at", "updated_at",
        ]

    def get_plan(self, obj: Project):
        return {"filename": obj.plan_filename, "md": obj.plan_md} if obj.plan_md else None

    def get_progress(self, obj: Project):
        turns = obj.turns.count()
        reports = obj.reports.count()
        return {"turns_in_window": max(0, turns - reports * 10) % 10, "reports_count": reports, "draft": draft_progress(obj)}


class ProjectListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name", "emoji", "format", "description", "updated_at"]


class ProjectWriteSerializer(serializers.ModelSerializer):
    packs = serializers.ListField(child=serializers.ChoiceField(choices=catalog.PACKS), required=False, max_length=4)

    class Meta:
        model = Project
        fields = ["name", "description", "emoji", "packs", "format", "rhythm", "answer_only"]
        extra_kwargs = {"name": {"min_length": 1}, "format": {"allow_blank": True}}

    def validate_packs(self, value):
        return list(dict.fromkeys(value))  # 중복 제거, 순서 유지


class CheckSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=300)


class PlanSerializer(serializers.Serializer):
    filename = serializers.CharField(max_length=100, required=False, allow_blank=True)
    md = serializers.CharField(max_length=100_000, allow_blank=True, trim_whitespace=False)


class MessageSerializer(serializers.ModelSerializer):
    """body 를 펼쳐서 한 겹으로 돌려준다. kind=rq 면 역질문 내용도 같이 싣는다."""

    class Meta:
        model = Message
        fields = ["id", "kind", "created_at"]

    def to_representation(self, obj: Message):
        out = {"id": obj.id, "kind": obj.kind, **obj.body, "created_at": serializers.DateTimeField().to_representation(obj.created_at)}
        if obj.turn_id:
            out["turn_id"] = obj.turn_id
        if obj.rq_id:
            from apps.coaching.serializers import ReverseQuestionSerializer

            out["rq_id"] = obj.rq_id
            if obj.rq is not None:
                out["rq"] = ReverseQuestionSerializer(obj.rq).data
        return out


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ["id", "lens", "level", "question", "text", "created_at"]
        read_only_fields = ["id", "lens", "level", "question", "created_at"]
