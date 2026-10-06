"""Seed the hero-carousel ad banners.

Mirrors the active "More Value Adds" offers as rotating ads so the public
homepage hero has real content instead of the hardcoded fallback slides.

Idempotent: banners are matched on title, so re-running only fills gaps.

Run: python -m scripts.seed_banners
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import SessionLocal
from app.models.banner import Banner

BANNERS = [
    {
        "title": "Local Trade Shows & Events",
        "subtitle": "Discover nearby exhibitions, business events and local trade opportunities.",
        "cta_text": "Explore Events",
        "cta_url": "/businesses",
        "gradient": "linear-gradient(135deg, #4f46e5, #7c3aed)",
    },
    {
        "title": "Buy Trade Leads",
        "subtitle": "Find genuine buyer requirements and connect with relevant local businesses.",
        "cta_text": "Get Leads",
        "cta_url": "/login",
        "gradient": "linear-gradient(135deg, #059669, #0d9488)",
    },
    {
        "title": "Business Domain",
        "subtitle": "Build your professional online business presence with BizzProfile.",
        "cta_text": "Claim Domain",
        "cta_url": "/auth/enduser",
        "gradient": "linear-gradient(135deg, #2563eb, #4f46e5)",
    },
    {
        "title": "Membership Plans",
        "subtitle": "Explore BizzProfile plans and business growth features for sellers.",
        "cta_text": "View Plans",
        "cta_url": "/login",
        "gradient": "linear-gradient(135deg, #d97706, #f59e0b)",
    },
    {
        "title": "Find Distributors",
        "subtitle": "Discover distributors, suppliers and business partners near you.",
        "cta_text": "Find Partners",
        "cta_url": "/businesses",
        "gradient": "linear-gradient(135deg, #e11d48, #db2777)",
    },
]


def seed():
    db = SessionLocal()
    try:
        created = 0
        for i, b in enumerate(BANNERS):
            existing = db.query(Banner).filter(Banner.title == b["title"]).first()
            if existing:
                print(f"[=] Banner already exists: {existing.title} (id={existing.id})")
                continue

            db.add(
                Banner(
                    title=b["title"],
                    subtitle=b["subtitle"],
                    cta_text=b["cta_text"],
                    cta_url=b["cta_url"],
                    image_url=None,
                    gradient=b["gradient"],
                    is_active=True,
                    sort_order=i + 1,
                )
            )
            db.flush()
            created += 1
            print(f"[+] Created banner: {b['title']} (order={i + 1})")

        db.commit()
        total = db.query(Banner).count()
        active = db.query(Banner).filter(Banner.is_active == True).count()
        print(f"\nDone! Created {created} banners. Total: {total} ({active} active)")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()