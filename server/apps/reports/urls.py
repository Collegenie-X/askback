from django.urls import path

from . import views

# ".md" 주소를 먼저 둔다 — <str:pk> 가 점까지 삼키기 때문
urlpatterns = [
    path("projects/<str:pk>/reports", views.ProjectReportListView.as_view(), name="project-reports"),
    path("reports/<str:pk>.md", views.ReportMarkdownView.as_view(), name="report-md"),
    path("reports/<str:pk>", views.ReportDetailView.as_view(), name="report-detail"),
    path("monthly/<str:ym>.md", views.MonthlyMarkdownView.as_view(), name="monthly-md"),
    path("monthly/<str:ym>", views.MonthlyView.as_view(), name="monthly"),
]
