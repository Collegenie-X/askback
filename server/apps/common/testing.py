"""테스트 도우미 — 기기 토큰을 발급받은 API 클라이언트."""
from rest_framework.test import APIClient

SMARTPOT_Q1 = "흙 센서값이 400 밑이면 펌프 3초 켜는 코드 짜줘"
SMARTPOT_Q2 = (
    "재봤어 — 마른 흙은 320쯤, 물 준 직후는 610쯤 나와. 400은 예제에서 베낀 숫자였어. "
    "그럼 지금 규칙(읽고 → 비교 → 3초 켜기)이 맞는 방향일까? 목표는 상추가 안 마르는 것, 제약은 5V 펌프에 다음 주 시연이야."
)


def student_client(nickname: str = "민준") -> tuple[APIClient, dict]:
    client = APIClient()
    res = client.post("/api/v1/auth/device", {"nickname": nickname, "grade": "중2", "interests": ["메이커"]}, format="json")
    assert res.status_code == 201, res.content
    body = res.json()["data"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {body['token']}")
    return client, body["user"]


def make_project(client: APIClient, **extra) -> dict:
    payload = {"name": "스마트 화분", "description": "상추 화분 — 센서에서 시작해 서버 · AI · 공유로", "emoji": "🌱", "packs": ["maker"], "format": "product", **extra}
    res = client.post("/api/v1/projects", payload, format="json")
    assert res.status_code == 201, res.content
    return res.json()["data"]["project"]
