from sqlalchemy.orm import Session
from passlib.context import CryptContext
from models import User, Job, Application
from schemas import UserCreate, JobCreate, ApplicationCreate, UserUpdate, JobUpdate
from matching import compute_match_score

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ─── User CRUD ─────────────────────────────────────────────────────────────────

def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()

def create_user(db: Session, user: UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_password,
        phone=user.phone,
        location=user.location,
        bio=user.bio,
        skills=user.skills,
        experience_years=user.experience_years,
        education=user.education,
        linkedin_url=user.linkedin_url,
        github_url=user.github_url,
        role=user.role,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user_update: UserUpdate):
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    update_data = user_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ─── Job CRUD ──────────────────────────────────────────────────────────────────

def get_job(db: Session, job_id: int):
    return db.query(Job).filter(Job.id == job_id).first()

def get_jobs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Job).filter(Job.is_active == 1).offset(skip).limit(limit).all()

def create_job(db: Session, job: JobCreate):
    db_job = Job(**job.dict())
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

def update_job(db: Session, job_id: int, job_update: JobUpdate):
    db_job = get_job(db, job_id)
    if not db_job:
        return None
    for key, value in job_update.dict(exclude_unset=True).items():
        setattr(db_job, key, value)
    db.commit()
    db.refresh(db_job)
    return db_job

def delete_job(db: Session, job_id: int):
    db_job = get_job(db, job_id)
    if db_job:
        db_job.is_active = 0
        db.commit()
    return db_job


# ─── Application CRUD ──────────────────────────────────────────────────────────

def get_application(db: Session, user_id: int, job_id: int):
    return db.query(Application).filter(
        Application.user_id == user_id,
        Application.job_id == job_id
    ).first()

def get_applications_by_user(db: Session, user_id: int):
    return db.query(Application).filter(Application.user_id == user_id).all()

def get_applications_by_job(db: Session, job_id: int):
    return db.query(Application).filter(Application.job_id == job_id).all()

def create_application(db: Session, application: ApplicationCreate):
    user = get_user(db, application.user_id)
    job = get_job(db, application.job_id)
    score = compute_match_score(
        user.skills or [],
        job.required_skills or [],
        job.preferred_skills or []
    ) if user and job else 0

    db_app = Application(
        user_id=application.user_id,
        job_id=application.job_id,
        cover_letter=application.cover_letter,
        match_score=score,
    )
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    return db_app

def update_application_status(db: Session, application_id: int, status: str):
    db_app = db.query(Application).filter(Application.id == application_id).first()
    if not db_app:
        return None
    valid_statuses = ["applied", "screening", "interview", "offer", "hired", "rejected"]
    if status not in valid_statuses:
        raise ValueError(f"Invalid status. Must be one of: {valid_statuses}")
    db_app.status = status
    db.commit()
    db.refresh(db_app)
    return db_app
