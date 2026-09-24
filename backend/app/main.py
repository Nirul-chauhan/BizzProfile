from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import check_db_health
from app.routers.auth import router as auth_router
from app.routers.biz_profile import router as biz_profile_router
from app.routers.nearby import router as nearby_router
from app.routers.search import router as search_router
from app.routers.category import router as category_router
from app.routers.admin_category import router as admin_category_router
from app.routers.social_link import router as social_link_router
from app.routers.social_link import social_links_router
from app.routers.document import router as document_router
from app.routers.document import documents_router
from app.routers.admin_document import router as admin_document_router
from app.routers.admin_user import router as admin_user_router
from app.routers.admin_profile import router as admin_profile_router
from app.routers.admin_stats import router as admin_stats_router
from app.routers.admin_dashboard import router as admin_dashboard_router
from app.routers.public_profile import router as public_profile_router
from app.routers.featured_businesses import router as featured_router
from app.routers.featured_businesses import admin_router as admin_featured_router
from app.routers.seller import router as seller_router
from app.routers.buyer import router as buyer_router
from app.routers.banner import router as banner_router
from app.routers.society import router as society_router
from app.routers.lead import router as lead_router
from app.routers.trending_video import router as trending_video_router
from app.routers.public_services import router as public_services_router
from app.routers.public_products import router as public_products_router
from app.routers.admin_best_sellers import router as admin_best_sellers_router
from app.routers.admin_trending_products import router as admin_trending_products_router
from app.routers.admin_services import router as admin_services_router
from app.routers.public_services_listing import router as public_services_listing_router
from app.routers.admin_services_listing import router as admin_services_listing_router
from app.routers.admin_enquiries import router as admin_enquiries_router
from app.routers.services_listing import router as services_listing_router
from app.routers.admin_enquiries import router as admin_enquiries_router

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(nearby_router)
app.include_router(search_router)
app.include_router(biz_profile_router)
app.include_router(category_router)
app.include_router(admin_category_router)
app.include_router(social_link_router)
app.include_router(social_links_router)
app.include_router(document_router)
app.include_router(documents_router)
app.include_router(admin_document_router)
app.include_router(admin_user_router)
app.include_router(admin_profile_router)
app.include_router(admin_stats_router)
app.include_router(admin_dashboard_router)
app.include_router(public_profile_router)
app.include_router(featured_router)
app.include_router(admin_featured_router)
app.include_router(seller_router)
app.include_router(buyer_router)
app.include_router(banner_router)
app.include_router(society_router)
app.include_router(lead_router)
app.include_router(trending_video_router)
app.include_router(public_services_router)
app.include_router(public_products_router)
app.include_router(admin_best_sellers_router)
app.include_router(admin_trending_products_router)
app.include_router(admin_services_router)
app.include_router(public_services_listing_router)
app.include_router(admin_services_listing_router)
app.include_router(services_listing_router)
app.include_router(admin_enquiries_router)

import os
from pathlib import Path

uploads_dir = Path("uploads")
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}


@app.get("/api/health")
def api_health_check():
    db = check_db_health()
    return {
        "status": "ok" if db["status"] == "ok" else "degraded",
        "app": settings.APP_NAME,
        "database": db,
    }
