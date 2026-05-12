"""
backend/models.py — REPLACEMENT (aligned to your real schema).

Changes from your current models.py:
  - Job.is_active: Integer(default=1) -> Boolean(default=True, nullable=False)
  - Adds explicit unique constraint on (Application.user_id, Application.job_id)
    so the same user can't double-apply to the same job
Everything else identical to your current file.
"""
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    phone = Column(String(20))
    location = Column(String(100))
    bio = Column(Text)
    skills = Column(JSON, default=list)  # ["Python", "React"]
    experience_years = Column(Integer, default=0)
    education = Column(String(200))
    resume_url = Column(String(500))
    linkedin_url = Column(String(300))
    github_url = Column(String(300))
    role = Column(String(20), default="applicant", nullable=False)  # "applicant" | "employer"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    applications = relationship("Application", back_populates="applicant")
    posted_jobs = relationship("Job", back_populates="employer")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    employer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    company = Column(String(200), nullable=False)
    location = Column(String(100))
    job_type = Column(String(50))            # full-time, part-time, remote, contract
    experience_level = Column(String(50))    # junior, mid, senior
    description = Column(Text)
    required_skills = Column(JSON, default=list)
    preferred_skills = Column(JSON, default=list)
    salary_min = Column(Integer)
    salary_max = Column(Integer)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    employer = relationship("User", back_populates="posted_jobs")
    applications = relationship("Application", back_populates="job")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, index=True)
    cover_letter = Column(Text)
    match_score = Column(Integer, default=0)  # 0-100
    status = Column(String(50), default="applied", nullable=False)
    # applied -> screening -> interview -> offer -> hired / rejected
    notes = Column(Text)
    applied_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    applicant = relationship("User", back_populates="applications")
    job = relationship("Job", back_populates="applications")

    __table_args__ = (
        UniqueConstraint("user_id", "job_id", name="uq_application_user_job"),
    )
