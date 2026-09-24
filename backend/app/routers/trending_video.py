from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, status
from fastapi.responses import JSONResponse
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload

from app.dependencies.auth import get_current_user, require_admin, require_buyer, require_seller
from app.dependencies.database import get_db_session
from app.models.trending_video import TrendingVideo, VideoApprovalStatus
from app.models.biz_profile import BizProfile
from app.models.user import User
from app.schemas.trending_video import (
    TrendingVideoCreate,
    TrendingVideoResponse,
    TrendingVideoReview,
    TrendingVideoUpdate,
)

router = APIRouter(prefix="/api/trending-videos", tags=["trending-videos"])

ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/ogg", "video/quicktime"}
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100 MB
MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024  # 5 MB


def _extract_embed_id(url: str, platform: str) -> str | None:
    """Extract video embed ID from a URL."""
    if platform == "YOUTUBE":
        if "watch?v=" in url:
            return url.split("watch?v=")[1].split("&")[0]
        if "youtu.be/" in url:
            return url.split("youtu.be/")[1].split("?")[0]
        if "youtube.com/shorts/" in url:
            return url.split("youtube.com/shorts/")[1].split("?")[0]
    elif platform == "INSTAGRAM":
        if "/reel/" in url:
            return url.split("/reel/")[1].split("?")[0]
        if "/p/" in url:
            return url.split("/p/")[1].split("?")[0]
    elif platform == "FACEBOOK":
        if "watch?v=" in url:
            return url.split("watch?v=")[1].split("&")[0]
    return None


def _serialize(video: TrendingVideo) -> dict:
    """Serialize a video with optional related data."""
    return {
        "id": video.id,
        "platform": video.platform,
        "video_url": video.video_url,
        "embed_id": video.embed_id,
        "title": video.title,
        "description": video.description,
        "thumbnail_url": video.thumbnail_url,
        "company_name": video.company_name,
        "city": video.city,
        "state": video.state,
        "country": video.country,
        "category_id": video.category_id,
        "added_by_user_id": video.added_by_user_id,
        "profile_id": video.profile_id,
        "approval_status": video.approval_status,
        "rejection_reason": video.rejection_reason,
        "is_active": video.is_active,
        "is_trending": video.is_trending,
        "sort_order": video.sort_order,
        "created_at": video.created_at.isoformat() if video.created_at else None,
        "updated_at": video.updated_at.isoformat() if video.updated_at else None,
    }


# ─── Public Endpoints ──────────────────────────────────────────────


@router.get("", response_model=list[TrendingVideoResponse])
def list_trending_videos(
    is_active: bool | None = None,
    platform: str | None = None,
    is_trending: bool | None = None,
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db_session),
):
    query = select(TrendingVideo).where(
        TrendingVideo.approval_status == VideoApprovalStatus.APPROVED.value,
    )
    if is_active is not None:
        query = query.where(TrendingVideo.is_active == is_active)
    if is_trending is not None:
        query = query.where(TrendingVideo.is_trending == is_trending)
    if platform:
        query = query.where(TrendingVideo.platform == platform)
    query = query.order_by(TrendingVideo.sort_order, TrendingVideo.created_at.desc()).limit(limit)
    videos = db.execute(query).scalars().all()
    return [_serialize(v) for v in videos]


@router.get("/count")
def count_trending_videos(
    is_active: bool | None = None,
    db: Session = Depends(get_db_session),
):
    q = select(func.count(TrendingVideo.id)).where(
        TrendingVideo.approval_status == VideoApprovalStatus.APPROVED.value,
    )
    if is_active is not None:
        q = q.where(TrendingVideo.is_active == is_active)
    total = db.execute(q).scalar() or 0
    return {"total": total}


@router.get("/{video_id}", response_model=TrendingVideoResponse)
def get_trending_video(video_id: int, db: Session = Depends(get_db_session)):
    video = db.get(TrendingVideo, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Trending video not found.")
    return _serialize(video)


# ─── Admin Endpoints ───────────────────────────────────────────────


@router.get("/admin/list", response_model=list[TrendingVideoResponse])
def admin_list_videos(
    is_active: bool | None = None,
    platform: str | None = None,
    approval_status: str | None = None,
    is_trending: bool | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    query = select(TrendingVideo)
    if is_active is not None:
        query = query.where(TrendingVideo.is_active == is_active)
    if platform:
        query = query.where(TrendingVideo.platform == platform)
    if approval_status:
        query = query.where(TrendingVideo.approval_status == approval_status)
    if is_trending is not None:
        query = query.where(TrendingVideo.is_trending == is_trending)
    if search:
        query = query.where(TrendingVideo.title.ilike(f"%{search}%"))
    query = query.order_by(TrendingVideo.sort_order, TrendingVideo.created_at.desc())
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    videos = db.execute(query).scalars().all()
    return [_serialize(v) for v in videos]


@router.post("", response_model=TrendingVideoResponse, status_code=status.HTTP_201_CREATED)
def create_trending_video(
    request: TrendingVideoCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    embed_id = request.embed_id or _extract_embed_id(request.video_url, request.platform)
    video = TrendingVideo(
        platform=request.platform,
        video_url=request.video_url,
        embed_id=embed_id,
        title=request.title,
        description=request.description,
        thumbnail_url=request.thumbnail_url,
        company_name=request.company_name,
        city=request.city,
        state=request.state,
        country=request.country,
        category_id=request.category_id,
        profile_id=request.profile_id,
        added_by_user_id=current_user.id,
        is_active=request.is_active,
        is_trending=request.is_trending,
        sort_order=request.sort_order,
        approval_status=VideoApprovalStatus.APPROVED.value,
    )
    db.add(video)
    db.commit()
    db.refresh(video)
    return _serialize(video)


@router.put("/{video_id}", response_model=TrendingVideoResponse)
def update_trending_video(
    video_id: int,
    request: TrendingVideoUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    video = db.get(TrendingVideo, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Trending video not found.")
    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(video, key, value)
    if request.video_url and request.platform:
        video.embed_id = _extract_embed_id(request.video_url, request.platform)
    elif request.video_url:
        video.embed_id = _extract_embed_id(request.video_url, video.platform)
    db.commit()
    db.refresh(video)
    return _serialize(video)


@router.patch("/{video_id}/trending")
def toggle_trending(
    video_id: int,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    video = db.get(TrendingVideo, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Trending video not found.")
    video.is_trending = not video.is_trending
    if not video.is_trending:
        video.sort_order = 0
    db.commit()
    return {"ok": True, "is_trending": video.is_trending}


@router.patch("/{video_id}/trending-order")
def update_trending_order(
    video_id: int,
    data: dict,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    video = db.get(TrendingVideo, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Trending video not found.")
    video.sort_order = data.get("sort_order", 0)
    db.commit()
    return {"ok": True, "sort_order": video.sort_order}


@router.patch("/{video_id}/active")
def toggle_active(
    video_id: int,
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    video = db.get(TrendingVideo, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Trending video not found.")
    video.is_active = not video.is_active
    db.commit()
    return {"ok": True, "is_active": video.is_active}


@router.get("/admin/requests", response_model=list[TrendingVideoResponse])
def admin_list_requests(
    approval_status: str | None = Query(None),
    db: Session = Depends(get_db_session),
    _admin: User = Depends(require_admin),
):
    query = select(TrendingVideo).where(
        TrendingVideo.added_by_user_id.isnot(None),
    )
    if approval_status:
        query = query.where(TrendingVideo.approval_status == approval_status)
    else:
        query = query.where(TrendingVideo.approval_status == VideoApprovalStatus.PENDING.value)
    query = query.order_by(TrendingVideo.created_at.desc())
    videos = db.execute(query).scalars().all()
    return [_serialize(v) for v in videos]


@router.patch("/{video_id}/review", response_model=TrendingVideoResponse)
def admin_review_video(
    video_id: int,
    request: TrendingVideoReview,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    video = db.get(TrendingVideo, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Trending video not found.")
    video.approval_status = request.approval_status
    video.rejection_reason = request.rejection_reason
    if request.approval_status == VideoApprovalStatus.APPROVED.value:
        video.is_active = True
    db.commit()
    db.refresh(video)
    return _serialize(video)


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trending_video(
    video_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db_session),
):
    video = db.get(TrendingVideo, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Trending video not found.")
    db.delete(video)
    db.commit()


# ─── Buyer Endpoints ───────────────────────────────────────────────


@router.get("/buyer/list", response_model=list[TrendingVideoResponse])
def buyer_list_my_videos(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_buyer),
):
    query = (
        select(TrendingVideo)
        .where(TrendingVideo.added_by_user_id == current_user.id)
        .order_by(TrendingVideo.created_at.desc())
    )
    videos = db.execute(query).scalars().all()
    return [_serialize(v) for v in videos]


@router.post("/buyer/upload", response_model=TrendingVideoResponse, status_code=status.HTTP_201_CREATED)
def buyer_upload_video(
    request: TrendingVideoCreate,
    current_user: User = Depends(require_buyer),
    db: Session = Depends(get_db_session),
):
    profile_id = request.profile_id
    if profile_id:
        profile = db.get(BizProfile, profile_id)
        if not profile or profile.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="You can only upload videos for your own business.")
    embed_id = request.embed_id or _extract_embed_id(request.video_url, request.platform)
    video = TrendingVideo(
        platform=request.platform,
        video_url=request.video_url,
        embed_id=embed_id,
        title=request.title,
        description=request.description,
        thumbnail_url=request.thumbnail_url,
        company_name=request.company_name,
        city=request.city,
        state=request.state,
        country=request.country,
        category_id=request.category_id,
        profile_id=profile_id,
        added_by_user_id=current_user.id,
        is_active=False,
        is_trending=False,
        sort_order=0,
        approval_status=VideoApprovalStatus.PENDING.value,
    )
    db.add(video)
    db.commit()
    db.refresh(video)
    return _serialize(video)


@router.put("/buyer/{video_id}", response_model=TrendingVideoResponse)
def buyer_update_video(
    video_id: int,
    request: TrendingVideoUpdate,
    current_user: User = Depends(require_buyer),
    db: Session = Depends(get_db_session),
):
    video = db.get(TrendingVideo, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found.")
    if video.added_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own videos.")
    if video.approval_status == VideoApprovalStatus.APPROVED.value:
        raise HTTPException(status_code=400, detail="Cannot edit an approved video. Contact admin.")
    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(video, key, value)
    if request.video_url and request.platform:
        video.embed_id = _extract_embed_id(request.video_url, request.platform)
    video.approval_status = VideoApprovalStatus.PENDING.value
    db.commit()
    db.refresh(video)
    return _serialize(video)


@router.delete("/buyer/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
def buyer_delete_video(
    video_id: int,
    current_user: User = Depends(require_buyer),
    db: Session = Depends(get_db_session),
):
    video = db.get(TrendingVideo, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found.")
    if video.added_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own videos.")
    if video.approval_status == VideoApprovalStatus.APPROVED.value:
        raise HTTPException(status_code=400, detail="Cannot delete an approved video. Contact admin.")
    db.delete(video)
    db.commit()


# ─── Seller Endpoints ──────────────────────────────────────────────


@router.get("/seller/list", response_model=list[TrendingVideoResponse])
def seller_list_my_videos(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_seller),
):
    query = (
        select(TrendingVideo)
        .where(TrendingVideo.added_by_user_id == current_user.id)
        .order_by(TrendingVideo.created_at.desc())
    )
    videos = db.execute(query).scalars().all()
    return [_serialize(v) for v in videos]


@router.post("/seller/upload", response_model=TrendingVideoResponse, status_code=status.HTTP_201_CREATED)
def seller_upload_video(
    request: TrendingVideoCreate,
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db_session),
):
    profile_id = request.profile_id
    if profile_id:
        profile = db.get(BizProfile, profile_id)
        if not profile or profile.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="You can only upload videos for your own business.")
    embed_id = request.embed_id or _extract_embed_id(request.video_url, request.platform)
    video = TrendingVideo(
        platform=request.platform,
        video_url=request.video_url,
        embed_id=embed_id,
        title=request.title,
        description=request.description,
        thumbnail_url=request.thumbnail_url,
        company_name=request.company_name,
        city=request.city,
        state=request.state,
        country=request.country,
        category_id=request.category_id,
        profile_id=profile_id,
        added_by_user_id=current_user.id,
        is_active=False,
        is_trending=False,
        sort_order=0,
        approval_status=VideoApprovalStatus.PENDING.value,
    )
    db.add(video)
    db.commit()
    db.refresh(video)
    return _serialize(video)


@router.put("/seller/{video_id}", response_model=TrendingVideoResponse)
def seller_update_video(
    video_id: int,
    request: TrendingVideoUpdate,
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db_session),
):
    video = db.get(TrendingVideo, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found.")
    if video.added_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own videos.")
    if video.approval_status == VideoApprovalStatus.APPROVED.value:
        raise HTTPException(status_code=400, detail="Cannot edit an approved video. Contact admin.")
    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(video, key, value)
    if request.video_url and request.platform:
        video.embed_id = _extract_embed_id(request.video_url, request.platform)
    video.approval_status = VideoApprovalStatus.PENDING.value
    db.commit()
    db.refresh(video)
    return _serialize(video)


@router.delete("/seller/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
def seller_delete_video(
    video_id: int,
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db_session),
):
    video = db.get(TrendingVideo, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found.")
    if video.added_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own videos.")
    if video.approval_status == VideoApprovalStatus.APPROVED.value:
        raise HTTPException(status_code=400, detail="Cannot delete an approved video. Contact admin.")
    db.delete(video)
    db.commit()
