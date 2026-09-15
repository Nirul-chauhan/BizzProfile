import re
from datetime import datetime
from pydantic import BaseModel, Field, field_validator, model_validator


_EMAIL_RE = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


# ---- Request Schemas ----


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=150)
    email: str
    mobile: str | None = Field(None, max_length=20)
    city: str | None = Field(None, max_length=100)
    state: str | None = Field(None, max_length=100)
    country: str | None = Field(None, max_length=100)
    password: str = Field(..., min_length=8, max_length=128)
    role: str = Field(default="USER", max_length=50)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not _EMAIL_RE.match(v):
            raise ValueError("Invalid email format.")
        return v


class SendOtpRequest(BaseModel):
    email: str | None = None
    mobile: str | None = None
    purpose: str = Field(default="EMAIL_VERIFICATION", max_length=30)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str | None) -> str | None:
        if v and not _EMAIL_RE.match(v):
            raise ValueError("Invalid email format.")
        return v

    @model_validator(mode="after")
    def check_email_or_mobile(self):
        if not self.email and not self.mobile:
            raise ValueError("Either email or mobile is required.")
        return self


class VerifyOtpRequest(BaseModel):
    email: str | None = None
    mobile: str | None = None
    otp: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")
    purpose: str = Field(default="EMAIL_VERIFICATION", max_length=30)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str | None) -> str | None:
        if v and not _EMAIL_RE.match(v):
            raise ValueError("Invalid email format.")
        return v

    @model_validator(mode="after")
    def check_email_or_mobile(self):
        if not self.email and not self.mobile:
            raise ValueError("Either email or mobile is required.")
        return self


class LoginRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not _EMAIL_RE.match(v):
            raise ValueError("Invalid email format.")
        return v


class ForgotPasswordRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not _EMAIL_RE.match(v):
            raise ValueError("Invalid email format.")
        return v


class ResetPasswordRequest(BaseModel):
    email: str
    otp: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")
    purpose: str = Field(default="FORGOT_PASSWORD", max_length=30)
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not _EMAIL_RE.match(v):
            raise ValueError("Invalid email format.")
        return v


class UpdateProfileRequest(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=150)
    city: str | None = Field(None, max_length=100)
    state: str | None = Field(None, max_length=100)
    country: str | None = Field(None, max_length=100)


# ---- Response Schemas ----


class RoleInfo(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    mobile: str | None
    city: str | None
    state: str | None
    country: str | None
    profile_pic: str | None
    is_email_verified: bool
    is_mobile_verified: bool
    is_active: bool
    role: RoleInfo
    created_at: datetime

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class MessageResponse(BaseModel):
    message: str


class DevOtpResponse(BaseModel):
    message: str
    otp: str
