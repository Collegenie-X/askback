from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class TurnRateThrottle(UserRateThrottle):
    """학생당 분당 질문 수 (Claude 비용이 드는 요청)."""

    scope = "turns"


class DeviceIssueThrottle(AnonRateThrottle):
    """IP당 기기 토큰 발급 수."""

    scope = "device"


class ImportThrottle(UserRateThrottle):
    scope = "import"
