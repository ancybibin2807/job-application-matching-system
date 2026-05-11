"""
Job-to-User Matching Algorithm
================================
Computes a 0-100 score based on:
  - Required skill overlap (70% weight)
  - Preferred skill overlap (30% weight)
Skill comparison is case-insensitive and handles common abbreviations.
"""
from typing import List


# Common skill aliases / synonyms
SKILL_ALIASES = {
    "js": "javascript",
    "ts": "typescript",
    "py": "python",
    "ml": "machine learning",
    "ai": "artificial intelligence",
    "k8s": "kubernetes",
    "k8": "kubernetes",
    "aws": "amazon web services",
    "gcp": "google cloud platform",
    "react.js": "react",
    "reactjs": "react",
    "node.js": "node",
    "nodejs": "node",
    "vue.js": "vue",
    "vuejs": "vue",
    "angular.js": "angular",
    "angularjs": "angular",
    "postgres": "postgresql",
    "mongo": "mongodb",
}


def normalize_skill(skill: str) -> str:
    """Lowercase and apply alias mapping."""
    normalized = skill.lower().strip()
    return SKILL_ALIASES.get(normalized, normalized)


def compute_match_score(
    user_skills: List[str],
    required_skills: List[str],
    preferred_skills: List[str],
    required_weight: float = 0.70,
    preferred_weight: float = 0.30,
) -> int:
    """
    Compute a match score (0-100) between user skills and job requirements.

    Args:
        user_skills:        Skills from the user's profile.
        required_skills:    Must-have skills for the job.
        preferred_skills:   Nice-to-have skills for the job.
        required_weight:    Weight given to required skill matches (default 70%).
        preferred_weight:   Weight given to preferred skill matches (default 30%).

    Returns:
        Integer score 0-100.
    """
    if not user_skills:
        return 0

    user_normalized = {normalize_skill(s) for s in user_skills}

    # Required skills score
    if required_skills:
        req_normalized = [normalize_skill(s) for s in required_skills]
        req_matched = sum(1 for s in req_normalized if s in user_normalized)
        req_score = req_matched / len(req_normalized)
    else:
        req_score = 1.0  # No required skills = automatic pass

    # Preferred skills score
    if preferred_skills:
        pref_normalized = [normalize_skill(s) for s in preferred_skills]
        pref_matched = sum(1 for s in pref_normalized if s in user_normalized)
        pref_score = pref_matched / len(pref_normalized)
    else:
        pref_score = 0.0

    total = (req_score * required_weight) + (pref_score * preferred_weight)
    return round(total * 100)


def get_skill_gaps(user_skills: List[str], required_skills: List[str]) -> List[str]:
    """Return list of required skills the user is missing."""
    user_normalized = {normalize_skill(s) for s in user_skills}
    return [s for s in required_skills if normalize_skill(s) not in user_normalized]


def get_bonus_skills(user_skills: List[str], preferred_skills: List[str]) -> List[str]:
    """Return preferred skills the user already has."""
    user_normalized = {normalize_skill(s) for s in user_skills}
    return [s for s in preferred_skills if normalize_skill(s) in user_normalized]
