from django.test import TestCase

from apps.coaching.models import Turn
from apps.common.testing import SMARTPOT_Q1, SMARTPOT_Q2, make_project, student_client


class TransferTests(TestCase):
    def test_export_then_import_into_another_student(self):
        a, _ = student_client("민준")
        p = make_project(a)
        a.post(f"/api/v1/projects/{p['id']}/turns", {"text": SMARTPOT_Q1}, format="json")
        a.post(f"/api/v1/projects/{p['id']}/turns", {"text": SMARTPOT_Q2}, format="json")
        exported = a.get("/api/v1/me/export").json()["data"]
        self.assertEqual(exported["profile"]["name"], "민준")
        self.assertEqual(len(exported["turns"]), 2)
        self.assertIn("projectId", exported["turns"][0])  # 브라우저와 같은 camelCase
        self.assertIsInstance(exported["turns"][0]["createdAt"], int)

        # 같은 학생이 다시 올리면 전부 중복으로 건너뛴다
        again = a.post("/api/v1/import/local", exported, format="json").json()["data"]
        self.assertEqual(again["imported"]["projects"], 0)
        self.assertEqual(again["skipped"]["duplicates"], 1)

        # 브라우저 데이터처럼 ID 를 바꿔 새 학생에게
        for key in ("projects", "messages", "turns", "rqs"):
            for row in exported[key]:
                row["id"] = "x" + row["id"]
                for ref in ("projectId", "turnId", "rqId"):
                    if row.get(ref):
                        row[ref] = "x" + row[ref]
        b, _ = student_client("새학생")
        res = b.post("/api/v1/import/local", exported, format="json")
        self.assertEqual(res.status_code, 200, res.content)
        out = res.json()["data"]
        self.assertEqual(out["imported"]["projects"], 1)
        self.assertEqual(out["imported"]["turns"], 2)
        self.assertEqual(Turn.objects.filter(student__nickname="민준").count(), 4)  # 빈 학생은 프로필을 받는다
        msgs = b.get(f"/api/v1/projects/x{p['id']}/messages").json()["data"]
        self.assertGreaterEqual(len(msgs), 5)

    def test_import_rejects_wrong_shape(self):
        c, _ = student_client()
        res = c.post("/api/v1/import/local", {"hello": 1}, format="json")
        self.assertEqual(res.status_code, 422)
