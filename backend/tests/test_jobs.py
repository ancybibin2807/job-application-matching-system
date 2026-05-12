"""
Happy-path job + matching coverage. Cheap smoke for the matching algorithm.
"""
from __future__ import annotations


def test_anon_can_list_and_view_jobs(alice, anon):
    job = alice["client"].post(
        "/jobs/",
        json={
            "title": "Engineer",
            "company": "Acme",
            "description": "...",
            "required_skills": ["python"],
        },
    ).json()

    r = anon.get("/jobs/")
    assert r.status_code == 200
    ids = [j["id"] for j in r.json()]
    assert job["id"] in ids

    r2 = anon.get(f"/jobs/{job['id']}")
    assert r2.status_code == 200
    assert r2.json()["title"] == "Engineer"


def test_get_unknown_job_404(anon):
    r = anon.get("/jobs/999999")
    assert r.status_code == 404


def test_apply_to_unknown_job_404(alice):
    r = alice["client"].post("/applications/", json={"job_id": 999999})
    assert r.status_code == 404


def test_match_jobs_returns_scores_sorted_desc(alice):
    # Two jobs: one perfect match, one weak
    alice["client"].post(
        "/jobs/",
        json={
            "title": "Python+React role",
            "company": "Acme",
            "description": "...",
            "required_skills": ["python", "react"],
            "preferred_skills": [],
        },
    )
    alice["client"].post(
        "/jobs/",
        json={
            "title": "Rust role",
            "company": "Beta",
            "description": "...",
            "required_skills": ["rust"],
            "preferred_skills": [],
        },
    )

    r = alice["client"].get(f"/jobs/match/{alice['user']['id']}")
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 2
    assert "match_score" in data[0]
    # Sorted by match_score descending
    scores = [d["match_score"] for d in data]
    assert scores == sorted(scores, reverse=True)
    # Python+React should outrank Rust for alice (skills=[python,react])
    assert data[0]["title"] == "Python+React role"


def test_my_applications_lists_only_mine(alice, bob):
    job_a = alice["client"].post(
        "/jobs/",
        json={"title": "A", "company": "Acme", "description": "..."},
    ).json()
    job_b = alice["client"].post(
        "/jobs/",
        json={"title": "B", "company": "Acme", "description": "..."},
    ).json()
    bob["client"].post("/applications/", json={"job_id": job_a["id"]})
    bob["client"].post("/applications/", json={"job_id": job_b["id"]})

    r = bob["client"].get(f"/applications/user/{bob['user']['id']}")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 2
    assert all(a["user_id"] == bob["user"]["id"] for a in data)
