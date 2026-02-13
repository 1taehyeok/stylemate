from __future__ import annotations

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool
from sqlalchemy.engine import URL, make_url

from app.config import get_settings
from app.database import Base
from app import models  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


def _to_sync_url(raw_url: str) -> str:
    """Convert async SQLAlchemy URL to sync URL for Alembic engine."""
    url: URL = make_url(raw_url)
    if "+aiosqlite" in url.drivername:
        return str(url.set(drivername=url.drivername.replace("+aiosqlite", "")))
    if "+asyncpg" in url.drivername:
        return str(url.set(drivername=url.drivername.replace("+asyncpg", "+psycopg")))
    return raw_url


settings = get_settings()
config.set_main_option("sqlalchemy.url", _to_sync_url(settings.db_url))

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
