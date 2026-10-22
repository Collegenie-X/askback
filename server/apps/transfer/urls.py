from django.urls import path

from .views import ImportLocalView

urlpatterns = [path("import/local", ImportLocalView.as_view(), name="import-local")]
