"""Seller service layer — all business logic for the seller backend."""
import re
import uuid
from datetime import datetime, timezone, timedelta
from math import radians, sin, cos, sqrt, atan2
from typing import Any

from sqlalchemy import func, select, and_
from sqlalchemy.orm import Session, joinedload

from app.models.biz_profile import BizProfile
from app.models.product import Product, ProductImage, ProductStatus, ProductApprovalStatus
from app.models.service import BizService, ServiceStatus, ServiceApprovalStatus
from app.models.trending_video import TrendingVideo, VideoApprovalStatus
from app.models.business_hours import BusinessHour
from app.models.enquiry import Enquiry, EnquiryStatus
from app.models.quotation import Quotation, QuotationStatus
from app.models.requirement import Requirement
from app.models.message import Message
from app.models.category import Category, Subcategory
from app.models.user import User
from app.models.notification import NotificationType
from app.services.notifications import create_notification


class SellerError(Exception):
    """Raised when a seller operation fails."""


class SellerService:
    def __init__(self, db: Session) -> None:
        self.db = db

    # -----------------------------------------------------------------------
    # Helpers
    # -----------------------------------------------------------------------

    def _unique_slug(self, model: Any, base_slug: str, exclude_id: int | None = None) -> str:
        """Return `base_slug`, suffixed until it is free for `model`.

        `slug` carries a unique constraint, so a seller who renames a listing to
        a name another seller already uses must not blow up on commit.
        """
        candidate = base_slug
        while (
            self.db.execute(
                select(model.id).where(
                    model.slug == candidate,
                    model.id != exclude_id if exclude_id is not None else model.id.isnot(None),
                )
            )
            .scalars()
            .first()
            is not None
        ):
            candidate = f"{base_slug}-{uuid.uuid4().hex[:6]}"
        return candidate

    def _get_profile_for_user(self, user_id: int) -> BizProfile:
        """Get the first active biz profile for a seller user, or raise."""
        profile = (
            self.db.execute(
                select(BizProfile).where(
                    BizProfile.user_id == user_id,
                    BizProfile.is_active == True,  # noqa: E712
                )
            )
            .scalars()
            .first()
        )
        if profile is None:
            raise SellerError("You do not have a business profile yet. Create one first.")
        return profile

    def _get_owned_profile_ids(self, user_id: int) -> list[int]:
        """Every active business profile id owned by this seller.

        Ownership is enforced on user_id, so all of a seller's own profiles are
        in scope and nothing belonging to another seller ever is.
        """
        rows = self.db.execute(
            select(BizProfile.id).where(
                BizProfile.user_id == user_id,
                BizProfile.is_active == True,  # noqa: E712
            )
        ).scalars().all()
        return list(rows)

    def _get_profile_by_id(self, profile_id: int) -> BizProfile:
        profile = self.db.get(BizProfile, profile_id)
        if profile is None:
            raise SellerError("Business profile not found.")
        return profile

    def _ensure_ownership(self, profile: BizProfile, user_id: int) -> None:
        if profile.user_id != user_id:
            raise SellerError("You do not own this resource.")

    def _require_owned_profile(self, profile_id: int, user_id: int) -> BizProfile:
        """Load a profile and assert the requesting seller owns it."""
        profile = self._get_profile_by_id(profile_id)
        self._ensure_ownership(profile, user_id)
        return profile

    @staticmethod
    def _generate_slug(name: str) -> str:
        slug = re.sub(r"[^\w\s-]", "", name.lower().strip())
        slug = re.sub(r"[\s_]+", "-", slug)
        slug = re.sub(r"-+", "-", slug).strip("-")
        if not slug:
            slug = uuid.uuid4().hex[:8]
        return slug

    @staticmethod
    def _parse_time(time_str: str) -> Any:
        """Parse HH:MM string to a time object."""
        from datetime import time as dt_time
        parts = time_str.split(":")
        return dt_time(int(parts[0]), int(parts[1]))

    def _count(self, model: Any, *conditions: Any) -> int:
        """Count rows in a table for the given conditions."""
        return (
            self.db.execute(select(func.count()).select_from(model).where(*conditions)).scalar()
            or 0
        )

    @staticmethod
    def _assert_editable(approval_status: str, label: str) -> None:
        """Block seller edits once an admin has approved the listing."""
        if approval_status == "APPROVED":
            raise SellerError(
                f"Cannot edit an approved {label}. Withdraw it from the marketplace first."
            )

    @staticmethod
    def _resubmit(record: Any) -> None:
        """Mark a seller-owned listing as awaiting admin review again."""
        record.approval_status = "PENDING"
        record.rejection_reason = None
        record.submitted_at = datetime.now(timezone.utc)
        if hasattr(record, "reviewed_at"):
            record.reviewed_at = None
        if hasattr(record, "reviewed_by_user_id"):
            record.reviewed_by_user_id = None
        if hasattr(record, "status"):
            record.status = "DRAFT"
        if hasattr(record, "is_published"):
            record.is_published = False

    # -----------------------------------------------------------------------
    # Dashboard
    # -----------------------------------------------------------------------

    def _get_profile_for_user_optional(self, user_id: int) -> BizProfile | None:
        """Get the first active biz profile for a seller user, or None."""
        return (
            self.db.execute(
                select(BizProfile).where(
                    BizProfile.user_id == user_id,
                    BizProfile.is_active == True,  # noqa: E712
                )
            )
            .scalars()
            .first()
        )

    def get_dashboard_stats(self, user_id: int) -> dict:
        """Live PostgreSQL counters for the seller's own records.

        Every number below is a real COUNT(*) scoped to the profiles this seller
        owns (plus rows attributed directly to them via added_by_user_id).
        """
        empty = {
            "total_products": 0,
            "active_products": 0,
            "best_seller_products": 0,
            "total_services": 0,
            "active_services": 0,
            "pending_approval_products": 0,
            "pending_approval_services": 0,
            "total_enquiries": 0,
            "pending_enquiries": 0,
            "new_enquiries": 0,
            "total_quotations": 0,
            "pending_quotations": 0,
            "accepted_quotations": 0,
            "promotional_videos": 0,
            "approved_promotional_videos": 0,
            "profile_completion": 0,
            "verification_status": "PENDING",
        }

        profile = self._get_profile_for_user_optional(user_id)
        if profile is None:
            return empty

        profile_ids = self._get_owned_profile_ids(user_id)
        # Nothing is owned yet — no listings, enquiries or media to report.
        if not profile_ids:
            return {**empty, "profile_completion": self._profile_completion(profile)}

        # ---- Products -----------------------------------------------------
        total_products = self._count(Product, Product.profile_id.in_(profile_ids))
        active_products = self._count(
            Product,
            Product.profile_id.in_(profile_ids),
            Product.status == ProductStatus.ACTIVE.value,
            Product.approval_status == ProductApprovalStatus.APPROVED.value,
        )
        best_seller_products = self._count(
            Product,
            Product.profile_id.in_(profile_ids),
            Product.is_best_seller == True,  # noqa: E712
        )
        pending_approval_products = self._count(
            Product,
            Product.profile_id.in_(profile_ids),
            Product.approval_status == ProductApprovalStatus.PENDING.value,
        )

        # ---- Services -----------------------------------------------------
        total_services = self._count(BizService, BizService.profile_id.in_(profile_ids))
        active_services = self._count(
            BizService,
            BizService.profile_id.in_(profile_ids),
            BizService.status == ServiceStatus.ACTIVE.value,
            BizService.approval_status == ServiceApprovalStatus.APPROVED.value,
        )
        pending_approval_services = self._count(
            BizService,
            BizService.profile_id.in_(profile_ids),
            BizService.approval_status == ServiceApprovalStatus.PENDING.value,
        )

        # ---- Enquiries ----------------------------------------------------
        total_enquiries = self._count(Enquiry, Enquiry.profile_id.in_(profile_ids))
        pending_enquiries = self._count(
            Enquiry,
            Enquiry.profile_id.in_(profile_ids),
            Enquiry.status.in_(
                [
                    EnquiryStatus.NEW.value,
                    EnquiryStatus.CONTACTED.value,
                    EnquiryStatus.QUOTED.value,
                ]
            ),
        )
        new_enquiries = self._count(
            Enquiry,
            Enquiry.profile_id.in_(profile_ids),
            Enquiry.status == EnquiryStatus.NEW.value,
        )

        # ---- Quotations ---------------------------------------------------
        # Quotations are attributed to the seller by seller_id, so they are
        # counted directly rather than through the enquiry join.
        total_quotations = self._count(Quotation, Quotation.seller_id == user_id)
        pending_quotations = self._count(
            Quotation,
            Quotation.seller_id == user_id,
            Quotation.status.in_([QuotationStatus.PENDING.value, QuotationStatus.SENT.value]),
        )
        accepted_quotations = self._count(
            Quotation,
            Quotation.seller_id == user_id,
            Quotation.status == QuotationStatus.ACCEPTED.value,
        )

        # ---- Promotional videos -------------------------------------------
        promotional_videos = self._count(TrendingVideo, TrendingVideo.added_by_user_id == user_id)
        approved_promotional_videos = self._count(
            TrendingVideo,
            TrendingVideo.added_by_user_id == user_id,
            TrendingVideo.approval_status == VideoApprovalStatus.APPROVED.value,
        )

        return {
            "total_products": total_products,
            "active_products": active_products,
            "best_seller_products": best_seller_products,
            "total_services": total_services,
            "active_services": active_services,
            "pending_approval_products": pending_approval_products,
            "pending_approval_services": pending_approval_services,
            "total_enquiries": total_enquiries,
            "pending_enquiries": pending_enquiries,
            "new_enquiries": new_enquiries,
            "total_quotations": total_quotations,
            "pending_quotations": pending_quotations,
            "accepted_quotations": accepted_quotations,
            "promotional_videos": promotional_videos,
            "approved_promotional_videos": approved_promotional_videos,
            "profile_completion": self._profile_completion(profile),
            "verification_status": (
                "APPROVED" if profile.is_verified else "PENDING"
            ),
        }

    def _profile_completion(self, profile: BizProfile) -> int:
        """Percentage (0-100) of the recommended profile fields that are filled."""
        filled = 0
        total_fields = 10
        if profile.business_name:
            filled += 1
        if profile.description:
            filled += 1
        if profile.phone:
            filled += 1
        if profile.email:
            filled += 1
        if profile.address:
            filled += 1
        if profile.city:
            filled += 1
        if profile.logo_url:
            filled += 1
        if profile.cover_image_url:
            filled += 1
        if profile.latitude is not None and profile.longitude is not None:
            filled += 1
        bh_count = self._count(
            BusinessHour, BusinessHour.biz_profile_id == profile.id
        )
        if bh_count > 0:
            filled += 1

        return int((filled / total_fields) * 100)

    # -----------------------------------------------------------------------
    # Business Profile
    # -----------------------------------------------------------------------

    def get_profile(self, user_id: int) -> BizProfile:
        return self._get_profile_for_user(user_id)

    def create_profile(self, user_id: int, data: dict) -> BizProfile:
        # Check if seller already has a profile
        existing = (
            self.db.execute(
                select(BizProfile).where(BizProfile.user_id == user_id)
            )
            .scalars()
            .first()
        )
        if existing:
            raise SellerError("You already have a business profile. Use PUT to update.")

        # Validate category
        category = self.db.get(Category, data.get("category_id"))
        if category is None:
            raise SellerError("Category not found.")

        if data.get("subcategory_id"):
            sub = self.db.get(Subcategory, data["subcategory_id"])
            if sub is None or sub.category_id != category.id:
                raise SellerError("Subcategory not found or does not belong to the category.")

        # Generate slug
        slug = data.get("slug") or self._generate_slug(data["business_name"])

        # Check slug uniqueness
        existing_slug = (
            self.db.execute(select(BizProfile).where(BizProfile.slug == slug))
            .scalars()
            .first()
        )
        if existing_slug:
            slug = f"{slug}-{uuid.uuid4().hex[:6]}"

        profile = BizProfile(
            user_id=user_id,
            category_id=data["category_id"],
            subcategory_id=data.get("subcategory_id"),
            profile_type="INDIVIDUAL",
            business_name=data["business_name"],
            slug=slug,
            description=data.get("description"),
            phone=data.get("phone"),
            email=data.get("email"),
            website=data.get("website"),
            address=data.get("address"),
            city=data.get("city"),
            state=data.get("state"),
            country=data.get("country"),
            pincode=data.get("pincode"),
            latitude=data.get("latitude"),
            longitude=data.get("longitude"),
            logo_url=data.get("logo_url"),
            cover_image_url=data.get("cover_image_url"),
            is_public=True,
            is_active=True,
        )
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        return profile

    def update_profile(self, user_id: int, data: dict) -> BizProfile:
        profile = self._get_profile_for_user(user_id)

        # Validate category if changing
        if "category_id" in data and data["category_id"] is not None:
            category = self.db.get(Category, data["category_id"])
            if category is None:
                raise SellerError("Category not found.")

        # Validate subcategory if changing
        if "subcategory_id" in data and data["subcategory_id"] is not None:
            sub = self.db.get(Subcategory, data["subcategory_id"])
            if sub is None:
                raise SellerError("Subcategory not found.")

        # Check slug uniqueness if changing
        if "slug" in data and data["slug"] is not None:
            existing_slug = (
                self.db.execute(
                    select(BizProfile).where(
                        BizProfile.slug == data["slug"],
                        BizProfile.id != profile.id,
                    )
                )
                .scalars()
                .first()
            )
            if existing_slug:
                raise SellerError("Slug already in use.")

        # Apply updates
        for key, value in data.items():
            if value is not None:
                setattr(profile, key, value)

        self.db.commit()
        self.db.refresh(profile)
        return profile

    # -----------------------------------------------------------------------
    # Products
    # -----------------------------------------------------------------------

    def list_products(
        self,
        user_id: int,
        page: int = 1,
        page_size: int = 20,
        approval_status: str | None = None,
        search: str | None = None,
    ) -> dict:
        profile_ids = self._get_owned_profile_ids(user_id)
        offset = (page - 1) * page_size

        conditions = [Product.profile_id.in_(profile_ids)]
        if approval_status:
            conditions.append(Product.approval_status == approval_status)
        if search:
            conditions.append(Product.name.ilike(f"%{search}%"))

        total = self._count(Product, *conditions)

        products = (
            self.db.execute(
                select(Product)
                .where(and_(*conditions))
                .options(joinedload(Product.images))
                .order_by(Product.created_at.desc())
                .offset(offset)
                .limit(page_size)
            )
            .scalars()
            .unique()
            .all()
        )

        return {
            "items": products,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 0,
        }

    def get_product(self, user_id: int, product_id: int) -> Product:
        product = self.db.get(Product, product_id)
        if product is None:
            raise SellerError("Product not found.")
        self._require_owned_profile(product.profile_id, user_id)
        return product

    def create_product(self, user_id: int, data: dict) -> Product:
        profile = self._get_profile_for_user(user_id)

        # Validate category
        category = self.db.get(Category, data.get("category_id"))
        if category is None:
            raise SellerError("Category not found.")

        subcategory_id = data.get("subcategory_id")
        if subcategory_id:
            sub = self.db.get(Subcategory, subcategory_id)
            if sub is None or sub.category_id != category.id:
                raise SellerError("Subcategory not found or does not belong to the category.")

        # Generate slug
        slug = self._unique_slug(Product, self._generate_slug(data["name"]))

        # New listings always start as an unpublished draft awaiting admin
        # approval. Merchandising flags are admin decisions, never seller input.
        product = Product(
            profile_id=profile.id,
            category_id=data["category_id"],
            subcategory_id=subcategory_id,
            name=data["name"],
            slug=slug,
            description=data.get("description"),
            price=data.get("price"),
            price_unit=data.get("price_unit"),
            is_available=data.get("is_available", True),
            added_by_user_id=user_id,
            approval_status=ProductApprovalStatus.PENDING.value,
            status=ProductStatus.DRAFT.value,
            is_best_seller=False,
            is_trending=False,
        )
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product

    def update_product(self, user_id: int, product_id: int, data: dict) -> Product:
        product = self.get_product(user_id, product_id)
        self._assert_editable(product.approval_status, "product")

        if "category_id" in data and data["category_id"] is not None:
            category = self.db.get(Category, data["category_id"])
            if category is None:
                raise SellerError("Category not found.")

        if "slug" in data and data["slug"] is not None:
            existing_slug = (
                self.db.execute(
                    select(Product).where(
                        Product.slug == data["slug"],
                        Product.id != product.id,
                    )
                )
                .scalars()
                .first()
            )
            if existing_slug:
                raise SellerError("Slug already in use.")

        if "name" in data and data["name"]:
            product.slug = self._unique_slug(
                Product, self._generate_slug(data["name"]), exclude_id=product.id
            )

        for key, value in data.items():
            if value is not None:
                setattr(product, key, value)

        # Any seller edit re-opens review so the admin sees the new content.
        self._resubmit(product)

        self.db.commit()
        self.db.refresh(product)
        return product

    def submit_product(self, user_id: int, product_id: int) -> Product:
        """Send a draft/rejected product to the admin for approval."""
        product = self.get_product(user_id, product_id)
        self._resubmit(product)
        self.db.commit()
        self.db.refresh(product)
        return product

    def delete_product(self, user_id: int, product_id: int) -> None:
        product = self.get_product(user_id, product_id)
        self.db.delete(product)
        self.db.commit()

    # -----------------------------------------------------------------------
    # Product Images
    # -----------------------------------------------------------------------

    def list_product_images(self, user_id: int, product_id: int) -> list[ProductImage]:
        self.get_product(user_id, product_id)  # ownership check
        images = (
            self.db.execute(
                select(ProductImage)
                .where(ProductImage.product_id == product_id)
                .order_by(ProductImage.sort_order)
            )
            .scalars()
            .all()
        )
        return list(images)

    def add_product_image(
        self, user_id: int, product_id: int, image_url: str,
        sort_order: int = 0, is_primary: bool = False,
    ) -> ProductImage:
        self.get_product(user_id, product_id)  # ownership check

        # If marking as primary, unset others
        if is_primary:
            existing_primary = (
                self.db.execute(
                    select(ProductImage).where(
                        ProductImage.product_id == product_id,
                        ProductImage.is_primary == True,  # noqa: E712
                    )
                )
                .scalars()
                .all()
            )
            for img in existing_primary:
                img.is_primary = False

        image = ProductImage(
            product_id=product_id,
            image_url=image_url,
            sort_order=sort_order,
            is_primary=is_primary,
        )
        self.db.add(image)
        self.db.commit()
        self.db.refresh(image)
        return image

    def delete_product_image(self, user_id: int, image_id: int) -> None:
        image = self.db.get(ProductImage, image_id)
        if image is None:
            raise SellerError("Product image not found.")
        self.get_product(user_id, image.product_id)  # ownership check
        self.db.delete(image)
        self.db.commit()

    # -----------------------------------------------------------------------
    # Services
    # -----------------------------------------------------------------------

    def list_services(
        self,
        user_id: int,
        page: int = 1,
        page_size: int = 20,
        approval_status: str | None = None,
        search: str | None = None,
    ) -> dict:
        profile_ids = self._get_owned_profile_ids(user_id)
        offset = (page - 1) * page_size

        conditions = [BizService.profile_id.in_(profile_ids)]
        if approval_status:
            conditions.append(BizService.approval_status == approval_status)
        if search:
            conditions.append(BizService.name.ilike(f"%{search}%"))

        total = self._count(BizService, *conditions)

        services = (
            self.db.execute(
                select(BizService)
                .where(and_(*conditions))
                .order_by(BizService.created_at.desc())
                .offset(offset)
                .limit(page_size)
            )
            .scalars()
            .all()
        )

        return {
            "items": services,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 0,
        }

    def get_service(self, user_id: int, service_id: int) -> BizService:
        svc = self.db.get(BizService, service_id)
        if svc is None:
            raise SellerError("Service not found.")
        self._require_owned_profile(svc.profile_id, user_id)
        return svc

    def create_service(self, user_id: int, data: dict) -> BizService:
        profile = self._get_profile_for_user(user_id)

        category = self.db.get(Category, data.get("category_id"))
        if category is None:
            raise SellerError("Category not found.")

        subcategory_id = data.get("subcategory_id")
        if subcategory_id:
            sub = self.db.get(Subcategory, subcategory_id)
            if sub is None or sub.category_id != category.id:
                raise SellerError("Subcategory not found or does not belong to the category.")

        price = data.get("price")
        slug = self._unique_slug(BizService, self._generate_slug(data["name"]))

        # Unpublished draft pending admin approval. is_trending / is_featured
        # are merchandising decisions reserved for admins.
        svc = BizService(
            profile_id=profile.id,
            category_id=data["category_id"],
            subcategory_id=subcategory_id,
            name=data["name"],
            slug=slug,
            description=data.get("description"),
            price_min=data.get("price_min") or price,
            price_max=data.get("price_max"),
            price_unit=data.get("price_unit"),
            is_available=data.get("is_available", True),
            is_trending=False,
            is_featured=False,
            is_published=False,
            added_by_user_id=user_id,
            approval_status=ServiceApprovalStatus.PENDING.value,
            status=ServiceStatus.DRAFT.value,
        )
        self.db.add(svc)
        self.db.commit()
        self.db.refresh(svc)
        return svc

    def update_service(self, user_id: int, service_id: int, data: dict) -> BizService:
        svc = self.get_service(user_id, service_id)
        self._assert_editable(svc.approval_status, "service")

        if "category_id" in data and data["category_id"] is not None:
            category = self.db.get(Category, data["category_id"])
            if category is None:
                raise SellerError("Category not found.")

        if "name" in data and data["name"]:
            svc.slug = self._unique_slug(
                BizService, self._generate_slug(data["name"]), exclude_id=svc.id
            )

        for key, value in data.items():
            if value is not None:
                setattr(svc, key, value)

        # Any seller edit re-opens review so the admin sees the new content.
        self._resubmit(svc)

        self.db.commit()
        self.db.refresh(svc)
        return svc

    def submit_service(self, user_id: int, service_id: int) -> BizService:
        """Send a draft/rejected service to the admin for approval."""
        svc = self.get_service(user_id, service_id)
        self._resubmit(svc)
        self.db.commit()
        self.db.refresh(svc)
        return svc

    def delete_service(self, user_id: int, service_id: int) -> None:
        svc = self.get_service(user_id, service_id)
        self.db.delete(svc)
        self.db.commit()

    # -----------------------------------------------------------------------
    # Business Hours
    # -----------------------------------------------------------------------

    def list_business_hours(self, user_id: int) -> list[BusinessHour]:
        profile = self._get_profile_for_user(user_id)
        hours = (
            self.db.execute(
                select(BusinessHour)
                .where(BusinessHour.biz_profile_id == profile.id)
                .order_by(BusinessHour.day_of_week)
            )
            .scalars()
            .all()
        )
        return list(hours)

    def upsert_business_hours(self, user_id: int, day_of_week: int, data: dict) -> BusinessHour:
        profile = self._get_profile_for_user(user_id)

        existing = (
            self.db.execute(
                select(BusinessHour).where(
                    BusinessHour.biz_profile_id == profile.id,
                    BusinessHour.day_of_week == day_of_week,
                )
            )
            .scalars()
            .first()
        )

        if existing:
            for key, value in data.items():
                if value is not None:
                    if key in ("open_time", "close_time") and isinstance(value, str):
                        value = self._parse_time(value)
                    setattr(existing, key, value)
            self.db.commit()
            self.db.refresh(existing)
            return existing

        open_time = self._parse_time(data["open_time"]) if data.get("open_time") else None
        close_time = self._parse_time(data["close_time"]) if data.get("close_time") else None

        hour = BusinessHour(
            biz_profile_id=profile.id,
            day_of_week=day_of_week,
            open_time=open_time,
            close_time=close_time,
            is_closed=data.get("is_closed", False),
        )
        self.db.add(hour)
        self.db.commit()
        self.db.refresh(hour)
        return hour

    # -----------------------------------------------------------------------
    # Enquiries
    # -----------------------------------------------------------------------

    def list_enquiries(self, user_id: int, page: int = 1, page_size: int = 20, status: str | None = None) -> dict:
        profile_ids = self._get_owned_profile_ids(user_id)
        offset = (page - 1) * page_size

        conditions = [Enquiry.profile_id.in_(profile_ids)]
        if status:
            conditions.append(Enquiry.status == status)

        total = self._count(Enquiry, *conditions)

        enquiries = (
            self.db.execute(
                select(Enquiry)
                .where(and_(*conditions))
                .options(
                    joinedload(Enquiry.buyer),
                    joinedload(Enquiry.seller),
                    joinedload(Enquiry.biz_profile),
                    joinedload(Enquiry.product),
                    joinedload(Enquiry.service),
                )
                .order_by(Enquiry.created_at.desc())
                .offset(offset)
                .limit(page_size)
            )
            .unique()
            .scalars()
            .all()
        )

        return {
            "items": enquiries,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 0,
        }

    def get_enquiry(self, user_id: int, enquiry_id: int) -> Enquiry:
        enquiry = self.db.get(Enquiry, enquiry_id)
        if enquiry is None:
            raise SellerError("Enquiry not found.")
        self._require_owned_profile(enquiry.profile_id, user_id)
        return enquiry

    def update_enquiry_status(self, user_id: int, enquiry_id: int, new_status: str) -> Enquiry:
        enquiry = self.get_enquiry(user_id, enquiry_id)
        allowed_transitions = {
            "NEW": ["CONTACTED", "CLOSED"],
            "CONTACTED": ["QUOTED", "CLOSED"],
            "QUOTED": ["CLOSED"],
            "ACCEPTED": ["CLOSED"],
            "REJECTED": ["CLOSED"],
            "CLOSED": [],
        }
        current = allowed_transitions.get(enquiry.status, [])
        if new_status not in current:
            raise SellerError(
                f"Cannot transition from {enquiry.status} to {new_status}. "
                f"Allowed: {current}"
            )
        enquiry.status = new_status
        self.db.commit()
        self.db.refresh(enquiry)
        return enquiry

    # -----------------------------------------------------------------------
    # Quotations
    # -----------------------------------------------------------------------

    def create_quotation(self, user_id: int, data: dict) -> Quotation:
        enquiry = self.db.get(Enquiry, data["enquiry_id"])
        if enquiry is None:
            raise SellerError("Enquiry not found.")

        self._require_owned_profile(enquiry.profile_id, user_id)

        quantity, unit_price, amount = self._resolve_pricing(data)

        # Validity can be given as a window ("7 days") or as an absolute date.
        # The stored valid_until is always the authoritative expiry.
        valid_until = data.get("valid_until")
        valid_days = data.get("valid_days")
        if valid_until is None and valid_days is not None:
            valid_until = datetime.now(timezone.utc) + timedelta(days=valid_days)

        quotation = Quotation(
            enquiry_id=enquiry.id,
            seller_id=user_id,
            buyer_id=enquiry.buyer_id,
            amount=amount,
            quantity=quantity,
            unit_price=unit_price,
            delivery_days=data.get("delivery_days"),
            valid_days=valid_days,
            description=data.get("description"),
            terms=data.get("terms"),
            valid_until=valid_until,
            # Creating a quotation is the act of sending it to the buyer, so it
            # lands as SENT rather than waiting on a second manual step.
            status=QuotationStatus.SENT.value,
        )
        self.db.add(quotation)
        self.db.flush()

        # Creating a quotation moves the enquiry into the QUOTED stage.
        if enquiry.status in (
            EnquiryStatus.NEW.value,
            EnquiryStatus.CONTACTED.value,
            EnquiryStatus.QUOTED.value,
        ):
            enquiry.status = EnquiryStatus.QUOTED.value

        create_notification(
            self.db,
            user_id=enquiry.buyer_id,
            type=NotificationType.QUOTATION_SENT.value,
            title="New quotation received",
            message=(
                f"{enquiry.business_name or f'Business {user_id}'} sent you a quotation "
                f"for {enquiry.product_name or enquiry.service_name or 'your enquiry'} "
                f"totalling Rs. {amount:,.2f}."
            ),
            enquiry_id=enquiry.id,
            quotation_id=quotation.id,
        )

        self.db.commit()
        self.db.refresh(quotation)
        return quotation

    @staticmethod
    def _resolve_pricing(data: dict) -> tuple[int, float | None, float]:
        """Work out (quantity, unit_price, total) from whatever the seller sent.

        Per-unit pricing wins and derives the total; a bare amount is treated as
        a lump-sum quote for a single unit. Schema validation has already
        checked the two agree when both are supplied.
        """
        quantity = data.get("quantity")
        unit_price = data.get("unit_price")
        amount = data.get("amount")

        if quantity is not None and unit_price is not None:
            return quantity, unit_price, round(quantity * unit_price, 2)
        if amount is not None:
            return quantity or 1, unit_price, amount
        raise SellerError("Provide quantity and unit price, or a total amount.")

    def _expire_stale_quotations(self, quotations: list[Quotation]) -> None:
        """Flip open quotations past their validity window to EXPIRED.

        Runs on read paths so a quote nobody acted on stops looking actionable.
        """
        stale = [q for q in quotations if q.is_expired]
        if not stale:
            return
        for quote in stale:
            quote.status = QuotationStatus.EXPIRED.value
        self.db.commit()
        for quote in stale:
            self.db.refresh(quote)

    def list_quotations(self, user_id: int, page: int = 1, page_size: int = 20, status: str | None = None) -> dict:
        profile = self._get_profile_for_user(user_id)
        offset = (page - 1) * page_size

        conditions = [Quotation.seller_id == user_id]
        if status:
            conditions.append(Quotation.status == status)

        total = self.db.execute(
            select(func.count()).select_from(Quotation).where(and_(*conditions))
        ).scalar() or 0

        quotations = (
            self.db.execute(
                select(Quotation)
                .where(and_(*conditions))
                .order_by(Quotation.created_at.desc())
                .offset(offset)
                .limit(page_size)
            )
            .scalars()
            .all()
        )

        # Expiry is computed across the seller's whole book, not just this page,
        # so the status filter stays consistent with the counts.
        self._expire_stale_quotations(
            self.db.execute(
                select(Quotation).where(Quotation.seller_id == user_id)
            ).scalars().all()
        )

        return {
            "items": quotations,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 0,
        }

    def get_quotation(self, user_id: int, quotation_id: int) -> Quotation:
        quote = self.db.get(Quotation, quotation_id)
        if quote is None:
            raise SellerError("Quotation not found.")
        if quote.seller_id != user_id:
            raise SellerError("You do not own this quotation.")
        self._expire_stale_quotations([quote])
        return quote

    def update_quotation(self, user_id: int, quotation_id: int, data: dict) -> Quotation:
        quote = self.get_quotation(user_id, quotation_id)

        # A decided quotation is a historical record: the buyer already agreed
        # to those exact numbers, so re-pricing it would silently change a
        # binding deal. Cancelling a live quote is the only edit left.
        if quote.status not in (QuotationStatus.PENDING.value, QuotationStatus.SENT.value):
            raise SellerError(
                f"Cannot revise a quotation in {quote.status} status. "
                "Only open quotations can be changed."
            )

        # Status transitions
        if "status" in data and data["status"] is not None:
            allowed = {"CANCELLED"}
            if data["status"] not in allowed:
                raise SellerError("Seller can only cancel a quotation.")

        # Re-pricing keeps the line item and the total consistent.
        quantity = data.get("quantity", quote.quantity)
        unit_price = data.get("unit_price", quote.unit_price)
        if "amount" in data and data["amount"] is not None:
            if "unit_price" not in data and "quantity" not in data and unit_price:
                # Editing only the total means the per-unit price follows it.
                unit_price = round(data["amount"] / max(quantity, 1), 2)
        if "quantity" not in data and "unit_price" not in data and "amount" not in data:
            data.pop("quantity", None)
        else:
            if unit_price is not None:
                data["amount"] = round(quantity * unit_price, 2)
            data["unit_price"] = unit_price
            data["quantity"] = quantity

        # Revising a window restarts the countdown from now.
        if data.get("valid_days") is not None and "valid_until" not in data:
            data["valid_until"] = datetime.now(timezone.utc) + timedelta(
                days=data["valid_days"]
            )

        for key, value in data.items():
            if value is not None:
                setattr(quote, key, value)

        self.db.commit()
        self.db.refresh(quote)
        return quote

    # -----------------------------------------------------------------------
    # Requirements (seller views public buyer requirements)
    # -----------------------------------------------------------------------

    def list_requirements(self, page: int = 1, page_size: int = 20, category_id: int | None = None, city: str | None = None) -> dict:
        offset = (page - 1) * page_size

        conditions = [Requirement.status == "OPEN"]
        if category_id:
            conditions.append(Requirement.category_id == category_id)
        if city:
            conditions.append(Requirement.city.ilike(f"%{city}%"))

        total = self.db.execute(
            select(func.count()).select_from(Requirement).where(and_(*conditions))
        ).scalar() or 0

        requirements = (
            self.db.execute(
                select(Requirement)
                .where(and_(*conditions))
                .order_by(Requirement.created_at.desc())
                .offset(offset)
                .limit(page_size)
            )
            .scalars()
            .all()
        )

        return {
            "items": requirements,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 0,
        }

    def get_requirement(self, requirement_id: int) -> Requirement:
        req = self.db.get(Requirement, requirement_id)
        if req is None:
            raise SellerError("Requirement not found.")
        return req

    # -----------------------------------------------------------------------
    # Messages
    # -----------------------------------------------------------------------

    def list_conversations(self, user_id: int) -> list[dict]:
        """List unique conversation partners for the seller."""
        sent = (
            self.db.execute(
                select(Message.receiver_id).where(Message.sender_id == user_id)
            )
            .scalars()
            .all()
        )
        received = (
            self.db.execute(
                select(Message.sender_id).where(Message.receiver_id == user_id)
            )
            .scalars()
            .all()
        )
        partner_ids = set(sent) | set(received)

        conversations = []
        for pid in partner_ids:
            partner = self.db.get(User, pid)
            if partner is None:
                continue
            last_msg = (
                self.db.execute(
                    select(Message).where(
                        ((Message.sender_id == user_id) & (Message.receiver_id == pid))
                        | ((Message.sender_id == pid) & (Message.receiver_id == user_id))
                    ).order_by(Message.created_at.desc()).limit(1)
                )
                .scalars()
                .first()
            )
            unread = self.db.execute(
                select(func.count()).select_from(Message).where(
                    Message.sender_id == pid,
                    Message.receiver_id == user_id,
                    Message.is_read == False,  # noqa: E712
                )
            ).scalar() or 0

            conversations.append({
                "partner_id": pid,
                "partner_name": partner.full_name,
                "last_message": last_msg.content if last_msg else "",
                "last_message_at": last_msg.created_at.isoformat() if last_msg else "",
                "unread_count": unread,
            })

        conversations.sort(key=lambda c: c["last_message_at"], reverse=True)
        return conversations

    def get_messages(self, user_id: int, other_user_id: int, page: int = 1, page_size: int = 50) -> dict:
        offset = (page - 1) * page_size

        conditions = (
            ((Message.sender_id == user_id) & (Message.receiver_id == other_user_id))
            | ((Message.sender_id == other_user_id) & (Message.receiver_id == user_id))
        )

        total = self.db.execute(
            select(func.count()).select_from(Message).where(conditions)
        ).scalar() or 0

        messages = (
            self.db.execute(
                select(Message)
                .where(conditions)
                .order_by(Message.created_at.desc())
                .offset(offset)
                .limit(page_size)
            )
            .scalars()
            .all()
        )

        return {
            "items": list(reversed(messages)),  # oldest first within page
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    def send_message(self, user_id: int, receiver_id: int, content: str) -> Message:
        receiver = self.db.get(User, receiver_id)
        if receiver is None:
            raise SellerError("The specified receiver does not exist.")
        if receiver_id == user_id:
            raise SellerError("Cannot send message to yourself.")

        msg = Message(
            sender_id=user_id,
            receiver_id=receiver_id,
            content=content.strip(),
        )
        self.db.add(msg)
        self.db.commit()
        self.db.refresh(msg)
        return msg

    def mark_messages_read(self, user_id: int, other_user_id: int) -> int:
        """Mark all messages from other_user as read. Returns count."""
        msgs = (
            self.db.execute(
                select(Message).where(
                    Message.sender_id == other_user_id,
                    Message.receiver_id == user_id,
                    Message.is_read == False,  # noqa: E712
                )
            )
            .scalars()
            .all()
        )
        count = len(msgs)
        for m in msgs:
            m.is_read = True
        self.db.commit()
        return count

    # -----------------------------------------------------------------------
    # Profile Settings (user-level)
    # -----------------------------------------------------------------------

    def get_profile_settings(self, user_id: int) -> User:
        user = self.db.get(User, user_id)
        if user is None:
            raise SellerError("User not found.")
        return user

    def update_profile_settings(self, user_id: int, data: dict) -> User:
        user = self.db.get(User, user_id)
        if user is None:
            raise SellerError("User not found.")

        for key, value in data.items():
            if value is not None:
                setattr(user, key, value)

        self.db.commit()
        self.db.refresh(user)
        return user
