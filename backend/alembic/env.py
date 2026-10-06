from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.config import get_settings
from app.database import Base

import app.models  # noqa: F401 — registers all models with Base.metadata

settings = get_settings()
config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# Objects that reflection can see in the database but that this project does not
# own. Without these filters `alembic revision --autogenerate` treats them as
# "present in the DB, missing from the models" and emits DROP statements for
# them: dropping spatial_ref_sys fails with "extension postgis requires it", and
# dropping the location columns would silently break Nearby search.
#
# Anything the postgis/raster/topology extensions may have installed.
EXTENSION_OWNED_TABLES = frozenset(
    {
        "spatial_ref_sys",
        "geometry_columns",
        "geography_columns",
        "raster_columns",
        "raster_overviews",
        "raster_cover_tiles_keyword",
        "topology_layers",
        "topology",
        "layer",
        "layer_stats",
        "layer_topology",
        "topology_ref_sys",
        "networks",
        "network_topology",
    }
)

# GENERATED ALWAYS AS STORED columns added by revision b2c3d4e5f6a8. The
# application never writes them - PostgreSQL derives the point from the
# latitude/longitude pair - so they are intentionally absent from the models.
GENERATED_COLUMNS = frozenset(
    {
        ("biz_profiles", "location"),
        ("biz_services", "location"),
        ("service_listings", "location"),
    }
)


def include_object(obj, name, type_, reflected, compare_to) -> bool:
    """Keep autogenerate away from database-owned objects."""
    if type_ == "table" and reflected and name in EXTENSION_OWNED_TABLES:
        return False

    # Only suppress the column when the database has it and the metadata does
    # not; a column present on both sides is a real difference and must be seen.
    if type_ == "column" and reflected and compare_to is None:
        if (obj.table.name, obj.name) in GENERATED_COLUMNS:
            return False

    # The GiST indexes belong to the columns above, but guard them anyway in
    # case reflection ever surfaces them as standalone objects.
    if type_ == "index" and reflected and name.startswith("ix_") and name.endswith("_location_gist"):
        return False

    return True


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    Configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well. By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        include_object=include_object,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_object=include_object,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
