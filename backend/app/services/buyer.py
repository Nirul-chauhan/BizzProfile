"""Buyer service layer — all business logic for the buyer backend."""
from typing import Any

from sqlalchemy import func, select, and_
from sqlalchemy.orm import Session

from app.models.biz_profile import BizProfile
from app.models.product import Product
from app.models.service import BizService
from app.models.enquiry import Enquiry
from app.models.quotation import Quotation
from app.models.requirement import Requirement
from app.models.message import Message
from app.models.favorite import Favorite
from app.models.user import User


class BuyerError(Exception):
    """Raised when a buyer operation fails."""


class BuyerService:
    def __init__(self, db: Session) -> None:
        self.db = db

    # -----------------------------------------------------------------------
    # Helpers
    # -----------------------------------------------------------------------

    def _get_user(self, user_id: int) -> User:
        user = self.db.get(User, user_id)
        if user is None:
            raise BuyerError("User not found.")
        return user

    def _get_profile(self, profile_id: int) -> BizProfile:
        profile = self.db.get(BizProfile, profile_id)
        if profile is None:
            raise BuyerError("Business profile not found.")
        return profile

    def _get_product(self, product_id: int) -> Product:
        product = self.db.get(Product, product_id)
        if product is None:
            raise BuyerError("Product not found.")
        return product

    def _get_service(self, service_id: int) -> BizService:
        svc = self.db.get(BizService, service_id)
        if svc is None:
            raise BuyerError("Service not found.")
        return svc

    def _paginate(self, query, page: int, page_size: int) -> dict:
        offset = (page - 1) * page_size
        count_q = select(func.count()).select_from(query.subquery())
        total = self.db.execute(count_q).scalar() or 0
        items = self.db.execute(
            query.offset(offset).limit(page_size)
        ).scalars().all()
        return {
            "items": list(items),
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 0,
        }

    # -----------------------------------------------------------------------
    # Dashboard Statistics
    # -----------------------------------------------------------------------

    def get_dashboard_stats(self, user_id: int) -> dict:
        active_requirements = self.db.execute(
            select(func.count()).select_from(Requirement).where(
                Requirement.buyer_id == user_id,
                Requirement.status.in_(["OPEN", "IN_PROGRESS"]),
            )
        ).scalar() or 0

        enquiries_sent = self.db.execute(
            select(func.count()).select_from(Enquiry).where(
                Enquiry.buyer_id == user_id,
            )
        ).scalar() or 0

        pending_quotations = self.db.execute(
            select(func.count()).select_from(Quotation).where(
                Quotation.buyer_id == user_id,
                Quotation.status.in_(["PENDING", "SENT"]),
            )
        ).scalar() or 0

        accepted_quotations = self.db.execute(
            select(func.count()).select_from(Quotation).where(
                Quotation.buyer_id == user_id,
                Quotation.status == "ACCEPTED",
            )
        ).scalar() or 0

        favorite_count = self.db.execute(
            select(func.count()).select_from(Favorite).where(
                Favorite.user_id == user_id,
            )
        ).scalar() or 0

        unread_messages = self.db.execute(
            select(func.count()).select_from(Message).where(
                Message.receiver_id == user_id,
                Message.is_read == False,  # noqa: E712
            )
        ).scalar() or 0

        return {
            "active_requirements": active_requirements,
            "enquiries_sent": enquiries_sent,
            "pending_quotations": pending_quotations,
            "accepted_quotations": accepted_quotations,
            "favorite_count": favorite_count,
            "unread_messages": unread_messages,
        }

    # -----------------------------------------------------------------------
    # Profile
    # -----------------------------------------------------------------------

    def get_profile(self, user_id: int) -> User:
        return self._get_user(user_id)

    def update_profile(self, user_id: int, data: dict) -> User:
        user = self._get_user(user_id)
        for key, value in data.items():
            if value is not None:
                setattr(user, key, value)
        self.db.commit()
        self.db.refresh(user)
        return user

    # -----------------------------------------------------------------------
    # Requirements
    # -----------------------------------------------------------------------

    def create_requirement(self, user_id: int, data: dict) -> Requirement:
        # Validate category if provided
        if data.get("category_id"):
            from app.models.category import Category
            cat = self.db.get(Category, data["category_id"])
            if cat is None:
                raise BuyerError("Category not found.")

        if data.get("subcategory_id"):
            from app.models.category import Subcategory
            sub = self.db.get(Subcategory, data["subcategory_id"])
            if sub is None:
                raise BuyerError("Subcategory not found.")

        req = Requirement(
            buyer_id=user_id,
            title=data["title"],
            description=data.get("description"),
            category_id=data.get("category_id"),
            subcategory_id=data.get("subcategory_id"),
            city=data.get("city"),
            state=data.get("state"),
            country=data.get("country"),
            latitude=data.get("latitude"),
            longitude=data.get("longitude"),
            budget=data.get("budget"),
            budget_unit=data.get("budget_unit"),
            status="OPEN",
        )
        self.db.add(req)
        self.db.commit()
        self.db.refresh(req)
        return req

    def list_requirements(self, user_id: int, page: int = 1, page_size: int = 20) -> dict:
        query = (
            select(Requirement)
            .where(Requirement.buyer_id == user_id)
            .order_by(Requirement.created_at.desc())
        )
        return self._paginate(query, page, page_size)

    def get_requirement(self, user_id: int, requirement_id: int) -> Requirement:
        req = self.db.get(Requirement, requirement_id)
        if req is None:
            raise BuyerError("Requirement not found.")
        if req.buyer_id != user_id:
            raise BuyerError("You do not own this requirement.")
        return req

    def update_requirement(self, user_id: int, requirement_id: int, data: dict) -> Requirement:
        req = self.get_requirement(user_id, requirement_id)

        # Validate category if changing
        if data.get("category_id"):
            from app.models.category import Category
            cat = self.db.get(Category, data["category_id"])
            if cat is None:
                raise BuyerError("Category not found.")

        for key, value in data.items():
            if value is not None:
                setattr(req, key, value)

        self.db.commit()
        self.db.refresh(req)
        return req

    def delete_requirement(self, user_id: int, requirement_id: int) -> None:
        req = self.get_requirement(user_id, requirement_id)
        self.db.delete(req)
        self.db.commit()

    # -----------------------------------------------------------------------
    # Enquiries
    # -----------------------------------------------------------------------

    def create_enquiry(self, user_id: int, data: dict) -> Enquiry:
        # Validate that the target profile exists and is active
        profile = self._get_profile(data["profile_id"])
        if not profile.is_active:
            raise BuyerError("This business profile is not active.")

        # Validate product if provided
        if data.get("product_id"):
            product = self._get_product(data["product_id"])
            if product.profile_id != profile.id:
                raise BuyerError("Product does not belong to this business profile.")
            if product.status != "ACTIVE":
                raise BuyerError("This product is not available.")

        # Validate service if provided
        if data.get("service_id"):
            svc = self._get_service(data["service_id"])
            if svc.profile_id != profile.id:
                raise BuyerError("Service does not belong to this business profile.")
            if svc.status != "ACTIVE":
                raise BuyerError("This service is not available.")

        enquiry = Enquiry(
            buyer_id=user_id,
            profile_id=data["profile_id"],
            product_id=data.get("product_id"),
            service_id=data.get("service_id"),
            requirement_id=data.get("requirement_id"),
            message=data["message"].strip(),
            status="NEW",
        )
        self.db.add(enquiry)
        self.db.commit()
        self.db.refresh(enquiry)
        return enquiry

    def list_enquiries(self, user_id: int, page: int = 1, page_size: int = 20) -> dict:
        query = (
            select(Enquiry)
            .where(Enquiry.buyer_id == user_id)
            .order_by(Enquiry.created_at.desc())
        )
        return self._paginate(query, page, page_size)

    def get_enquiry(self, user_id: int, enquiry_id: int) -> Enquiry:
        enquiry = self.db.get(Enquiry, enquiry_id)
        if enquiry is None:
            raise BuyerError("Enquiry not found.")
        if enquiry.buyer_id != user_id:
            raise BuyerError("You do not own this enquiry.")
        return enquiry

    # -----------------------------------------------------------------------
    # Favorites
    # -----------------------------------------------------------------------

    def add_favorite(self, user_id: int, target_type: str, target_id: int) -> Favorite:
        # Validate target exists
        if target_type == "PRODUCT":
            self._get_product(target_id)
        elif target_type == "SERVICE":
            self._get_service(target_id)
        elif target_type == "BIZ_PROFILE":
            self._get_profile(target_id)
        else:
            raise BuyerError(f"Invalid target type: {target_type}")

        # Check for duplicate
        existing = (
            self.db.execute(
                select(Favorite).where(
                    Favorite.user_id == user_id,
                    Favorite.target_type == target_type,
                    Favorite.target_id == target_id,
                )
            )
            .scalars()
            .first()
        )
        if existing:
            raise BuyerError("This item is already in your favorites.")

        fav = Favorite(
            user_id=user_id,
            target_type=target_type,
            target_id=target_id,
        )
        self.db.add(fav)
        self.db.commit()
        self.db.refresh(fav)
        return fav

    def list_favorites(self, user_id: int, page: int = 1, page_size: int = 20) -> dict:
        query = (
            select(Favorite)
            .where(Favorite.user_id == user_id)
            .order_by(Favorite.created_at.desc())
        )
        return self._paginate(query, page, page_size)

    def remove_favorite(self, user_id: int, favorite_id: int) -> None:
        fav = self.db.get(Favorite, favorite_id)
        if fav is None:
            raise BuyerError("Favorite not found.")
        if fav.user_id != user_id:
            raise BuyerError("You do not own this favorite.")
        self.db.delete(fav)
        self.db.commit()

    # -----------------------------------------------------------------------
    # Quotations
    # -----------------------------------------------------------------------

    def list_quotations(self, user_id: int, page: int = 1, page_size: int = 20) -> dict:
        query = (
            select(Quotation)
            .where(Quotation.buyer_id == user_id)
            .order_by(Quotation.created_at.desc())
        )
        return self._paginate(query, page, page_size)

    def get_quotation(self, user_id: int, quotation_id: int) -> Quotation:
        quote = self.db.get(Quotation, quotation_id)
        if quote is None:
            raise BuyerError("Quotation not found.")
        if quote.buyer_id != user_id:
            raise BuyerError("You do not own this quotation.")
        return quote

    def accept_quotation(self, user_id: int, quotation_id: int) -> Quotation:
        quote = self.get_quotation(user_id, quotation_id)
        allowed = {"PENDING", "SENT"}
        if quote.status not in allowed:
            raise BuyerError(
                f"Cannot accept quotation in {quote.status} status. "
                f"Allowed: {', '.join(sorted(allowed))}"
            )
        quote.status = "ACCEPTED"
        self.db.commit()
        self.db.refresh(quote)
        return quote

    def reject_quotation(self, user_id: int, quotation_id: int) -> Quotation:
        quote = self.get_quotation(user_id, quotation_id)
        allowed = {"PENDING", "SENT"}
        if quote.status not in allowed:
            raise BuyerError(
                f"Cannot reject quotation in {quote.status} status. "
                f"Allowed: {', '.join(sorted(allowed))}"
            )
        quote.status = "REJECTED"
        self.db.commit()
        self.db.refresh(quote)
        return quote

    # -----------------------------------------------------------------------
    # Messages
    # -----------------------------------------------------------------------

    def list_conversations(self, user_id: int) -> list[dict]:
        """List unique conversation partners for the buyer."""
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
            "items": list(reversed(messages)),
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    def send_message(self, user_id: int, receiver_id: int, content: str) -> Message:
        receiver = self.db.get(User, receiver_id)
        if receiver is None:
            raise BuyerError("The specified receiver does not exist.")
        if receiver_id == user_id:
            raise BuyerError("Cannot send message to yourself.")

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
