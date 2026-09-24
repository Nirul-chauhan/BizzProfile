"""Seed 7 realistic service listings across categories."""
import sys, os, re
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models.service_listing import ServiceListing, ListingApprovalStatus
from app.models.user import User
from sqlalchemy import select


def _slugify(text: str) -> str:
    slug = re.sub(r"[^\w\s-]", "", text.lower().strip())
    return re.sub(r"[\s_]+", "-", slug)

SERVICES = [
    {
        "name": "Society Electrician - Same Day Repair",
        "description": "Professional electrician services for all society residents. Wiring repair, switch board replacement, fan installation, light fitting, MCB trips, and full house electrical inspection. Same-day service within your society premises.",
        "full_details": "Our certified electricians provide end-to-end electrical solutions for residential societies. We handle everything from minor switch repairs to complete rewiring projects.\n\nServices Include:\n- Switch & socket repair/replacement\n- Fan, light, and fitting installation\n- MCB and fuse box troubleshooting\n- Voltage stabilizer installation\n- Full house electrical safety audit\n- Emergency power restoration\n\nAll technicians are police-verified, wear ID badges, and carry digital invoices. 30-day warranty on all repairs.",
        "category_id": 10,
        "subcategory_id": 35,
        "provider_name": "QuickFix Electricals",
        "contact_number": "9876543210",
        "price": 299,
        "price_unit": "per visit",
        "city": "Mumbai",
        "state": "Maharashtra",
        "society_name": "Lokhandwala Complex",
        "image_url": "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800",
        "is_active": True,
        "is_featured": True,
        "sort_order": 1,
    },
    {
        "name": "Deep Home Cleaning - Premium Package",
        "description": "Thorough deep cleaning service covering kitchen, bathrooms, bedrooms, and living areas. Eco-friendly products, trained staff, and 100% satisfaction guarantee. Book online and get same-week slots.",
        "full_details": "Transform your home with our comprehensive deep cleaning service. Our trained professionals use hospital-grade eco-friendly cleaning agents to sanitize every corner of your home.\n\nPackage Includes:\n- Kitchen: chimney, hob, tiles, sink, cabinets (external)\n- Bathrooms: deep descaling, fixtures, glass panels\n- Bedrooms: floor mopping, window cleaning, fan dusting\n- Living Area: sofa vacuuming, carpet cleaning\n\nWe bring all equipment and supplies. No hidden charges. Each session takes 3-5 hours depending on flat size.\n\nSpecial offer: Flat 20% off for societies with 5+ bookings in a month.",
        "category_id": 12,
        "subcategory_id": 42,
        "provider_name": "CleanHome Pro",
        "contact_number": "9876543211",
        "price": 1499,
        "price_unit": "per session",
        "city": "Bangalore",
        "state": "Karnataka",
        "society_name": "Prestige Lakeside Heights",
        "image_url": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800",
        "is_active": True,
        "is_featured": True,
        "sort_order": 2,
    },
    {
        "name": "AC Servicing & Gas Refill",
        "description": "Complete AC maintenance including gas top-up, filter cleaning, compressor check, and performance tuning. Works with all brands - Samsung, LG, Daikin, Voltas, Blue Star. Emergency slots available.",
        "full_details": "Keep your air conditioner running at peak efficiency with our expert AC servicing. Our AC technicians are trained on all major brands and carry common spare parts.\n\nService includes:\n- Indoor unit deep cleaning (jet wash)\n- Outdoor unit coil cleaning\n- Gas pressure check and refill (if needed)\n- Thermostat calibration\n- Drain line clearing\n- Performance test run with temperature check\n\nWe service Split AC, Window AC, and Cassette AC units. Genuine spare parts with manufacturer warranty. Same-day service available for urgent breakdowns.\n\nGas refill charges additional based on tonnage: 0.75T (₹1800), 1T (₹2200), 1.5T (₹2800).",
        "category_id": 11,
        "subcategory_id": 39,
        "provider_name": "CoolCare Services",
        "contact_number": "9876543212",
        "price": 499,
        "price_unit": "per unit",
        "city": "Delhi",
        "state": "Delhi",
        "society_name": "DLF Phase 3",
        "image_url": "https://images.unsplash.com/photo-1631545806612-0e4c5c8e2c2e?w=800",
        "is_active": True,
        "is_featured": True,
        "sort_order": 3,
    },
    {
        "name": "Apartment Painting - Interior & Exterior",
        "description": "Professional painting services for 1BHK, 2BHK, 3BHK apartments. Asian Paints and Berger authorized partner. Free color consultation, masking, and cleanup included. 5-year warranty on exterior paint.",
        "full_details": "Give your home a fresh new look with our professional painting service. We are an authorized partner of Asian Paints and Berger, using only genuine products.\n\nWhat's Included:\n- Free pre-work site visit and color consultation\n- Surface preparation (putty, sanding, primer)\n- 2 coats of premium emulsion paint\n- Complete masking of furniture and fixtures\n- Post-painting cleanup\n\nPaint Options:\n- Economy: Asian Paints Apex / Berger Exterior\n- Premium: Asian Paints Royale / Berger WeatherCoat\n- Luxury: Asian Paints Royal Play textures\n\nTimeline: 1BHK (2-3 days), 2BHK (3-4 days), 3BHK (4-6 days)\nFree estimate with no obligation. Societies get 10% group discount.",
        "category_id": 13,
        "subcategory_id": 45,
        "provider_name": "ColorCraft Painters",
        "contact_number": "9876543213",
        "price": 12000,
        "price_unit": "per 2BHK",
        "city": "Pune",
        "state": "Maharashtra",
        "society_name": "Magarpatta City",
        "image_url": "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800",
        "is_active": True,
        "is_featured": False,
        "sort_order": 4,
    },
    {
        "name": "At-Society Car Washing & Detailing",
        "description": "Waterless and foam car wash service that comes to your society parking. Exterior wash, interior vacuuming, dashboard polishing, and tire dressing. Monthly packages available for residents.",
        "full_details": "Skip the car wash queue! Our mobile car care team arrives at your society parking with all equipment.\n\nStandard Wash (₹399):\n- High-pressure foam wash\n- Exterior hand dry\n- Interior vacuum\n- Dashboard wipe\n\nPremium Detailing (₹999):\n- Everything in Standard\n- Clay bar treatment\n- Wax polish\n- Fabric/leather conditioning\n- Tyre dressing\n- Glass cleaning (interior + exterior)\n\nMonthly Plans:\n- 4 washes/month: ₹1299 (save ₹300)\n- 4 premium/month: ₹3299 (save ₹700)\n\nWe use eco-friendly waterless products. No mess in parking area. Societies of 50+ flats get dedicated weekly slots.",
        "category_id": 17,
        "subcategory_id": 57,
        "provider_name": "SparkleWash Mobile",
        "contact_number": "9876543214",
        "price": 399,
        "price_unit": "per wash",
        "city": "Hyderabad",
        "state": "Telangana",
        "society_name": "Gachibowli Metro Ville",
        "image_url": "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800",
        "is_active": True,
        "is_featured": True,
        "sort_order": 5,
    },
    {
        "name": "Society Club Booking & Event Decor",
        "description": "Complete party and event decoration for society hall bookings. Birthday, anniversary, naming ceremony, and festival decorations. Includes setup, teardown, and cleanup.",
        "full_details": "Make every celebration special with our end-to-end event decoration service. We handle everything from setup to cleanup so you can enjoy the event stress-free.\n\nBirthday Package (₹2,999):\n- Balloon arch and column\n- Theme-based backdrop\n- Table centerpiece\n- LED number candles\n- Confetti poppers\n\nAnniversary Package (₹4,499):\n- Floral and balloon decor\n- Photo booth setup\n- LED lights backdrop\n- Rose petal table arrangement\n- Cake table dressing\n\nCustom Events:\n- Naming ceremony\n- Housewarming\n- Festival celebrations (Diwali, Holi, Christmas)\n- Society annual day\n\nAll packages include setup, event-time support, and next-day teardown. We coordinate with society admin for hall booking compliance.",
        "category_id": 16,
        "subcategory_id": 54,
        "provider_name": "CelebrationBox Events",
        "contact_number": "9876543215",
        "price": 2999,
        "price_unit": "per event",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "society_name": "Mantri Synergy",
        "image_url": "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800",
        "is_active": True,
        "is_featured": False,
        "sort_order": 6,
    },
    {
        "name": "RO Water Purifier Service & Installation",
        "description": "Complete RO water purifier AMC, installation, and repair. Works with Aquaguard, Kent, Pureit, Blue Star. Filter replacement, membrane change, UV bulb change, and annual maintenance contracts.",
        "full_details": "Ensure safe drinking water for your family with our expert RO purifier service. We service all major brands and offer both one-time repair and annual maintenance contracts.\n\nOne-Time Service (₹499):\n- Complete RO system inspection\n- Sediment + carbon filter cleaning\n- RO membrane flush\n- UV bulb check\n- TDS measurement before/after\n- Performance report\n\nAMC Plans:\n- Basic (₹1,999/year): 2 services + filter change\n- Premium (₹3,499/year): 4 services + all filters + membrane\n- Premium+ (₹4,999/year): All of Premium + free visit for breakdowns\n\nInstallation: ₹500 for new RO setup (excluding RO unit)\nFilter replacements at genuine MRP. 90-day warranty on all services.\n\nWe also buy back old RO units for recycling.",
        "category_id": 10,
        "subcategory_id": 38,
        "provider_name": "PureFlow Water Solutions",
        "contact_number": "9876543216",
        "price": 499,
        "price_unit": "per service",
        "city": "Noida",
        "state": "Uttar Pradesh",
        "society_name": "ATS Triumph",
        "image_url": "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800",
        "is_active": True,
        "is_featured": True,
        "sort_order": 7,
    },
]


def seed():
    db = SessionLocal()
    try:
        admin = db.execute(select(User).where(User.email == "admin@bizzprofiles.com")).scalars().first()
        if not admin:
            print("ERROR: Admin user not found. Run seed_admin first.")
            return

        count = 0
        for s in SERVICES:
            slug = _slugify(s["name"])
            existing = db.execute(select(ServiceListing).where(ServiceListing.slug == slug)).scalars().first()
            if existing:
                print(f"  SKIP: '{s['name']}' already exists")
                continue
            svc = ServiceListing(
                name=s["name"],
                slug=slug,
                description=s["description"],
                full_details=s["full_details"],
                image_url=s["image_url"],
                category_id=s["category_id"],
                subcategory_id=s["subcategory_id"],
                provider_name=s["provider_name"],
                contact_number=s["contact_number"],
                price=s["price"],
                price_unit=s["price_unit"],
                city=s["city"],
                state=s["state"],
                society_name=s["society_name"],
                added_by_user_id=admin.id,
                approval_status=ListingApprovalStatus.APPROVED.value,
                is_active=s["is_active"],
                is_featured=s["is_featured"],
                sort_order=s["sort_order"],
            )
            db.add(svc)
            count += 1
            print(f"  ADD: {s['name']} ({s['city']})")

        db.commit()
        print(f"\nDone! {count} services seeded.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
