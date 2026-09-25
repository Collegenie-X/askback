#!/usr/bin/env python3
"""시나리오 JSON 검사기 — python3 scripts/validate_scenario.py frontend/src/data/scenarios/<id>.json [--full]
--full: 15문 이상 · 2문 1역 · 답마다 열린 되묻기(ask) 규칙까지 검사한다.
리포트는 답 10개가 쌓였을 때 1장 — report 의 숫자는 앞의 10턴만 센다. 11번째부터는 다음 판(지난 리포트의 미션을 해내는 구간)."""
import json, re, sys

ROLES = {"typist", "coder", "engineer", "architect", "encyclopedia"}
ROLE_OF = {"O1": "typist", "O2": "coder", "O3": "engineer", "O4": "architect", "O5": "encyclopedia"}
CHIPS = {"widen", "narrow", "alt", "expand", "plan", "algo", "arch"}
ELEMENTS = {f"E{i}" for i in range(1, 13)} | {f"{p}{i}" for p in "MSCA" for i in range(1, 5)}
AXES = {"plan", "algo", "arch"}  # 🧭 기획 · 🔀 알고리즘 · 🏗 전체 구조 — 되묻기는 언제나 이 셋 중 하나를 확인한다
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
            need(rq.get("axis") in AXES, f"{tag}: rq.axis 는 plan · algo · arch 중 하나 (지금 {rq.get('axis')!r})")
            need(bool(rq.get("benefit")), f"{tag}: rq.benefit — 답하면 내 아이템의 어디가 세지는지 한 줄")
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
    # 🔥 7단계 기획 가이드를 얹은 시나리오 — 불씨 → 봉화. 얹은 것에만 엄격히 검사한다.
    if "spark" in s:
        sp = s["spark"]
        for k in ["title", "caption", "rule", "levels", "steps"]:
            need(k in sp, f"spark.{k} 없음")
        need(len(sp.get("levels", [])) == 4, "spark.levels 는 4단 (🕯 불씨 · 🔥 불꽃 · 🔦 횃불 · 🚀 봉화)")
        need(len(sp.get("steps", [])) == 7, "spark.steps 는 7칸")
        fills = {}
        for i, t in enumerate(turns, start=1):
            tag = f"turn[{i-1}] {t.get('id')}"
            ts = t.get("spark")
            need(bool(ts), f"{tag}: spark(7단계 중 어느 칸인가) 없음")
            if not ts:
                continue
            need(any(x["no"] == ts.get("step") for x in sp["steps"]), f"{tag}: spark.step {ts.get('step')} 가 7칸에 없음")
            need(bool(ts.get("now")) and bool(ts.get("next")), f"{tag}: spark.now · spark.next — 지금과 다음 방향 한 줄씩")
            if ts.get("fills"):
                need(ts["step"] not in fills, f"{tag}: {ts['step']}단계가 두 번 찬다 (이미 Q{fills.get(ts['step'])})")
                fills[ts["step"]] = i
            # 답 안의 열린 질문 — 코치가 정하지 않고 남긴 칸
            yc = t["answer"].get("yourCall") or []
            need(len(yc) >= 2, f"{tag}: answer.yourCall — 답 속 열린 질문이 둘 이상이어야 한다 (지금 {len(yc)})")
            need(all(q.rstrip().endswith("?") for q in yc), f"{tag}: answer.yourCall 은 모두 물음표로 끝나는 열린 질문")
        for st in sp["steps"]:
            for k in ["no", "emoji", "name", "goal", "check", "opens", "filledBy", "line"]:
                need(k in st, f"spark.steps[{st.get('no')}].{k} 없음")
            need(len(st.get("opens", [])) >= 2, f"{st.get('no')}단계: opens — 빈칸을 여는 열린 질문이 둘 이상")
            need(all(q.rstrip().endswith("?") for q in st.get("opens", [])), f"{st.get('no')}단계: opens 는 모두 물음표로 끝난다")
            need(fills.get(st["no"]) == st.get("filledBy"), f"{st.get('no')}단계: filledBy {st.get('filledBy')} ≠ 실제로 찬 질문 {fills.get(st['no'])}")
        # 힌트 3단은 답이 아니라 질문으로 끝난다
        for i, t in enumerate(turns, start=1):
            rq = t.get("reverseQuestion")
            if not rq:
                continue
            for k in ["hint", "example", "coachView"]:
                need(rq["hints"][k].rstrip().endswith("?"), f"turn[{i-1}] {t.get('id')}: hints.{k} 는 열린 질문으로 끝나야 한다 (물음표)")

    if full:
        # 📐 설계 묻기 — 세 축을 학생이 직접 묻는 칩에서 자란 질문이 둘 이상, 그중 기획이 하나 이상
        design = [t["fromChip"]["kind"] for t in turns if t.get("fromChip") and t["fromChip"]["kind"] in AXES]
        need(len(design) >= 2, f"📐 설계 묻기 칩에서 자란 질문이 {len(design)}개 — 둘 이상이어야 한다 (fromChip.kind = plan · algo · arch)")
        need("plan" in design, "📐 설계 묻기 중 🧭 기획(plan) 칩에서 자란 질문이 없음")
        # 세 축 고루 — 리포트 한 장(10문)마다 기획 · 알고리즘 · 전체 구조가 다 한 번은 확인돼야 한다
        for w, block in enumerate([turns[:10], turns[10:20]], start=1):
            got = {t["reverseQuestion"]["axis"] for t in block if t.get("reverseQuestion") and t["reverseQuestion"].get("axis")}
            for ax, label in [("plan", "🧭 기획"), ("algo", "🔀 알고리즘"), ("arch", "🏗 전체 구조")]:
                need(ax in got, f"{w}번째 리포트 구간에 {label} 을(를) 확인하는 역질문이 없음")
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
