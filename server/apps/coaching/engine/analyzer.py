"""분석기 (설계서 §4-2 · §4-3) — 브라우저 lib/analyzer.ts 를 그대로 옮긴 신호 규칙.

Claude 가 답하면 개방도 · 6요소 · 단계 · 개념은 모델 값으로 덮어쓴다 (answerer.py).
urgent · signals · context_load 는 늘 이 규칙의 값을 쓴다.
"""
import re
from collections.abc import Sequence

from apps.common import catalog
from apps.common.catalog import SIX_KEYS

RX = {
    "emotional": re.compile(r"(우울|죽고\s?싶|자해|외로워|너무 힘들어|살기 싫|불안해서|왕따|괴롭힘)"),
    "smalltalk": re.compile(r"^(ㅇㅇ|ㅇㅋ|ㄱㅅ|고마워|고맙|감사|안녕|하이|오+ ?된다|된다|ㅋ+|ㅎ+|넵|네|응|굿|좋아|알겠어|오케이|ok)[\s!~.ㅋㅎ]*$", re.I),
    "howto": re.compile(r"(리포트|설정|타임라인|기록).{0,8}(어디|어떻게 봐|어디서)"),
    "alt": re.compile(r"(말고|다른 (방법|방식|길)|비교|장단점|잃는|틀리는 조건|대안|vs\b|차이가 뭐)", re.I),
    "open": re.compile(r"(어떻게|왜|어떤 방식|어떤 게|뭐가 좋|좋을까|맞을까|방향|일까|할까|을까|인가|이유)"),
    "spec": re.compile(r"(짜\s?줘|만들어\s?줘|써\s?줘|작성해\s?줘|코드|구현해)"),
    "directive": re.compile(r"(바꿔\s?줘|고쳐\s?줘|수정해\s?줘|로 바꿔|번째? 줄|지워\s?줘|추가해\s?줘|이름을|으로 해줘)"),
    "format_limit": re.compile(r"(코드만|한 줄로|짧게만|설명 없이)"),
    "urgent": re.compile(r"(빨리|급해|분 뒤|곧 발표|시간 없|마감)"),
    "why": re.compile(r"(위해|하려고|하고 싶|목표|목적|때문에|싶어서)"),
    "context": re.compile(r"(지금|현재|상황|쓰고 있|가지고 있|가진|우노|보드|학년|프로젝트|만들고 있|꽂았|연결했)"),
    "constraint": re.compile(r"(안에|까지|만 가지고|제약|예산|시간이|[0-9]+\s?(v|V|시간|분|일|원|cm)|없이|밖에 없|다음 주|내일)"),
    "criteria": re.compile(r"(기준|잘 됐|성공|않는 게|않아야|이면 돼|해야 해|이하|이상이면|깜빡이지)"),
    "verify": re.compile(r"(확인|테스트|검증|맞는지|로그|재 ?보)"),
    "discard": re.compile(r"(말고|빼고|제외|안 쓸|쓰지 않|버리|없이)"),
    "stage_verify": re.compile(r"(에러|오류|안 돼|안돼|테스트|확인|error|exception)", re.I),
    "stage_build": re.compile(r"(짜\s?줘|코드|구현|바꿔|고쳐|만들어\s?줘)"),
    "stage_design": re.compile(r"(구조|설계|방식|로직|어떻게 잡|아키텍처)"),
}
_CODE_FENCE = re.compile(r"```[\s\S]*?```")
_HANGUL = re.compile(r"[가-힣]")


def bigrams(s: str) -> set[str]:
    t = re.sub(r"\s+", "", s).lower()
    return {t[i : i + 2] for i in range(len(t) - 1)}


def similarity(a: str, b: str) -> float:
    """글자쌍 자카드 유사도 — 중복 질문 · AI 답 베끼기 판정."""
    A, B = bigrams(a), bigrams(b)
    if not A or not B:
        return 0.0
    inter = len(A & B)
    return inter / (len(A) + len(B) - inter)


def topic_of(q: str, limit: int = 22) -> str:
    t = re.sub(r"\s+", " ", _CODE_FENCE.sub("", q)).strip()
    return t[:limit] + "…" if len(t) > limit else t


def six_of(text: str) -> dict[str, float]:
    return {k: 1.0 if RX[k].search(text) else 0.0 for k in SIX_KEYS}


def analyze(text: str, history: Sequence, project_desc: str) -> dict:
    """history: 이 프로젝트의 이전 턴들 (question · six · openness 를 가진 객체)."""
    q = text.strip()
    lower = q.lower()
    base = {
        "valid": True,
        "invalid_reason": None,
        "six": six_of(q),
        "openness": "NA",
        "context_load": 0,
        "stage": "탐색",
        "urgent": bool(RX["urgent"].search(q)),
        "signals": [],
        "concepts": [c for c in catalog.concepts() if c.lower() in lower][:3],
    }

    # ① 관문 — 질문으로 세지 않는 것
    if RX["emotional"].search(q):
        return {**base, "valid": False, "invalid_reason": "emotional"}
    if len(q) <= 12 and RX["smalltalk"].search(q):
        return {**base, "valid": False, "invalid_reason": "smalltalk"}
    if RX["howto"].search(q):
        return {**base, "valid": False, "invalid_reason": "howto"}
    prev = history[-1] if history else None
    if prev is not None and similarity(prev.question, q) >= 0.9:
        return {**base, "valid": False, "invalid_reason": "duplicate"}

    base["stage"] = (
        "검증" if RX["stage_verify"].search(q) else "구현" if RX["stage_build"].search(q) else "설계" if RX["stage_design"].search(q) else "탐색"
    )

    # 코드 · 에러만 붙여넣음 → 판별 불가
    if len(q) > 20 and len(_HANGUL.findall(q)) / len(q) < 0.15:
        return {**base, "openness": "NA", "stage": "검증", "signals": ["paste"]}

    # 맥락량 — 앞선 3턴에서 준 맥락 · 제약 · 기준도 친다
    recent = list(history[-3:])

    def carried(k: str) -> bool:
        return base["six"][k] >= 0.5 or any(t.six[k] >= 0.5 for t in recent)

    load = 0
    if carried("context") or project_desc.strip():
        load += 1
    if carried("constraint"):
        load += 1
    if carried("criteria"):
        load += 1
    base["context_load"] = load

    sig = {k: bool(RX[k].search(q)) for k in ("alt", "open", "spec", "directive")}
    sig["limit"] = bool(RX["format_limit"].search(q))
    base["signals"] = [k for k, v in sig.items() if v]

    if sig["alt"]:
        o = "O4" if load >= 1 else "O5"
    elif sig["directive"] and not sig["open"]:
        o = "O1"
    elif sig["spec"] and not sig["open"]:
        o = "O2"
    elif sig["open"]:
        o = "O3" if load >= 2 else "O2" if sig["spec"] else "O3" if load == 1 and len(q) > 40 else "O5"
    else:
        o = "O5" if len(q) < 25 else "O2"
    if sig["limit"] and o == "O3":
        o = "O2"
    base["openness"] = o
    return base
