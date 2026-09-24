from functools import wraps
from typing import Callable

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies.database import get_db_session
from app.models.user import User
from app.services.jwt import (
    InvalidTokenError,
    TokenExpiredError,
    decode_access_token,
)

security = HTTPBearer()


# ---------------------------------------------------------------------------
# Core dependency: resolve the current user from the JWT
# ---------------------------------------------------------------------------

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db_session),
) -> User:
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except TokenExpiredError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired.",
        )
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials.",
        )

    user_id = int(payload["sub"])
    user = db.execute(select(User).where(User.id == user_id)).scalars().first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated.",
        )

    return user


# ---------------------------------------------------------------------------
# Role-based gate dependencies
# ---------------------------------------------------------------------------

def _require_role(*allowed_role_names: str) -> Callable:
    """Factory that returns a dependency requiring one of *allowed_role_names*."""

    def dependency(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role.name not in allowed_role_names:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"{current_user.role.name} access denied. Required: {', '.join(allowed_role_names)}.",
            )
        return current_user

    return dependency


# Single-role helpers
require_admin = _require_role("ADMIN")
require_buyer = _require_role("BUYER")
require_seller = _require_role("SELLER")

# Backward compat aliases
require_customer = require_buyer
require_enduser = require_seller

# Multi-role helpers
require_buyer_or_admin = _require_role("BUYER", "ADMIN")
require_seller_or_admin = _require_role("SELLER", "ADMIN")
require_any_authenticated = _require_role("ADMIN", "BUYER", "SELLER", "USER")

# Backward-compatible alias (any authenticated user)
require_user = require_any_authenticated


# ---------------------------------------------------------------------------
# Ownership helpers
# ---------------------------------------------------------------------------

def _get_or_404(db: Session, model, record_id: int, label: str = "Resource"):
    """Fetch a record by PK or raise 404."""
    record = db.get(model, record_id)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{label} not found.",
        )
    return record


def require_profile_owner(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> User:
    """Ensure the current user owns the biz_profile, or is admin."""
    from app.models.biz_profile import BizProfile

    profile = _get_or_404(db, BizProfile, profile_id, "Business profile")

    if current_user.role.name == "ADMIN":
        return current_user

    if profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this business profile.",
        )

    return current_user


def require_product_owner(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> User:
    """Ensure the current user owns the product (via its biz_profile), or is admin."""
    from app.models.product import Product

    product = _get_or_404(db, Product, product_id, "Product")

    if current_user.role.name == "ADMIN":
        return current_user

    from app.models.biz_profile import BizProfile
    profile = _get_or_404(db, BizProfile, product.profile_id, "Business profile")

    if profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this product.",
        )

    return current_user


def require_service_owner(
    service_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> User:
    """Ensure the current user owns the service (via its biz_profile), or is admin."""
    from app.models.service import BizService

    svc = _get_or_404(db, BizService, service_id, "Service")

    if current_user.role.name == "ADMIN":
        return current_user

    from app.models.biz_profile import BizProfile
    profile = _get_or_404(db, BizProfile, svc.profile_id, "Business profile")

    if profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this service.",
        )

    return current_user


def require_enquiry_participant(
    enquiry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> User:
    """Ensure the current user is buyer or seller on the enquiry, or is admin."""
    from app.models.enquiry import Enquiry

    enquiry = _get_or_404(db, Enquiry, enquiry_id, "Enquiry")

    if current_user.role.name == "ADMIN":
        return current_user

    if enquiry.buyer_id == current_user.id:
        return current_user

    from app.models.biz_profile import BizProfile
    profile = db.get(BizProfile, enquiry.profile_id)
    if profile and profile.user_id == current_user.id:
        return current_user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You are not a participant in this enquiry.",
    )


def require_requirement_owner(
    requirement_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> User:
    """Ensure the current user owns the requirement, or is admin."""
    from app.models.requirement import Requirement

    req = _get_or_404(db, Requirement, requirement_id, "Requirement")

    if current_user.role.name == "ADMIN":
        return current_user

    if req.buyer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this requirement.",
        )

    return current_user


def require_message_participant(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> User:
    """Ensure the current user is sender or receiver, or is admin."""
    from app.models.message import Message

    msg = _get_or_404(db, Message, message_id, "Message")

    if current_user.role.name == "ADMIN":
        return current_user

    if msg.sender_id != current_user.id and msg.receiver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a participant in this conversation.",
        )

    return current_user


def require_quotation_participant(
    quotation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> User:
    """Ensure the current user is buyer or seller on the quotation, or is admin."""
    from app.models.quotation import Quotation

    quote = _get_or_404(db, Quotation, quotation_id, "Quotation")

    if current_user.role.name == "ADMIN":
        return current_user

    if quote.seller_id == current_user.id or quote.buyer_id == current_user.id:
        return current_user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You are not a participant in this quotation.",
    )


def require_review_owner(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> User:
    """Ensure the current user owns the review, or is admin."""
    from app.models.review import Review

    review = _get_or_404(db, Review, review_id, "Review")

    if current_user.role.name == "ADMIN":
        return current_user

    if review.buyer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this review.",
        )

    return current_user
