"""POST /projects/{id}/turns 부터 역질문 · 리포트까지 — Claude 없이 로컬 엔진으로."""
from django.test import TestCase, override_settings
from django.conf import settings

from apps.coaching.models import ReverseQuestion, Turn
from apps.common.testing import SMARTPOT_Q1, SMARTPOT_Q2, make_project, student_client


class TurnFlowTests(TestCase):
    def setUp(self):
        self.client, self.user = student_client()
        self.project = make_project(self.client)
        self.url = f"/api/v1/projects/{self.project['id']}/turns"

    def post(self, text, **extra):
        return self.client.post(self.url, {"text": text, **extra}, format="json")

    def test_first_turn_answers_without_rq(self):
        res = self.post(SMARTPOT_Q1)
        self.assertEqual(res.status_code, 201)
        data = res.json()["data"]
        self.assertEqual(data["outcome"], "answered")
        self.assertEqual(data["turn"]["analysis"]["openness"], "O2")
        self.assertEqual(data["answer"]["source"], "local")
        self.assertIn("🙋", data["answer"]["md"])  # 답은 늘 되묻기로 끝난다
        self.assertIsNone(data["rq"])
        self.assertEqual(data["project"]["counter"], 1)
        self.assertEqual(data["me"]["validCount"], 1)
        self.assertIn("roleReason", data["answer"])  # camelCase 로 나간다

    def test_second_turn_brings_reverse_question(self):
        self.post(SMARTPOT_Q1)
        data = self.post(SMARTPOT_Q2, chip="widen").json()["data"]
        rq = data["rq"]
        self.assertIsNotNone(rq)
        self.assertEqual(rq["status"], "open")
        self.assertIn(rq["axis"], ("plan", "algo", "arch"))
        self.assertEqual(data["project"]["counter"], 0)
        self.assertEqual(data["project"]["barIndex"], 1)

        # 대화에도 rq 메시지가 펼쳐져 들어 있다
        msgs = self.client.get(f"/api/v1/projects/{self.project['id']}/messages").json()["data"]
        kinds = [m["kind"] for m in msgs]
        self.assertEqual(kinds[0], "coach")  # 첫 인사
        self.assertIn("rq", kinds)
        self.assertEqual(next(m for m in msgs if m["kind"] == "rq")["rq"]["id"], rq["id"])

    def test_answer_rq_option_and_conflict(self):
        self.post(SMARTPOT_Q1)
        rq = self.post(SMARTPOT_Q2).json()["data"]["rq"]
        url = f"/api/v1/rqs/{rq['id']}/answer"
        body = {"optionIndex": 0} if rq["options"] else {"text": "3번 넘게 계속 마르면 멈추고 알림 — 센서가 빠졌을 수도 있으니까"}
        res = self.client.post(url, body, format="json")
        self.assertEqual(res.status_code, 200, res.content)
        out = res.json()["data"]
        self.assertEqual(out["rq"]["status"], "answered")
        self.assertIn(out["rq"]["score"], (0, 1, 2, 3))
        self.assertIn("계속 갈래", out["coachMessage"]["md"])
        again = self.client.post(url, body, format="json")
        self.assertEqual(again.status_code, 409)
        self.assertEqual(again.json()["error"]["code"], "RQ_ALREADY_ANSWERED")

    def test_hint_caps_score(self):
        self.post(SMARTPOT_Q1)
        rq = self.post(SMARTPOT_Q2).json()["data"]["rq"]
        hint = self.client.post(f"/api/v1/rqs/{rq['id']}/hint").json()["data"]
        self.assertEqual(hint["rq"]["hintStage"], 1)
        self.assertEqual(len(hint["rq"]["hints"]), 1)
        res = self.client.post(f"/api/v1/rqs/{rq['id']}/answer", {"text": "3번 넘게 계속 마르면 멈추고 알림 — 센서가 빠졌을 수도 있으니까"}, format="json")
        self.assertLessEqual(res.json()["data"]["rq"]["score"], 1)

    def test_new_question_moves_open_rq_to_later(self):
        self.post(SMARTPOT_Q1)
        rq = self.post(SMARTPOT_Q2).json()["data"]["rq"]
        self.post("그럼 서버로 흙 상태를 보내려면 어떤 구조가 좋을까? 집 와이파이만 있어.")
        self.assertEqual(ReverseQuestion.objects.get(pk=rq["id"]).status, "later")

    def test_gated_messages_do_not_count(self):
        res = self.post("고마워!")
        self.assertEqual(res.status_code, 200)
        data = res.json()["data"]
        self.assertEqual(data["outcome"], "gated")
        self.assertEqual(data["reason"], "smalltalk")
        self.assertEqual(Turn.objects.count(), 0)

    def test_emotional_shows_1388(self):
        data = self.post("요즘 너무 힘들어").json()["data"]
        self.assertEqual(data["outcome"], "emotional")
        self.assertIn("1388", data["coachMessages"][0]["md"])

    def test_idempotency_replays_same_response(self):
        h = {"HTTP_IDEMPOTENCY_KEY": "k-1"}
        first = self.client.post(self.url, {"text": SMARTPOT_Q1}, format="json", **h)
        second = self.client.post(self.url, {"text": SMARTPOT_Q1}, format="json", **h)
        self.assertEqual(first.json(), second.json())
        self.assertEqual(second["Idempotent-Replay"], "true")
        self.assertEqual(Turn.objects.count(), 1)
        mismatch = self.client.post(self.url, {"text": "다른 질문이야 어떻게 할까?"}, format="json", **h)
        self.assertEqual(mismatch.status_code, 409)

    def test_ten_turns_make_a_report(self):
        questions = [f"{i}번째 — 펌프 급수 규칙을 어떻게 바꾸면 좋을까? 목표는 안 마르는 것, 제약은 5V 펌프야. ({i})" for i in range(10)]
        report = None
        for q in questions:
            data = self.post(q).json()["data"]
            report = data["report"] or report
        self.assertIsNotNone(report)
        self.assertEqual(report["seq"], 1)
        self.assertEqual(report["title"], "스마트 화분 · 1번째 리포트")

        detail = self.client.get(f"/api/v1/reports/{report['id']}").json()["data"]
        self.assertEqual(list(detail["sections"].keys()), ["glance", "mix", "length", "six", "rqs", "stuck", "best", "mission"])
        self.assertEqual(detail["turnRange"], [1, 10])

        md = self.client.get(f"/api/v1/reports/{report['id']}.md")
        self.assertEqual(md.status_code, 200)
        text = md.content.decode()
        for n in "①②③④⑤⑥⑦⑧":
            self.assertIn(f"## {n}", text)

        # 11번째 질문부터는 2번째 구간
        data = self.post("11번째 — 이제 서버를 붙이면 어디부터 볼까? 와이파이만 있어.").json()["data"]
        self.assertEqual(data["turn"]["windowIndex"], 2)

    def test_answer_only_deposits_rq(self):
        self.client.patch(f"/api/v1/projects/{self.project['id']}", {"answerOnly": True}, format="json")
        self.post(SMARTPOT_Q1)
        data = self.post(SMARTPOT_Q2).json()["data"]
        self.assertIsNone(data["rq"])
        self.assertEqual(ReverseQuestion.objects.filter(status="later").count(), 1)

    def test_validation_and_daily_limit(self):
        bad = self.post("")
        self.assertEqual(bad.status_code, 422)
        self.assertEqual(bad.json()["error"]["code"], "VALIDATION_FAILED")
        self.assertEqual(bad.json()["error"]["details"][0]["field"], "text")
        with override_settings(ASKBACK={**settings.ASKBACK, "DAILY_TURN_LIMIT": 1}):
            self.post(SMARTPOT_Q1)
            res = self.post(SMARTPOT_Q2)
            self.assertEqual(res.status_code, 429)
            self.assertEqual(res.json()["error"]["code"], "DAILY_LIMIT")

    def test_ask_me_and_deep(self):
        self.post(SMARTPOT_Q1)
        out = self.client.post(f"/api/v1/projects/{self.project['id']}/ask-me").json()["data"]
        self.assertIsNotNone(out["rq"])
        q = self.client.post(f"/api/v1/projects/{self.project['id']}/deep/ask", {"lens": "philosophy", "level": 0}, format="json").json()["data"]
        self.assertIn("철학", q["message"]["md"])
        a = self.client.post(
            f"/api/v1/projects/{self.project['id']}/deep/answer", {"lens": "philosophy", "level": 0, "text": "편하게 해 주는 게 꼭 좋은 건지 모르겠어"}, format="json"
        ).json()["data"]
        self.assertEqual(a["note"]["lens"], "philosophy")
        self.assertEqual(len(a["coachMessage"]["actions"]), 3)
        self.assertEqual(Turn.objects.count(), 1)  # 심화는 턴으로 세지 않는다

    def test_other_students_project_is_404(self):
        other, _ = student_client("지민")
        res = other.post(self.url, {"text": SMARTPOT_Q1}, format="json")
        self.assertEqual(res.status_code, 404)
        self.assertEqual(res.json()["error"]["code"], "NOT_FOUND")
