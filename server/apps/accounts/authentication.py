"""Authorization: Bearer abk_… → 학생."""
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import exceptions
from rest_framework.authentication import BaseAuthentication, get_authorization_header

from .models import Device
from .tokens import hash_token

_TOUCH_EVERY = timedelta(minutes=5)  # 마지막 사용 시각은 5분에 한 번만 쓴다 (쓰기 줄이기)


class DeviceTokenAuthentication(BaseAuthentication):
    keyword = b"bearer"

    def authenticate(self, request):
        parts = get_authorization_header(request).split()
        if not parts or parts[0].lower() != self.keyword:
            return None
        if len(parts) != 2:
            raise exceptions.AuthenticationFailed("토큰 형식이 올바르지 않아. 'Bearer <토큰>' 으로 보내 줘.")

        device = (
            Device.objects.select_related("student")
            .filter(token_hash=hash_token(parts[1].decode(errors="ignore")), revoked_at__isnull=True)
            .first()
        )
        if device is None:
            raise exceptions.AuthenticationFailed("기기 토큰이 맞지 않거나 폐기됐어.")

        now = timezone.now()
        if now - device.last_seen_at > timedelta(days=settings.ASKBACK["DEVICE_IDLE_DAYS"]):
            raise exceptions.AuthenticationFailed("오래 쓰지 않아 토큰이 만료됐어. 새로 발급해 줘.")
        if now - device.last_seen_at > _TOUCH_EVERY:
            Device.objects.filter(pk=device.pk).update(last_seen_at=now)
        return device.student, device

    def authenticate_header(self, request):
        return 'Bearer realm="askback"'
