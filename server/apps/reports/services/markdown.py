"""리포트 → .md (브라우저 reportToMd 와 같은 여덟 칸)."""
from apps.common import catalog
from apps.common.catalog import FORM_LABEL, O_KEYS, ROLE_KEYS, SIX_KEYS
from apps.coaching.engine.rq_picker import color_of

from ..models import Report
from .builder import LENGTH_INFO, LENGTH_KEYS, open_total, text_comment
from .sections import REPORT_SECTIONS, report_range


def _bar(n: int, max_n: int = 10) -> str:
    return "▇" * round(n / max_n * 10) or "·"


def elements_line(elements: list[dict]) -> str:
    return "".join(color_of(e.get("score")) for e in elements) if elements else "(없음)"


def report_to_md(report: Report, name: str) -> str:
    roles = catalog.roles()
    s = report.stats
    mix, rl, six = s["mix"], s["roles"], s["six"]
    elements, text = s.get("elements", []), s.get("text")
    total = open_total(mix)
    active = [k for k in ROLE_KEYS if rl.get(k)]
    top = sorted(active, key=lambda k: rl[k], reverse=True)[0] if active else None

    def h(i: int) -> str:
        n, title = REPORT_SECTIONS[i]
        return f"## {n} {title}"

    L = [f"# 📄 {report.title}", "", f"## “{report.headline}”", "", f"> {name} · {report_range(report)}", ""]

    top_line = f"{roles['roles'][top]['emoji']} {roles['roles'][top]['name']} {rl[top]}번" if top else "—"
    L += [
        h(0),
        f"- 🌅 열린 질문 {mix['O3'] + mix['O4']}/{total}",
        f"- 🪑 AI를 가장 많이 앉힌 자리: {top_line}",
        f"- 📏 질문 평균 길이: {text['avg']}자 ({text['min']}~{text['max']}자)" if text else "- 📏 질문 평균 길이: 기록 없음",
        f"- 🧭 되묻기 {len(elements)}번 {elements_line(elements)}",
        "",
    ]

    L += [h(1), "", "| 유형 | AI의 자리 | 막대 | 횟수 |", "|---|---|---|---|"]
    for k in O_KEYS:
        o = roles["openness"][k]
        role = roles["roles"][o["role"]]
        L.append(f"| {o['label']} | {role['emoji']} {role['name']} | {_bar(mix[k])} | {mix[k]} |")
    ref = roles["stageMix"].get(report.stage)
    if ref:
        L += ["", f"참고 ({report.stage} 단계에서 흔히 잘 통하는 비율) 좁은 질문 {ref['O2']}% · 열린 질문 {ref['O3']}% · 대안 질문 {ref['O4']}%"]
    L += ["", f"> 💬 {s.get('mix_comment', '')}", ""]

    L.append(h(2))
    if text:
        L += ["", "| 길이 | 횟수 | 실은 것(평균) | 열린 질문 |", "|---|---|---|---|"]
        for k in LENGTH_KEYS:
            info, b = LENGTH_INFO[k], text["buckets"][k]
            L.append(f"| {info['emoji']} {info['name']} ({info['range']}) | {b['count']} | {b['avg_six']}가지 | {b['open']} |")
        L += ["", f"> 💬 {text_comment(text)}", ""]
    else:
        L += ["질문 원문이 남아 있지 않아 글자 수를 셀 수 없어.", ""]

    L += [h(3), " · ".join(f"{roles['six'][k]['name']} {six[k]}/{total}" for k in SIX_KEYS), ""]

    L.append(h(4))
    if not elements:
        L.append("이번엔 되묻기에 답한 기록이 없어.")
    for e in elements:
        el = catalog.element_by_id(e["element"]) or {}
        state = color_of(e.get("score")) if e["status"] == "answered" else "➖ 나중에"
        L.append(f"- {el.get('icon', '')} {el.get('name', e['element'])} {state} {FORM_LABEL[e['form']]}({e['form']})" + (" · 힌트 후" if e.get("hint_stage") else ""))
    if elements:
        axes = catalog.axes()
        counts = {a["key"]: sum(1 for e in elements if catalog.axis_of(e["element"]) == a["key"]) for a in axes}
        thin = [a for a in axes if not counts[a["key"]]]
        L += ["", "**📐 이번에 확인한 세 축** — " + " · ".join(f"{a['emoji']} {a['name']} {counts[a['key']]}" for a in axes)]
        L.append(f"> {' · '.join(a['emoji'] + ' ' + a['name'] for a in thin)}는 이번에 한 번도 안 물었어 — {thin[0]['desc']}." if thin else "> 세 축을 다 확인했어.")
    L.append("")

    L.append(h(5))
    stuck = s.get("stuck", [])
    if not stuck:
        L.append("같은 개념을 두 번 이상 물은 곳은 없었어.")
    L += [f"- **{x['concept']}** 관련 질문이 이번에 {x['count_in_window']}번. 지금까지 합쳐 {x['count_total']}번째야." for x in stuck]
    L.append("")

    best = s.get("best")
    L += [h(6), *([f'> "{best["text"]}" — Q{best["turn_n"]}', "", f"💬 {best['reason']}"] if best else ["이번엔 뽑지 않았어."]), ""]

    last, nxt = report.last_mission, report.next_mission
    L += [
        h(7),
        f'- 지난 미션: "{last["text"]}" → {last["detail"]}' if last else "- 지난 미션: 아직 없어.",
        f"- 다음 미션 (하나만 · 바꿔도 돼): **{nxt.get('text', '')}**",
        f"  ← {nxt.get('basis', '')}",
    ]
    return "\n".join(L)
