from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from app.config import get_settings


class AuthError(Exception):
    pass


class TokenExpiredError(AuthError):
    pass


class InvalidTokenError(AuthError):
    pass


def create_access_token(user_id: int, role_name: str) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "role": role_name,
        "exp": expire,
        "iat": now,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_signup_token(phone: str) -> str:
    """Short-lived token for completing signup after OTP verification."""
    settings = get_settings()
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.SIGNUP_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": f"signup:{phone}",
        "phone": phone,
        "type": "signup",
        "exp": expire,
        "iat": now,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_signup_token(token: str) -> dict:
    """Decode and validate a signup token."""
    settings = get_settings()
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
    except JWTError as e:
        raise InvalidTokenError(f"Invalid signup token: {e}") from e

    if payload.get("type") != "signup":
        raise InvalidTokenError("Not a signup token.")

    exp = payload.get("exp")
    if exp is not None:
        expire_dt = datetime.fromtimestamp(exp, tz=timezone.utc)
        if expire_dt < datetime.now(timezone.utc):
            raise TokenExpiredError("Signup token has expired.")

    return payload


def decode_access_token(token: str) -> dict:
    settings = get_settings()
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
    except JWTError as e:
        raise InvalidTokenError(f"Invalid token: {e}") from e

    if "sub" not in payload:
        raise InvalidTokenError("Token missing 'sub' claim.")

    exp = payload.get("exp")
    if exp is not None:
        expire_dt = datetime.fromtimestamp(exp, tz=timezone.utc)
        if expire_dt < datetime.now(timezone.utc):
            raise TokenExpiredError("Token has expired.")

    return payload
