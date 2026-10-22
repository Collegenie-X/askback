"""더미 DB 만들기 — 개발 · 시연 · 관리자 화면 확인용.

데이터를 직접 INSERT 하지 않고, 실제 코칭 엔진(pipeline.run_turn · answer_rq …)에 질문을 흘려 보내서 만든다.
그래서 턴 · 역질문 · 답 메시지 · 10문 리포트 · 미션이 운영과 똑같은 규칙으로 쌓인다.

- 시각: 지난 N일에 걸쳐 저녁마다 몇 문씩 물은 것처럼 시계를 돌린다 (월간 리포트가 두 달에 걸치게).
- Claude: 기본은 부르지 않는다 (비용 0). 로컬 답 카드로 답한다.
- Claude 호출 기록: 관리자 대시보드를 볼 수 있게 가짜 LLMCall 을 만든다 (--no-llm-calls 로 끔).
- 표시: 더미 학생의 기기 토큰은 user_agent='seed_dummy' — --reset 이 이것만 지운다.
"""
import json
import random
from contextlib import contextmanager
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from unittest import mock

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import Device, Goal, Student
from apps.accounts.tokens import issue_device
from apps.coaching.engine import pipeline
from apps.coaching.models import ReverseQuestion
from apps.common import catalog
from apps.llm import prompts
from apps.llm.models import LLMCall
from apps.projects.models import Project
from apps.projects.services import projects as project_svc

from . import profiles

SEED_AGENT = "seed_dummy"


class Clock:
    """timezone.now() 대신 쓰는 시계. 부를 때마다 1ms 씩 흘러서 같은 턴의 메시지 순서가 섞이지 않는다."""

    def __init__(self, start: datetime):
        self.t = start

    def now(self) -> datetime:
        self.t += timedelta(milliseconds=1)
        return self.t

    def jump(self, **kw) -> None:
        self.t += timedelta(**kw)

    def set(self, at: datetime) -> None:
        self.t = max(self.t, at)


@contextmanager
def running(clock: Clock, use_claude: bool):
    patches = [mock.patch("django.utils.timezone.now", side_effect=clock.now)]
    if not use_claude:
        patches.append(mock.patch("apps.llm.client.is_live", return_value=False))
    for p in patches:
        p.start()
    try:
        yield
    finally:
        for p in reversed(patches):
            p.stop()


@dataclass
class SeedReport:
    students: list[dict] = field(default_factory=list)
    counts: dict = field(default_factory=dict)
    admin: str | None = None


def reset() -> int:
    """seed_dummy 로 만든 학생만 지운다 (프로젝트 · 턴 · 리포트는 함께 지워진다)."""
    ids = list(Device.objects.filter(user_agent=SEED_AGENT).values_list("student_id", flat=True).distinct())
    LLMCall.objects.filter(student_id__in=ids).delete()
    n, _ = Student.objects.filter(pk__in=ids).delete()
    return len(ids) if n else 0


class Seeder:
    def __init__(self, *, days: int = 30, extra: int | None = None, seed: int = 7, use_claude: bool = False, llm_calls: bool = True, scenarios=None):
        self.rng = random.Random(seed)
        self.days = days
        self.extra = profiles.EXTRA_STUDENTS if extra is None else profiles.EXTRA_STUDENTS[:extra]
        self.scenarios = profiles.SCENARIOS if scenarios is None else scenarios
        self.use_claude = use_claude
        self.llm_calls = llm_calls
        self.now = timezone.now()
        self.report = SeedReport()

    # ---------- 시간 ----------

    def _session_starts(self, turns: int) -> list[datetime]:
        """저녁 7~10시에 4~6문씩 — 세션 시작 시각들을 지난 days 일에 고르게 흩는다."""
        sessions = max(1, -(-turns // 5))
        first = timezone.localtime(self.now - timedelta(days=self.days)).replace(hour=19, minute=0, second=0, microsecond=0)
        gap = max(1.0, (self.days - 1) / max(1, sessions - 1))  # 마지막 세션이 어제쯤에 오게
        starts = []
        for i in range(sessions):
            at = first + timedelta(days=round(i * gap), minutes=self.rng.randint(0, 150))
            starts.append(min(at, self.now - timedelta(hours=2)))
        return starts

    # ---------- 공통 ----------

    def _student(self, nickname: str, grade: str, interests: list[str]) -> tuple[Student, str]:
        student = Student.objects.create(nickname=nickname, grade=grade, interests=interests, intro_seen=True)
        return student, issue_device(student, SEED_AGENT)

    def _fake_llm(self, task: str, student: Student, project: Project) -> None:
        if not self.llm_calls:
            return
        r = self.rng
        status = r.choices(["ok", "timeout", "invalid", "refusal", "error"], weights=[90, 3, 4, 1, 2])[0]
        spec = settings.ASKBACK["LLM"]["TASKS"][task]
        big = task == "answer"
        system = 3600 if big else 1400
        cached = system if r.random() < 0.85 else 0
        LLMCall.objects.create(
            student=student, project=project, task=task, model=spec["model"], effort=spec["effort"],
            prompt_version=prompts.version(task),
            input_tokens=r.randint(400, 2600) + (system - cached), output_tokens=r.randint(600, 2200) if big else r.randint(120, 500),
            cache_read_tokens=cached, cache_write_tokens=0 if cached else system,
            latency_ms=r.randint(5000, 32000) if big else r.randint(1500, 9000),
            stop_reason={"ok": "end_turn", "refusal": "refusal"}.get(status, ""),
            status=status, error_code={"timeout": "timeout", "invalid": "ValidationError", "error": "529:OverloadedError"}.get(status, ""),
        )

    def _ask(self, clock: Clock, student: Student, project: Project, text: str) -> pipeline.TurnResult:
        clock.jump(minutes=self.rng.randint(2, 18))
        result = pipeline.run_turn(student, project, text)
        if result.outcome == "answered":
            self._fake_llm("answer", student, project)
            if result.rq is not None:
                self._fake_llm("rq", student, project)
        return result

    def _finish(self, student: Student, token: str, project: Project, goal: str) -> None:
        Goal.objects.update_or_create(student=student, ym=timezone.localtime(self.now).strftime("%Y-%m"), defaults={"text": goal})
        student.refresh_from_db()
        project.refresh_from_db()
        self.report.students.append({
            "nickname": student.nickname, "grade": student.grade, "student_id": student.id, "token": token,
            "project_id": project.id, "project": f"{project.emoji} {project.name}", "format": project.format,
            "turns": project.turns.count(), "reports": project.reports.count(), "deleted": project.deleted_at is not None,
        })

    # ---------- 시나리오 학생 ----------

    def seed_scenario(self, key: str) -> None:
        data = catalog.load(f"scenarios/{key}.json")
        meta, who = data["project"], data["student"]
        turns = data["turns"]
        demo_rqs = [t["reverseQuestion"] for t in turns if t.get("reverseQuestion")]
        starts = self._session_starts(len(turns))
        clock = Clock(starts[0])
        with running(clock, self.use_claude):
            student, token = self._student(who["name"], who["grade"], [])
            project, _ = project_svc.create_project(
                student, name=meta["name"], description=meta["desc"], emoji=meta["emoji"],
                packs=data.get("packs") or [], format=data.get("format") or "",
            )
            plan = data.get("planDoc") or {}
            project.plan_filename, project.plan_md = plan.get("filename", ""), plan.get("base", "")
            project.save(update_fields=["plan_filename", "plan_md"])

            for i, t in enumerate(turns):
                if i % 5 == 0:
                    clock.set(starts[min(i // 5, len(starts) - 1)])
                result = self._ask(clock, student, project, t["question"])
                if result.rq is not None:
                    demo = demo_rqs.pop(0) if demo_rqs else None
                    self._answer_like_demo(clock, student, result.rq, demo)

            self._deep_from_scenario(clock, student, project, data.get("deep") or {})
            self._finish(student, token, project, "열린 질문을 리포트 한 장에 5번 이상")

    def _answer_like_demo(self, clock: Clock, student: Student, rq: ReverseQuestion, demo: dict | None) -> None:
        """시나리오의 실제 학생 답(demoAnswer · demoOptionIndex · 힌트 사용)을 서버가 고른 역질문에 붙인다."""
        clock.jump(minutes=self.rng.randint(1, 4))
        if demo is None:
            pipeline.later_rq(rq)
            return
        if demo.get("demoUsesHint"):
            pipeline.hint_rq(rq)
        idx = demo.get("demoOptionIndex")
        if rq.options and isinstance(idx, int) and idx < len(rq.options):
            pipeline.answer_rq(student, rq, None, idx)
            return
        text = demo.get("demoAnswer") or (demo.get("options") or [{}])[idx or 0].get("label")
        if text:
            pipeline.answer_rq(student, rq, text, None)
            self._fake_llm("feedback", student, rq.project)
        else:
            pipeline.idk_rq(student, rq)

    def _deep_from_scenario(self, clock: Clock, student: Student, project: Project, deep: dict) -> None:
        lens = deep.get("demoLens") or "philosophy"
        said = [m["text"] for m in (deep.get("messages") or []) if m.get("from") == "student"]
        if not said:
            return
        clock.jump(minutes=10)
        pipeline.deep_open(project)
        for level, text in enumerate(said[:3]):
            pipeline.deep_ask(project, lens, level)
            clock.jump(minutes=2)
            pipeline.deep_answer(student, project, lens, level, text)

    # ---------- 추가 학생 ----------

    def _questions(self, prof: dict) -> list[str]:
        f = catalog.format_of(prof["project"]["format"]) or {}
        words = prof["words"]
        templates = [c["ask"] for c in f.get("checks", [])] + [q["draft"] for q in f.get("quick", [])]
        pool = []
        for tpl in templates:
            parts = tpl.split("___")
            pool.append("".join(p + (words[i % len(words)] if i < len(parts) - 1 else "") for i, p in enumerate(parts)))
        fill = {"topic": words[0], "people": words[1], "goal": prof["goal"]}
        pool += [g.format(**fill) for g in profiles.GENERIC_QUESTIONS]
        self.rng.shuffle(pool)
        out = []
        while len(out) < prof["turns"]:
            q = pool[len(out) % len(pool)]
            if len(out) >= len(pool):
                q = f"{q} (다시 정리하면: {words[len(out) % len(words)]} 기준으로)"  # 한 바퀴 돈 뒤엔 중복으로 안 걸리게 덧붙인다
            out.append(q)
        return out

    def _answer_freely(self, clock: Clock, student: Student, rq: ReverseQuestion, prof: dict) -> None:
        clock.jump(minutes=self.rng.randint(1, 5))
        roll = self.rng.random()
        if roll < 0.15:
            pipeline.later_rq(rq)
        elif roll < 0.27:
            pipeline.idk_rq(student, rq)
        elif rq.options and roll < 0.55:
            pipeline.answer_rq(student, rq, None, self.rng.randrange(len(rq.options)))
        else:
            if self.rng.random() < 0.2:
                pipeline.hint_rq(rq)
            text = self.rng.choice(profiles.FREE_ANSWERS).format(topic=prof["words"][0], people=prof["words"][1])
            pipeline.answer_rq(student, rq, text, None)
            self._fake_llm("feedback", student, rq.project)

    def seed_extra(self, prof: dict) -> None:
        questions = self._questions(prof)
        starts = self._session_starts(max(1, len(questions)))
        clock = Clock(starts[0])
        with running(clock, self.use_claude):
            student, token = self._student(prof["nickname"], prof["grade"], prof["interests"])
            project, _ = project_svc.create_project(student, **prof["project"])
            for i, q in enumerate(questions):
                if i % 5 == 0:
                    clock.set(starts[min(i // 5, len(starts) - 1)])
                if self.rng.random() < 0.08:
                    self._ask(clock, student, project, self.rng.choice(profiles.SMALLTALK))
                result = self._ask(clock, student, project, q)
                if result.rq is not None:
                    self._answer_freely(clock, student, result.rq, prof)
            f = catalog.format_of(project.format)
            if f and questions:  # 체크 칸 앞쪽 몇 개는 학생이 정한 것으로
                for c in f["checks"][: self.rng.randint(1, len(f["checks"]))]:
                    project_svc.set_check(project, c["key"], f"{prof['words'][0]} — {c['done']}")
            if prof.get("deleted"):
                project_svc.soft_delete(project)
            self._finish(student, token, project, prof["goal"])

    # ---------- 전체 ----------

    def run(self) -> SeedReport:
        with transaction.atomic():
            for key in self.scenarios:
                self.seed_scenario(key)
            for prof in self.extra:
                self.seed_extra(prof)
        from apps.coaching.models import Turn
        from apps.reports.models import Report

        dummy = Student.objects.filter(devices__user_agent=SEED_AGENT).distinct()
        self.report.counts = {
            "students": dummy.count(),
            "projects": Project.objects.filter(student__in=dummy).count(),
            "turns": Turn.objects.filter(student__in=dummy).count(),
            "rqs": ReverseQuestion.objects.filter(project__student__in=dummy).count(),
            "reports": Report.objects.filter(project__student__in=dummy).count(),
            "llm_calls": LLMCall.objects.filter(student__in=dummy).count(),
        }
        return self.report


def ensure_admin(username: str, password: str) -> bool:
    """개발용 관리자. 이미 있으면 비밀번호를 건드리지 않는다. 새로 만들었으면 True."""
    from django.contrib.auth import get_user_model

    User = get_user_model()
    if User.objects.filter(username=username).exists():
        return False
    User.objects.create_superuser(username=username, email=f"{username}@askback.local", password=password)
    return True


def write_tokens(report: SeedReport, path) -> None:
    rows = [{k: s[k] for k in ("nickname", "grade", "student_id", "token", "project_id", "project", "turns", "reports", "deleted")} for s in report.students]
    path.write_text(json.dumps({"base_url": "http://localhost:8000/api/v1", "students": rows}, ensure_ascii=False, indent=2), encoding="utf-8")
