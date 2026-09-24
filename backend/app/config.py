from pydantic import Field
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # --- App ---
    APP_NAME: str = "BizzProfile"
    APP_VERSION: str = "0.1.0"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # --- Database ---
    DATABASE_URL: str = Field(..., description="PostgreSQL connection string")
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800

    # --- Security ---
    SECRET_KEY: str = Field(..., description="JWT signing secret — REQUIRED")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # --- OTP ---
    OTP_EXPIRE_MINUTES: int = 5
    OTP_RATE_LIMIT: int = 3
    OTP_RATE_WINDOW_MINUTES: int = 10

    # --- SMS Provider ---
    SMS_PROVIDER: str = "console"  # console | twilio | fast2sms
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""
    FAST2SMS_API_KEY: str = ""

    # --- Signup Token ---
    SIGNUP_TOKEN_EXPIRE_MINUTES: int = 15

    # --- CORS ---
    CORS_ORIGINS: str = "http://localhost:5173"

    # --- Storage ---
    STORAGE_DIR: str = "uploads"

    model_config = {"env_file": ".env", "extra": "ignore"}

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
