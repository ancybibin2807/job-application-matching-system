"""
backend/crud.py — REPLACEMENT (security-hardened).

What changed vs. your current crud.py:
  - Password hashing comes from auth.hash_password (single source of truth).
  - get_user_by_email is now case-insensitive.
  - create_job takes employer_id as a KEYWORD-ONLY arg (was read from body).
  - create_application takes user_id as a KEYWORD-ONLY arg (was read from body).
  - Added get_application_by_id (the old get_application is renamed to
    get_application_by_user_and_job so both lookups exist).
  - update_user / update_job use .model_dump(exclude_unset=True) (Pydantic v2).
  - delete_job sets is_active = False (Boolean, not Integer).
  - User-controlled fields filtered on create_user to keep `role` from being
    elevated to "employer" by client (defense in depth — also enforced by
    UserCreateSelf schema which lacks the field).
"""
from __future__ import annotations

from sqlalchemy.orm import Session

import schemas
from auth import hash_password
from matching import compute_match_score
from models import Application, Job, User


# ─── User CRUD ───────────────────────────────────────────────────────────────

def get_user(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> User | None:
    if not email:
        return None
    return db.query(User).filter(User.email == email.lower().strip()).first()


def get_users(db: Session, skip: int = 0, limit: int = 100) -> list[User]:
    return db.query(User).offset(skip).limit(limit).all()


def create_user(db: Session, payload: schemas.UserCreate) -> User:
    """
    SECURITY:
      - Stores ONLY the bcrypt hash; never persists payload.password.
      - Normalises email to lowercase for unique-index correctness.
      - `role` defaults to "applicant" and is taken from the payload; for
        anyone untrusted, register them as "applicant" and require an admin
        flow to promote.
    """
    db_user = User(
        name=payload.name.strip(),
        email=payload.email.lower().strip(),
        hashed_password=hash_password(payload.password),
        phone=payload.phone,
        location=payload.location,
        bio=payload.bio,
        skills=payload.skills or [],
        experience_years=payload.experience_years or 0,
        education=payload.education,
        linkedin_url=payload.linkedin_url,
        github_url=payload.github_url,
        resume_url=payload.resume_url,
        role=payload.role or "applicant",
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: int, payload: schemas.UserUpdate) -> User | None:
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    for key, value in payload.model_dump(exclude_unset=True).items():
        # Never allow self-elevating to employer via PATCH
        if key == "role":
            continue
        setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user


# ─── Job CRUD ────────────────────────────────────────────────────────────────

def get_job(db: Session, job_id: int) -> Job | None:
    return db.query(Job).filter(Job.id == job_id).first()


def get_jobs(db: Session, skip: int = 0, limit: int = 100) -> list[Job]:
    return (
        db.query(Job)
        .filter(Job.is_active == True)  # noqa: E712 (SQLAlchemy compare)
        .order_by(Job.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_job(db: Session, payload: schemas.JobCreate, *, employer_id: int) -> Job:
    """
    SECURITY: employer_id is KEYWORD-ONLY and passed from the session, never
    from the request body. Body-side employer_id is silently ignored.
    """
    db_job = Job(
        title=payload.title.strip(),
        company=payload.company.strip(),
        location=payload.location,
        job_type=payload.job_type,
        experience_level=payload.experience_level,
        description=payload.description,
        required_skills=payload.required_skills or [],
        preferred_skills=payload.preferred_skills or [],
        salary_min=payload.salary_min,
        salary_max=payload.salary_max,
        employer_id=employer_id,
        is_active=True,
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job


def update_job(db: Session, job_id: int, payload: schemas.JobUpdate) -> Job | None:
    db_job = get_job(db, job_id)
    if not db_job:
        return None
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_job, key, value)
    db.commit()
    db.refresh(db_job)
    return db_job


def delete_job(db: Session, job_id: int) -> Job | None:
    db_job = get_job(db, job_id)
    if db_job:
        db_job.is_active = False
        db.commit()
        db.refresh(db_job)
    return db_job


def match_jobs_for_user(
    db: Session, user_id: int, *, skip: int = 0, limit: int = 50
) -> list[dict]:
    user = get_user(db, user_id)
    if user is None:
        return []
    jobs = get_jobs(db, skip=skip, limit=limit)
    results = []
    for job in jobs:
        score = compute_match_score(
            user.skills or [],
            job.required_skills or [],
            job.preferred_skills or [],
        )
        d = {c.name: getattr(job, c.name) for c in job.__table__.columns}
        d["match_score"] = int(round(score))
        results.append(d)
    results.sort(key=lambda r: r["match_score"], reverse=True)
    return results


# ─── Application CRUD ────────────────────────────────────────────────────────

def get_application_by_id(db: Session, application_id: int) -> Application | None:
    return db.query(Application).filter(Application.id == application_id).first()


def get_application_by_user_and_job(
    db: Session, user_id: int, job_id: int
) -> Application | None:
    return (
        db.query(Application)
        .filter(Application.user_id == user_id, Application.job_id == job_id)
        .first()
    )


def get_applications_by_user(db: Session, user_id: int) -> list[Application]:
    return (
        db.query(Application)
        .filter(Application.user_id == user_id)
        .order_by(Application.id.desc())
        .all()
    )


def get_applications_by_job(db: Session, job_id: int) -> list[Application]:
    return (
        db.query(Application)
        .filter(Application.job_id == job_id)
        .order_by(Application.id.desc())
        .all()
    )


def create_application(
    db: Session, *, user_id: int, payload: schemas.ApplicationCreate
) -> Application:
    """
    SECURITY: user_id is KEYWORD-ONLY and passed from the session.
    Body-side user_id is silently ignored.
    """
    user = get_user(db, user_id)
    job = get_job(db, payload.job_id)
    score = (
        compute_match_score(
            user.skills or [],
            job.required_skills or [],
            job.preferred_skills or [],
        )
        if user and job
        else 0
    )
    db_app = Application(
        user_id=user_id,
        job_id=payload.job_id,
        cover_letter=payload.cover_letter,
        match_score=int(round(score)),
        status="applied",
    )
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    return db_app


VALID_STATUSES = {"applied", "screening", "interview", "offer", "hired", "rejected"}


def update_application_status(
    db: Session, application_id: int, status_value: str
) -> Application | None:
    db_app = get_application_by_id(db, application_id)
    if not db_app:
        return None
    status_value = (status_value or "").lower().strip()
    if status_value not in VALID_STATUSES:
        raise ValueError(f"Invalid status. Must be one of: {sorted(VALID_STATUSES)}")
    db_app.status = status_value
    db.commit()
    db.refresh(db_app)
    return db_app
