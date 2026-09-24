"""
Seed script for initial category hierarchy.

Run: python -m backend.seed_categories

Idempotent — will not duplicate existing records.
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.config import get_settings
from app.database import SessionLocal
from app.models.category import Category
from sqlalchemy import select


# ─── Category hierarchy ──────────────────────────────────────────────────────
# Structure: {name: {icon, subcategories: [names] or {name: [sub_names]}}}
CATEGORIES = {
    "Health Care": {
        "icon": "heart",
        "subcategories": {
            "Home Nursing Services": [],
            "Elder Care / Senior Citizen Caretaker Services": [],
            "ICU at Home / Critical Care": [],
            "Mother and Baby Care": [],
            "Medical Equipment Rentals & Services": [],
        },
    },
    "Electrical Services": {
        "icon": "zap",
        "subcategories": {
            "Wiring & Circuit Repairs": [],
            "Switchboard & MCB Installation": [],
            "Fan, Light, and Fixture Installation": [],
        },
    },
    "Plumbing Services": {
        "icon": "droplets",
        "subcategories": {
            "Pipe Leakage & Tap Repairs": [],
            "Bathroom & Kitchen Fixture Installation": [],
            "Water Tank & Motor Maintenance": [],
        },
    },
    "Carpentry Services": {
        "icon": "hammer",
        "subcategories": {
            "Furniture Assembly & Repair": [],
            "Door, Window, and Lock Repairs": [],
            "Custom Woodwork & Fitting": [],
        },
    },
    "Appliance Repair": {
        "icon": "settings",
        "subcategories": {
            "AC Servicing & Installation": [],
            "Washing Machine & Refrigerator Repair": [],
            "Microwave & Water Purifier (RO) Service": [],
        },
    },
    "Cleaning & Pest Control": {
        "icon": "sparkles",
        "subcategories": {
            "Deep Home Cleaning": [],
            "Kitchen & Bathroom Cleaning": [],
            "Sofa & Carpet Shampooing": [],
        },
    },
    "Home Cleaning": {
        "icon": "home",
        "subcategories": {
            "Regular Home Cleaning": [],
            "Move-in/Move-out Cleaning": [],
            "Post-Construction Cleaning": [],
        },
    },
    "Washing and Laundry": {
        "icon": "shirt",
        "subcategories": {
            "Wash & Fold": [],
            "Dry Cleaning": [],
            "Ironing & Pressing": [],
        },
    },
    "Home Care": {
        "icon": "wrench",
        "subcategories": {
            "Painting & Wall Repairs": [],
            "Roof & Waterproofing": [],
            "Pest Control Services": [],
        },
    },
    "Beauty & Personal Care": {
        "icon": "sparkle",
        "subcategories": {
            "Home Salon Services": [],
            "Bridal Makeup": [],
            "Skin & Hair Care Treatments": [],
        },
    },
    "Education & Tutoring": {
        "icon": "book-open",
        "subcategories": {
            "Home Tuition": [],
            "Online Tutoring": [],
            "Skill Development Classes": [],
        },
    },
    "Event Services": {
        "icon": "calendar",
        "subcategories": {
            "Party Planning": [],
            "Photography & Videography": [],
            "Catering Services": [],
        },
    },
    "Health & Beauty": {
        "icon": "heart",
        "subcategories": {
            "Skincare & Cosmetics": [],
            "Hair Care & Styling": [],
            "Personal Hygiene": [],
            "Spa & Wellness": [],
        },
    },
    "Apparel & Fashion": {
        "icon": "shirt",
        "subcategories": {
            "Men's Clothing": [],
            "Women's Clothing": [],
            "Footwear": [],
            "Accessories & Fashion Jewellery": [],
        },
    },
    "Chemicals": {
        "icon": "flask",
        "subcategories": {
            "Industrial Chemicals": [],
            "Laboratory Chemicals": [],
            "Specialty Chemicals": [],
        },
    },
    "Machinery": {
        "icon": "cog",
        "subcategories": {
            "Industrial Machinery": [],
            "Agricultural Machinery": [],
            "Construction Machinery": [],
            "Packaging Machinery": [],
        },
    },
    "Construction & Real Estate": {
        "icon": "building",
        "subcategories": {
            "Building Materials": [],
            "Interior Design": [],
            "Real Estate Services": [],
            "Hardware & Fittings": [],
        },
    },
    "Electronics & Electrical": {
        "icon": "zap",
        "subcategories": {
            "Consumer Electronics": [],
            "Electrical Components": [],
            "Home Appliances": [],
            "Smart Devices": [],
        },
    },
    "Hospital & Medical Supplies": {
        "icon": "cross",
        "subcategories": {
            "Surgical Equipment": [],
            "Diagnostic Devices": [],
            "Medical Furniture": [],
            "Patient Care Products": [],
        },
    },
    "Gifts & Crafts": {
        "icon": "gift",
        "subcategories": {
            "Corporate Gifts": [],
            "Handicrafts": [],
            "Festive Decorations": [],
            "Customised Gifts": [],
        },
    },
    "Packaging & Paper": {
        "icon": "box",
        "subcategories": {
            "Corrugated Boxes": [],
            "Flexible Packaging": [],
            "Paper Products": [],
            "Labels & Stickers": [],
        },
    },
    "Agriculture": {
        "icon": "leaf",
        "subcategories": {
            "Seeds & Fertilizers": [],
            "Farm Equipment": [],
            "Irrigation Systems": [],
            "Organic Products": [],
        },
    },
    "Home Supplies": {
        "icon": "home",
        "subcategories": {
            "Kitchen Accessories": [],
            "Bath & Sanitary": [],
            "Home Decor": [],
            "Cleaning Supplies": [],
        },
    },
    "Mineral & Metals": {
        "icon": "gem",
        "subcategories": {
            "Iron & Steel": [],
            "Non-Ferrous Metals": [],
            "Mineral Ores": [],
            "Metal Products": [],
        },
    },
}


def _slugify(name: str) -> str:
    return (
        name.lower()
        .replace("&", "and")
        .replace("/", " ")
        .replace("(", "")
        .replace(")", "")
        .strip()
        .replace("  ", " ")
        .replace(" ", "-")
    )


def seed_categories():
    db = SessionLocal()
    created_count = 0

    try:
        sort_order = 0
        for cat_name, cat_data in CATEGORIES.items():
            cat_slug = _slugify(cat_name)

            # Check if category exists
            existing = db.execute(
                select(Category).where(Category.slug == cat_slug)
            ).scalars().first()

            if existing:
                category = existing
            else:
                category = Category(
                    name=cat_name,
                    slug=cat_slug,
                    icon=cat_data.get("icon"),
                    is_active=True,
                    is_popular=True,
                    sort_order=sort_order,
                )
                db.add(category)
                db.flush()
                created_count += 1

            sort_order += 1

            # Create subcategories
            subcategories = cat_data.get("subcategories", {})
            sub_sort = 0
            for sub_name, sub_sub_names in subcategories.items():
                sub_slug = _slugify(sub_name)

                existing_sub = db.execute(
                    select(Category).where(
                        Category.parent_id == category.id,
                        Category.slug == sub_slug,
                    )
                ).scalars().first()

                if not existing_sub:
                    sub = Category(
                        parent_id=category.id,
                        name=sub_name,
                        slug=sub_slug,
                        is_active=True,
                        sort_order=sub_sort,
                    )
                    db.add(sub)
                    db.flush()
                    created_count += 1

                sub_sort += 1

        db.commit()
        print(f"Seeding complete. Created {created_count} new categories.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding categories: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_categories()
