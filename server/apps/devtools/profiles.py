"""더미 학생 명단.

- 시나리오 학생 4명: frontend/src/data/scenarios/*.json 의 실제 질문 20개 · 역질문 답을 그대로 쓴다.
- 추가 학생 6명: 형식(논문 · 리서치 · 캠페인 · 서비스 · 제품)마다 질문 틀(formats.json 의 checks · quick)에 낱말을 채워 만든다.
  질문 수를 일부러 들쭉날쭉하게 둬서 리포트 0장 · 1장 · 2장인 프로젝트가 섞이게 한다.
"""

SCENARIOS = ["smartpot", "pet-diary", "turtle-neck", "safe-route"]

EXTRA_STUDENTS = [
    {
        "nickname": "하린", "grade": "중1", "interests": ["글쓰기", "환경"],
        "project": {"name": "급식 잔반 리서치", "emoji": "🍱", "format": "research", "packs": ["share"],
                    "description": "우리 학교 급식 잔반이 왜 많은지 — 설문에서 시작해 인터뷰 · 그래프로"},
        "words": ["급식 잔반", "1학년 3반 친구들", "잔반 무게 기록", "영양사 선생님"], "goal": "잔반이 줄었다는 걸 숫자로 보이기",
        "turns": 14,
    },
    {
        "nickname": "도윤", "grade": "중2", "interests": ["영상", "게임"],
        "project": {"name": "분리수거 30초 영상", "emoji": "🎬", "format": "campaign", "packs": ["share"],
                    "description": "페트병 라벨 떼기 — 30초 AI 영상 한 편으로 반 친구들 행동 바꾸기"},
        "words": ["페트병 라벨 떼기", "우리 반 친구들", "첫 장면 라벨 클로즈업", "캡컷"], "goal": "보고 나서 라벨을 떼는 사람이 늘어나는 것",
        "turns": 23,
    },
    {
        "nickname": "지우", "grade": "중3", "interests": ["과학", "수학"],
        "project": {"name": "수면 시간과 집중력", "emoji": "📄", "format": "paper", "packs": [],
                    "description": "잠을 1시간 더 자면 수학 문제 집중 시간이 늘까 — 2주 자기 실험"},
        "words": ["수면 시간과 집중력", "잠을 더 자면 집중이 오래 간다", "수면 시간", "문제 푼 시간"], "goal": "2주 기록으로 한 문장 결론 내기",
        "turns": 7,
    },
    {
        "nickname": "예준", "grade": "중2", "interests": ["코딩", "밴드"],
        "project": {"name": "동아리 출석 체크", "emoji": "💻", "format": "service", "packs": ["collab", "share"],
                    "description": "밴드 동아리 연습 출석을 단톡 대신 버튼 한 번으로"},
        "words": ["동아리 출석 확인", "부장 서준이", "출석 기록", "구글 시트"], "goal": "부장이 출석 세는 시간이 0분이 되는 것",
        "turns": 11,
    },
    {
        "nickname": "소율", "grade": "중1", "interests": ["만들기"],
        "project": {"name": "아침 자동 커튼", "emoji": "🪟", "format": "product", "packs": ["maker"],
                    "description": "해가 뜨면 커튼이 열리는 작은 모터 장치"},
        "words": ["커튼을 여는", "조도 센서", "모터", "내 방 창문"], "goal": "알람 없이 일어나기",
        "turns": 4,
    },
    {
        "nickname": "시우", "grade": "중3", "interests": ["버스", "지도"],
        "project": {"name": "학원 셔틀 알림", "emoji": "🚌", "format": "service", "packs": ["ai"],
                    "description": "셔틀이 5분 전에 오면 알려주는 웹 — 지금은 쉬는 중"},
        "words": ["셔틀 도착 알림", "같은 학원 친구들", "도착 시각", "카카오맵"], "goal": "셔틀을 놓치지 않기",
        "turns": 3, "deleted": True,  # 지운 프로젝트 (30일 안에 복구 가능) 예시
    },
]

# 형식 틀 말고 섞어 넣는 질문 — 개방도가 골고루 나오게 (O1 · O2 · O3 · O4 · O5)
GENERIC_QUESTIONS = [
    "{topic} 말고 다른 방법은 없을까? 각각 잃는 건 뭐야?",
    "{topic} 어떻게 시작해?",
    "지금 {topic} 구조가 맞는 방향일까? 목표는 {goal}이고 제약은 다음 주 발표까지야.",
    "{topic} 잘 됐는지 어떻게 확인해? 기준은 {people}가 혼자 쓸 수 있으면 돼.",
    "방금 표에서 두 번째 줄 이름을 '{people}'로 바꿔줘.",
    "{topic} 체크리스트 만들어줘",
    "{topic}에서 이번엔 안 할 걸 정하고 싶어. 시간이 일주일밖에 없는데 뭘 빼는 게 좋을까?",
    "{people}한테 보여줬더니 헷갈려했어. 어디가 문제일까? 내가 확인한 건 첫 화면이야.",
]

# 추가 학생이 역질문에 직접 쓰는 답 — 길이 · 이유 유무가 섞여서 점수가 고르게 나온다
FREE_ANSWERS = [
    "{people}가 먼저 써 봐야 알 것 같아. 왜냐하면 내가 쓰면 다 아니까 헷갈리는 곳이 안 보여서.",
    "기준은 일주일 동안 3번 이상 쓰는 거.",
    "그건 아직 안 정했어",
    "{topic}에서 제일 먼저 막히는 곳부터 고칠래. 거기서 멈추면 뒤는 아무도 안 보니까.",
    "음 모르겠는데 일단 해볼게",
    "빼도 되는 건 꾸미기야. 핵심은 {topic}이라서 그것만 되면 돼.",
]

SMALLTALK = ["고마워!", "ㅇㅋ", "좋아"]  # 관문에 걸리는 말 — 턴으로 세지 않는다
