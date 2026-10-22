from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import Device, Student
from apps.common.testing import make_project, student_client


class AuthTests(TestCase):
    def test_device_issue_and_me(self):
        client, user = student_client()
        self.assertTrue(user["id"].startswith("usr_"))
        me = client.get("/api/v1/me").json()["data"]
        self.assertEqual(me["nickname"], "민준")
        self.assertEqual(me["usage"]["today"]["limit"], 60)
        self.assertFalse(Device.objects.filter(token_hash__startswith="abk_").exists())  # 원문은 저장하지 않는다

    def test_missing_or_bad_token_is_401_envelope(self):
        res = APIClient().get("/api/v1/me")
        self.assertEqual(res.status_code, 401)
        self.assertEqual(res.json()["error"]["code"], "UNAUTHORIZED")
        bad = APIClient(HTTP_AUTHORIZATION="Bearer nope").get("/api/v1/me")
        self.assertEqual(bad.status_code, 401)

    def test_logout_revokes_token(self):
        client, _ = student_client()
        self.assertEqual(client.delete("/api/v1/auth/device").status_code, 204)
        self.assertEqual(client.get("/api/v1/me").status_code, 401)

    def test_patch_me_and_current_project_must_be_mine(self):
        client, _ = student_client()
        other, _ = student_client("지민")
        theirs = make_project(other)
        res = client.patch("/api/v1/me", {"introSeen": True, "currentProjectId": theirs["id"]}, format="json")
        self.assertEqual(res.status_code, 422)
        ok = client.patch("/api/v1/me", {"introSeen": True, "nickname": "민준이"}, format="json").json()["data"]
        self.assertTrue(ok["introSeen"])
        self.assertEqual(ok["nickname"], "민준이")

    def test_goals_crud(self):
        client, _ = student_client()
        self.assertEqual(client.put("/api/v1/me/goals/2026-13", {"text": "x"}, format="json").status_code, 422)
        client.put("/api/v1/me/goals/2026-10", {"text": "열린 질문 5번"}, format="json")
        self.assertEqual(client.get("/api/v1/me/goals").json()["data"][0]["ym"], "2026-10")
        client.delete("/api/v1/me/goals/2026-10")
        self.assertEqual(client.get("/api/v1/me/goals").json()["data"], [])

    def test_delete_me_removes_everything(self):
        client, user = student_client()
        make_project(client)
        self.assertEqual(client.delete("/api/v1/me").status_code, 204)
        self.assertFalse(Student.objects.filter(pk=user["id"]).exists())


class ProjectTests(TestCase):
    def setUp(self):
        self.client, _ = student_client()

    def test_create_project_greets_with_format_intro(self):
        res = self.client.post("/api/v1/projects", {"name": "스마트 화분", "format": "product", "packs": ["maker", "maker"]}, format="json")
        data = res.json()["data"]
        self.assertEqual(data["project"]["packs"], ["maker"])
        self.assertEqual(data["project"]["progress"]["draft"]["total"], 4)
        self.assertIn("제품", data["messages"][0]["md"])

    def test_checks_plan_soft_delete_restore(self):
        p = make_project(self.client)
        base = f"/api/v1/projects/{p['id']}"
        self.assertEqual(self.client.put(f"{base}/checks/nope", {"text": "x"}, format="json").status_code, 422)
        out = self.client.put(f"{base}/checks/scenario", {"text": "흙이 320 밑이면 3초 급수"}, format="json").json()["data"]
        self.assertEqual(out["progress"]["draft"]["done"], 1)
        plan = self.client.put(f"{base}/plan", {"md": "# 기획서\n\n## 알고리즘"}, format="json").json()["data"]
        self.assertEqual(plan["filename"], "스마트 화분_기획서.md")

        self.assertEqual(self.client.patch(base, {"format": "service"}, format="json").json()["data"]["checks"], {})
        self.assertEqual(self.client.delete(base).status_code, 204)
        self.assertEqual(self.client.get(base).status_code, 404)
        self.assertEqual(self.client.get("/api/v1/projects").json()["data"], [])
        self.assertEqual(self.client.post(f"{base}/restore").status_code, 200)
        self.assertEqual(len(self.client.get("/api/v1/projects").json()["data"]), 1)

    def test_rhythm_change_resets_counter(self):
        p = make_project(self.client)
        bad = self.client.patch(f"/api/v1/projects/{p['id']}", {"rhythm": 5}, format="json")
        self.assertEqual(bad.status_code, 422)
        ok = self.client.patch(f"/api/v1/projects/{p['id']}", {"rhythm": 3}, format="json").json()["data"]
        self.assertEqual(ok["rhythm"], 3)
