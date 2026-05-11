from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import uvicorn

from database import SessionLocal, engine, Base
from models import User, Job, Application
from schemas import UserCreate, UserResponse, JobCreate, JobResponse, ApplicationCreate, ApplicationResponse
from matching import compute_match_score
import crud

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Job Application & Matching System",
    description="A smart job matching system based on user expertise",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/users/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.post("/jobs/", response_model=JobResponse)
def create_job(job: JobCreate, db: Session = Depends(get_db)):
    return crud.create_job(db=db, job=job)

@app.get("/jobs/", response_model=List[JobResponse])
def list_jobs(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    return crud.get_jobs(db, skip=skip, limit=limit)

@app.get("/jobs/match/{user_id}")
def get_matched_jobs(user_id: int, db: Session = Depends(get_db)):
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    jobs = crud.get_jobs(db)
    matched = []
    for job in jobs:
        score = compute_match_score(user.skills, job.required_skills, job.preferred_skills)
        matched.append({"job": job, "match_score": score})
    matched.sort(key=lambda x: x["match_score"], reverse=True)
    return matched

@app.post("/applications/", response_model=ApplicationResponse)
def apply_for_job(application: ApplicationCreate, db: Session = Depends(get_db)):
    existing = crud.get_application(db, user_id=application.user_id, job_id=application.job_id)
    if existing:
        raise HTTPException(status_code=400, detail="Already applied for this job")
    return crud.create_application(db=db, application=application)

@app.get("/applications/user/{user_id}", response_model=List[ApplicationResponse])
def get_user_applications(user_id: int, db: Session = Depends(get_db)):
    return crud.get_applications_by_user(db, user_id=user_id)

@app.patch("/applications/{application_id}/status")
def update_application_status(application_id: int, status: str, db: Session = Depends(get_db)):
    app_obj = crud.update_application_status(db, application_id=application_id, status=status)
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")
    return app_obj

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
