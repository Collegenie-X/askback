import json
from io import StringIO
from unittest import mock

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.accounts.models import Student
from apps.coaching.models import Turn
from apps.devtools import dummy
from apps.llm.models import LLMCall
from apps.reports.models import Report


@override_settings(DEBUG=True)
class SeedDummyTests(TestCase):
    def run_seed(self, *args):
        out = StringIO()
        with mock.patch.object(dummy, "write_tokens") as write:
            call_command("seed_dummy", *args, stdout=out)
        return out.getvalue(), write.call_args[0][0]

    def test_seed_builds_consistent_data_through_engine(self):
        text, report = self.run_seed("--extra", "2")
        self.assertIn("완료", text)
        self.assertEqual(report.counts["students"], 6)
        smartpot = next(s for s in report.students if s["nickname"] == "민준")
        self.assertEqual(smartpot["turns"], 20)
        self.assertEqual(smartpot["reports"], 2)  # 20문 → 리포트 2장
        self.assertEqual(Report.objects.filter(project_id=smartpot["project_id"], seq=2).count(), 1)
        self.assertTrue(LLMCall.objects.exists())
        # 시각이 지난 30일에 흩어져 있다
        first, last = Turn.objects.order_by("created_at").first(), Turn.objects.order_by("created_at").last()
        self.assertGreater((last.created_at - first.created_at).days, 14)

    def test_tokens_work_against_api(self):
        _, report = self.run_seed("--extra", "0", "--no-llm-calls")
        s = report.students[0]
        client = APIClient(HTTP_AUTHORIZATION=f"Bearer {s['token']}")
        me = client.get("/api/v1/me").json()["data"]
        self.assertEqual(me["nickname"], s["nickname"])
        reports = client.get(f"/api/v1/projects/{s['project_id']}/reports").json()["data"]
        self.assertEqual(len(reports), s["reports"])
        self.assertFalse(LLMCall.objects.exists())

    def test_reset_only_removes_dummy_students(self):
        Student.objects.create(nickname="진짜학생")
        self.run_seed("--extra", "1")
        self.assertEqual(dummy.reset(), 5)
        self.assertEqual(list(Student.objects.values_list("nickname", flat=True)), ["진짜학생"])

    def test_same_seed_gives_same_shape(self):
        _, a = self.run_seed("--extra", "2", "--seed", "3")
        _, b = self.run_seed("--reset", "--extra", "2", "--seed", "3")
        self.assertEqual([(s["turns"], s["reports"]) for s in a.students], [(s["turns"], s["reports"]) for s in b.students])

    def test_admin_flag_creates_superuser_once(self):
        from django.contrib.auth import get_user_model

        self.run_seed("--extra", "0", "--admin")
        self.assertTrue(get_user_model().objects.get(username="admin").is_superuser)
        text, _ = self.run_seed("--reset", "--extra", "0", "--admin")
        self.assertIn("이미 있어서", text)

    @override_settings(DEBUG=False)
    def test_refuses_without_debug(self):
        with self.assertRaises(CommandError):
            call_command("seed_dummy", stdout=StringIO())

    def test_write_tokens_file_shape(self):
        import tempfile
        from pathlib import Path

        _, report = self.run_seed("--extra", "0", "--no-llm-calls")
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "t.json"
            dummy.write_tokens(report, path)
            data = json.loads(path.read_text(encoding="utf-8"))
        self.assertEqual(len(data["students"]), 4)
        self.assertTrue(data["students"][0]["token"].startswith("abk_"))
