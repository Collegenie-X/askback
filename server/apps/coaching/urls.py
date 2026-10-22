from django.urls import path

from . import views

urlpatterns = [
    path("projects/<str:pk>/turns", views.TurnListView.as_view(), name="project-turns"),
    path("projects/<str:pk>/rqs", views.ProjectRQListView.as_view(), name="project-rqs"),
    path("projects/<str:pk>/ask-me", views.AskMeView.as_view(), name="project-ask-me"),
    path("projects/<str:pk>/deep/open", views.DeepOpenView.as_view(), name="project-deep-open"),
    path("projects/<str:pk>/deep/ask", views.DeepAskView.as_view(), name="project-deep-ask"),
    path("projects/<str:pk>/deep/answer", views.DeepAnswerView.as_view(), name="project-deep-answer"),
    path("turns/<str:pk>", views.TurnDetailView.as_view(), name="turn-detail"),
    path("rqs/<str:pk>", views.RQDetailView.as_view(), name="rq-detail"),
    path("rqs/<str:pk>/answer", views.RQAnswerView.as_view(), name="rq-answer"),
    path("rqs/<str:pk>/hint", views.RQHintView.as_view(), name="rq-hint"),
    path("rqs/<str:pk>/later", views.RQLaterView.as_view(), name="rq-later"),
    path("rqs/<str:pk>/idk", views.RQIdkView.as_view(), name="rq-idk"),
]
