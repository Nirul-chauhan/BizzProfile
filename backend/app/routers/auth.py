from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db_session
from app.models.otp import Otp, OtpPurpose
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    PhoneOtpRequest,
    PhoneOtpVerifyRequest,
    RegisterRequest,
    ResetPasswordRequest,
    SendOtpRequest,
    SignupCompleteRequest,
    UpdateProfileRequest,
    UserResponse,
    VerifyOtpRequest,
)
from app.services.auth import AuthError, AuthService
from app.services.jwt import (
    TokenExpiredError,
    InvalidTokenError,
    create_access_token,
    create_signup_token,
    decode_signup_token,
)
from app.services.sms import get_sms_provider
from app.services.otp import OtpService

import time

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, db: Session = Depends(get_db_session)):
    settings = get_settings()
    svc = AuthService(db)
    try:
        svc.register(
            full_name=request.full_name,
            email=request.email,
            password=request.password,
            mobile=request.mobile,
            city=request.city,
            state=request.state,
            country=request.country,
            role=request.role,
        )
    except AuthError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )
    return {"message": "Registration successful. Please verify your email."}


@router.post("/send-otp")
def send_otp(request: SendOtpRequest, db: Session = Depends(get_db_session)):
    settings = get_settings()
    svc = AuthService(db)
    try:
        code = svc.send_otp(
            email=request.email,
            mobile=request.mobile,
            purpose=request.purpose,
        )
    except AuthError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )

    if request.mobile:
        sms = get_sms_provider()
        sms.send(
            request.mobile,
            f"Your BizzProfile OTP is: {code}. Valid for {settings.OTP_EXPIRE_MINUTES} minutes.",
        )

    if settings.APP_ENV == "development":
        return {"message": "OTP sent successfully.", "otp": code}
    return {"message": "OTP sent successfully."}


@router.post("/verify-otp", response_model=MessageResponse)
def verify_otp(request: VerifyOtpRequest, db: Session = Depends(get_db_session)):
    svc = AuthService(db)
    try:
        svc.verify_otp(
            email=request.email,
            mobile=request.mobile,
            otp=request.otp,
            purpose=request.purpose,
        )
    except AuthError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )
    return MessageResponse(message="OTP verified successfully.")


@router.post("/login", response_model=AuthResponse)
def login(request: LoginRequest, db: Session = Depends(get_db_session)):
    svc = AuthService(db)
    try:
        result = svc.login(email=request.email, password=request.password)
    except AuthError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e)
        )
    return AuthResponse(
        access_token=result["access_token"],
        token_type="bearer",
        user=UserResponse.model_validate(result["user"]),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
def update_me(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    current_user.full_name = request.full_name
    current_user.city = request.city
    current_user.state = request.state
    current_user.country = request.country
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.post("/change-password", response_model=MessageResponse)
def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    svc = AuthService(db)
    try:
        svc.change_password(user_id=current_user.id, new_password=request.new_password)
    except AuthError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )
    return MessageResponse(message="Password changed successfully.")


@router.post("/seed-admin")
def seed_admin(db: Session = Depends(get_db_session)):
    """Seed the default admin account. Safe to call multiple times."""
    svc = AuthService(db)
    result = svc.seed_admin()
    return {"message": result}


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post("/me/profile-pic", response_model=UserResponse)
async def upload_profile_pic(
    file: UploadFile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{file.content_type}' is not allowed. Use JPEG, PNG, or WebP.",
        )

    content = await file.read()
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum of 5 MB.",
        )

    from app.services.storage import LocalStorageService

    storage = LocalStorageService()
    file_path = storage.save(
        content, file.filename or "profile.jpg", folder="profiles"
    )
    profile_url = storage.get_url(file_path)

    current_user.profile_pic = profile_url
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.delete("/me/profile-pic", response_model=UserResponse)
def remove_profile_pic(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    current_user.profile_pic = None
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest, db: Session = Depends(get_db_session)
):
    settings = get_settings()
    svc = AuthService(db)
    try:
        code = svc.forgot_password(email=request.email)
    except AuthError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )

    if settings.APP_ENV == "development":
        return {"message": "OTP sent (dev mode).", "otp": code}
    return {"message": "If the email exists, an OTP has been sent."}


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(
    request: ResetPasswordRequest, db: Session = Depends(get_db_session)
):
    svc = AuthService(db)
    try:
        svc.reset_password(
            email=request.email,
            otp=request.otp,
            purpose=request.purpose,
            new_password=request.new_password,
        )
    except AuthError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )
    return MessageResponse(message="Password reset successfully.")


# ---------------------------------------------------------------------------
# Phone OTP Auth Flow (spec-aligned)
# ---------------------------------------------------------------------------

# Simple in-memory rate limiter: {phone: [timestamp, ...]}
_otp_rate_limits: dict[str, list[float]] = {}


@router.post("/otp/request")
def request_phone_otp(
    request: PhoneOtpRequest,
    db: Session = Depends(get_db_session),
):
    """Step 1: Send OTP to phone number."""
    settings = get_settings()
    phone = request.phone

    # Rate limiting
    now = time.time()
    window = settings.OTP_RATE_WINDOW_MINUTES * 60
    if phone in _otp_rate_limits:
        _otp_rate_limits[phone] = [
            t for t in _otp_rate_limits[phone] if now - t < window
        ]
        if len(_otp_rate_limits[phone]) >= settings.OTP_RATE_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many OTP requests. Try again in {settings.OTP_RATE_WINDOW_MINUTES} minutes.",
            )
    else:
        _otp_rate_limits[phone] = []

    # Generate and send OTP
    otp_svc = OtpService(db)
    code, _ = otp_svc.generate(
        mobile=phone,
        purpose=OtpPurpose.LOGIN,
    )

    sms = get_sms_provider()
    sms.send(phone, f"Your BizzProfile OTP is: {code}. Valid for {settings.OTP_EXPIRE_MINUTES} minutes.")

    _otp_rate_limits[phone].append(now)

    if settings.APP_ENV == "development":
        return {"message": "OTP sent successfully.", "otp": code}
    return {"message": "OTP sent successfully."}


@router.post("/otp/verify")
def verify_phone_otp(
    request: PhoneOtpVerifyRequest,
    db: Session = Depends(get_db_session),
):
    """Step 2: Verify OTP. If phone exists → login. If new → return signup_token."""
    otp_svc = OtpService(db)
    try:
        otp_svc.verify(
            mobile=request.phone,
            purpose=OtpPurpose.LOGIN,
            code=request.otp,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )

    # Check if user exists with this phone
    user = db.execute(
        select(User).where(User.mobile == request.phone)
    ).scalars().first()

    if user is not None:
        # Existing user — log them in
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account is deactivated.")
        token = create_access_token(user_id=user.id, role_name=user.role.name)
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": UserResponse.model_validate(user),
            "is_new_user": False,
        }

    # New user — return a short-lived signup token
    signup_token = create_signup_token(phone=request.phone)
    return {
        "signup_token": signup_token,
        "is_new_user": True,
        "message": "Phone verified. Complete your profile to finish signup.",
    }


@router.post("/signup/complete", response_model=AuthResponse)
def complete_signup(
    request: SignupCompleteRequest,
    db: Session = Depends(get_db_session),
):
    """Step 3: Complete signup with name, role, society/block/flat info."""
    # Validate signup token
    try:
        payload = decode_signup_token(request.signup_token)
    except (TokenExpiredError, InvalidTokenError) as e:
        raise HTTPException(status_code=401, detail=str(e))

    phone = payload["phone"]

    # Check phone not already registered
    existing = db.execute(
        select(User).where(User.mobile == phone)
    ).scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered.")

    svc = AuthService(db)
    try:
        svc.register_phone_user(
            phone=phone,
            full_name=request.name,
            role=request.role,
            society_id=request.society_id,
            block_tower=request.block_tower,
            flat_number=request.flat_number,
        )
    except AuthError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Fetch the newly created user
    user = db.execute(
        select(User).where(User.mobile == phone)
    ).scalars().first()

    token = create_access_token(user_id=user.id, role_name=user.role.name)
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )
