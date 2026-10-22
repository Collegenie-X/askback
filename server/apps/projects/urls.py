from django.urls import path

from . import views

urlpatterns = [
    path("projects", views.ProjectListView.as_view(), name="project-list"),
    path("projects/<str:pk>", views.ProjectDetailView.as_view(), name="project-detail"),
    path("projects/<str:pk>/restore", views.ProjectRestoreView.as_view(), name="project-restore"),
    path("projects/<str:pk>/checks/<str:key>", views.CheckView.as_view(), name="project-check"),
    path("projects/<str:pk>/plan", views.PlanView.as_view(), name="project-plan"),
    path("projects/<str:pk>/messages", views.MessageListView.as_view(), name="project-messages"),
    path("projects/<str:pk>/notes", views.NoteListView.as_view(), name="project-notes"),
    path("notes/<str:pk>", views.NoteDetailView.as_view(), name="note-detail"),
]
