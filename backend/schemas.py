"""
backend/schemas.py — REPLACEMENT (aligned to your real models).

Pydantic v2: model_config = ConfigDict(from_attributes=True), @field_validator.
Field names match models.py exactly: experience_years, linkedin_url, github_url,
resume_url, role.

JobCreate and ApplicationCreate intentionally DO NOT include employer_id /
user_id — the server fills those from the session.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# ─── User ────────────────────────────────────────────────────────────────────

class UserBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=20)
    location: Optional[str] = Field(default=None, max_length=100)
    bio: Optional[str] = None
    education: Optional[str] = Field(default=None, max_length=200)
    linkedin_url: Optional[str] = Field(default=None, max_length=300)
    github_url: Optional[str] = Field(default=None, max_length=300)
    resume_url: Optional[str] = Field(default=None, max_length=500)


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)
    skills: list[str] = Field(default_factory=list)
    experience_years: int = Field(default=0, ge=0, le=70)
    role: str = Field(default="applicant")  # validated below

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        if not any(c.isalpha() for c in v):
            raise ValueError("Password must contain at least one letter")
        return v

    @field_validator("role")
    @classmethod
    def valid_role(cls, v: str) -> str:
        v = (v or "applicant").lower().strip()
        if v not in ("applicant", "employer"):
            raise ValueError("role must be 'applicant' or 'employer'")
        return v


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[list[str]] = None
    experience_years: Optional[int] = Field(default=None, ge=0, le=70)
    education: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    resume_url: Optional[str] = None
    # role intentionally omitted — promoted via admin flow only


class UserOut(UserBase):
    id: int
    skills: list[str] = Field(default_factory=list)
    experience_years: int = 0
    role: str = "applicant"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ─── Auth ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ─── Job ─────────────────────────────────────────────────────────────────────

class JobBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    company: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    location: Optional[str] = Field(default=None, max_length=100)
    job_type: Optional[str] = Field(default=None, max_length=50)
    experience_level: Optional[str] = Field(default=None, max_length=50)
    salary_min: Optional[int] = Field(default=None, ge=0)
    salary_max: Optional[int] = Field(default=None, ge=0)
    required_skills: list[str] = Field(default_factory=list)
    preferred_skills: list[str] = Field(default_factory=list)


class JobCreate(JobBase):
    # employer_id INTENTIONALLY ABSENT — server fills from session
    pass


class JobUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    experience_level: Optional[str] = None
    salary_min: Optional[int] = Field(default=None, ge=0)
    salary_max: Optional[int] = Field(default=None, ge=0)
    required_skills: Optional[list[str]] = None
    preferred_skills: Optional[list[str]] = None
    is_active: Optional[bool] = None


class JobOut(JobBase):
    id: int
    employer_id: int
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class JobMatch(JobOut):
    match_score: int


# ─── Application ─────────────────────────────────────────────────────────────

APPLICATION_STATUSES = {"applied", "screening", "interview", "offer", "hired", "rejected"}


class ApplicationCreate(BaseModel):
    # user_id INTENTIONALLY ABSENT — server fills from session
    job_id: int
    cover_letter: Optional[str] = Field(default=None, max_length=10_000)


class ApplicationStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def valid_status(cls, v: str) -> str:
        v = (v or "").lower().strip()
        if v not in APPLICATION_STATUSES:
            raise ValueError(f"status must be one of: {sorted(APPLICATION_STATUSES)}")
        return v


class ApplicationOut(BaseModel):
    id: int
    user_id: int
    job_id: int
    status: str
    cover_letter: Optional[str] = None
    match_score: int = 0
    notes: Optional[str] = None
    applied_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
