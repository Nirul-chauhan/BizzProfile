from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.otp import OtpPurpose
from app.models.role import Role, RoleEnum
from app.models.user import User
from app.services.jwt import create_access_token
from app.services.otp import OtpService
from app.services.password import hash_password, verify_password


class AuthError(Exception):
    pass


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db

    # Roles allowed for self-registration (ADMIN excluded - must be seeded).
    ALLOWED_REGISTRATION_ROLES = {RoleEnum.BUYER.value, RoleEnum.SELLER.value}

    # Default admin credentials (replace before public deployment).
    DEFAULT_ADMIN_EMAIL = "admin@bizzprofiles.com"
    DEFAULT_ADMIN_PASSWORD = "admin123"

    def register(
        self,
        full_name: str,
        email: str,
        password: str,
        mobile: str | None = None,
        city: str | None = None,
        state: str | None = None,
        country: str | None = None,
        role: str = RoleEnum.BUYER.value,
    ) -> str:
        # Normalize role to uppercase
        role = role.upper()

        # Block ADMIN self-registration — admin must be seeded
        if role == RoleEnum.ADMIN.value:
            raise AuthError("Admin registration is not allowed. Admin accounts are created by the system.")

        if role not in self.ALLOWED_REGISTRATION_ROLES:
            raise AuthError("Invalid role for registration. Allowed roles: BUYER, SELLER.")

        # Check duplicate email
        existing = self.db.execute(
            select(User).where(User.email == email)
        ).scalars().first()
        if existing is not None:
            raise AuthError("Email already registered.")

        # Check duplicate mobile
        if mobile:
            existing_mobile = self.db.execute(
                select(User).where(User.mobile == mobile)
            ).scalars().first()
            if existing_mobile is not None:
                raise AuthError("Mobile number already registered.")

        # Get or create the role
        user_role = self.db.execute(
            select(Role).where(Role.name == role)
        ).scalars().first()
        if user_role is None:
            user_role = Role(name=role, description=f"{role} role")
            self.db.add(user_role)
            self.db.commit()
            self.db.refresh(user_role)

        user = User(
            role_id=user_role.id,
            full_name=full_name,
            email=email,
            mobile=mobile,
            city=city,
            state=state,
            country=country,
            password_hash=hash_password(password),
            is_email_verified=True,
            is_mobile_verified=True,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        return "registered"

    def seed_admin(self) -> str:
        """Seed the default admin account if it doesn't exist."""
        existing = self.db.execute(
            select(User).where(User.email == self.DEFAULT_ADMIN_EMAIL)
        ).scalars().first()
        if existing is not None:
            return "admin already exists"

        # Get or create ADMIN role
        admin_role = self.db.execute(
            select(Role).where(Role.name == RoleEnum.ADMIN.value)
        ).scalars().first()
        if admin_role is None:
            admin_role = Role(name=RoleEnum.ADMIN.value, description="Administrator role")
            self.db.add(admin_role)
            self.db.commit()
            self.db.refresh(admin_role)

        user = User(
            role_id=admin_role.id,
            full_name="Administrator",
            email=self.DEFAULT_ADMIN_EMAIL,
            password_hash=hash_password(self.DEFAULT_ADMIN_PASSWORD),
            is_email_verified=True,
            is_active=True,
            is_first_login=True,
        )
        self.db.add(user)
        self.db.commit()
        return "admin seeded"

    def change_password(self, user_id: int, new_password: str) -> None:
        """Change password and clear first_login flag."""
        user = self.db.execute(
            select(User).where(User.id == user_id)
        ).scalars().first()
        if user is None:
            raise AuthError("User not found.")
        user.password_hash = hash_password(new_password)
        user.is_first_login = False
        self.db.commit()

    def send_otp(
        self,
        email: str | None = None,
        mobile: str | None = None,
        purpose: str = "EMAIL_VERIFICATION",
        user_id: int | None = None,
    ) -> str:
        otp_purpose = OtpPurpose(purpose)
        otp_svc = OtpService(self.db)
        try:
            code, _ = otp_svc.generate(
                email=email, mobile=mobile, purpose=otp_purpose, user_id=user_id
            )
        except ValueError as e:
            raise AuthError(str(e)) from e
        return code

    def verify_otp(
        self,
        email: str | None = None,
        mobile: str | None = None,
        otp: str = "",
        purpose: str = "EMAIL_VERIFICATION",
    ) -> bool:
        otp_purpose = OtpPurpose(purpose)
        otp_svc = OtpService(self.db)
        try:
            otp_svc.verify(
                email=email, mobile=mobile, purpose=otp_purpose, code=otp
            )
        except ValueError as e:
            raise AuthError(str(e)) from e

        if purpose == OtpPurpose.EMAIL_VERIFICATION.value and email:
            user = self.db.execute(
                select(User).where(User.email == email)
            ).scalars().first()
            if user:
                user.is_email_verified = True
                self.db.commit()
        elif purpose == OtpPurpose.MOBILE_VERIFICATION.value and mobile:
            user = self.db.execute(
                select(User).where(User.mobile == mobile)
            ).scalars().first()
            if user:
                user.is_mobile_verified = True
                self.db.commit()

        return True

    def login(self, email: str, password: str) -> dict:
        user = self.db.execute(
            select(User).where(User.email == email)
        ).scalars().first()

        # Generic error — do not reveal whether email exists
        if user is None:
            raise AuthError("Invalid email or password.")

        if not verify_password(password, user.password_hash):
            raise AuthError("Invalid email or password.")

        if not user.is_active:
            raise AuthError("Account is deactivated. Please contact support.")

        if not user.is_email_verified:
            raise AuthError("Please verify your email before logging in.")

        token = create_access_token(user_id=user.id, role_name=user.role.name)
        return {"access_token": token, "user": user}

    def get_user_by_id(self, user_id: int) -> User | None:
        return self.db.execute(
            select(User).where(User.id == user_id)
        ).scalars().first()

    def forgot_password(self, email: str) -> str:
        user = self.db.execute(
            select(User).where(User.email == email)
        ).scalars().first()

        # Always return the same message — do not reveal email existence
        if user is None:
            raise AuthError("If the email exists, an OTP has been sent.")

        code = self.send_otp(
            email=email,
            purpose=OtpPurpose.FORGOT_PASSWORD.value,
            user_id=user.id,
        )
        return code

    def reset_password(
        self, email: str, otp: str, purpose: str, new_password: str
    ) -> None:
        self.verify_otp(email=email, otp=otp, purpose=purpose)

        user = self.db.execute(
            select(User).where(User.email == email)
        ).scalars().first()

        if user is None:
            raise AuthError("User not found.")

        user.password_hash = hash_password(new_password)
        user.is_email_verified = True
        self.db.commit()

    def register_phone_user(
        self,
        phone: str,
        full_name: str,
        role: str = "BUYER",
        society_id: int | None = None,
        block_tower: str | None = None,
        flat_number: str | None = None,
    ) -> str:
        """Register a new user via phone OTP (no email/password required)."""
        role = role.upper()
        if role not in self.ALLOWED_REGISTRATION_ROLES:
            raise AuthError("Invalid role. Allowed: BUYER, SELLER, ADMIN.")

        # Get or create role
        user_role = self.db.execute(
            select(Role).where(Role.name == role)
        ).scalars().first()
        if user_role is None:
            user_role = Role(name=role, description=f"{role} role")
            self.db.add(user_role)
            self.db.commit()
            self.db.refresh(user_role)

        # Generate a placeholder email from phone
        email = f"phone_{phone}@bizzprofile.local"

        user = User(
            role_id=user_role.id,
            society_id=society_id,
            full_name=full_name,
            email=email,
            mobile=phone,
            block_tower=block_tower,
            flat_number=flat_number,
            is_phone_verified=True,
            is_mobile_verified=True,
            is_active=True,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return "registered"
