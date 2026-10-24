import enum


class ProfileVerificationStatus(str, enum.Enum):
    """Verification lifecycle shared by personal (User) and business profiles.

    Distinct from the per-document ``VerificationStatus`` (PENDING/APPROVED/
    REJECTED) used by the documents table: this is the overall account/business
    state a seller sees and an admin controls.
    """

    UNVERIFIED = "UNVERIFIED"
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"