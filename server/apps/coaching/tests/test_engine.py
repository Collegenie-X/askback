"""엔진 단위 테스트 — 브라우저 엔진과 같은 판정이 나오는지."""
from types import SimpleNamespace

from django.test import SimpleTestCase, TestCase

from apps.coaching.engine.analyzer import analyze, similarity, topic_of
from apps.coaching.engine.chips import chips_for
from apps.coaching.engine.rq_picker import next_form, pick_element
from apps.coaching.models import ReverseQuestion, Turn
from apps.common import catalog
from apps.common.testing import SMARTPOT_Q1, SMARTPOT_Q2


def fake_turn(question: str, **kw) -> SimpleNamespace:
    a = analyze(question, [], "상추 화분")
    return SimpleNamespace(question=question, six=a["six"], openness=a["openness"], stage=a["stage"], **kw)


class AnalyzerTests(SimpleTestCase):
    def test_smartpot_first_question_is_narrow(self):
        a = analyze(SMARTPOT_Q1, [], "")
        self.assertTrue(a["valid"])
        self.assertEqual(a["openness"], "O2")
        self.assertEqual(a["stage"], "구현")
        self.assertIn("센서", a["concepts"])

    def test_open_question_with_context_is_o3(self):
        q = "그럼 지금 규칙이 맞는 방향일까? 목표는 상추가 안 마르는 것, 제약은 5V 펌프에 다음 주 시연이야."
        a = analyze(q, [fake_turn(SMARTPOT_Q1)], "상추 화분")
        self.assertEqual(a["openness"], "O3")
        self.assertEqual(a["six"]["why"], 1)
        self.assertEqual(a["six"]["constraint"], 1)
        self.assertGreaterEqual(a["context_load"], 2)

    def test_word_bigyo_reads_as_alternative_like_browser(self):
        # 시나리오 Q2 는 '읽고 → 비교 → 3초' 의 '비교' 때문에 로컬 규칙에선 O4 (브라우저 analyzer.ts 와 같다).
        # Claude 가 연결되면 모델이 O3 로 덮어쓴다.
        self.assertEqual(analyze(SMARTPOT_Q2, [fake_turn(SMARTPOT_Q1)], "상추 화분")["openness"], "O4")

    def test_alternative_question(self):
        a = analyze("임계값 방식 말고 다른 방법은? 각각 잃는 건?", [], "상추 화분")
        self.assertEqual(a["openness"], "O4")

    def test_gate(self):
        self.assertEqual(analyze("고마워!", [], "")["invalid_reason"], "smalltalk")
        self.assertEqual(analyze("리포트 어디서 봐?", [], "")["invalid_reason"], "howto")
        self.assertEqual(analyze("요즘 너무 힘들어", [], "")["invalid_reason"], "emotional")
        prev = fake_turn(SMARTPOT_Q1)
        self.assertEqual(analyze(SMARTPOT_Q1, [prev], "")["invalid_reason"], "duplicate")

    def test_pasted_code_is_na(self):
        a = analyze("void loop() { int v = analogRead(A0); if (v < 400) digitalWrite(7, HIGH); }", [], "")
        self.assertEqual(a["openness"], "NA")
        self.assertEqual(a["signals"], ["paste"])

    def test_similarity_and_topic(self):
        self.assertEqual(similarity("같은 문장", "같은 문장"), 1.0)
        self.assertLess(similarity("펌프", "서버 구조"), 0.2)
        self.assertTrue(topic_of("x" * 40).endswith("…"))


class ChipTests(SimpleTestCase):
    def test_widen_back_to_design_for_product(self):
        project = SimpleNamespace(description="상추 화분", format="product")
        chips = chips_for(analyze(SMARTPOT_Q1, [], ""), [], project)
        self.assertEqual(chips[0]["kind"], "widen")
        self.assertEqual(chips[0]["draft"], catalog.format_of("product")["design"]["back"])
        self.assertLessEqual(len(chips), 2)


class PickerTests(TestCase):
    def setUp(self):
        from apps.accounts.models import Student
        from apps.projects.models import Project

        self.student = Student.objects.create(nickname="민준")
        self.project = Project.objects.create(student=self.student, name="스마트 화분", description="상추", format="product", packs=["maker"])

    def _turn(self, n: int, q: str) -> Turn:
        a = analyze(q, [], self.project.description)
        t = Turn(project=self.project, student=self.student, n=n, window_index=1, bar_index=0, question=q, openness=a["openness"], stage=a["stage"], analysis=a, source="local")
        t.six = a["six"]
        t.save()
        return t

    def test_pick_prefers_unasked_axis_and_respects_candidates(self):
        bar = [self._turn(1, SMARTPOT_Q1), self._turn(2, SMARTPOT_Q2)]
        picked = pick_element(bar, self.project, bar, [], 1)
        self.assertIsNotNone(picked)
        el = picked.element
        # 팩은 maker 만, 형식은 product 만 후보
        self.assertTrue(el.get("pack") in (None, "maker"))
        self.assertTrue(el.get("format") in (None, "product"))
        self.assertIn(el.get("axis"), ("plan", "algo", "arch"))
        self.assertLessEqual(len(picked.scores), 3)

    def test_next_form_climbs_after_good_answer(self):
        el = catalog.element_by_id("E1")
        t = self._turn(1, SMARTPOT_Q1)
        self.assertEqual(next_form(el, []), "F1")
        rq = ReverseQuestion(project=self.project, turn=t, window_index=1, bar_index=0, element="E1", form="F1", status="answered", score=3)
        self.assertEqual(next_form(el, [rq]), "F2")
        rq.score = 1
        self.assertEqual(next_form(el, [rq]), "F1")
        self.assertEqual(next_form(catalog.element_by_id("M1"), []), "F3")  # F1 템플릿이 없는 요소
