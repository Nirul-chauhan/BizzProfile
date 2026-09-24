"""Seed 7 Best Seller products into the database.

Run: python -m scripts.seed_best_sellers
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import SessionLocal
from app.models.user import User
from app.models.role import Role, RoleEnum
from app.models.biz_profile import BizProfile, ProfileType
from app.models.category import Category
from app.models.product import Product, ProductImage, ProductStatus
from app.models.product import ProductStatus as PS

PRODUCTS = [
    {
        "name": "Stainless Steel Fasteners",
        "slug": "stainless-steel-fasteners",
        "description": "High-grade SS 304/316 fasteners including bolts, nuts, washers, and anchors. Suitable for construction, marine, and industrial applications.",
        "price": 500,
        "price_unit": "Kg",
        "category_name": "Industrial Supplies",
        "image_url": "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&h=300&fit=crop",
    },
    {
        "name": "CNC Precision Components",
        "slug": "cnc-precision-components",
        "description": "Custom CNC machined parts in aluminium, brass, steel. Tolerances up to ±0.01mm. OEM orders welcome.",
        "price": 1200,
        "price_unit": "Piece",
        "category_name": "Industrial Supplies",
        "image_url": "https://images.unsplash.com/photo-1565043666747-69f6646db940?w=400&h=300&fit=crop",
    },
    {
        "name": "Industrial Safety Shoes",
        "slug": "industrial-safety-shoes",
        "description": "ISI certified steel-toe safety shoes with anti-slip sole. Available in sizes 6-12. Bulk orders accepted.",
        "price": 850,
        "price_unit": "Pair",
        "category_name": "Safety Equipment",
        "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop",
    },
    {
        "name": "Copper Wire 2.5mm",
        "slug": "copper-wire-2-5mm",
        "description": "ISI marked 2.5 sq mm copper house wiring wire. 99.9% pure copper conductor with PVC insulation.",
        "price": 3400,
        "price_unit": "Roll (90m)",
        "category_name": "Electrical Supplies",
        "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop",
    },
    {
        "name": "Marble Floor Tiles",
        "slug": "marble-floor-tiles",
        "description": "Premium Indian marble floor tiles — Makrana White, Green Marble, Black Galaxy. Polished finish, 2x2 ft.",
        "price": 75,
        "price_unit": "Sq Ft",
        "category_name": "Building Materials",
        "image_url": "https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=400&h=300&fit=crop",
    },
    {
        "name": "Commercial Water Pump",
        "slug": "commercial-water-pump",
        "description": "1 HP monoblock centrifugal water pump for agriculture and commercial use. Energy efficient, 2-year warranty.",
        "price": 4500,
        "price_unit": "Unit",
        "category_name": "Machinery",
        "image_url": "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=300&fit=crop",
    },
    {
        "name": "PVC Pipe 4 inch",
        "slug": "pvc-pipe-4-inch",
        "description": "Heavy-duty PVC pressure pipes for plumbing and irrigation. IS:4985 certified. Length: 6 meters.",
        "price": 420,
        "price_unit": "Piece",
        "category_name": "Building Materials",
        "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=400&fit=crop",
    },
]


def seed():
    db = SessionLocal()
    try:
        # Find or create a SELLER user
        seller_role = db.query(Role).filter(Role.name == RoleEnum.SELLER.value).first()
        if not seller_role:
            seller_role = Role(name=RoleEnum.SELLER.value, description="Seller role")
            db.add(seller_role)
            db.flush()

        seller = db.query(User).filter(User.email == "seller@bizzprofiles.com").first()
        if not seller:
            seller = User(
                full_name="BizzProfiles Store",
                email="seller@bizzprofiles.com",
                mobile="9000000001",
                role_id=seller_role.id,
                city="Mumbai",
                state="Maharashtra",
                country="India",
                is_active=True,
                is_phone_verified=True,
            )
            db.add(seller)
            db.flush()
            print(f"[+] Created seller user: {seller.email} (id={seller.id})")
        else:
            print(f"[=] Seller user exists: {seller.email} (id={seller.id})")

        # Find or create category
        cat = db.query(Category).filter(Category.name == "Industrial Supplies").first()
        if not cat:
            cat = Category(name="Industrial Supplies", slug="industrial-supplies", is_active=True)
            db.add(cat)
            db.flush()
            print(f"[+] Created category: {cat.name} (id={cat.id})")
        else:
            print(f"[=] Category exists: {cat.name} (id={cat.id})")

        # Create additional categories as needed
        cats_map = {}
        for p in PRODUCTS:
            cname = p["category_name"]
            if cname not in cats_map:
                existing = db.query(Category).filter(Category.name == cname).first()
                if not existing:
                    existing = Category(name=cname, slug=cname.lower().replace(" ", "-"), is_active=True)
                    db.add(existing)
                    db.flush()
                    print(f"[+] Created category: {cname} (id={existing.id})")
                cats_map[cname] = existing

        # Find or create business profile
        profile = db.query(BizProfile).filter(BizProfile.user_id == seller.id).first()
        if not profile:
            profile = BizProfile(
                user_id=seller.id,
                category_id=cat.id,
                profile_type=ProfileType.COMPANY.value,
                business_name="BizzProfiles Store",
                slug="bizzprofiles-store",
                description="Your one-stop B2B marketplace for industrial and commercial supplies.",
                phone="9000000001",
                email="seller@bizzprofiles.com",
                city="Mumbai",
                state="Maharashtra",
                country="India",
                is_public=True,
                is_active=True,
                is_verified=True,
            )
            db.add(profile)
            db.flush()
            print(f"[+] Created business profile: {profile.business_name} (id={profile.id})")
        else:
            print(f"[=] Business profile exists: {profile.business_name} (id={profile.id})")

        # Create products
        created = 0
        for i, p in enumerate(PRODUCTS):
            existing = db.query(Product).filter(Product.slug == p["slug"]).first()
            if existing:
                if not existing.is_best_seller:
                    existing.is_best_seller = True
                    existing.best_seller_order = i + 1
                    db.flush()
                    print(f"[=] Updated {existing.name} -> best_seller=True, order={i+1}")
                else:
                    print(f"[=] Product already best seller: {existing.name}")
                continue

            product = Product(
                profile_id=profile.id,
                category_id=cats_map[p["category_name"]].id,
                name=p["name"],
                slug=p["slug"],
                description=p["description"],
                price=p["price"],
                price_unit=p["price_unit"],
                is_available=True,
                is_best_seller=True,
                best_seller_order=i + 1,
                status=PS.ACTIVE.value,
            )
            db.add(product)
            db.flush()

            # Add product image
            img = ProductImage(
                product_id=product.id,
                image_url=p["image_url"],
                sort_order=0,
                is_primary=True,
            )
            db.add(img)
            created += 1
            print(f"[+] Created product: {product.name} (id={product.id}, order={i+1})")

        db.commit()
        print(f"\nDone! Created {created} products. Total best sellers: {db.query(Product).filter(Product.is_best_seller == True).count()}")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
