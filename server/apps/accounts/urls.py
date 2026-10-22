from django.urls import path

from . import views

urlpatterns = [
    path("auth/device", views.DeviceView.as_view(), name="auth-device"),
    path("me", views.MeView.as_view(), name="me"),
    path("me/export", views.ExportView.as_view(), name="me-export"),
    path("me/goals", views.GoalListView.as_view(), name="me-goals"),
    path("me/goals/<str:ym>", views.GoalDetailView.as_view(), name="me-goal"),
]
