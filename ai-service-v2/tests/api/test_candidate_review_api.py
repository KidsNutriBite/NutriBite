import os
import json
import hashlib
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.candidate_review_service import candidate_review_service, VALIDATED_CANDIDATES_FILE
from app.db.connection import DATASETS_DIR

client = TestClient(app)

FROZEN_NER_DATASETS = [
    os.path.join("ner", "data", "train.jsonl"),
    os.path.join("ner", "data", "test.jsonl"),
    os.path.join("ner", "data", "validation.jsonl"),
    os.path.join("ner", "data", "human_gold", "human_gold.jsonl"),
    os.path.join("ner", "data", "human_gold", "nutrient_challenge.jsonl"),
    os.path.join("ner", "data", "schema_v2", "train.jsonl"),
    os.path.join("ner", "data", "schema_v2", "test.jsonl"),
    os.path.join("ner", "data", "schema_v2", "validation.jsonl"),
]


def _repo_root() -> str:
    cur = os.path.abspath(os.path.dirname(__file__))
    for _ in range(5):
        if os.path.exists(os.path.join(cur, "ner")):
            return cur
        cur = os.path.dirname(cur)
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))


def _compute_file_hashes() -> dict:
    root = _repo_root()
    hashes = {}
    for rel in FROZEN_NER_DATASETS:
        full = os.path.join(root, rel)
        if os.path.exists(full):
            hasher = hashlib.sha256()
            with open(full, "rb") as f:
                hasher.update(f.read())
            hashes[rel] = hasher.hexdigest()
    return hashes


@pytest.fixture(scope="session", autouse=True)
def preserve_dataset_files():
    """Backup and restore review datasets around the entire test session."""
    reviews_path = os.path.join(DATASETS_DIR, "candidate_reviews.json")
    validated_path = os.path.join(DATASETS_DIR, VALIDATED_CANDIDATES_FILE)
    
    saved_reviews = None
    saved_validated = None
    if os.path.exists(reviews_path):
        with open(reviews_path, "r", encoding="utf-8") as f:
            saved_reviews = f.read()
    if os.path.exists(validated_path):
        with open(validated_path, "r", encoding="utf-8") as f:
            saved_validated = f.read()
            
    yield
    
    if saved_reviews is not None:
        with open(reviews_path, "w", encoding="utf-8") as f:
            f.write(saved_reviews)
    if saved_validated is not None:
        with open(validated_path, "w", encoding="utf-8") as f:
            f.write(saved_validated)
    candidate_review_service.load_candidates(force_reload=True)


@pytest.fixture(autouse=True)
def clean_review_state():
    """Ensure clean state before and after each test."""
    candidate_review_service.reset_reviews()
    yield
    candidate_review_service.reset_reviews()


def test_candidate_loading():
    """Verify that candidates load from Phase 3 discovery results with required fields."""
    response = client.get("/api/v1/candidates?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1500
    assert len(data["candidates"]) == 10

    first = data["candidates"][0]
    required_keys = [
        "candidate_id",
        "entity_id",
        "candidate_text",
        "context",
        "source_document",
        "start_char",
        "end_char",
        "discovery_method",
        "similarity_score",
        "discovered_by_methods",
        "metadata",
        "status",
        "occurrence_count",
    ]
    for key in required_keys:
        assert key in first, f"Missing key {key} in candidate response"


def test_filtering_by_entity():
    """Verify filtering candidates by dynamic entity type."""
    for entity_name in ["COOKING_METHOD", "SUPPLEMENT", "DIET_PATTERN"]:
        res = client.get(f"/api/v1/candidates?entity={entity_name}&limit=20")
        assert res.status_code == 200
        data = res.json()
        assert data["total"] == 500
        for cand in data["candidates"]:
            assert cand["entity_id"] == entity_name


def test_filtering_by_discovery_method():
    """Verify filtering candidates by discovery method."""
    res = client.get("/api/v1/candidates?discovery_method=exact_match&limit=20")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] > 0
    for cand in data["candidates"]:
        assert cand["discovery_method"] == "exact_match" or "exact_match" in cand["discovered_by_methods"]


def test_filtering_by_confidence_range():
    """Verify filtering candidates by similarity score range."""
    res = client.get("/api/v1/candidates?min_confidence=0.85&max_confidence=1.0&limit=50")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] > 0
    for cand in data["candidates"]:
        assert 0.85 <= cand["similarity_score"] <= 1.0


def test_candidate_review_accepted_and_metadata():
    """Verify human reviewer ACCEPT decision, metadata storage, and dataset synchronization."""
    list_res = client.get("/api/v1/candidates?limit=1")
    cand_id = list_res.json()["candidates"][0]["candidate_id"]

    review_payload = {
        "decision": "ACCEPTED",
        "reviewer_id": "pediatric_specialist_dr_smith",
        "reviewer_note": "Clinically standard cooking preparation for pediatric weaning.",
        "apply_to_all_occurrences": False,
    }
    patch_res = client.patch(f"/api/v1/candidates/{cand_id}/review", json=review_payload)
    assert patch_res.status_code == 200
    patch_data = patch_res.json()

    assert patch_data["affected_count"] == 1
    primary = patch_data["primary_candidate"]
    assert primary["candidate_id"] == cand_id
    assert primary["decision"] == "ACCEPTED"
    assert primary["status"] == "ACCEPTED"
    assert primary["reviewer_id"] == "pediatric_specialist_dr_smith"
    assert primary["reviewer_note"] == "Clinically standard cooking preparation for pediatric weaning."
    assert primary["reviewed_at"] is not None

    # Check GET single endpoint
    get_res = client.get(f"/api/v1/candidates/{cand_id}")
    assert get_res.status_code == 200
    assert get_res.json()["status"] == "ACCEPTED"

    # Verify validated candidate file was updated
    val_path = os.path.join(DATASETS_DIR, VALIDATED_CANDIDATES_FILE)
    assert os.path.exists(val_path)
    with open(val_path, "r", encoding="utf-8") as f:
        val_data = json.load(f)
    assert val_data["total_validated"] == 1
    assert any(c["candidate_id"] == cand_id for c in val_data["validated_candidates"])


def test_candidate_review_rejected():
    """Verify human reviewer REJECT decision and non-inclusion in validated dataset."""
    list_res = client.get("/api/v1/candidates?limit=1")
    cand_id = list_res.json()["candidates"][0]["candidate_id"]

    review_payload = {
        "decision": "REJECTED",
        "reviewer_id": "reviewer_nutrition_lead",
        "reviewer_note": "Spurious match; not relevant to target pediatric nutrition entity.",
        "apply_to_all_occurrences": False,
    }
    patch_res = client.patch(f"/api/v1/candidates/{cand_id}/review", json=review_payload)
    assert patch_res.status_code == 200
    primary = patch_res.json()["primary_candidate"]
    assert primary["status"] == "REJECTED"
    assert primary["decision"] == "REJECTED"

    # Verify NOT in validated candidates
    val_path = os.path.join(DATASETS_DIR, VALIDATED_CANDIDATES_FILE)
    with open(val_path, "r", encoding="utf-8") as f:
        val_data = json.load(f)
    assert not any(c["candidate_id"] == cand_id for c in val_data.get("validated_candidates", []))


def test_candidate_review_skipped():
    """Verify human reviewer SKIPPED decision."""
    list_res = client.get("/api/v1/candidates?limit=1")
    cand_id = list_res.json()["candidates"][0]["candidate_id"]

    review_payload = {
        "decision": "SKIPPED",
        "reviewer_id": "reviewer_001",
        "reviewer_note": "Ambiguous medical dosage context, deferred to senior pediatrician.",
        "apply_to_all_occurrences": False,
    }
    patch_res = client.patch(f"/api/v1/candidates/{cand_id}/review", json=review_payload)
    assert patch_res.status_code == 200
    primary = patch_res.json()["primary_candidate"]
    assert primary["status"] == "SKIPPED"
    assert primary["decision"] == "SKIPPED"


def test_deduplication_and_batch_propagation():
    """
    Verify that repeated surface forms can be reviewed together via
    apply_to_all_occurrences while preserving distinct contexts and IDs.
    """
    # Find candidate with duplicates (occurrence_count > 1)
    all_cands = client.get("/api/v1/candidates?limit=500").json()["candidates"]
    multi_cand = next((c for c in all_cands if c["occurrence_count"] > 1), None)
    assert multi_cand is not None, "Expected at least one candidate with occurrence_count > 1"

    cand_id = multi_cand["candidate_id"]
    occ_count = multi_cand["occurrence_count"]
    text = multi_cand["candidate_text"]
    entity = multi_cand["entity_id"]

    review_payload = {
        "decision": "ACCEPTED",
        "reviewer_id": "batch_reviewer",
        "reviewer_note": "Batch verified pediatric entity mention.",
        "apply_to_all_occurrences": True,
    }
    patch_res = client.patch(f"/api/v1/candidates/{cand_id}/review", json=review_payload)
    assert patch_res.status_code == 200
    patch_data = patch_res.json()

    assert patch_data["affected_count"] == occ_count
    assert len(patch_data["affected_candidate_ids"]) == occ_count

    # Check search with group_by_surface_form
    grouped_res = client.get("/api/v1/candidates?group_by_surface_form=true&limit=200")
    assert grouped_res.status_code == 200
    grouped_data = grouped_res.json()
    assert grouped_data["total"] <= 1500

    # Verify individual occurrences preserved distinct IDs and contexts in validated dataset
    val_path = os.path.join(DATASETS_DIR, VALIDATED_CANDIDATES_FILE)
    with open(val_path, "r", encoding="utf-8") as f:
        val_data = json.load(f)
    matching = [c for c in val_data["validated_candidates"] if c["candidate_text"].lower() == text.lower() and c["entity_id"] == entity]
    assert len(matching) == occ_count
    distinct_ids = {c["candidate_id"] for c in matching}
    assert len(distinct_ids) == occ_count


def test_invalid_candidate_handling():
    """Verify 404 and 422 error handling for invalid candidates and bad payloads."""
    res_404 = client.get("/api/v1/candidates/NON_EXISTENT_ID_99999")
    assert res_404.status_code == 404

    patch_404 = client.patch(
        "/api/v1/candidates/NON_EXISTENT_ID_99999/review",
        json={"decision": "ACCEPTED", "reviewer_id": "admin"}
    )
    assert patch_404.status_code == 404

    list_res = client.get("/api/v1/candidates?limit=1")
    cand_id = list_res.json()["candidates"][0]["candidate_id"]
    invalid_decision_res = client.patch(
        f"/api/v1/candidates/{cand_id}/review",
        json={"decision": "INVALID_STATE", "reviewer_id": "admin"}
    )
    assert invalid_decision_res.status_code == 422


def test_review_summary_endpoint():
    """Verify aggregate metrics in /candidates/review-summary endpoint."""
    # Perform some reviews
    all_cands = client.get("/api/v1/candidates?limit=5").json()["candidates"]
    client.patch(f"/api/v1/candidates/{all_cands[0]['candidate_id']}/review", json={"decision": "ACCEPTED", "reviewer_id": "rev1"})
    client.patch(f"/api/v1/candidates/{all_cands[1]['candidate_id']}/review", json={"decision": "REJECTED", "reviewer_id": "rev2"})
    client.patch(f"/api/v1/candidates/{all_cands[2]['candidate_id']}/review", json={"decision": "SKIPPED", "reviewer_id": "rev3"})

    summary_res = client.get("/api/v1/candidates/review-summary")
    assert summary_res.status_code == 200
    summary = summary_res.json()

    assert summary["total_candidates"] == 1500
    assert summary["reviewed_count"] == 3
    assert summary["accepted_count"] == 1
    assert summary["rejected_count"] == 1
    assert summary["skipped_count"] == 1
    assert summary["pending_count"] == 1497
    assert summary["acceptance_rate"] == pytest.approx(33.33, rel=1e-2)
    assert "COOKING_METHOD" in summary["candidates_per_entity"]
    assert "SUPPLEMENT" in summary["candidates_per_entity"]
    assert "DIET_PATTERN" in summary["candidates_per_entity"]
    assert len(summary["confidence_distribution"]) == 4


def test_existing_ner_gold_data_isolation():
    """
    CRITICAL CONSTRAINT: Verify that the candidate review service and human decisions
    NEVER modify, mutate, or touch any existing NER training, validation, test, or gold files.
    """
    hashes_before = _compute_file_hashes()
    assert len(hashes_before) > 0, "Frozen NER datasets must exist and be hashed"

    # Perform extensive review mutations (Accepted, Rejected, Skipped, and batch updates)
    list_res = client.get("/api/v1/candidates?limit=10")
    cands = list_res.json()["candidates"]

    client.patch(f"/api/v1/candidates/{cands[0]['candidate_id']}/review", json={"decision": "ACCEPTED", "reviewer_id": "auditor_1"})
    client.patch(f"/api/v1/candidates/{cands[1]['candidate_id']}/review", json={"decision": "REJECTED", "reviewer_id": "auditor_2"})
    client.patch(f"/api/v1/candidates/{cands[2]['candidate_id']}/review", json={"decision": "SKIPPED", "reviewer_id": "auditor_3"})
    client.patch(f"/api/v1/candidates/{cands[3]['candidate_id']}/review", json={
        "decision": "ACCEPTED",
        "reviewer_id": "auditor_4",
        "apply_to_all_occurrences": True
    })

    # Verify hashes after all review actions
    hashes_after = _compute_file_hashes()
    for rel_path, before_hash in hashes_before.items():
        after_hash = hashes_after.get(rel_path)
        assert after_hash == before_hash, (
            f"VIOLATION: Frozen NER dataset '{rel_path}' was modified! "
            f"Before hash: {before_hash}, After hash: {after_hash}"
        )


def test_phase4_1_structured_rejection_reasons():
    """Phase 4.1: Test structured rejection reasons and validation."""
    list_res = client.get("/api/v1/candidates?limit=6")
    cands = list_res.json()["candidates"]

    reasons = [
        "AMBIGUOUS_POLYSEMOUS",
        "WRONG_ENTITY_TYPE",
        "OUT_OF_DOMAIN",
        "SPAN_BOUNDARY_ERROR",
        "DUPLICATE",
        "OTHER",
    ]

    for i, reason in enumerate(reasons):
        cid = cands[i]["candidate_id"]
        payload = {
            "decision": "REJECTED",
            "reviewer_id": f"rev_{i}",
            "rejection_reason": reason,
            "reviewer_note": f"Test rejection for {reason}"
        }
        res = client.patch(f"/api/v1/candidates/{cid}/review", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["rejection_reason"] == reason
        assert data["primary_candidate"]["rejection_reason"] == reason

    # Test invalid rejection reason returns 422
    bad_payload = {
        "decision": "REJECTED",
        "reviewer_id": "rev_bad",
        "rejection_reason": "INVALID_REJECTION_REASON"
    }
    bad_res = client.patch(f"/api/v1/candidates/{cands[0]['candidate_id']}/review", json=bad_payload)
    assert bad_res.status_code == 422


def test_phase4_1_annotation_effort_tracking():
    """Phase 4.1: Test review start/end timing, duration, and occurrences covered."""
    list_res = client.get("/api/v1/candidates?limit=1")
    cid = list_res.json()["candidates"][0]["candidate_id"]

    start_iso = "2026-10-01T10:00:00+00:00"
    end_iso = "2026-10-01T10:00:18.500000+00:00"
    payload = {
        "decision": "ACCEPTED",
        "reviewer_id": "pediatric_expert_1",
        "review_start_time": start_iso,
        "review_end_time": end_iso,
        "review_duration_seconds": 18.5,
        "apply_to_all_occurrences": False
    }

    res = client.patch(f"/api/v1/candidates/{cid}/review", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["review_duration_seconds"] == 18.5
    assert data["occurrences_covered"] == 1
    assert data["primary_candidate"]["review_duration_seconds"] == 18.5

    # Check GET single endpoint returns effort fields
    get_res = client.get(f"/api/v1/candidates/{cid}")
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert get_data["review_duration_seconds"] == 18.5
    assert get_data["occurrences_covered"] == 1


def test_phase4_1_group_review_analytics_endpoint():
    """Phase 4.1: Test GET /candidates/analytics/group-review."""
    res = client.get("/api/v1/candidates/analytics/group-review")
    assert res.status_code == 200
    data = res.json()

    assert data["unique_surface_forms"] == 680
    assert data["total_occurrences"] == 1500
    assert data["reviewed_groups"] >= 0
    assert data["accepted_groups"] >= 0
    assert data["rejected_groups"] >= 0
    assert data["skipped_groups"] >= 0
    assert data["pending_groups"] <= 680
    assert data["group_acceptance_rate"] >= 0.0
    assert data["group_rejection_rate"] >= 0.0


def test_phase4_1_effort_metrics_endpoint():
    """Phase 4.1: Test GET /candidates/analytics/effort-metrics."""
    res = client.get("/api/v1/candidates/analytics/effort-metrics?default_time_per_decision=15.0")
    assert res.status_code == 200
    data = res.json()

    assert "reviewed_candidate_count" in data
    assert "reviewed_group_count" in data
    assert data["average_review_time_seconds"] > 0
    assert "total_review_effort_seconds" in data
    assert "total_review_effort_minutes" in data
    assert "estimated_individual_effort_seconds" in data
    assert "effort_reduction_percentage" in data
    assert "candidate_coverage_percentage" in data
    assert "group_coverage_percentage" in data


def test_phase4_1_embedding_analysis_endpoint():
    """Phase 4.1: Test GET /candidates/analytics/embedding-thresholds."""
    res = client.get("/api/v1/candidates/analytics/embedding-thresholds")
    assert res.status_code == 200
    data = res.json()

    assert data["total_embedding_candidates"] == 1244
    assert data["current_acceptance_rate"] <= 10.0
    assert data["boundary_flaw_count"] > 0
    assert data["boundary_flaw_percentage"] > 0.0
    assert len(data["threshold_evaluations"]) == 6
    assert len(data["recommendations"]) >= 3
    assert "root_cause_summary" in data


def test_phase4_1_summary_integration():
    """Phase 4.1: Test review-summary includes all Phase 4.1 additions."""
    res = client.get("/api/v1/candidates/review-summary")
    assert res.status_code == 200
    data = res.json()

    assert "rejection_rate" in data
    assert data["group_analytics"] is not None
    assert data["effort_metrics"] is not None
    assert len(data["rejection_reasons_breakdown"]) == 6
    assert data["embedding_analysis"] is not None
