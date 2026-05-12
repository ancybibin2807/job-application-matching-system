"""
Alembic env. Reads DATABASE_URL from env so the same migration runs against
SQLite (dev) and Postgres (prod).

Run from backend/ :
    alembic upgrade head
    alembic revision --autogenerate -m "add_role_column"
"""
from __future__ import annotations

import os
import sys
import pathlib
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# Make backend/ importable so we can pull in models.py
BACKEND_DIR = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

db_url = os.getenv("DATABASE_URL", "sqlite:///./job_matching.db")
config.set_main_option("sqlalchemy.url", db_url)

# Import models so autogenerate sees them. If models.py imports fail
# (e.g. during a fresh clone), fall back to no metadata — manual migrations
# still work.
try:
    from database import Base  # noqa: E402
    import models  # noqa: F401,E402
    target_metadata = Base.metadata
except Exception:
    target_metadata = None


def run_migrations_offline() -> None:
    context.configure(
        url=db_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=db_url.startswith("sqlite"),
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
            render_as_batch=db_url.startswith("sqlite"),
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
