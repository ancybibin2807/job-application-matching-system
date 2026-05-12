"""
backend/auth.py — JWT + password hashing + FastAPI auth dependency.

Drop-in: NEW FILE. Safe to add without touching anything else.
Imported by main.py.
"""
from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional

import jwt  # PyJWT
from fastapi import Depends, HTTPException, Request, status
from passlib.context import CryptContext
from sqlalchemy.orm import Session

import models
from database import get_db

# ─── Config ──────────────────────────────────────────────────────────────────

ACCESS_TOKEN_COOKIE = "access_token"
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

SECRET_KEY = os.getenv("SECRET_KEY", "")
_INSECURE_DEFAULTS = {
    "",
    "supersecretchangeme",
    "your-secret-key-change-in-production",
    "your-secret-key",
}
if SECRET_KEY in _INSECURE_DEFAULTS:
    raise RuntimeError(
        "SECRET_KEY env var is missing or set to a known-insecure default. "
        'Generate one with: python -c "import secrets; print(secrets.token_hex(32))" '
        "and set it in your environment / .env."
    )

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ─── Password hashing ────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    if not hashed:
        return False
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        return False


# ─── JWT ─────────────────────────────────────────────────────────────────────

def create_access_token(*, sub: int | str, extra: Optional[dict] = None) -> str:
    now = datetime.now(timezone.utc)
    payload: dict = {
        "sub": str(sub),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)).timestamp()),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def _extract_token(request: Request) -> Optional[str]:
    # Prefer httpOnly cookie
    cookie = request.cookies.get(ACCESS_TOKEN_COOKIE)
    if cookie:
        return cookie
    # Fallback to Authorization: Bearer for tooling / mobile
    auth_header = request.headers.get("Authorization", "")
    if auth_header.lower().startswith("bearer "):
        return auth_header.split(" ", 1)[1].strip() or None
    return None


# ─── Dependency ──────────────────────────────────────────────────────────────

def get_current_user(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> models.User:
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_token(token)
    sub = payload.get("sub")
    if sub is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    try:
        user_id = int(sub)
    except (TypeError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if hasattr(user, "is_active") and not bool(user.is_active):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")
    return user


def require_self_or_403(current_user: models.User, target_user_id: int) -> None:
    if int(current_user.id) != int(target_user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
