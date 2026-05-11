from pydantic import BaseModel, EmailStr, validator
from typing import List, Optional
from datetime import datetime


# ─── User Schemas ──────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    skills: List[str] = []
    experience_years: int = 0
    education: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    role: str = "applicant"

    @validator("role")
    def validate_role(cls, v):
        if v not in ("applicant", "employer"):
            raise ValueError("Role must be 'applicant' or 'employer'")
        return v


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    location: Optional[str]
    bio: Optional[str]
    skills: List[str]
    experience_years: int
    education: Optional[str]
    resume_url: Optional[str]
    linkedin_url: Optional[str]
    github_url: Optional[str]
    role: str
    created_at: datetime

    class Config:
        orm_mode = True


class UserUpdate(BaseModel):
    name: Optional[str]
    phone: Optional[str]
    location: Optional[str]
    bio: Optional[str]
    skills: Optional[List[str]]
    experience_years: Optional[int]
    education: Optional[str]
    resume_url: Optional[str]
    linkedin_url: Optional[str]
    github_url: Optional[str]


# ─── Job Schemas ───────────────────────────────────────────────────────────────

class JobCreate(BaseModel):
    employer_id: int
    title: str
    company: str
    location: Optional[str] = None
    job_type: Optional[str] = None          # full-time, part-time, remote, contract
    experience_level: Optional[str] = None  # junior, mid, senior
    description: Optional[str] = None
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None


class JobResponse(BaseModel):
    id: int
    employer_id: int
    title: str
    company: str
    location: Optional[str]
    job_type: Optional[str]
    experience_level: Optional[str]
    description: Optional[str]
    required_skills: List[str]
    preferred_skills: List[str]
    salary_min: Optional[int]
    salary_max: Optional[int]
    is_active: int
    created_at: datetime

    class Config:
        orm_mode = True


class JobUpdate(BaseModel):
    title: Optional[str]
    location: Optional[str]
    job_type: Optional[str]
    experience_level: Optional[str]
    description: Optional[str]
    required_skills: Optional[List[str]]
    preferred_skills: Optional[List[str]]
    salary_min: Optional[int]
    salary_max: Optional[int]
    is_active: Optional[int]


# ─── Application Schemas ───────────────────────────────────────────────────────

class ApplicationCreate(BaseModel):
    user_id: int
    job_id: int
    cover_letter: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: int
    user_id: int
    job_id: int
    cover_letter: Optional[str]
    match_score: int
    status: str
    notes: Optional[str]
    applied_at: datetime

    class Config:
        orm_mode = True


# ─── Auth Schemas ──────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
