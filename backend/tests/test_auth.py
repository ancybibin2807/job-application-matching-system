"""
Auth happy/sad paths.

Covers: register → me, duplicate email, weak password, login, wrong password,
unknown user, logout invalidates session, /auth/me requires auth.
"""
from __future__ import annotations


def test_register_sets_cookie_and_me_returns_user(alice):
    r = alice["client"].get("/auth/me")
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == "alice@example.com"
    assert body["name"] == "Alice"
    # Password and hashed_password must never leak
    assert "password" not in body
    assert "hashed_password" not in body


def test_register_duplicate_email_returns_409(alice, make_client):
    c = make_client()
    r = c.post(
        "/auth/register",
        json={
            "name": "Alice2",
            "email": "alice@example.com",
            "password": "another1pass",
        },
    )
    assert r.status_code == 409


def test_register_short_password_returns_422(make_client):
    c = make_client()
    r = c.post(
        "/auth/register",
        json={"name": "X", "email": "x@example.com", "password": "short1"},
    )
    assert r.status_code == 422


def test_register_password_without_digit_returns_422(make_client):
    c = make_client()
    r = c.post(
        "/auth/register",
        json={"name": "X", "email": "x@example.com", "password": "onlyletters"},
    )
    assert r.status_code == 422


def test_login_then_logout(alice, make_client):
    c = make_client()
    r = c.post(
        "/auth/login",
        json={"email": "alice@example.com", "password": alice["password"]},
    )
    assert r.status_code == 200
    me = c.get("/auth/me")
    assert me.status_code == 200

    out = c.post("/auth/logout")
    assert out.status_code == 204

    me2 = c.get("/auth/me")
    assert me2.status_code == 401


def test_login_wrong_password_returns_401(alice, make_client):
    c = make_client()
    r = c.post(
        "/auth/login",
        json={"email": "alice@example.com", "password": "wrongpassword1"},
    )
    assert r.status_code == 401
    # Generic message — no user enumeration
    assert "invalid" in r.json()["detail"].lower()


def test_login_unknown_user_returns_401(make_client):
    c = make_client()
    r = c.post(
        "/auth/login",
        json={"email": "ghost@example.com", "password": "whatever1pass"},
    )
    assert r.status_code == 401


def test_me_without_cookie_returns_401(anon):
    r = anon.get("/auth/me")
    assert r.status_code == 401


def test_bearer_token_also_works(alice, make_client):
    """Login via JSON, then call /auth/me using Authorization: Bearer for tooling/mobile."""
    c = make_client()
    r = c.post(
        "/auth/login",
        json={"email": "alice@example.com", "password": alice["password"]},
    )
    assert r.status_code == 200
    token = c.cookies.get("access_token")
    assert token

    # Strip cookie, use header
    c.cookies.clear()
    me = c.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
