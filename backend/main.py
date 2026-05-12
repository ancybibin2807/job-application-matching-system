"""
backend/main.py — REPLACEMENT (aligned to your real crud.py).

Endpoints:
  POST /auth/register
  POST /auth/login
  POST /auth/logout
  GET  /auth/me

  GET  /users/{user_id}             (self only)
  PATCH /users/{user_id}            (self only)

  POST /jobs/                       (auth)
  GET  /jobs/                       (public)
  GET  /jobs/{job_id}               (public)
  PATCH /jobs/{job_id}              (owner only)
  DELETE /jobs/{job_id}             (owner only — soft delete via is_active=False)
  GET  /jobs/match/{user_id}        (self only)

  POST /applications/               (auth, user_id from session)
  GET  /applications/user/{user_id} (self only)
  PATCH /applications/{application_id}/status  (employer that owns the job only)
"""
from __future__ import annotations

import os
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import auth
import crud
import models
import schemas
from database import Base, engine, get_db

# TODO: remove this once Alembic is wired up in your deploy pipeline.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Job Application & Expertise Matching System",
    version="0.2.0",
)

# ─── CORS ────────────────────────────────────────────────────────────────────

FRONTEND_ORIGINS = [
    o.strip()
    for o in os.getenv("FRONTEND_ORIGINS", "http://localhost:3000").split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# ─── Cookies ─────────────────────────────────────────────────────────────────

COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax").lower()  # "lax" | "strict" | "none"


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=auth.ACCESS_TOKEN_COOKIE,
        value=token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=auth.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )


# ─── Health ──────────────────────────────────────────────────────────────────

@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}


# ─── Auth ────────────────────────────────────────────────────────────────────

@app.post("/auth/register", response_model=schemas.UserOut, status_code=201, tags=["auth"])
def register(
    payload: schemas.UserCreate,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
):
    if crud.get_user_by_email(db, payload.email):
        raise HTTPException(status_code=409, detail="Email already registered")
    user = crud.create_user(db, payload)
    token = auth.create_access_token(sub=user.id)
    _set_auth_cookie(response, token)
    return user


@app.post("/auth/login", response_model=schemas.UserOut, tags=["auth"])
def login(
    payload: schemas.LoginRequest,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
):
    user = crud.get_user_by_email(db, payload.email)
    # Always run verify_password (constant-time-ish) to mitigate user enumeration
    ok = auth.verify_password(payload.password, getattr(user, "hashed_password", "") or "")
    if not user or not ok:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = auth.create_access_token(sub=user.id)
    _set_auth_cookie(response, token)
    return user


@app.post("/auth/logout", status_code=204, tags=["auth"])
def logout(response: Response):
    # Match the attrs used on set so the browser/test client actually clears it
    response.delete_cookie(
        key=auth.ACCESS_TOKEN_COOKIE,
        path="/",
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        httponly=True,
    )
    # Returning None lets FastAPI use the injected `response` (with the
    # Set-Cookie deletion header). Returning a new Response would drop it.
    return None


@app.get("/auth/me", response_model=schemas.UserOut, tags=["auth"])
def me(current_user: Annotated[models.User, Depends(auth.get_current_user)]):
    return current_user


# ─── Users ───────────────────────────────────────────────────────────────────

@app.get("/users/{user_id}", response_model=schemas.UserOut, tags=["users"])
def get_user(
    user_id: int,
    current_user: Annotated[models.User, Depends(auth.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    auth.require_self_or_403(current_user, user_id)
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.patch("/users/{user_id}", response_model=schemas.UserOut, tags=["users"])
def update_user(
    user_id: int,
    payload: schemas.UserUpdate,
    current_user: Annotated[models.User, Depends(auth.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    auth.require_self_or_403(current_user, user_id)
    user = crud.update_user(db, user_id, payload)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ─── Jobs ────────────────────────────────────────────────────────────────────

@app.post("/jobs/", response_model=schemas.JobOut, status_code=201, tags=["jobs"])
def create_job(
    payload: schemas.JobCreate,
    current_user: Annotated[models.User, Depends(auth.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    # Follow-up: gate on role == "employer" once UI/onboarding sets the role.
    # For now any authenticated user can post; security boundary is the
    # employer_id being taken from session, not from body.
    return crud.create_job(db, payload, employer_id=current_user.id)


@app.get("/jobs/", response_model=list[schemas.JobOut], tags=["jobs"])
def list_jobs(
    db: Annotated[Session, Depends(get_db)],
    skip: int = 0,
    limit: int = 50,
):
    return crud.get_jobs(db, skip=max(0, skip), limit=min(max(1, limit), 100))


@app.get("/jobs/{job_id}", response_model=schemas.JobOut, tags=["jobs"])
def get_job(job_id: int, db: Annotated[Session, Depends(get_db)]):
    job = crud.get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.patch("/jobs/{job_id}", response_model=schemas.JobOut, tags=["jobs"])
def update_job(
    job_id: int,
    payload: schemas.JobUpdate,
    current_user: Annotated[models.User, Depends(auth.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    job = crud.get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if int(job.employer_id) != int(current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")
    return crud.update_job(db, job_id, payload)


@app.delete("/jobs/{job_id}", status_code=204, tags=["jobs"])
def delete_job(
    job_id: int,
    current_user: Annotated[models.User, Depends(auth.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    job = crud.get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if int(job.employer_id) != int(current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")
    crud.delete_job(db, job_id)
    return Response(status_code=204)


@app.get("/jobs/match/{user_id}", response_model=list[schemas.JobMatch], tags=["jobs"])
def match_jobs(
    user_id: int,
    current_user: Annotated[models.User, Depends(auth.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    skip: int = 0,
    limit: int = 50,
):
    auth.require_self_or_403(current_user, user_id)
    return crud.match_jobs_for_user(
        db, user_id, skip=max(0, skip), limit=min(max(1, limit), 100)
    )


# ─── Applications ────────────────────────────────────────────────────────────

@app.post("/applications/", response_model=schemas.ApplicationOut, status_code=201, tags=["applications"])
def apply(
    payload: schemas.ApplicationCreate,
    current_user: Annotated[models.User, Depends(auth.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    job = crud.get_job(db, payload.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    # Prevent double-apply (DB unique constraint also enforces this, but a
    # clean 409 is friendlier than the IntegrityError 500)
    existing = crud.get_application_by_user_and_job(db, current_user.id, payload.job_id)
    if existing:
        raise HTTPException(status_code=409, detail="Already applied to this job")
    return crud.create_application(db, user_id=current_user.id, payload=payload)


@app.get(
    "/applications/user/{user_id}",
    response_model=list[schemas.ApplicationOut],
    tags=["applications"],
)
def list_user_applications(
    user_id: int,
    current_user: Annotated[models.User, Depends(auth.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    auth.require_self_or_403(current_user, user_id)
    return crud.get_applications_by_user(db, user_id)


@app.patch(
    "/applications/{application_id}/status",
    response_model=schemas.ApplicationOut,
    tags=["applications"],
)
def update_application_status(
    application_id: int,
    payload: schemas.ApplicationStatusUpdate,
    current_user: Annotated[models.User, Depends(auth.get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    application = crud.get_application_by_id(db, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    job = crud.get_job(db, application.job_id)
    if not job or int(job.employer_id) != int(current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")
    return crud.update_application_status(db, application_id, payload.status)
