"""
IDOR battery. Every test here corresponds to a vulnerability the agent flagged
in the review. If any of these regress, the app is unsafe to deploy.
"""
from __future__ import annotations


def _create_job(client, *, title="Senior Eng", required=None, preferred=None) -> dict:
    r = client.post(
        "/jobs/",
        json={
            "title": title,
            "company": "Acme",
            "description": "Build stuff.",
            "required_skills": required or ["python"],
            "preferred_skills": preferred or ["react"],
        },
    )
    assert r.status_code == 201, r.text
    return r.json()


# ─── Anonymous access ────────────────────────────────────────────────────────

def test_anon_cannot_get_user_profile(anon, alice):
    r = anon.get(f"/users/{alice['user']['id']}")
    assert r.status_code == 401


def test_anon_cannot_update_user_profile(anon, alice):
    r = anon.patch(f"/users/{alice['user']['id']}", json={"name": "Hacker"})
    assert r.status_code == 401


def test_anon_cannot_list_other_users_applications(anon, alice):
    r = anon.get(f"/applications/user/{alice['user']['id']}")
    assert r.status_code == 401


def test_anon_cannot_match_jobs(anon, alice):
    r = anon.get(f"/jobs/match/{alice['user']['id']}")
    assert r.status_code == 401


def test_anon_cannot_post_job(anon):
    r = anon.post(
        "/jobs/",
        json={"title": "x", "company": "y", "description": "z"},
    )
    assert r.status_code == 401


def test_anon_cannot_apply(anon):
    r = anon.post("/applications/", json={"job_id": 1})
    assert r.status_code == 401


def test_anon_cannot_change_application_status(anon):
    r = anon.patch("/applications/1/status", json={"status": "hired"})
    assert r.status_code == 401


# ─── Cross-user (logged in as A, attacking B) ────────────────────────────────

def test_alice_cannot_read_bobs_profile(alice, bob):
    r = alice["client"].get(f"/users/{bob['user']['id']}")
    assert r.status_code == 403


def test_alice_cannot_update_bobs_profile(alice, bob):
    r = alice["client"].patch(
        f"/users/{bob['user']['id']}",
        json={"name": "Pwned", "bio": "Hacked"},
    )
    assert r.status_code == 403


def test_alice_cannot_list_bobs_applications(alice, bob):
    r = alice["client"].get(f"/applications/user/{bob['user']['id']}")
    assert r.status_code == 403


def test_alice_cannot_match_jobs_for_bob(alice, bob):
    r = alice["client"].get(f"/jobs/match/{bob['user']['id']}")
    assert r.status_code == 403


# ─── Body-tampering: ignore client-supplied user_id / employer_id ────────────

def test_create_job_ignores_employer_id_in_body(alice, bob):
    r = alice["client"].post(
        "/jobs/",
        json={
            "title": "Impersonation attempt",
            "company": "Acme",
            "description": "...",
            # Alice tries to impersonate Bob — backend must overwrite this
            "employer_id": bob["user"]["id"],
        },
    )
    assert r.status_code == 201
    assert r.json()["employer_id"] == alice["user"]["id"]


def test_apply_ignores_user_id_in_body(alice, bob):
    job = _create_job(alice["client"])
    # Bob tries to apply AS Alice
    r = bob["client"].post(
        "/applications/",
        json={"job_id": job["id"], "user_id": alice["user"]["id"]},
    )
    assert r.status_code == 201
    assert r.json()["user_id"] == bob["user"]["id"]


# ─── Application status: only the employer that owns the job ─────────────────

def test_applicant_cannot_self_promote_to_hired(alice, bob):
    job = _create_job(alice["client"])
    r = bob["client"].post("/applications/", json={"job_id": job["id"]})
    assert r.status_code == 201
    app_id = r.json()["id"]

    # Bob (the applicant) tries to flip himself to "hired"
    r2 = bob["client"].patch(
        f"/applications/{app_id}/status", json={"status": "hired"}
    )
    assert r2.status_code == 403


def test_stranger_cannot_change_application_status(alice, bob, make_client):
    """A third user (mallory) — neither applicant nor employer — must 403."""
    job = _create_job(alice["client"])
    r = bob["client"].post("/applications/", json={"job_id": job["id"]})
    assert r.status_code == 201
    app_id = r.json()["id"]

    mallory = make_client()
    reg = mallory.post(
        "/auth/register",
        json={
            "name": "Mallory",
            "email": "mallory@example.com",
            "password": "mallory123abc",
        },
    )
    assert reg.status_code == 201

    r2 = mallory.patch(
        f"/applications/{app_id}/status", json={"status": "rejected"}
    )
    assert r2.status_code == 403


def test_employer_can_change_application_status(alice, bob):
    job = _create_job(alice["client"])
    r = bob["client"].post("/applications/", json={"job_id": job["id"]})
    assert r.status_code == 201
    app_id = r.json()["id"]

    r2 = alice["client"].patch(
        f"/applications/{app_id}/status", json={"status": "interview"}
    )
    assert r2.status_code == 200
    assert r2.json()["status"] == "interview"


def test_invalid_status_rejected_422(alice, bob):
    job = _create_job(alice["client"])
    r = bob["client"].post("/applications/", json={"job_id": job["id"]})
    app_id = r.json()["id"]
    r2 = alice["client"].patch(
        f"/applications/{app_id}/status", json={"status": "promoted-to-ceo"}
    )
    assert r2.status_code == 422


# ─── Self-access still works ─────────────────────────────────────────────────

def test_alice_can_read_her_own_profile(alice):
    r = alice["client"].get(f"/users/{alice['user']['id']}")
    assert r.status_code == 200


def test_alice_can_update_her_own_profile(alice):
    r = alice["client"].patch(
        f"/users/{alice['user']['id']}",
        json={"bio": "Updated bio"},
    )
    assert r.status_code == 200
    assert r.json()["bio"] == "Updated bio"
