"""initial schema — users, jobs, applications

Revision ID: 0001_initial
Revises:
Create Date: 2026-05-12 00:00:00

Matches backend/models.py:
  - users.hashed_password NOT NULL (no plaintext)
  - users.email unique-indexed (case-insensitivity enforced in crud.py)
  - users.role default 'applicant'
  - jobs.is_active BOOLEAN (not Integer)
  - applications: UNIQUE (user_id, job_id) — drop the constraint if you want
    to allow re-applications.
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("email", sa.String(100), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("location", sa.String(100), nullable=True),
        sa.Column("bio", sa.Text, nullable=True),
        sa.Column("skills", sa.JSON, nullable=False, server_default="[]"),
        sa.Column("experience_years", sa.Integer, nullable=False, server_default="0"),
        sa.Column("education", sa.String(200), nullable=True),
        sa.Column("resume_url", sa.String(500), nullable=True),
        sa.Column("linkedin_url", sa.String(300), nullable=True),
        sa.Column("github_url", sa.String(300), nullable=True),
        sa.Column("role", sa.String(20), nullable=False, server_default="applicant"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_id", "users", ["id"])

    op.create_table(
        "jobs",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("employer_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("company", sa.String(200), nullable=False),
        sa.Column("location", sa.String(100), nullable=True),
        sa.Column("job_type", sa.String(50), nullable=True),
        sa.Column("experience_level", sa.String(50), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("required_skills", sa.JSON, nullable=False, server_default="[]"),
        sa.Column("preferred_skills", sa.JSON, nullable=False, server_default="[]"),
        sa.Column("salary_min", sa.Integer, nullable=True),
        sa.Column("salary_max", sa.Integer, nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_jobs_id", "jobs", ["id"])
    op.create_index("ix_jobs_employer_id", "jobs", ["employer_id"])

    op.create_table(
        "applications",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("job_id", sa.Integer, sa.ForeignKey("jobs.id"), nullable=False),
        sa.Column("cover_letter", sa.Text, nullable=True),
        sa.Column("match_score", sa.Integer, nullable=False, server_default="0"),
        sa.Column("status", sa.String(50), nullable=False, server_default="applied"),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("applied_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("user_id", "job_id", name="uq_application_user_job"),
    )
    op.create_index("ix_applications_id", "applications", ["id"])
    op.create_index("ix_applications_user_id", "applications", ["user_id"])
    op.create_index("ix_applications_job_id", "applications", ["job_id"])


def downgrade() -> None:
    op.drop_index("ix_applications_job_id", table_name="applications")
    op.drop_index("ix_applications_user_id", table_name="applications")
    op.drop_index("ix_applications_id", table_name="applications")
    op.drop_table("applications")
    op.drop_index("ix_jobs_employer_id", table_name="jobs")
    op.drop_index("ix_jobs_id", table_name="jobs")
    op.drop_table("jobs")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
