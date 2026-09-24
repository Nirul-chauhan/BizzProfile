"""Seed demo services into biz_services table."""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models.service import BizService, ServiceStatus, ServiceApprovalStatus
from app.models.category import Category
from app.models.biz_profile import BizProfile

DEMO_SERVICES = [
    {
        "name": "Professional AC Repair & Installation",
        "slug": "professional-ac-repair-installation",
        "description": "Expert AC repair, installation, and maintenance services. We handle all brands and models with guaranteed satisfaction.",
        "category_slug": "electronics-appliance-care",
        "subcategory_slug": "ac-repair-installation",
        "price_min": 500,
        "price_max": 5000,
        "price_unit": "per service",
        "contact_phone": "9876543210",
        "contact_email": "ac@services.com",
        "city": "Mumbai",
        "state": "Maharashtra",
        "is_trending": True,
        "is_featured": True,
    },
    {
        "name": "Deep Home Cleaning Service",
        "slug": "deep-home-cleaning-service",
        "description": "Complete deep cleaning for homes and offices. Kitchen, bathroom, carpet, sofa cleaning with eco-friendly products.",
        "category_slug": "cleaning-pest-control",
        "subcategory_slug": "deep-cleaning",
        "price_min": 1500,
        "price_max": 8000,
        "price_unit": "per visit",
        "contact_phone": "9876543211",
        "contact_email": "cleaning@services.com",
        "city": "Delhi",
        "state": "Delhi",
        "is_trending": True,
        "is_featured": True,
    },
    {
        "name": "Expert Electrician Services",
        "slug": "expert-electrician-services",
        "description": "Licensed electricians for all your wiring, installation, and repair needs. Available 24/7 for emergency calls.",
        "category_slug": "home-repair-maintenance",
        "subcategory_slug": "electrician",
        "price_min": 300,
        "price_max": 3000,
        "price_unit": "per visit",
        "contact_phone": "9876543212",
        "contact_email": "electric@services.com",
        "city": "Bangalore",
        "state": "Karnataka",
        "is_trending": True,
        "is_featured": False,
    },
    {
        "name": "Premium Car Washing & Detailing",
        "slug": "premium-car-washing-detailing",
        "description": "Inside-out car washing, waxing, polishing, and ceramic coating. Mobile service available at your doorstep.",
        "category_slug": "automobile-vehicle-care",
        "subcategory_slug": "car-washing",
        "price_min": 400,
        "price_max": 5000,
        "price_unit": "per wash",
        "contact_phone": "9876543213",
        "contact_email": "carwash@services.com",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "is_trending": True,
        "is_featured": True,
    },
    {
        "name": "Professional Painting Services",
        "slug": "professional-painting-services",
        "description": "Interior and exterior painting with premium paints. Color consultation included. Residential and commercial projects.",
        "category_slug": "construction-interior-works",
        "subcategory_slug": "painting",
        "price_min": 5000,
        "price_max": 50000,
        "price_unit": "per project",
        "contact_phone": "9876543214",
        "contact_email": "painting@services.com",
        "city": "Pune",
        "state": "Maharashtra",
        "is_trending": False,
        "is_featured": True,
    },
    {
        "name": "Salon at Home - Beauty Services",
        "slug": "salon-at-home-beauty-services",
        "description": "Professional beauty parlour services at your doorstep. Hair spa, facial, waxing, makeup, and bridal packages.",
        "category_slug": "wellness-personal-care",
        "subcategory_slug": "salon-services",
        "price_min": 300,
        "price_max": 10000,
        "price_unit": "per session",
        "contact_phone": "9876543215",
        "contact_email": "beauty@services.com",
        "city": "Hyderabad",
        "state": "Telangana",
        "is_trending": True,
        "is_featured": False,
    },
    {
        "name": "Plumbing Services - All Types",
        "slug": "plumbing-services-all-types",
        "description": "Expert plumbing for pipe fitting, leak repair, bathroom renovation, and water tank cleaning. Same-day service guaranteed.",
        "category_slug": "home-repair-maintenance",
        "subcategory_slug": "plumbing",
        "price_min": 400,
        "price_max": 4000,
        "price_unit": "per visit",
        "contact_phone": "9876543216",
        "contact_email": "plumb@services.com",
        "city": "Kolkata",
        "state": "West Bengal",
        "is_trending": False,
        "is_featured": True,
    },
    {
        "name": "Pest Control & Termite Treatment",
        "slug": "pest-control-termite-treatment",
        "description": "Complete pest control solutions for cockroaches, termites, mosquitoes, and rats. 100% safe for kids and pets.",
        "category_slug": "cleaning-pest-control",
        "subcategory_slug": "pest-control",
        "price_min": 800,
        "price_max": 5000,
        "price_unit": "per treatment",
        "contact_phone": "9876543217",
        "contact_email": "pest@services.com",
        "city": "Ahmedabad",
        "state": "Gujarat",
        "is_trending": True,
        "is_featured": False,
    },
    {
        "name": "Event Management & Decoration",
        "slug": "event-management-decoration",
        "description": "Complete event planning for birthdays, weddings, corporate events. Theme decoration, catering, and DJ services.",
        "category_slug": "event-management-celebration-services",
        "subcategory_slug": "event-planning",
        "price_min": 10000,
        "price_max": 500000,
        "price_unit": "per event",
        "contact_phone": "9876543218",
        "contact_email": "events@services.com",
        "city": "Jaipur",
        "state": "Rajasthan",
        "is_trending": True,
        "is_featured": True,
    },
    {
        "name": "Grocery & Dairy Daily Delivery",
        "slug": "grocery-dairy-daily-delivery",
        "description": "Fresh groceries, dairy products, and daily essentials delivered to your doorstep. Same-day delivery within 2 hours.",
        "category_slug": "daily-essentials-local-delivery",
        "subcategory_slug": "dairy-daily-essentials",
        "price_min": 0,
        "price_max": 0,
        "price_unit": "free delivery above ₹500",
        "contact_phone": "9876543219",
        "contact_email": "delivery@services.com",
        "city": "Lucknow",
        "state": "Uttar Pradesh",
        "is_trending": False,
        "is_featured": True,
    },
]


def seed_services():
    db = SessionLocal()
    try:
        profiles = db.query(BizProfile).filter(BizProfile.is_active == True).limit(5).all()
        if not profiles:
            print("No active business profiles found. Creating with first profile or skipping.")
            return

        created = 0
        for svc_data in DEMO_SERVICES:
            existing = db.query(BizService).filter(BizService.slug == svc_data["slug"]).first()
            if existing:
                print(f"  Service '{svc_data['name']}' already exists, skipping.")
                continue

            category = db.query(Category).filter(Category.slug == svc_data["category_slug"]).first()
            if not category:
                print(f"  Category '{svc_data['category_slug']}' not found, skipping '{svc_data['name']}'.")
                continue

            subcategory = None
            if svc_data.get("subcategory_slug"):
                from app.models.category import Subcategory
                subcategory = db.query(Subcategory).filter(Subcategory.slug == svc_data["subcategory_slug"]).first()

            profile = profiles[created % len(profiles)]

            service = BizService(
                profile_id=profile.id,
                category_id=category.id,
                subcategory_id=subcategory.id if subcategory else None,
                name=svc_data["name"],
                slug=svc_data["slug"],
                description=svc_data["description"],
                price_min=svc_data.get("price_min"),
                price_max=svc_data.get("price_max"),
                price_unit=svc_data.get("price_unit"),
                contact_phone=svc_data.get("contact_phone"),
                contact_email=svc_data.get("contact_email"),
                city=svc_data.get("city"),
                state=svc_data.get("state"),
                country="India",
                added_by_user_id=profile.user_id,
                approval_status=ServiceApprovalStatus.APPROVED.value,
                is_available=True,
                is_trending=svc_data.get("is_trending", False),
                is_featured=svc_data.get("is_featured", False),
                is_published=True,
                status=ServiceStatus.ACTIVE.value,
            )
            db.add(service)
            created += 1
            print(f"  Created service: {svc_data['name']}")

        db.commit()
        print(f"\nSeeded {created} demo services.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding services: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_services()
