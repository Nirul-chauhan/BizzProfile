"""SMS Provider abstraction layer.

Swap implementations by changing the provider in config.
"""
import abc
import logging

logger = logging.getLogger(__name__)


class SmsProvider(abc.ABC):
    """Abstract base class for SMS providers."""

    @abc.abstractmethod
    def send(self, phone: str, message: str) -> bool:
        """Send an SMS. Returns True on success."""
        ...


class ConsoleSmsProvider(SmsProvider):
    """Development provider — prints OTP to console."""

    def send(self, phone: str, message: str) -> bool:
        logger.info(f"[SMS to {phone}]: {message}")
        print(f"\n{'='*50}\nSMS to {phone}: {message}\n{'='*50}\n")
        return True


class TwilioSmsProvider(SmsProvider):
    """Twilio SMS provider — requires twilio SDK."""

    def __init__(self, account_sid: str, auth_token: str, from_number: str):
        from twilio.rest import Client
        self.client = Client(account_sid, auth_token)
        self.from_number = from_number

    def send(self, phone: str, message: str) -> bool:
        try:
            self.client.messages.create(body=message, from_=self.from_number, to=phone)
            return True
        except Exception as e:
            logger.error(f"Twilio SMS failed: {e}")
            return False


class Fast2SmsProvider(SmsProvider):
    """Fast2SMS provider — popular in India."""

    def __init__(self, api_key: str, sender_id: str = "FSTSMS"):
        self.api_key = api_key
        self.sender_id = sender_id

    def send(self, phone: str, message: str) -> bool:
        import requests
        try:
            resp = requests.post(
                "https://www.fast2sms.com/dev/bulkV2",
                headers={"authorization": self.api_key},
                data={"variables_values": message, "route": "otp", "numbers": phone},
                timeout=10,
            )
            return resp.status_code == 200 and resp.json().get("return")
        except Exception as e:
            logger.error(f"Fast2SMS failed: {e}")
            return False


def get_sms_provider() -> SmsProvider:
    """Factory — returns the configured SMS provider."""
    from app.config import get_settings
    settings = get_settings()
    provider = getattr(settings, "SMS_PROVIDER", "console")

    if provider == "twilio":
        return TwilioSmsProvider(
            account_sid=settings.TWILIO_ACCOUNT_SID,
            auth_token=settings.TWILIO_AUTH_TOKEN,
            from_number=settings.TWILIO_FROM_NUMBER,
        )
    elif provider == "fast2sms":
        return Fast2SmsProvider(api_key=settings.FAST2SMS_API_KEY)
    else:
        return ConsoleSmsProvider()
