from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.idempotency import Idempotency
from apps.common.pagination import CursorPage
from apps.common.throttling import TurnRateThrottle
from apps.projects.permissions import my_project
from apps.projects.serializers import MessageSerializer, NoteSerializer
from apps.reports.serializers import ReportSummarySerializer

from . import serializers as s
from .engine import pipeline
from .models import ReverseQuestion, Turn


def _my_rq(request, pk: str) -> ReverseQuestion:
    qs = ReverseQuestion.objects.select_related("project").filter(project__student=request.user, project__deleted_at__isnull=True)
    return get_object_or_404(qs, pk=pk)


def _turn_payload(r: pipeline.TurnResult) -> dict:
    data = {
        "outcome": r.outcome,
        "user_message": MessageSerializer(r.user_message).data,
        "coach_messages": MessageSerializer(r.coach_messages, many=True).data,
    }
    if r.outcome != "answered":
        data["reason"] = r.reason
        return data
    p = r.project
    turns = p.turns.count()
    return {
        **data,
        "turn": s.TurnSerializer(r.turn).data,
        "answer": MessageSerializer(r.answer).data,
        "rq": s.ReverseQuestionSerializer(r.rq).data if r.rq else None,
        "report": ReportSummarySerializer(r.report).data if r.report else None,
        "project": {
            "counter": p.counter,
            "bar_index": p.bar_index,
            "later_streak": p.later_streak,
            "turns_in_window": max(0, turns - p.reports.count() * 10) % 10,
        },
        "me": {"valid_count": r.student.valid_count},
    }


class TurnListView(ListAPIView):
    """GET 이 프로젝트의 턴 (?window=1 로 리포트 구간만) · POST 질문 하나 보내기"""

    serializer_class = s.TurnSerializer
    pagination_class = CursorPage

    def get_throttles(self):
        return [TurnRateThrottle()] if self.request.method == "POST" else super().get_throttles()

    def get_queryset(self):
        qs = my_project(self.request, self.kwargs["pk"]).turns.all()
        window = self.request.query_params.get("window")
        return qs.filter(window_index=int(window)) if window and window.isdigit() else qs

    def post(self, request, pk):
        project = my_project(request, pk)
        idem = Idempotency(request)
        if (cached := idem.replay()) is not None:
            return cached
        data = s.TurnCreateSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        v = data.validated_data
        result = pipeline.run_turn(request.user, project, v["text"], v.get("chip"), v.get("images"))
        code = status.HTTP_201_CREATED if result.outcome == "answered" else status.HTTP_200_OK
        return idem.save(Response(_turn_payload(result), status=code))


class TurnDetailView(APIView):
    def get(self, request, pk):
        turn = get_object_or_404(Turn.objects.filter(student=request.user, project__deleted_at__isnull=True), pk=pk)
        return Response(s.TurnSerializer(turn).data)


class ProjectRQListView(ListAPIView):
    serializer_class = s.ReverseQuestionSerializer
    pagination_class = CursorPage

    def get_queryset(self):
        qs = my_project(self.request, self.kwargs["pk"]).rqs.all()
        st = self.request.query_params.get("status")
        return qs.filter(status=st) if st else qs


class AskMeView(APIView):
    def post(self, request, pk):
        rq, msg = pipeline.ask_me(request.user, my_project(request, pk))
        return Response({"rq": s.ReverseQuestionSerializer(rq).data if rq else None, "message": MessageSerializer(msg).data})


class RQDetailView(APIView):
    def get(self, request, pk):
        return Response(s.ReverseQuestionSerializer(_my_rq(request, pk)).data)


class RQAnswerView(APIView):
    def post(self, request, pk):
        rq = _my_rq(request, pk)
        data = s.RQAnswerSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        rq, msg = pipeline.answer_rq(request.user, rq, data.validated_data.get("text"), data.validated_data.get("option_index"))
        return Response({"rq": s.ReverseQuestionSerializer(rq).data, "coach_message": MessageSerializer(msg).data})


class RQHintView(APIView):
    def post(self, request, pk):
        rq, hint = pipeline.hint_rq(_my_rq(request, pk))
        return Response({"rq": s.ReverseQuestionSerializer(rq).data, "hint": hint})


class RQLaterView(APIView):
    def post(self, request, pk):
        rq, msg = pipeline.later_rq(_my_rq(request, pk))
        return Response({"rq": s.ReverseQuestionSerializer(rq).data, "coach_message": MessageSerializer(msg).data if msg else None})


class RQIdkView(APIView):
    def post(self, request, pk):
        rq, msg = pipeline.idk_rq(request.user, _my_rq(request, pk))
        return Response({"rq": s.ReverseQuestionSerializer(rq).data, "coach_message": MessageSerializer(msg).data})


class DeepOpenView(APIView):
    def post(self, request, pk):
        return Response({"message": MessageSerializer(pipeline.deep_open(my_project(request, pk))).data})


class DeepAskView(APIView):
    def post(self, request, pk):
        data = s.DeepAskSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        msg = pipeline.deep_ask(my_project(request, pk), data.validated_data["lens"], data.validated_data["level"])
        return Response({"message": MessageSerializer(msg).data})


class DeepAnswerView(APIView):
    def post(self, request, pk):
        data = s.DeepAnswerSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        v = data.validated_data
        note, msg, nxt = pipeline.deep_answer(request.user, my_project(request, pk), v["lens"], v["level"], v["text"])
        return Response({"note": NoteSerializer(note).data, "coach_message": MessageSerializer(msg).data, "next_question": nxt})
