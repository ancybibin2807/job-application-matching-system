from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
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
    skills = Column(JSON, default=[])          # List of skill strings e.g. ["Python", "React"]
    experience_years = Column(Integer, default=0)
    education = Column(String(200))
    resume_url = Column(String(500))
    linkedin_url = Column(String(300))
    github_url = Column(String(300))
    role = Column(String(20), default="applicant")  # "applicant" or "employer"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    applications = relationship("Application", back_populates="applicant")
    posted_jobs = relationship("Job", back_populates="employer")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    employer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    company = Column(String(200), nullable=False)
    location = Column(String(100))
    job_type = Column(String(50))              # full-time, part-time, remote, contract
    experience_level = Column(String(50))     # junior, mid, senior
    description = Column(Text)
    required_skills = Column(JSON, default=[])    # Must-have skills
    preferred_skills = Column(JSON, default=[])   # Nice-to-have skills
    salary_min = Column(Integer)
    salary_max = Column(Integer)
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    employer = relationship("User", back_populates="posted_jobs")
    applications = relationship("Application", back_populates="job")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    cover_letter = Column(Text)
    match_score = Column(Integer, default=0)   # 0-100 percentage
    status = Column(String(50), default="applied")
    # Statuses: applied → screening → interview → offer → hired / rejected
    notes = Column(Text)
    applied_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    applicant = relationship("User", back_populates="applications")
    job = relationship("Job", back_populates="applications")
