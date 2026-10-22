from django.contrib import admin
from django.urls import include, path

admin.site.site_header = "AskBack 관리자"
admin.site.site_title = "AskBack 관리자"
admin.site.index_title = "학생 · 프로젝트 · 코칭 기록 · Claude 호출"

api_v1 = [
    path("", include("apps.llm.urls")),
    path("", include("apps.accounts.urls")),
    path("", include("apps.projects.urls")),
    path("", include("apps.coaching.urls")),
    path("", include("apps.reports.urls")),
    path("", include("apps.transfer.urls")),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include(api_v1)),
]
