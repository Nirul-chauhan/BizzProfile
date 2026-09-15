import re
from urllib.parse import urlparse

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.biz_profile import (
    BizProfile,
    CompanyProfile,
    IndividualProfile,
    MsmProfile,
    ProfileType,
)
from app.models.category import Category, Subcategory


CHILD_MODEL_MAP = {
    ProfileType.COMPANY: CompanyProfile,
    ProfileType.INDIVIDUAL: IndividualProfile,
    ProfileType.MSME: MsmProfile,
}

DETAIL_KEY_MAP = {
    ProfileType.COMPANY: "company_detail",
    ProfileType.INDIVIDUAL: "individual_detail",
    ProfileType.MSME: "msme_detail",
}


class BizProfileError(Exception):
    pass


class BizProfileService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _generate_slug(self, name: str) -> str:
        slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
        base = slug
        counter = 1
        while self.db.execute(
            select(BizProfile).where(BizProfile.slug == slug)
        ).scalars().first():
            slug = f"{base}-{counter}"
            counter += 1
        return slug

    def _validate_category(self, category_id: int, subcategory_id: int | None) -> None:
        cat = self.db.execute(
            select(Category).where(Category.id == category_id)
        ).scalars().first()
        if cat is None:
            raise BizProfileError("Category not found.")
        if not cat.is_active:
            raise BizProfileError("Category is not active.")

        if subcategory_id is not None:
            sub = self.db.execute(
                select(Subcategory).where(
                    Subcategory.id == subcategory_id,
                    Subcategory.category_id == category_id,
                )
            ).scalars().first()
            if sub is None:
                raise BizProfileError("Subcategory not found or does not belong to this category.")
            if not sub.is_active:
                raise BizProfileError("Subcategory is not active.")

    def _validate_url(self, value: str | None, field_name: str) -> None:
        if value is None:
            return
        parsed = urlparse(value)
        if parsed.scheme not in ("http", "https"):
            raise BizProfileError(f"{field_name} must be a valid HTTP/HTTPS URL.")

    def _validate_email(self, value: str | None) -> None:
        if value is None:
            return
        if not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", value):
            raise BizProfileError("Invalid email format.")

    def _validate_phone(self, value: str | None) -> None:
        if value is None:
            return
        cleaned = re.sub(r"[\s\-\(\)+]", "", value)
        if not cleaned.isdigit() or len(cleaned) < 7 or len(cleaned) > 15:
            raise BizProfileError("Invalid phone format.")

    def _validate_lat_lng(self, lat: float | None, lng: float | None) -> None:
        if lat is not None and not (-90 <= lat <= 90):
            raise BizProfileError("Latitude must be between -90 and 90.")
        if lng is not None and not (-180 <= lng <= 180):
            raise BizProfileError("Longitude must be between -180 and 180.")

    def _validate_pincode(self, value: str | None) -> None:
        if value is None:
            return
        if not re.match(r"^[a-zA-Z0-9\- ]{3,20}$", value):
            raise BizProfileError("Invalid pincode format.")

    def _validate_detail_for_type(self, profile_type: str, detail_data: dict | None) -> None:
        if detail_data is None:
            return
        pt = ProfileType(profile_type)
        expected_key = DETAIL_KEY_MAP[pt]
        allowed_keys = set()
        if expected_key == "company_detail":
            allowed_keys = {"company_registration_number", "legal_name", "company_type"}
        elif expected_key == "individual_detail":
            allowed_keys = {"professional_name", "profession", "experience_years", "services"}
        elif expected_key == "msme_detail":
            allowed_keys = {"msme_number", "business_type", "industry"}

        unexpected = set(detail_data.keys()) - allowed_keys
        if unexpected:
            raise BizProfileError(
                f"Invalid fields for {profile_type} profile: {', '.join(sorted(unexpected))}"
            )

    def _create_child(self, profile: BizProfile, profile_type: str, detail_data: dict | None) -> None:
        if detail_data is None:
            return
        pt = ProfileType(profile_type)
        child_cls = CHILD_MODEL_MAP[pt]
        child = child_cls(biz_profile_id=profile.id, **detail_data)
        self.db.add(child)

    def _update_child(self, profile: BizProfile, profile_type: str, detail_data: dict | None) -> None:
        if detail_data is None:
            return
        pt = ProfileType(profile_type)
        child_cls = CHILD_MODEL_MAP[pt]
        child = self.db.execute(
            select(child_cls).where(child_cls.biz_profile_id == profile.id)
        ).scalars().first()
        if child is None:
            child = child_cls(biz_profile_id=profile.id, **detail_data)
            self.db.add(child)
        else:
            for key, value in detail_data.items():
                setattr(child, key, value)

    def create(
        self,
        user_id: int,
        category_id: int,
        profile_type: str,
        business_name: str,
        slug: str | None = None,
        subcategory_id: int | None = None,
        company_detail: dict | None = None,
        individual_detail: dict | None = None,
        msme_detail: dict | None = None,
        **kwargs,
    ) -> BizProfile:
        self._validate_category(category_id, subcategory_id)
        self._validate_url(kwargs.get("website"), "Website")
        self._validate_url(kwargs.get("logo_url"), "Logo URL")
        self._validate_url(kwargs.get("cover_image_url"), "Cover image URL")
        self._validate_email(kwargs.get("email"))
        self._validate_phone(kwargs.get("phone"))
        self._validate_lat_lng(kwargs.get("latitude"), kwargs.get("longitude"))
        self._validate_pincode(kwargs.get("pincode"))

        detail_map = {
            "COMPANY": company_detail,
            "INDIVIDUAL": individual_detail,
            "MSME": msme_detail,
        }
        detail_data = detail_map.get(profile_type)
        self._validate_detail_for_type(profile_type, detail_data)

        if slug:
            existing = self.db.execute(
                select(BizProfile).where(BizProfile.slug == slug)
            ).scalars().first()
            if existing:
                raise BizProfileError("Slug already exists.")
        else:
            slug = self._generate_slug(business_name)

        profile = BizProfile(
            user_id=user_id,
            category_id=category_id,
            subcategory_id=subcategory_id,
            profile_type=profile_type,
            business_name=business_name,
            slug=slug,
            **kwargs,
        )
        self.db.add(profile)
        self.db.flush()

        self._create_child(profile, profile_type, detail_data)

        self.db.commit()
        self.db.refresh(profile)
        return profile

    def get_my_profiles(self, user_id: int) -> list[BizProfile]:
        return list(
            self.db.execute(
                select(BizProfile).where(BizProfile.user_id == user_id).order_by(BizProfile.created_at.desc())
            ).scalars().all()
        )

    def get_by_id(self, profile_id: int) -> BizProfile:
        profile = self.db.execute(
            select(BizProfile).where(BizProfile.id == profile_id)
        ).scalars().first()
        if profile is None:
            raise BizProfileError("Profile not found.")
        return profile

    def update(
        self,
        profile_id: int,
        user_id: int,
        is_admin: bool = False,
        company_detail: dict | None = None,
        individual_detail: dict | None = None,
        msme_detail: dict | None = None,
        **kwargs,
    ) -> BizProfile:
        profile = self.get_by_id(profile_id)

        if not is_admin and profile.user_id != user_id:
            raise BizProfileError("You can only modify your own profiles.")

        if "category_id" in kwargs or "subcategory_id" in kwargs:
            cat_id = kwargs.get("category_id", profile.category_id)
            sub_id = kwargs.get("subcategory_id", profile.subcategory_id)
            self._validate_category(cat_id, sub_id)

        if "website" in kwargs:
            self._validate_url(kwargs["website"], "Website")
        if "logo_url" in kwargs:
            self._validate_url(kwargs["logo_url"], "Logo URL")
        if "cover_image_url" in kwargs:
            self._validate_url(kwargs["cover_image_url"], "Cover image URL")
        if "email" in kwargs:
            self._validate_email(kwargs["email"])
        if "phone" in kwargs:
            self._validate_phone(kwargs["phone"])
        if "latitude" in kwargs or "longitude" in kwargs:
            lat = kwargs.get("latitude", profile.latitude)
            lng = kwargs.get("longitude", profile.longitude)
            self._validate_lat_lng(lat, lng)
        if "pincode" in kwargs:
            self._validate_pincode(kwargs["pincode"])

        if "slug" in kwargs and kwargs["slug"] is not None:
            existing = self.db.execute(
                select(BizProfile).where(
                    BizProfile.slug == kwargs["slug"],
                    BizProfile.id != profile_id,
                )
            ).scalars().first()
            if existing:
                raise BizProfileError("Slug already exists.")

        for key, value in kwargs.items():
            if value is not None:
                setattr(profile, key, value)

        detail_map = {
            "COMPANY": company_detail,
            "INDIVIDUAL": individual_detail,
            "MSME": msme_detail,
        }
        detail_data = detail_map.get(profile.profile_type)
        if detail_data is not None:
            self._validate_detail_for_type(profile.profile_type, detail_data)
            self._update_child(profile, profile.profile_type, detail_data)

        self.db.commit()
        self.db.refresh(profile)
        return profile

    def delete(self, profile_id: int, user_id: int, is_admin: bool = False) -> None:
        profile = self.get_by_id(profile_id)

        if not is_admin and profile.user_id != user_id:
            raise BizProfileError("You can only delete your own profiles.")

        self.db.delete(profile)
        self.db.commit()
