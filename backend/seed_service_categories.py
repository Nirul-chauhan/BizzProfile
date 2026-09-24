"""Seed service categories and subcategories."""
from app.database import get_db
from app.models.category import Category, Subcategory

SERVICE_CATEGORIES = [
    {
        "name": "Home Repair & Maintenance",
        "slug": "home-repair-maintenance",
        "icon": "wrench",
        "description": "Expert home repair and maintenance services for your society and apartment needs.",
        "sort_order": 1,
        "subcategories": [
            {"name": "Society Electrician", "slug": "society-electrician", "description": "Professional electricians for wiring, repairs, and installations in your society.", "sort_order": 1},
            {"name": "Plumbing Services", "slug": "plumbing-services", "description": "Expert plumbers for pipe fitting, leak repairs, and bathroom/kitchen plumbing.", "sort_order": 2},
            {"name": "Carpentry & Furniture", "slug": "carpentry-furniture", "description": "Skilled carpenters for furniture repair, woodwork, and custom installations.", "sort_order": 3},
            {"name": "RO Water Purifier Service", "slug": "ro-water-purifier-service", "description": "Regular maintenance, filter replacement, and repair for RO water purifiers.", "sort_order": 4},
        ],
    },
    {
        "name": "Electronics & Appliance Care",
        "slug": "electronics-appliance-care",
        "icon": "cpu",
        "description": "Professional servicing and repair for all your home electronics and appliances.",
        "sort_order": 2,
        "subcategories": [
            {"name": "AC Servicing & Repair", "slug": "ac-servicing-repair", "description": "Complete AC servicing, gas refilling, installation, and repair for all brands.", "sort_order": 1},
            {"name": "Home Appliance Repair", "slug": "home-appliance-repair", "description": "Repair services for washing machines, refrigerators, microwaves, and more.", "sort_order": 2},
            {"name": "Smart Home & Security", "slug": "smart-home-security", "description": "Installation and maintenance of CCTV, smart locks, and home automation systems.", "sort_order": 3},
        ],
    },
    {
        "name": "Cleaning & Pest Control",
        "slug": "cleaning-pest-control",
        "icon": "sparkles",
        "description": "Professional cleaning and pest control services for a healthy living environment.",
        "sort_order": 3,
        "subcategories": [
            {"name": "Deep Home Cleaning", "slug": "deep-home-cleaning", "description": "Thorough deep cleaning of your entire home including kitchen and bathroom.", "sort_order": 1},
            {"name": "Pest Control Treatment", "slug": "pest-control-treatment", "description": "Effective pest control for cockroaches, termites, mosquitoes, and rodents.", "sort_order": 2},
            {"name": "Water Tank Cleaning", "slug": "water-tank-cleaning", "description": "Professional overhead and underground water tank cleaning and sanitization.", "sort_order": 3},
        ],
    },
    {
        "name": "Construction & Interior Works",
        "slug": "construction-interior-works",
        "icon": "hammer",
        "description": "Quality construction, renovation, and interior design services for your home.",
        "sort_order": 4,
        "subcategories": [
            {"name": "Apartment Painting", "slug": "apartment-painting", "description": "Professional interior and exterior painting with premium quality paints.", "sort_order": 1},
            {"name": "False Ceiling & POP Repairs", "slug": "false-ceiling-pop-repairs", "description": "Expert false ceiling installation, POP work, and gypsum board repairs.", "sort_order": 2},
            {"name": "Civil & Tiling Work", "slug": "civil-tiling-work", "description": "Civil construction, wall repairs, floor tiling, and waterproofing services.", "sort_order": 3},
        ],
    },
    {
        "name": "Daily Essentials & Local Delivery",
        "slug": "daily-essentials-local-delivery",
        "icon": "truck",
        "description": "Fresh daily essentials delivered right to your doorstep from local vendors.",
        "sort_order": 5,
        "subcategories": [
            {"name": "Organic Dairy Delivery", "slug": "organic-dairy-delivery", "description": "Fresh organic milk, curd, paneer, and dairy products delivered daily.", "sort_order": 1},
            {"name": "Fresh Produce Vending", "slug": "fresh-produce-vending", "description": "Farm-fresh vegetables and fruits sourced directly from local markets.", "sort_order": 2},
            {"name": "Plant Nursery & Gardening", "slug": "plant-nursery-gardening", "description": "Indoor and outdoor plants, garden maintenance, and landscaping services.", "sort_order": 3},
        ],
    },
    {
        "name": "Wellness & Personal Care",
        "slug": "wellness-personal-care",
        "icon": "heart",
        "description": "Health, wellness, and personal care services in the comfort of your home.",
        "sort_order": 6,
        "subcategories": [
            {"name": "At-Home Salon & Grooming", "slug": "at-home-salon-grooming", "description": "Professional salon services at home including haircut, styling, and grooming.", "sort_order": 1},
            {"name": "Physiotherapy & Fitness", "slug": "physiotherapy-fitness", "description": "Expert physiotherapy sessions and personal fitness training at your doorstep.", "sort_order": 2},
            {"name": "Diagnostic Sample Collection", "slug": "diagnostic-sample-collection", "description": "Home collection of blood and other diagnostic samples with quick reports.", "sort_order": 3},
        ],
    },
    {
        "name": "Event Management & Celebration Services",
        "slug": "event-management-celebration",
        "icon": "gift",
        "description": "Complete event management and celebration services for society events and parties.",
        "sort_order": 7,
        "subcategories": [
            {"name": "Society Club Booking & Decor", "slug": "society-club-booking-decor", "description": "Venue booking, decoration, and event setup for society celebrations.", "sort_order": 1},
            {"name": "Catering & Tiffin Services", "slug": "catering-tiffin-services", "description": "Professional catering for events and daily tiffin services for residents.", "sort_order": 2},
            {"name": "DJ & Sound Rental", "slug": "dj-sound-rental", "description": "DJ services, sound system rental, and lighting for parties and events.", "sort_order": 3},
        ],
    },
    {
        "name": "Automobile & Vehicle Care",
        "slug": "automobile-vehicle-care",
        "icon": "car",
        "description": "Convenient vehicle maintenance and care services at your society parking.",
        "sort_order": 8,
        "subcategories": [
            {"name": "At-Society Car Washing", "slug": "at-society-car-washing", "description": "Professional car washing and detailing at your society parking area.", "sort_order": 1},
            {"name": "Two-Wheeler Quick Repair", "slug": "two-wheeler-quick-repair", "description": "Quick bike and scooter repair, battery replacement, and puncture fixing.", "sort_order": 2},
            {"name": "Battery Jump-Start Service", "slug": "battery-jump-start-service", "description": "Emergency car and bike battery jump-start and replacement services.", "sort_order": 3},
        ],
    },
]


def seed_service_categories():
    db = next(get_db())
    try:
        created_count = 0
        skipped_count = 0

        for cat_data in SERVICE_CATEGORIES:
            existing = db.query(Category).filter(
                (Category.slug == cat_data["slug"]) | (Category.name == cat_data["name"])
            ).first()
            if existing:
                skipped_count += 1
                cat = existing
            else:
                cat = Category(
                    name=cat_data["name"],
                    slug=cat_data["slug"],
                    description=cat_data.get("description"),
                    icon=cat_data.get("icon"),
                    is_active=True,
                    sort_order=cat_data.get("sort_order", 0),
                )
                db.add(cat)
                db.flush()
                created_count += 1

            for sub_data in cat_data.get("subcategories", []):
                existing_sub = db.query(Subcategory).filter(
                    Subcategory.category_id == cat.id,
                    (Subcategory.slug == sub_data["slug"]) | (Subcategory.name == sub_data["name"]),
                ).first()
                if not existing_sub:
                    sub = Subcategory(
                        category_id=cat.id,
                        name=sub_data["name"],
                        slug=sub_data["slug"],
                        description=sub_data.get("description"),
                        is_active=True,
                        sort_order=sub_data.get("sort_order", 0),
                    )
                    db.add(sub)

        db.commit()
        total_cats = db.query(Category).count()
        total_subs = db.query(Subcategory).count()
        print(f"Categories: {total_cats} total ({created_count} new, {skipped_count} existing)")
        print(f"Subcategories: {total_subs} total")

    except Exception as e:
        db.rollback()
        print(f"Error seeding categories: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_service_categories()
