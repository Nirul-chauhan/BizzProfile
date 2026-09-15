from datetime import datetime

from pydantic import BaseModel, field_validator

from app.models.social_link import SocialLinkPlatform


class SocialLinkCreate(BaseModel):
    platform: SocialLinkPlatform
    url: str

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v.strip()


class SocialLinkUpdate(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v.strip()


class SocialLinkResponse(BaseModel):
    id: int
    biz_profile_id: int
    platform: SocialLinkPlatform
    url: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
