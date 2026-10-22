from rest_framework import serializers

from .models import Report
from .services.sections import report_range, sections_of


class ReportSummarySerializer(serializers.ModelSerializer):
    title = serializers.CharField(read_only=True)
    range = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = ["id", "seq", "title", "headline", "range", "opened", "created_at"]

    def get_range(self, obj: Report):
        return report_range(obj)


class ReportSerializer(ReportSummarySerializer):
    turn_range = serializers.SerializerMethodField()
    sections = serializers.SerializerMethodField()
    project_id = serializers.CharField(read_only=True)

    class Meta(ReportSummarySerializer.Meta):
        fields = ["id", "project_id", "seq", "title", "headline", "range", "turn_range", "sections", "opened", "imported", "created_at"]

    def get_turn_range(self, obj: Report):
        return [obj.turn_from, obj.turn_to]

    def get_sections(self, obj: Report):
        return sections_of(obj)


class MissionEditSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=300)


class ReportPatchSerializer(serializers.Serializer):
    opened = serializers.BooleanField(required=False)
    next_mission = MissionEditSerializer(required=False)
