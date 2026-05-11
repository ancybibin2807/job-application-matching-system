# Job Application & Expertise Matching System

A full-stack web application that intelligently matches job seekers to job postings based on their skills and expertise.

## Features

- **User Registration & Profiles** – Job seekers build profiles with skills, experience, education, and portfolio links
- **Job Posting** – Employers post jobs with required and preferred skills
- **Smart Matching Algorithm** – Scores each job 0-100% based on skill overlap (70% weight on required, 30% on preferred)
- **Skill Aliases** – Handles synonyms like "JS" = "JavaScript", "Postgres" = "PostgreSQL"
- **Job Application** – One-click apply with optional cover letter
- **Application Tracking** – Full pipeline: Applied → Screening → Interview → Offer → Hired/Rejected
- **Skill Gap Analysis** – Shows what skills are missing for a target role

---

## Project Structure

```
job-application-matching-system/
├── backend/                    # FastAPI Python backend
│   ├── main.py                 # API routes & app setup
│   ├── models.py               # SQLAlchemy database models
│   ├── schemas.py              # Pydantic request/response schemas
│   ├── crud.py                 # Database operations (Create/Read/Update/Delete)
│   ├── matching.py             # Job-user matching algorithm
│   ├── database.py             # DB connection & session
│   ├── requirements.txt        # Python dependencies
│   └── Dockerfile              # Backend container
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── App.jsx             # Root component with routing
│   │   ├── api.js              # Axios API client
│   │   └── components/
│   │       ├── JobList.jsx         # Browse & search all jobs
│   │       ├── JobDetail.jsx       # Job details + apply form
│   │       ├── MatchedJobs.jsx     # Jobs matched to user skills
│   │       ├── Register.jsx        # User registration form
│   │       ├── UserProfile.jsx     # Profile view & edit
│   │       ├── MyApplications.jsx  # Track all applications
│   │       └── PostJob.jsx         # Employer job posting form
│   └── package.json
├── docker-compose.yml          # Full stack deployment
└── .env.example                # Environment variables template
```

---

## Quick Start

### Option A: With Docker (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/ancybibin2807/job-application-matching-system.git
cd job-application-matching-system

# 2. Copy and configure environment variables
cp .env.example .env
# Edit .env and set a strong SECRET_KEY

# 3. Start everything
docker-compose up --build

# App will be available at:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs (Swagger): http://localhost:8000/docs
```

### Option B: Manual Setup

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="sqlite:///./job_matching.db"
export SECRET_KEY="your-secret-key"

# Run the server
uvicorn main:app --reload
# API available at http://localhost:8000
# Swagger UI at http://localhost:8000/docs
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set environment (create .env file)
echo "REACT_APP_API_URL=http://localhost:8000" > .env

# Start development server
npm start
# App available at http://localhost:3000
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /users/ | Register a new user |
| GET | /users/{id} | Get user profile |
| POST | /jobs/ | Post a new job |
| GET | /jobs/ | List all jobs |
| GET | /jobs/match/{user_id} | Get jobs matched to user skills |
| POST | /applications/ | Apply for a job |
| GET | /applications/user/{user_id} | Get user's applications |
| PATCH | /applications/{id}/status | Update application status |

Interactive API docs available at **http://localhost:8000/docs**

---

## Matching Algorithm

The matching score is computed as:

```
score = (required_match × 0.70) + (preferred_match × 0.30)
```

- **required_match** = fraction of required skills the user has
- **preferred_match** = fraction of preferred skills the user has
- Score is 0-100 (percentage)
- Common skill synonyms are normalized (e.g., "JS" → "JavaScript")

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python) |
| Database | SQLite (dev) / PostgreSQL (prod) |
| ORM | SQLAlchemy |
| Validation | Pydantic v2 |
| Frontend | React 18 + React Router |
| HTTP Client | Axios |
| Containers | Docker & Docker Compose |

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request
