"""Claude 경로 — SDK 를 가짜로 바꿔서 요청 모양 · 검증 · 기록 · 폴백을 확인한다 (실제 호출 없음)."""
import json
from types import SimpleNamespace
from unittest import mock

from django.conf import settings
from django.test import SimpleTestCase, TestCase, override_settings

from apps.coaching.models import Turn
from apps.common.testing import SMARTPOT_Q1, make_project, student_client
from apps.llm import client as llm
from apps.llm import validate
from apps.llm.models import LLMCall
from apps.llm.schemas import SCHEMAS, output_schema

LIVE = {**settings.ASKBACK, "LLM": {**settings.ASKBACK["LLM"], "ENABLED": True}}

ANSWER = {
    "openness": "O2",
    "six": {"why": 0, "context": 1, "constraint": 0, "criteria": 0, "verify": 0, "discard": 0},
    "stage": "구현",
    "concepts": ["임계값", "센서", "펌프", "넷째"],
    "emotional": False,
    "answer_md": "코드 대신 **규칙 카드**로 적어줄게.",
    "assumptions": ["센서값이 작을수록 마른 흙"],
    "your_call": ["400은 직접 재서 정해"],
    "risk_note": "",
    "role_reason": "설계는 네가 정했어",
}


def fake_response(payload: dict, stop_reason: str = "end_turn"):
    return SimpleNamespace(
        content=[SimpleNamespace(type="thinking", thinking=""), SimpleNamespace(type="text", text=json.dumps(payload, ensure_ascii=False))],
        stop_reason=stop_reason,
        model="claude-opus-5-5",
        usage=SimpleNamespace(input_tokens=1200, output_tokens=300, cache_read_input_tokens=900, cache_creation_input_tokens=0),
    )


class SchemaTests(SimpleTestCase):
    def test_every_object_is_closed_and_fully_required(self):
        def walk(node):
            if isinstance(node, dict):
                if node.get("type") == "object":
                    self.assertFalse(node["additionalProperties"])
                    self.assertEqual(set(node["required"]), set(node["properties"]))
                self.assertNotIn("$ref", node)
                for v in node.values():
                    walk(v)
            elif isinstance(node, list):
                for v in node:
                    walk(v)

        for model in SCHEMAS.values():
            walk(output_schema(model))

    def test_validate_rules(self):
        fixed = validate.fix_answer(ANSWER, seed=3)
        self.assertIn("🙋", fixed["answer_md"])
        self.assertEqual(len(fixed["concepts"]), 3)
        self.assertIsNone(fixed["risk_note"])
        fb = validate.fix_feedback({"score": 2.6, "reason_one_line": "r", "feedback_md": "좋아. 3점이야. 계속 갈래?"})
        self.assertEqual(fb["score"], 3)
        self.assertNotIn("점", fb["feedback_md"])
        rq = validate.fix_rq(
            {"question": "빈칸 없는 질문", "benefit": "b", "options": [{"label": "a", "score": 9}], "hint": "h", "example": "e", "coach_view": "c", "expected_points": ["x"]},
            "F2",
            {"question": "템플릿 ___ 질문", "options": None},
        )
        self.assertEqual(rq["question"], "템플릿 ___ 질문")
        self.assertEqual(rq["options"], [])


@override_settings(ASKBACK=LIVE)
@mock.patch.dict("os.environ", {"ANTHROPIC_API_KEY": "test-key"})
class ClaudePathTests(TestCase):
    def setUp(self):
        llm._client.cache_clear()
        self.client, _ = student_client()
        self.project = make_project(self.client)

    def test_request_shape(self):
        req = llm.build_request("answer", "질문", context="학생: 민준", history=[{"role": "user", "content": "a"}, {"role": "assistant", "content": "b"}])
        self.assertEqual(req["model"], "claude-opus-5-5")
        self.assertEqual(req["thinking"], {"type": "adaptive"})
        self.assertEqual(req["output_config"]["effort"], "medium")
        self.assertEqual(req["output_config"]["format"]["type"], "json_schema")
        self.assertEqual(req["system"][0]["cache_control"], {"type": "ephemeral"})
        self.assertTrue(req["messages"][-1]["content"].startswith("<context>"))
        self.assertNotIn("민준", req["system"][0]["text"])  # 시스템 프롬프트에는 학생 정보가 없다 (캐시)
        self.assertEqual(req["extra_body"], {"fallbacks": "default"})

    def test_turn_uses_claude_output_and_logs_call(self):
        fake = mock.Mock()
        fake.messages.create.return_value = fake_response(ANSWER)
        with mock.patch.object(llm, "_client", return_value=fake):
            data = self.client.post(f"/api/v1/projects/{self.project['id']}/turns", {"text": SMARTPOT_Q1}, format="json").json()["data"]
        self.assertEqual(data["answer"]["source"], "claude")
        self.assertIn("🙋", data["answer"]["md"])  # 서버가 되묻기 줄을 붙였다
        self.assertEqual(data["turn"]["analysis"]["concepts"], ["임계값", "센서", "펌프"])
        call = LLMCall.objects.get()
        self.assertEqual((call.task, call.status, call.input_tokens, call.cache_read_tokens), ("answer", "ok", 1200, 900))
        self.assertEqual(Turn.objects.get().llm_call_id, call.id)

    def test_invalid_json_retries_once_then_falls_back(self):
        fake = mock.Mock()
        fake.messages.create.return_value = fake_response({"wrong": True})
        with mock.patch.object(llm, "_client", return_value=fake):
            data = self.client.post(f"/api/v1/projects/{self.project['id']}/turns", {"text": SMARTPOT_Q1}, format="json").json()["data"]
        self.assertEqual(data["answer"]["source"], "local")
        self.assertEqual(fake.messages.create.call_count, 2)
        self.assertEqual(list(LLMCall.objects.values_list("status", flat=True)), ["invalid", "invalid"])

    def test_refusal_falls_back_without_retry(self):
        fake = mock.Mock()
        fake.messages.create.return_value = fake_response(ANSWER, stop_reason="refusal")
        with mock.patch.object(llm, "_client", return_value=fake):
            data = self.client.post(f"/api/v1/projects/{self.project['id']}/turns", {"text": SMARTPOT_Q1}, format="json").json()["data"]
        self.assertEqual(data["answer"]["source"], "local")
        self.assertEqual(fake.messages.create.call_count, 1)
        self.assertEqual(LLMCall.objects.get().status, "refusal")

    def test_emotional_flag_from_claude_skips_turn(self):
        fake = mock.Mock()
        fake.messages.create.return_value = fake_response({**ANSWER, "emotional": True, "answer_md": "말해줘서 고마워."})
        with mock.patch.object(llm, "_client", return_value=fake):
            data = self.client.post(f"/api/v1/projects/{self.project['id']}/turns", {"text": "코드 짜다가 다 그만두고 싶어졌어 어떻게 해"}, format="json").json()["data"]
        self.assertEqual(data["outcome"], "emotional")
        self.assertEqual(Turn.objects.count(), 0)
