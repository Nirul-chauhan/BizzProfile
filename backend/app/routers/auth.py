from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db_session
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    DevOtpResponse,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
    SendOtpRequest,
    UpdateProfileRequest,
    UserResponse,
    VerifyOtpRequest,
)
from app.services.auth import AuthError, AuthService

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, db: Session = Depends(get_db_session)):
    settings = get_settings()
    svc = AuthService(db)
    try:
        otp_code = svc.register(
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    if settings.APP_ENV == "development":
        return {"message": "Registration successful. Please verify your email.", "otp": otp_code}
    return {"message": "Registration successful. Please verify your email."}


@router.post("/send-otp")
def send_otp(request: SendOtpRequest, db: Session = Depends(get_db_session)):
    settings = get_settings()
    svc = AuthService(db)
    try:
        code = svc.send_otp(email=request.email, mobile=request.mobile, purpose=request.purpose)
    except AuthError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return MessageResponse(message="OTP verified successfully.")


@router.post("/login", response_model=AuthResponse)
def login(request: LoginRequest, db: Session = Depends(get_db_session)):
    svc = AuthService(db)
    try:
        result = svc.login(email=request.email, password=request.password)
    except AuthError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    return AuthResponse(
        access_token=result["access_token"],
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
    file_path = storage.save(content, file.filename or "profile.jpg", folder="profiles")
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
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db_session)):
    settings = get_settings()
    svc = AuthService(db)
    try:
        code = svc.forgot_password(email=request.email)
    except AuthError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    if settings.APP_ENV == "development":
        return {"message": "OTP sent (dev mode).", "otp": code}
    return {"message": "If the email exists, an OTP has been sent."}


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db_session)):
    svc = AuthService(db)
    try:
        svc.reset_password(
            email=request.email,
            otp=request.otp,
            purpose=request.purpose,
            new_password=request.new_password,
        )
    except AuthError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return MessageResponse(message="Password reset successfully.")
