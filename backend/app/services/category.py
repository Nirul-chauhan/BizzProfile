from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.category import Category, Subcategory


class CategoryError(Exception):
    pass


class CategoryService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_category(
        self, name: str, slug: str, description: str | None = None, is_active: bool = True,
        icon: str | None = None, logo_url: str | None = None, is_popular: bool = False,
        sort_order: int = 0, parent_id: int | None = None,
        is_trending: bool = False, trending_order: int = 0,
    ) -> Category:
        if self.db.execute(select(Category).where(Category.name == name)).scalars().first():
            raise CategoryError("Category name already exists.")
        if self.db.execute(select(Category).where(Category.slug == slug)).scalars().first():
            raise CategoryError("Category slug already exists.")

        if parent_id is not None:
            parent = self.db.execute(select(Category).where(Category.id == parent_id)).scalars().first()
            if parent is None:
                raise CategoryError("Parent category not found.")

        category = Category(
            parent_id=parent_id, name=name, slug=slug, description=description,
            is_active=is_active, icon=icon, logo_url=logo_url,
            is_popular=is_popular, sort_order=sort_order,
            is_trending=is_trending, trending_order=trending_order,
        )
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category

    def get_categories(self, include_inactive: bool = False) -> list[Category]:
        query = select(Category)
        if not include_inactive:
            query = query.where(Category.is_active == True)
        return list(self.db.execute(query.order_by(Category.sort_order, Category.name)).scalars().all())

    def get_category_by_id(self, category_id: int) -> Category:
        category = self.db.execute(select(Category).where(Category.id == category_id)).scalars().first()
        if category is None:
            raise CategoryError("Category not found.")
        return category

    def get_children(self, parent_id: int) -> list[Category]:
        return list(
            self.db.execute(
                select(Category)
                .where(Category.parent_id == parent_id, Category.is_active == True)
                .order_by(Category.sort_order, Category.name)
            ).scalars().all()
        )

    def get_root_categories(self) -> list[Category]:
        return list(
            self.db.execute(
                select(Category)
                .where(Category.parent_id == None, Category.is_active == True)
                .order_by(Category.sort_order, Category.name)
            ).scalars().all()
        )

    def build_tree(self) -> list[dict]:
        """Build the full category tree recursively. Returns list of root nodes."""
        all_categories = list(
            self.db.execute(
                select(Category)
                .where(Category.is_active == True)
                .order_by(Category.sort_order, Category.name)
            ).scalars().all()
        )

        all_subcategories = list(
            self.db.execute(
                select(Subcategory)
                .where(Subcategory.is_active == True)
                .order_by(Subcategory.sort_order, Subcategory.name)
            ).scalars().all()
        )

        # Build lookup maps
        cat_map: dict[int, dict] = {}
        for c in all_categories:
            cat_map[c.id] = {
                "id": c.id,
                "parent_id": c.parent_id,
                "name": c.name,
                "slug": c.slug,
                "description": c.description,
                "is_active": c.is_active,
                "icon": c.icon,
                "logo_url": c.logo_url,
                "is_popular": c.is_popular,
                "is_trending": c.is_trending,
                "trending_order": c.trending_order,
                "sort_order": c.sort_order,
                "children": [],
                "subcategories": [],
            }

        # Attach subcategories to their parent categories
        for s in all_subcategories:
            if s.category_id in cat_map:
                cat_map[s.category_id]["subcategories"].append({
                    "id": s.id,
                    "category_id": s.category_id,
                    "name": s.name,
                    "slug": s.slug,
                    "description": s.description,
                    "is_active": s.is_active,
                    "keywords": s.keywords,
                    "sort_order": s.sort_order,
                    "is_trending": s.is_trending,
                    "created_at": s.created_at.isoformat() if s.created_at else None,
                    "updated_at": s.updated_at.isoformat() if s.updated_at else None,
                })

        # Build tree: attach children to parents
        roots = []
        for c in all_categories:
            node = cat_map[c.id]
            if c.parent_id is None:
                roots.append(node)
            elif c.parent_id in cat_map:
                cat_map[c.parent_id]["children"].append(node)

        return roots

    def get_breadcrumbs(self, category_id: int) -> list[dict]:
        """Get breadcrumb path from root to the given category."""
        breadcrumbs = []
        current_id = category_id
        visited = set()

        while current_id is not None:
            if current_id in visited:
                break
            visited.add(current_id)

            cat = self.db.execute(
                select(Category).where(Category.id == current_id)
            ).scalars().first()
            if cat is None:
                break

            breadcrumbs.append({"id": cat.id, "name": cat.name, "slug": cat.slug})
            current_id = cat.parent_id

        breadcrumbs.reverse()
        return breadcrumbs

    def update_category(self, category_id: int, **kwargs) -> Category:
        category = self.get_category_by_id(category_id)

        if "name" in kwargs and kwargs["name"] is not None:
            existing = self.db.execute(
                select(Category).where(Category.name == kwargs["name"], Category.id != category_id)
            ).scalars().first()
            if existing:
                raise CategoryError("Category name already exists.")
            category.name = kwargs["name"]

        if "slug" in kwargs and kwargs["slug"] is not None:
            existing = self.db.execute(
                select(Category).where(Category.slug == kwargs["slug"], Category.id != category_id)
            ).scalars().first()
            if existing:
                raise CategoryError("Category slug already exists.")
            category.slug = kwargs["slug"]

        if "description" in kwargs:
            category.description = kwargs["description"]

        if "is_active" in kwargs and kwargs["is_active"] is not None:
            category.is_active = kwargs["is_active"]

        if "icon" in kwargs:
            category.icon = kwargs["icon"]

        if "logo_url" in kwargs:
            category.logo_url = kwargs["logo_url"]

        if "is_popular" in kwargs and kwargs["is_popular"] is not None:
            category.is_popular = kwargs["is_popular"]

        if "sort_order" in kwargs and kwargs["sort_order"] is not None:
            category.sort_order = kwargs["sort_order"]

        if "is_trending" in kwargs and kwargs["is_trending"] is not None:
            category.is_trending = kwargs["is_trending"]

        if "trending_order" in kwargs and kwargs["trending_order"] is not None:
            category.trending_order = kwargs["trending_order"]

        if "parent_id" in kwargs:
            if kwargs["parent_id"] == category_id:
                raise CategoryError("Category cannot be its own parent.")
            if kwargs["parent_id"] is not None:
                parent = self.db.execute(
                    select(Category).where(Category.id == kwargs["parent_id"])
                ).scalars().first()
                if parent is None:
                    raise CategoryError("Parent category not found.")
            category.parent_id = kwargs["parent_id"]

        self.db.commit()
        self.db.refresh(category)
        return category

    def delete_category(self, category_id: int) -> None:
        category = self.get_category_by_id(category_id)
        self.db.delete(category)
        self.db.commit()

    def create_subcategory(
        self, category_id: int, name: str, slug: str, description: str | None = None,
        is_active: bool = True, keywords: str | None = None, sort_order: int = 0,
        is_trending: bool = False,
    ) -> Subcategory:
        self.get_category_by_id(category_id)

        existing = self.db.execute(
            select(Subcategory).where(
                Subcategory.category_id == category_id, Subcategory.slug == slug
            )
        ).scalars().first()
        if existing:
            raise CategoryError("Subcategory slug already exists in this category.")

        subcategory = Subcategory(
            category_id=category_id, name=name, slug=slug, description=description,
            is_active=is_active, keywords=keywords, sort_order=sort_order,
            is_trending=is_trending,
        )
        self.db.add(subcategory)
        self.db.commit()
        self.db.refresh(subcategory)
        return subcategory

    def get_subcategories(self, category_id: int) -> list[Subcategory]:
        self.get_category_by_id(category_id)
        return list(
            self.db.execute(
                select(Subcategory).where(Subcategory.category_id == category_id).order_by(Subcategory.name)
            ).scalars().all()
        )

    def get_subcategory_by_id(self, subcategory_id: int) -> Subcategory:
        sub = self.db.execute(select(Subcategory).where(Subcategory.id == subcategory_id)).scalars().first()
        if sub is None:
            raise CategoryError("Subcategory not found.")
        return sub

    def update_subcategory(self, subcategory_id: int, **kwargs) -> Subcategory:
        sub = self.get_subcategory_by_id(subcategory_id)

        if "name" in kwargs and kwargs["name"] is not None:
            sub.name = kwargs["name"]

        if "slug" in kwargs and kwargs["slug"] is not None:
            existing = self.db.execute(
                select(Subcategory).where(
                    Subcategory.category_id == sub.category_id,
                    Subcategory.slug == kwargs["slug"],
                    Subcategory.id != subcategory_id,
                )
            ).scalars().first()
            if existing:
                raise CategoryError("Subcategory slug already exists in this category.")
            sub.slug = kwargs["slug"]

        if "description" in kwargs:
            sub.description = kwargs["description"]

        if "is_active" in kwargs and kwargs["is_active"] is not None:
            sub.is_active = kwargs["is_active"]

        if "keywords" in kwargs:
            sub.keywords = kwargs["keywords"]

        if "sort_order" in kwargs and kwargs["sort_order"] is not None:
            sub.sort_order = kwargs["sort_order"]

        if "is_trending" in kwargs and kwargs["is_trending"] is not None:
            sub.is_trending = kwargs["is_trending"]

        if "category_id" in kwargs and kwargs["category_id"] is not None:
            self.get_category_by_id(kwargs["category_id"])
            sub.category_id = kwargs["category_id"]

        self.db.commit()
        self.db.refresh(sub)
        return sub

    def delete_subcategory(self, subcategory_id: int) -> None:
        sub = self.get_subcategory_by_id(subcategory_id)
        self.db.delete(sub)
        self.db.commit()
