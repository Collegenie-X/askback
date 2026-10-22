from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.pagination import NewestFirstPage, UpdatedPage

from . import serializers as s
from .models import Project
from .permissions import my_note, my_project
from .services import projects as svc


class ProjectListView(ListAPIView):
    """GET 목록 · POST 만들기"""

    serializer_class = s.ProjectListSerializer
    pagination_class = UpdatedPage

    def get_queryset(self):
        return Project.objects.alive().filter(student=self.request.user)

    def post(self, request):
        data = s.ProjectWriteSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        project, messages = svc.create_project(request.user, **data.validated_data)
        return Response(
            {"project": s.ProjectSerializer(project).data, "messages": s.MessageSerializer(messages, many=True).data},
            status=status.HTTP_201_CREATED,
        )


class ProjectDetailView(APIView):
    def get(self, request, pk):
        return Response(s.ProjectSerializer(my_project(request, pk)).data)

    def patch(self, request, pk):
        project = my_project(request, pk)
        data = s.ProjectWriteSerializer(project, data=request.data, partial=True)
        data.is_valid(raise_exception=True)
        return Response(s.ProjectSerializer(svc.update_project(project, data.validated_data)).data)

    def delete(self, request, pk):
        svc.soft_delete(my_project(request, pk))
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectRestoreView(APIView):
    def post(self, request, pk):
        project = svc.restore(my_project(request, pk, include_deleted=True))
        return Response(s.ProjectSerializer(project).data)


class CheckView(APIView):
    def put(self, request, pk, key):
        data = s.CheckSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        project = svc.set_check(my_project(request, pk), key, data.validated_data["text"])
        return Response(s.ProjectSerializer(project).data)

    def delete(self, request, pk, key):
        svc.clear_check(my_project(request, pk), key)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlanView(APIView):
    def get(self, request, pk):
        project = my_project(request, pk)
        return Response({"filename": project.plan_filename, "md": project.plan_md})

    def put(self, request, pk):
        project = my_project(request, pk)
        data = s.PlanSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        project.plan_md = data.validated_data["md"]
        project.plan_filename = data.validated_data.get("filename") or project.plan_filename or f"{project.name}_기획서.md"
        project.save(update_fields=["plan_md", "plan_filename", "updated_at"])
        return Response({"filename": project.plan_filename, "md": project.plan_md})


class MessageListView(ListAPIView):
    serializer_class = s.MessageSerializer
    pagination_class = NewestFirstPage

    def get_queryset(self):
        return my_project(self.request, self.kwargs["pk"]).messages.select_related("rq")


class NoteListView(ListAPIView):
    serializer_class = s.NoteSerializer
    pagination_class = NewestFirstPage

    def get_queryset(self):
        return my_project(self.request, self.kwargs["pk"]).notes.all()


class NoteDetailView(APIView):
    def patch(self, request, pk):
        note = my_note(request, pk)
        data = s.NoteSerializer(note, data=request.data, partial=True)
        data.is_valid(raise_exception=True)
        return Response(s.NoteSerializer(data.save()).data)

    def delete(self, request, pk):
        my_note(request, pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
