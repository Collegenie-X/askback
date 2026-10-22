"""관리자 화면 — 모든 목록 · 상세 화면이 실제 데이터로 열리는지."""
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from apps.common.camel import camelize, snakeize
from apps.common.testing import SMARTPOT_Q1, SMARTPOT_Q2, make_project, student_client


class CamelTests(TestCase):
    def test_round_trip_keeps_special_keys(self):
        data = {"turn_n": 1, "mix": {"O1": 2, "NA": 0}, "2026-10": "x", "_doc": 1, "six": {"why": 1}}
        self.assertEqual(camelize(data)["turnN"], 1)
        self.assertEqual(camelize(data)["mix"], {"O1": 2, "NA": 0})
        self.assertEqual(snakeize(camelize(data)), data)


class AdminSmokeTests(TestCase):
    def setUp(self):
        client, _ = student_client()
        p = make_project(client)
        client.post(f"/api/v1/projects/{p['id']}/turns", {"text": SMARTPOT_Q1}, format="json")
        client.post(f"/api/v1/projects/{p['id']}/turns", {"text": SMARTPOT_Q2}, format="json")
        topics = ["펌프", "센서 위치", "서버 구조", "알림 문턱", "전원", "화면 칸", "AI 분류", "친구와 공유"]
        for topic in topics:  # 비슷한 문장은 중복으로 걸러지니 주제를 바꿔 묻는다
            client.post(f"/api/v1/projects/{p['id']}/turns", {"text": f"{topic}은(는) 어떻게 설계하면 좋을까? 목표는 상추가 안 마르는 것이야."}, format="json")
        client.post(f"/api/v1/projects/{p['id']}/deep/answer", {"lens": "sociology", "level": 0, "text": "할머니도 쓸 수 있을까"}, format="json")
        admin_user = get_user_model().objects.create_superuser("admin", "admin@example.com", "pw-12345!")
        self.client.force_login(admin_user)

    def test_every_admin_page_opens(self):
        self.assertEqual(self.client.get(reverse("admin:index")).status_code, 200)
        for model, model_admin in admin.site._registry.items():
            meta = model._meta
            url = reverse(f"admin:{meta.app_label}_{meta.model_name}_changelist")
            self.assertEqual(self.client.get(url).status_code, 200, url)
            obj = model.objects.first()
            if obj is not None:
                change = reverse(f"admin:{meta.app_label}_{meta.model_name}_change", args=[obj.pk])
                self.assertEqual(self.client.get(change).status_code, 200, change)

    def test_report_admin_shows_markdown_preview(self):
        from apps.reports.models import Report

        report = Report.objects.get()
        res = self.client.get(reverse("admin:reports_report_change", args=[report.pk]))
        self.assertContains(res, "## ① 한눈에 보기")
