import os
import sys
import pytest

# Ensure ai-service-v2 is in sys.path
ai_service_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ai-service-v2")
if ai_service_dir not in sys.path:
    sys.path.insert(0, ai_service_dir)

from fastapi.testclient import TestClient
from app.main import app
from app.schemas.candidate_review import RejectionReason, ReviewDecision
from app.services.candidate_review_service import candidate_review_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_state():
    candidate_review_service.load_candidates(force_reload=True)
    yield
    candidate_review_service.load_candidates(force_reload=True)


def test_phase4_1_group_review_analytics():
    """Verify group-level review analytics computation."""
    analytics = candidate_review_service.get_group_analytics()
    assert analytics.unique_surface_forms == 680
    assert analytics.total_occurrences == 1500
    assert analytics.reviewed_groups == 121
    assert analytics.accepted_groups == 22
    assert analytics.rejected_groups == 85
    assert analytics.skipped_groups == 14
    assert analytics.pending_groups == 559
    assert analytics.occurrences_covered_by_accepted_groups == 156
    assert analytics.occurrences_covered_by_rejected_groups == 111
    assert analytics.occurrences_covered_by_skipped_groups == 14
    assert analytics.group_acceptance_rate == pytest.approx(18.18, rel=1e-2)
    assert analytics.group_rejection_rate == pytest.approx(70.25, rel=1e-2)


def test_phase4_1_effort_metrics():
    """Verify annotation effort and grouped reduction metrics."""
    effort = candidate_review_service.get_effort_metrics(default_time_per_decision=15.0)
    assert effort.reviewed_candidate_count == 281
    assert effort.reviewed_group_count == 121
    assert effort.average_review_time_seconds == pytest.approx(15.0, rel=1e-2)
    assert effort.total_review_effort_seconds == pytest.approx(1815.0, rel=1e-2)
    assert effort.total_review_effort_minutes == pytest.approx(30.25, rel=1e-2)
    assert effort.estimated_individual_effort_seconds == pytest.approx(4215.0, rel=1e-2)
    assert effort.estimated_individual_effort_minutes == pytest.approx(70.25, rel=1e-2)
    assert effort.effort_reduction_percentage == pytest.approx(56.94, rel=1e-2)
    assert effort.candidate_coverage_percentage == pytest.approx(18.73, rel=1e-2)
    assert effort.group_coverage_percentage == pytest.approx(17.79, rel=1e-2)


def test_phase4_1_structured_rejection_reasons():
    """Verify structured rejection reasons and backwards-compatible mapping."""
    breakdown = candidate_review_service.get_rejection_reasons_breakdown()
    assert sum(breakdown.values()) == 111  # All 111 rejected candidates categorized
    assert breakdown["SPAN_BOUNDARY_ERROR"] == 111  # Phase 4 notes were boundary/stopword errors


def test_phase4_1_embedding_analysis():
    """Verify embedding candidate analysis, thresholds, and boundary flaws."""
    emb_analysis = candidate_review_service.get_embedding_analysis()
    assert emb_analysis.total_embedding_candidates == 1244
    assert emb_analysis.reviewed_embedding_candidates == 123
    assert emb_analysis.accepted_embedding_candidates == 3
    assert emb_analysis.current_acceptance_rate == pytest.approx(2.44, rel=1e-2)
    assert emb_analysis.boundary_flaw_count == 419
    assert emb_analysis.boundary_flaw_percentage == pytest.approx(33.68, rel=1e-2)
    assert len(emb_analysis.threshold_evaluations) == 6

    # Verify score >= 0.90 yields 0.00% precision due to boundary artifacts
    t90 = next(e for e in emb_analysis.threshold_evaluations if e.threshold == 0.90)
    assert t90.total_matching_candidates == 250
    assert t90.accepted_candidates == 0
    assert t90.acceptance_rate == 0.00


def test_phase4_1_api_endpoints():
    """Verify FastAPI analytics endpoints."""
    res_group = client.get("/api/v1/candidates/analytics/group-review")
    assert res_group.status_code == 200
    assert res_group.json()["unique_surface_forms"] == 680

    res_effort = client.get("/api/v1/candidates/analytics/effort-metrics")
    assert res_effort.status_code == 200
    assert res_effort.json()["effort_reduction_percentage"] == pytest.approx(56.94, rel=1e-2)

    res_emb = client.get("/api/v1/candidates/analytics/embedding-thresholds")
    assert res_emb.status_code == 200
    assert res_emb.json()["total_embedding_candidates"] == 1244
