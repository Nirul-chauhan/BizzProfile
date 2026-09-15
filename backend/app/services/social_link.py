from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.biz_profile import BizProfile
from app.models.social_link import SocialLink, SocialLinkPlatform


class SocialLinkError(Exception):
    pass


class SocialLinkService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _get_profile(self, profile_id: int) -> BizProfile:
        profile = self.db.execute(
            select(BizProfile).where(BizProfile.id == profile_id)
        ).scalars().first()
        if profile is None:
            raise SocialLinkError("Profile not found.")
        return profile

    def _check_ownership(self, profile: BizProfile, user_id: int, is_admin: bool) -> None:
        if not is_admin and profile.user_id != user_id:
            raise SocialLinkError("You can only modify your own profiles.")

    def _check_duplicate_platform(self, profile_id: int, platform: SocialLinkPlatform) -> None:
        existing = self.db.execute(
            select(SocialLink).where(
                SocialLink.biz_profile_id == profile_id,
                SocialLink.platform == platform.value,
            )
        ).scalars().first()
        if existing:
            raise SocialLinkError(f"A link for {platform.value} already exists for this profile.")

    def create(
        self,
        profile_id: int,
        platform: SocialLinkPlatform,
        url: str,
        user_id: int,
        is_admin: bool = False,
    ) -> SocialLink:
        profile = self._get_profile(profile_id)
        self._check_ownership(profile, user_id, is_admin)
        self._check_duplicate_platform(profile_id, platform)

        social_link = SocialLink(
            biz_profile_id=profile_id,
            platform=platform.value,
            url=url,
        )
        self.db.add(social_link)
        self.db.commit()
        self.db.refresh(social_link)
        return social_link

    def get_by_profile(self, profile_id: int) -> list[SocialLink]:
        self._get_profile(profile_id)
        return list(
            self.db.execute(
                select(SocialLink)
                .where(SocialLink.biz_profile_id == profile_id)
                .order_by(SocialLink.created_at)
            ).scalars().all()
        )

    def get_by_id(self, social_link_id: int) -> SocialLink:
        link = self.db.execute(
            select(SocialLink).where(SocialLink.id == social_link_id)
        ).scalars().first()
        if link is None:
            raise SocialLinkError("Social link not found.")
        return link

    def update(
        self,
        social_link_id: int,
        url: str,
        user_id: int,
        is_admin: bool = False,
    ) -> SocialLink:
        link = self.get_by_id(social_link_id)
        profile = self._get_profile(link.biz_profile_id)
        self._check_ownership(profile, user_id, is_admin)

        link.url = url
        self.db.commit()
        self.db.refresh(link)
        return link

    def delete(
        self,
        social_link_id: int,
        user_id: int,
        is_admin: bool = False,
    ) -> None:
        link = self.get_by_id(social_link_id)
        profile = self._get_profile(link.biz_profile_id)
        self._check_ownership(profile, user_id, is_admin)

        self.db.delete(link)
        self.db.commit()
