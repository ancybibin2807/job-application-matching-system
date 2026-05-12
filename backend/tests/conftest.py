"""
Shared test fixtures.

Each test gets:
- a fresh in-memory SQLite DB (schema rebuilt every test for isolation)
- a `make_client()` factory — each call returns a TestClient with its own
  cookie jar, all pointing at the SAME test DB. This lets us simulate two
  concurrent users (alice vs bob) without one's session clobbering the other.
- `alice`, `bob`: registered + logged-in users on independent clients.
- `anon`: an unauthenticated client.

Critical: SECRET_KEY env var MUST be set BEFORE importing backend.auth, or
auth.py will raise RuntimeError. We set it at the top of this module.
"""
from __future__ import annotations

import os
import secrets
import sys
import pathlib

# Set env BEFORE any backend imports
os.environ.setdefault("SECRET_KEY", secrets.token_hex(32))
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("FRONTEND_ORIGINS", "http://localhost:3000")
os.environ.setdefault("COOKIE_SECURE", "false")
os.environ.setdefault("COOKIE_SAMESITE", "lax")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "60")

# Ensure backend/ is on sys.path (tests live in backend/tests/)
BACKEND_DIR = pathlib.Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402


@pytest.fixture
def engine():
    """Function-scoped in-memory SQLite, one per test. StaticPool keeps a
    single connection alive so :memory: is shared across requests."""
    eng = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    from database import Base
    import models  # noqa: F401  — triggers model registration
    Base.metadata.create_all(bind=eng)
    yield eng
    eng.dispose()


@pytest.fixture
def db_session(engine):
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    s = Session()
    try:
        yield s
    finally:
        s.close()


@pytest.fixture
def make_client(engine, db_session):
    """
    Factory: returns a fresh TestClient (own cookie jar) sharing the test DB.
    Use multiple clients to simulate distinct logged-in users.
    """
    from main import app
    from database import get_db

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    def _make() -> TestClient:
        return TestClient(app)

    yield _make
    app.dependency_overrides.clear()


@pytest.fixture
def anon(make_client) -> TestClient:
    return make_client()


def _register(client: TestClient, name: str, email: str, password: str = "secret123abc", **extra) -> dict:
    payload = {"name": name, "email": email, "password": password, **extra}
    r = client.post("/auth/register", json=payload)
    assert r.status_code == 201, f"register failed: {r.status_code} {r.text}"
    return {"client": client, "user": r.json(), "password": password, "email": email}


@pytest.fixture
def alice(make_client):
    return _register(
        make_client(),
        name="Alice",
        email="alice@example.com",
        skills=["python", "react"],
    )


@pytest.fixture
def bob(make_client):
    return _register(
        make_client(),
        name="Bob",
        email="bob@example.com",
        skills=["go", "kubernetes"],
    )
