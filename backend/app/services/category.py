from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.category import Category, Subcategory


class CategoryError(Exception):
    pass


class CategoryService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_category(
        self, name: str, slug: str, description: str | None = None, is_active: bool = True,
        icon: str | None = None, logo_url: str | None = None, is_popular: bool = False,
        sort_order: int = 0,
    ) -> Category:
        if self.db.execute(select(Category).where(Category.name == name)).scalars().first():
            raise CategoryError("Category name already exists.")
        if self.db.execute(select(Category).where(Category.slug == slug)).scalars().first():
            raise CategoryError("Category slug already exists.")

        category = Category(
            name=name, slug=slug, description=description, is_active=is_active,
            icon=icon, logo_url=logo_url, is_popular=is_popular, sort_order=sort_order,
        )
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category

    def get_categories(self) -> list[Category]:
        return list(self.db.execute(select(Category).order_by(Category.name)).scalars().all())

    def get_category_by_id(self, category_id: int) -> Category:
        category = self.db.execute(select(Category).where(Category.id == category_id)).scalars().first()
        if category is None:
            raise CategoryError("Category not found.")
        return category

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
