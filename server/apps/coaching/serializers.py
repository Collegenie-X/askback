from rest_framework import serializers

from apps.common.catalog import CHIP_KINDS, LENSES

from .models import ReverseQuestion, Turn


class TurnSerializer(serializers.ModelSerializer):
    analysis = serializers.SerializerMethodField()

    class Meta:
        model = Turn
        fields = ["id", "n", "window_index", "bar_index", "question", "analysis", "role", "chip_used", "source", "created_at"]

    def get_analysis(self, obj: Turn):
        a = obj.analysis
        return {
            "openness": obj.openness,
            "stage": obj.stage,
            "six": obj.six,
            "concepts": a.get("concepts", []),
            "urgent": a.get("urgent", False),
            "context_load": a.get("context_load", 0),
        }


class ReverseQuestionSerializer(serializers.ModelSerializer):
    """학생에게 보내는 역질문. 힌트 3단은 단계가 열린 만큼만 보여준다."""

    hints = serializers.SerializerMethodField()

    class Meta:
        model = ReverseQuestion
        fields = [
            "id", "element", "axis", "form", "question", "benefit", "options", "status", "hint_stage", "hints",
            "answer", "score", "feedback", "created_at", "answered_at",
        ]

    def get_hints(self, obj: ReverseQuestion):
        stages = [obj.hint, obj.example, obj.coach_view]
        return [h for h in stages[: obj.hint_stage] if h]


class TurnCreateSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=4000, trim_whitespace=True)
    chip = serializers.ChoiceField(choices=CHIP_KINDS, required=False, allow_null=True)
    images = serializers.ListField(child=serializers.CharField(max_length=2_100_000), required=False, max_length=3)
    client_message_id = serializers.CharField(max_length=64, required=False)

    def validate_images(self, value):
        for url in value:
            if not url.startswith("data:image/"):
                raise serializers.ValidationError("사진은 data:image/… 형식이어야 해.")
        return value


class RQAnswerSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=2000, required=False, allow_blank=False)
    option_index = serializers.IntegerField(required=False, min_value=0)

    def validate(self, attrs):
        if attrs.get("text") is None and attrs.get("option_index") is None:
            raise serializers.ValidationError("text 나 optionIndex 중 하나는 보내 줘.")
        return attrs


class DeepAskSerializer(serializers.Serializer):
    lens = serializers.ChoiceField(choices=LENSES)
    level = serializers.IntegerField(min_value=0, max_value=3)


class DeepAnswerSerializer(DeepAskSerializer):
    text = serializers.CharField(max_length=2000)
