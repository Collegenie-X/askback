"""한 턴 파이프라인 (설계서 §4-1): 관문 → 분석 → 답 → 칩 → 리듬 · 역질문 → 리포트.

Claude 호출(수십 초)은 트랜잭션 밖에서 한다. SQLite 는 쓰기 잠금이 DB 전체라서,
호출을 기다리는 동안 잠금을 쥐고 있으면 다른 학생의 요청까지 멈춘다.
  A. (잠금) 학생 메시지 · 열린 역질문 정리
  B. (잠금 없음) Claude 답
  C. (잠금) 턴 · 답 · 카운터 · 역질문 템플릿
  D. (잠금 없음) Claude 로 역질문 다듬기
  E. (잠금) 역질문 저장 · 리포트
"""
from dataclasses import dataclass, field

from django.conf import settings
from django.db import IntegrityError, transaction
from django.db.models import F
from django.utils import timezone
from rest_framework import status

from apps.accounts.models import Student
from apps.common import catalog
from apps.common.exceptions import ApiError
from apps.projects.models import Message, Note, Project
from apps.projects.services.messages import coach, push_message
from apps.reports.models import Report
from apps.reports.services.builder import build_window_report

from ..models import ReverseQuestion, Turn
from . import grader
from .analyzer import analyze
from .answerer import generate_answer
from .chips import chips_for
from .context import history_of
from .deep import deep_question, deep_reply
from .rq_picker import build_rq, pick_element

INVALID_REPLY = {
    "smalltalk": "응! 또 궁금한 게 생기면 바로 물어봐.",
    "howto": "리포트 · 우주 배경 · 설정은 왼쪽 위 **☰ 메뉴**에 있어. 생각 노트와 가이드는 **설정** 안에 있어.",
    "duplicate": "방금이랑 같은 질문이네. 답이 아쉬웠다면 **어디가** 아쉬웠는지 한 줄만 보태 줄래? 그러면 다른 답을 할 수 있어.",
    "emotional": (
        "말해줘서 고마워. 그런 마음이 드는 건 이상한 게 아니야. 여기서는 평가도 질문도 잠깐 내려놓을게.\n\n"
        "혼자 감당하기 버거우면 믿을 만한 어른이나 **청소년상담전화 1388**(24시간, 문자·전화)에 얘기해 봐. 나도 여기 있을게."
    ),
}
RHYTHM_ACTIONS = [
    {"label": "2문 1역 그대로", "action": "rhythm:2"},
    {"label": "3문 1역", "action": "rhythm:3"},
    {"label": "4문 1역", "action": "rhythm:4"},
]


@dataclass
class TurnResult:
    outcome: str  # answered · gated · emotional
    user_message: Message
    reason: str | None = None
    turn: Turn | None = None
    answer: Message | None = None
    rq: ReverseQuestion | None = None
    report: Report | None = None
    coach_messages: list[Message] = field(default_factory=list)
    project: Project | None = None
    student: Student | None = None


def _check_daily_limit(student: Student) -> None:
    limit = settings.ASKBACK["DAILY_TURN_LIMIT"]
    today = timezone.localdate()
    if Turn.objects.filter(student=student, created_at__date=today).count() >= limit:
        raise ApiError("DAILY_LIMIT", f"오늘 질문 {limit}개를 다 썼어. 내일 다시 이어 가자.", status.HTTP_429_TOO_MANY_REQUESTS)


def _close_open_rqs(project: Project) -> bool:
    """역질문을 보는 중에 새 질문 → 미응답은 [나중에]로 넘긴다."""
    return ReverseQuestion.objects.filter(project=project, status="open").update(status="later") > 0


def run_turn(student: Student, project: Project, text: str, chip: str | None = None, images: list[str] | None = None) -> TurnResult:
    _check_daily_limit(student)
    images = images or []
    history = history_of(project)  # 이번 질문을 저장하기 전의 대화
    project_turns = list(project.turns.order_by("created_at"))

    # A
    with transaction.atomic():
        body = {"text": text}
        if chip:
            body["chip"] = chip
        if images:
            body["image_count"] = len(images)  # 사진 원본은 DB 에 넣지 않는다
        user_msg = push_message(project, "user", body)
        analysis = analyze(text, project_turns, project.description)
        if not analysis["valid"]:
            reason = analysis["invalid_reason"]
            outcome = "emotional" if reason == "emotional" else "gated"
            return TurnResult(outcome, user_msg, reason=reason, coach_messages=[coach(project, INVALID_REPLY[reason])], project=project)
        had_open = _close_open_rqs(project)

    # B
    result = generate_answer(text, analysis, project, student, history, images)
    if result.emotional:
        return TurnResult("emotional", user_msg, reason="emotional", coach_messages=[coach(project, result.md)], project=project)

    # C
    pending_rq: ReverseQuestion | None = None
    bar: list[Turn] = []
    with transaction.atomic():
        project = Project.objects.select_for_update().get(pk=project.pk)
        student = Student.objects.select_for_update().get(pk=student.pk)
        window_index = project.reports.count() + 1  # 리포트는 프로젝트마다 1번째부터 센다
        a = result.analysis
        turn = Turn(
            project=project,
            student=student,
            n=student.valid_count + 1,
            window_index=window_index,
            bar_index=project.bar_index,
            question=text,
            openness=a["openness"],
            stage=a["stage"],
            analysis=a,
            role=catalog.role_of(a["openness"]),
            chip_used=chip,
            source=result.source,
            llm_call=result.llm_call,
        )
        turn.six = a["six"]
        turn.save()
        answer = push_message(
            project,
            "answer",
            {
                "md": result.md,
                "role": turn.role,
                "role_reason": result.role_reason,
                "risk_note": result.risk_note,
                "assumptions": result.assumptions,
                "your_call": result.your_call,
                "chips": chips_for(a, [t.openness for t in project_turns[-4:]], project),
                "analysis": {k: a[k] for k in ("openness", "stage", "six", "concepts", "urgent", "context_load")},
                "source": result.source,
            },
            turn=turn,
        )

        # 리듬 — 유효 질문이 rhythm 개 쌓이면 역질문 1개
        counter = project.counter + 1
        bar_index = project.bar_index
        later_streak = project.later_streak + (1 if had_open else 0)
        if counter >= project.rhythm:
            bar = list(project.turns.order_by("-created_at")[: project.rhythm])[::-1]
            student_turns = list(Turn.objects.filter(student=student).order_by("created_at"))
            student_rqs = list(ReverseQuestion.objects.filter(project__student=student).order_by("created_at"))
            picked = pick_element(bar, project, student_turns, student_rqs, window_index)
            counter, bar_index = 0, bar_index + 1
            if picked:
                rq = build_rq(picked, turn, window_index, project.bar_index)
                if project.answer_only or a["urgent"]:
                    rq.status = "later"  # [⚡ 답만] · 급하다는 신호 → 적립
                    rq.save()
                else:
                    pending_rq = rq
            # 물을 게 마땅치 않으면 그 마디는 건너뛴다 — 카운터만 리셋
        project.counter, project.bar_index, project.later_streak = counter, bar_index, later_streak
        project.save(update_fields=["counter", "bar_index", "later_streak", "updated_at"])
        student.valid_count += 1
        student.current_project = project
        student.save(update_fields=["valid_count", "current_project", "updated_at"])

    out = TurnResult("answered", user_msg, turn=turn, answer=answer, project=project, student=student)

    # D · E
    if pending_rq is not None:
        pairs = []
        answers = {m.turn_id: m.body.get("md", "") for m in Message.objects.filter(turn__in=bar, kind="answer")}
        for t in bar:
            pairs.append({"q": t.question, "a": answers.get(t.id, "")[:1200]})
        pending_rq = grader.refine_rq(pending_rq, pairs, project, student)
        with transaction.atomic():
            _close_open_rqs(project)
            pending_rq.save()
            push_message(project, "rq", rq=pending_rq)
        out.rq = pending_rq

    with transaction.atomic():
        project.refresh_from_db()
        if project.later_streak >= 3:
            project.later_streak = 0
            project.save(update_fields=["later_streak", "updated_at"])
            out.coach_messages.append(coach(project, "요즘 바쁜 것 같아. 되묻는 간격을 좀 늦출까?", RHYTHM_ACTIONS))
        out.report = _maybe_report(project, turn.window_index, student)
    out.project = project
    return out


def _maybe_report(project: Project, window_index: int, student: Student) -> Report | None:
    """이 프로젝트의 질문이 10개 쌓일 때마다 한 장."""
    in_window = list(project.turns.filter(window_index=window_index).order_by("created_at"))
    if len(in_window) < 10 or project.reports.filter(seq=window_index).exists():
        return None
    rqs = list(project.rqs.filter(window_index=window_index).order_by("created_at"))
    prev = project.reports.filter(seq__lt=window_index).order_by("-seq").first()
    student_turns = list(Turn.objects.filter(student=student))
    report = build_window_report(project, window_index, in_window[:10], rqs, student_turns, prev)
    try:
        with transaction.atomic():
            report.save()
    except IntegrityError:
        return project.reports.get(seq=window_index)  # 동시에 두 번 — 먼저 생긴 것
    return report


# ---------- 역질문에 답하기 ----------


def _last_answer_md(rq: ReverseQuestion) -> str:
    msg = Message.objects.filter(turn_id=rq.turn_id, kind="answer").first()
    return msg.body.get("md", "") if msg else ""


def answer_rq(student: Student, rq: ReverseQuestion, text: str | None, option_index: int | None) -> tuple[ReverseQuestion, Message]:
    if rq.status == "answered":
        raise ApiError("RQ_ALREADY_ANSWERED", "이미 답한 되묻기야.", status.HTTP_409_CONFLICT)
    option_score = None
    if option_index is not None:
        options = rq.options or []
        if not (0 <= option_index < len(options)):
            raise ApiError("VALIDATION_FAILED", "고를 수 있는 보기가 아니야.", 422, [{"field": "optionIndex", "messages": ["범위를 벗어났어."]}])
        text, option_score = options[option_index]["label"], int(options[option_index]["score"])
    project = rq.project
    g = grader.grade(rq, text or "", option_score, _last_answer_md(rq), project, student)
    with transaction.atomic():
        rq.status, rq.answer, rq.score, rq.reason, rq.feedback = "answered", text or "", g.score, g.reason[:300], g.feedback
        rq.grade_call = g.llm_call
        rq.answered_at = timezone.now()
        rq.save()
        Project.objects.filter(pk=project.pk).update(later_streak=0)
        msg = coach(project, g.feedback)
    return rq, msg


def idk_rq(student: Student, rq: ReverseQuestion) -> tuple[ReverseQuestion, Message]:
    if rq.status == "answered":
        raise ApiError("RQ_ALREADY_ANSWERED", "이미 답한 되묻기야.", status.HTTP_409_CONFLICT)
    el = catalog.element_by_id(rq.element) or {}
    feedback = f"괜찮아, 모른다고 말하는 게 제일 정직한 재료야. {el.get('coachView') or rq.coach_view} 거기서부터 생각해 보면 돼."
    with transaction.atomic():
        rq.status, rq.answer, rq.score, rq.reason, rq.feedback = "answered", "잘 모르겠어", 0, "'잘 모르겠어'를 고름", feedback
        rq.answered_at = timezone.now()
        rq.save()
        Student.objects.filter(pk=student.pk).update(idk_count=F("idk_count") + 1)
        Project.objects.filter(pk=rq.project_id).update(later_streak=0)
        msg = coach(rq.project, feedback)
    return rq, msg


def later_rq(rq: ReverseQuestion) -> tuple[ReverseQuestion, Message | None]:
    if rq.status != "open":
        return rq, None
    with transaction.atomic():
        rq.status = "later"
        rq.save(update_fields=["status"])
        project = Project.objects.select_for_update().get(pk=rq.project_id)
        project.later_streak += 1
        msg = None
        if project.later_streak >= 3:
            project.later_streak = 0
            msg = coach(project, "요즘 바쁜 것 같아. 되묻는 간격을 좀 늦출까?", RHYTHM_ACTIONS)
        project.save(update_fields=["later_streak", "updated_at"])
    return rq, msg


def hint_rq(rq: ReverseQuestion) -> tuple[ReverseQuestion, str]:
    rq.hint_stage = min(3, rq.hint_stage + 1)
    rq.save(update_fields=["hint_stage"])
    return rq, grader.hint_text(rq)


def ask_me(student: Student, project: Project) -> tuple[ReverseQuestion | None, Message]:
    """[🙋 나한테 물어봐] — 리듬과 무관하게 역질문 1개. 카운터는 그대로."""
    bar = list(project.turns.order_by("-created_at")[:2])[::-1]
    if not bar:
        return None, coach(project, "아직 물어본 게 없어서 되물을 거리가 없어. 먼저 하나 물어봐 줘.")
    window_index = project.reports.count() + 1
    student_turns = list(Turn.objects.filter(student=student).order_by("created_at"))
    student_rqs = list(ReverseQuestion.objects.filter(project__student=student).order_by("created_at"))
    picked = pick_element(bar, project, student_turns, student_rqs, window_index)
    if not picked:
        return None, coach(project, "지금은 억지로 물을 게 없어. 조금 더 진행하고 다시 눌러 줘.")
    rq = build_rq(picked, bar[-1], window_index, project.bar_index)
    with transaction.atomic():
        _close_open_rqs(project)
        rq.save()
        msg = push_message(project, "rq", rq=rq)
    return rq, msg


# ---------- 심화 ----------


def deep_open(project: Project) -> Message:
    return push_message(project, "deepPick")


def deep_ask(project: Project, lens: str, level: int) -> Message:
    return push_message(project, "deepQ", {"lens": lens, "level": level, "md": deep_question(lens, level, project)})


def deep_answer(student: Student, project: Project, lens: str, level: int, text: str) -> tuple[Note, Message, str | None]:
    question = Message.objects.filter(project=project, kind="deepQ").order_by("-created_at").first()
    with transaction.atomic():
        push_message(project, "user", {"text": text, "deep": True})
        note = Note.objects.create(project=project, lens=lens, level=level, question=question.body.get("md", "") if question else "", text=text)
    reply, nxt = deep_reply(lens, level, text, project, student)
    done = level >= 3
    if done:
        msg = coach(project, f"{reply}\n\n이 생각은 **생각 노트**에 모아 뒀어. 이제 하던 걸로 돌아가자.")
    else:
        actions = [
            {"label": "🔁 프로젝트로 돌려놓기" if level >= 2 else "⬇️ 한 단 더 깊이", "action": "deep:next"},
            {"label": "🔄 다른 렌즈로", "action": "deep:lens"},
            {"label": "✋ 여기까지", "action": "deep:stop"},
        ]
        msg = coach(project, reply, actions)
    return note, msg, nxt
