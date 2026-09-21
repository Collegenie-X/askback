#!/usr/bin/env python3
"""시나리오 JSON 검사기 — python3 scripts/validate_scenario.py frontend/src/data/scenarios/<id>.json [--full]
--full: 15문 이상 · 2문 1역 · 답마다 열린 되묻기(ask) 규칙까지 검사한다.
리포트는 답 10개가 쌓였을 때 1장 — report 의 숫자는 앞의 10턴만 센다. 11번째부터는 다음 판(지난 리포트의 미션을 해내는 구간)."""
import json, re, sys

ROLES = {"typist", "coder", "engineer", "architect", "encyclopedia"}
ROLE_OF = {"O1": "typist", "O2": "coder", "O3": "engineer", "O4": "architect", "O5": "encyclopedia"}
CHIPS = {"widen", "narrow", "alt", "expand"}
ELEMENTS = {f"E{i}" for i in range(1, 9)} | {f"{p}{i}" for p in "MSCA" for i in range(1, 5)}
SIX = ["why", "context", "constraint", "criteria", "verify"]

def check(path, full):
    s = json.load(open(path))
    err = []
    def need(cond, msg):
        if not cond: err.append(msg)
    for k in ["id", "card", "stages", "planDoc", "meta", "student", "project", "window", "guides", "turns", "deep", "report"]:
        need(k in s, f"최상위 '{k}' 없음")
    if err: return err
    for k in ["intro", "afterTurns", "lens", "deep1", "deep2", "deep3", "deep4", "afterDeep", "report", "done"]:
        need(k in s["guides"], f"guides.{k} 없음")
    turns = s["turns"]
    if full:
        need(len(turns) >= 20, f"턴이 20개 이상이어야 함 — 리포트 2장 (지금 {len(turns)})")
        r2 = s.get("report2")
        need(bool(r2), "report2(2번째 리포트 — 질문 11~20) 없음")
        if r2:
            for k in ["title", "headline", "range", "lastMission", "mixComment", "best", "nextMission"]:
                need(k in r2, f"report2.{k} 없음")
            need(r2.get("title", "").endswith("2번째 리포트"), "report2.title은 '{프로젝트 이름} · 2번째 리포트'")
            need(r2.get("lastMission", {}).get("text") == s["report"]["nextMission"]["text"], "report2.lastMission.text는 report.nextMission.text와 같아야 함")
            second = turns[10:20]
            q = r2.get("best", {}).get("question", "").lstrip("…")[:24]
            need(any(q and q in t["question"] for t in second), "report2.best.question은 11~20번째 질문 중 하나의 일부여야 함")
        need(len({t["id"] for t in turns}) == len(turns), "turn id 중복")
        need(s["window"]["startCount"] == 0 and s["window"]["size"] == 10, "window는 startCount 0 · size 10")
    need(s["window"]["startCount"] + len(turns) >= s["window"]["size"], "startCount + 턴 수 ≥ size 여야 리포트가 나온다")
    prev = None
    for i, t in enumerate(turns):
        tag = f"turn[{i}] {t.get('id')}"
        for k in ["id", "number", "time", "stage", "scene", "openness", "opennessLabel", "question", "answer", "six", "chips", "guide"]:
            need(k in t, f"{tag}: '{k}' 없음")
        a = t["answer"]
        for k in ["md", "assumptions", "role", "roleReason"]:
            need(k in a, f"{tag}: answer.{k} 없음")
        need(a["role"] in ROLES, f"{tag}: role {a['role']}")
        need(ROLE_OF.get(t["openness"]) == a["role"], f"{tag}: openness {t['openness']} ↔ role {a['role']} 불일치")
        need(0 <= t["stage"] < len(s["stages"]), f"{tag}: stage 범위")
        need(bool(t.get("plan")) != bool(t.get("planSkip")), f"{tag}: plan 또는 planSkip 중 하나만")
        need(all(c in CHIPS for c in t["chips"]), f"{tag}: chips")
        if t["six"] is not None:
            need(all(k in t["six"] for k in SIX), f"{tag}: six 키")
        fences = re.findall(r"```(\w*)", a["md"])[::2]
        need(all(f == "mermaid" for f in fences), f"{tag}: 답에 mermaid 외 코드블록 {fences} — 코드는 넣지 않는다")
        for m in re.findall(r"```mermaid\n(.*?)```", a["md"], re.S):
            need(m.strip().startswith("flowchart TD"), f"{tag}: mermaid는 flowchart TD")
        if t.get("fromChip"):
            need(prev is not None and t["fromChip"]["kind"] in prev["chips"], f"{tag}: fromChip.kind가 직전 턴 chips에 없음")
            need("___" in t["fromChip"]["draft"], f"{tag}: 칩 초안에 ___ 빈칸")
        rq = t.get("reverseQuestion")
        if full:
            need(bool(a.get("ask")), f"{tag}: answer.ask(열린 되묻기) 없음")
            need(bool(rq) == (i % 2 == 1), f"{tag}: 역질문은 짝수 번째 턴(2·4·6…)에만")
        if rq:
            need(rq["element"] in ELEMENTS, f"{tag}: rq.element {rq['element']}")
            need(rq["form"] in ("F1", "F3"), f"{tag}: rq.form")
            for k in ["elementIcon", "elementLabel", "formLabel", "question", "hints", "scoreReason", "dontKnowFeedback"]:
                need(k in rq, f"{tag}: rq.{k} 없음")
            if rq["form"] == "F1":
                o = rq.get("options", [])
                need(len(o) == 4 and o[-1].get("dontKnow"), f"{tag}: F1 보기 3개 + '잘 모르겠어'")
                need("demoOptionIndex" in rq, f"{tag}: demoOptionIndex")
                need(all("feedback" in x for x in o), f"{tag}: 보기마다 feedback")
            else:
                need(all(k in rq for k in ["demoAnswer", "demoFeedback", "demoScore"]), f"{tag}: F3 demoAnswer/Feedback/Score")
        prev = t
    first = turns[: s["window"]["size"] - s["window"]["startCount"]]  # 리포트가 세는 구간
    roles = [t["answer"]["role"] for t in first]
    if s["window"]["startCount"] == 0:
        for (k, label), row in zip(zip(SIX, "왜맥제기검"), s["report"]["six"]):
            n = sum(1 for t in first if t["six"] and t["six"].get(k))
            need(row["value"] == n, f"report.six {label} = {row['value']} ≠ 앞 10턴의 실제 {n}")
        for m in s["report"]["mix"]:
            need(m["count"] == roles.count(m["role"]), f"report.mix {m['role']} = {m['count']} ≠ 실제 {roles.count(m['role'])}")
    msgs = s["deep"]["messages"]
    need(msgs and msgs[-1].get("final"), "deep.messages 마지막은 final")
    need(any(l["key"] == s["deep"]["demoLens"] for l in s["deep"]["lenses"]), "deep.demoLens")
    return err

if __name__ == "__main__":
    full = "--full" in sys.argv
    bad = 0
    for p in [a for a in sys.argv[1:] if not a.startswith("--")]:
        e = check(p, full)
        print(("❌ " if e else "✅ ") + p)
        for x in e: print("   -", x)
        bad += bool(e)
    sys.exit(1 if bad else 0)
