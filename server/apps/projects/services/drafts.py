"""아이템 초안 — 다섯 형식(논문 · 리서치 · 캠페인 · 서비스 · 제품)의 체크 칸. 브라우저 lib/draft.ts 와 같은 규칙."""
from apps.common import catalog

from ..models import Project


def draft_progress(project: Project) -> dict:
    f = catalog.format_of(project.format)
    checks = f["checks"] if f else []
    done = [c for c in checks if project.checks.get(c["key"])]
    nxt = next((c["key"] for c in checks if not project.checks.get(c["key"])), None)
    return {"done": len(done), "total": len(checks), "next": nxt}


def draft_context(project: Project) -> str:
    """코치에게 가는 맥락 — 형식과 빈칸을 알면 답이 초안을 채우는 쪽으로 간다."""
    f = catalog.format_of(project.format)
    if not f:
        return ""
    rows = [f"- {c['label']}: {project.checks.get(c['key']) or '(아직 비어 있음)'}" for c in f["checks"]]
    d = f["design"]
    return "\n".join(
        [
            f"초안 형식: {f['name']} — {f['draft']}",
            f"이 형식에서 설계란: 기획 = {d['plan']} / 알고리즘 = {d['algo']} / 전체 구조 = {d['arch']}",
            f"나중으로 미루는 것: {d['later']}",
            "형식별 코칭 지침:",
            *[f"- {c}" for c in f["coach"]],
            "초안 체크 칸 (학생이 정한 것):",
            *rows,
            "답은 이 형식에 맞추고, 비어 있는 칸을 학생이 스스로 정하도록 돕는다. 칸을 대신 채워 주지 않는다.",
        ]
    )


def format_intro(key: str) -> str:
    """형식을 고른 직후 코치가 하는 말."""
    f = catalog.format_of(key)
    if not f:
        return ""
    p = catalog.formats()["principle"]
    lines = [
        f"**{f['emoji']} {f['name']}** 초안으로 가자. 완성품이 아니라 **설계가 담긴 한 장짜리 초안**이야.",
        "",
        f"**{p['title']}** — 여기서 네가 쥘 것은 세 가지야:",
        *[f"- {a['emoji']} **{a['name']}** — {f['design'][a['key']]}" for a in p["axes"]],
        "",
        f"{f['design']['later']} 같은 건 **나중**이야. {p['coach']}",
        "",
        f"채울 칸은 {len(f['checks'])}개야:",
        *[f"{i + 1}. **{c['label']}** — {c['done']}" for i, c in enumerate(f["checks"])],
    ]
    return "\n".join(lines)


def check_keys(project: Project) -> list[str]:
    f = catalog.format_of(project.format)
    return [c["key"] for c in f["checks"]] if f else []


def plan_outline(project: Project, limit: int = 10) -> str:
    """기획서.md 의 제목줄만 — 코치 맥락에 싣는 요약."""
    heads = [line.lstrip("#").strip() for line in project.plan_md.splitlines() if line.startswith("## ")]
    return " · ".join(heads[:limit])
