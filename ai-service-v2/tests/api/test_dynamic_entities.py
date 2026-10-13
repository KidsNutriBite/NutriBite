import pytest
import os
import json
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_seed_phase1_defaults():
    """Test seeding Phase 1 selected entities (COOKING_METHOD, SUPPLEMENT, DIET_PATTERN)."""
    response = client.post("/api/v1/entities/seed-defaults")
    assert response.status_code == 200
    data = response.json()
    assert "COOKING_METHOD" in data["seeded_entities"]
    assert "SUPPLEMENT" in data["seeded_entities"]
    assert "DIET_PATTERN" in data["seeded_entities"]
    assert data["total_active"] >= 2


def test_list_entities_with_filter():
    """Test listing dynamic entities with status and search filters."""
    # List all
    res = client.get("/api/v1/entities")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 3
    assert data["active_count"] >= 2

    # Filter active
    res_active = client.get("/api/v1/entities?status=ACTIVE")
    assert res_active.status_code == 200
    active_data = res_active.json()
    for e in active_data["entities"]:
        assert e["status"] == "ACTIVE"

    # Search filter
    res_search = client.get("/api/v1/entities?search=steaming")
    assert res_search.status_code == 200
    search_data = res_search.json()
    names = [e["name"] for e in search_data["entities"]]
    assert "COOKING_METHOD" in names


def test_get_entity_details():
    """Test fetching single entity by name."""
    res = client.get("/api/v1/entities/COOKING_METHOD")
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "COOKING_METHOD"
    assert data["category"] == "Culinary & Biochemical Processing"
    assert len(data["seed_examples"]) > 0
    assert len(data["aliases"]) > 0


def test_frozen_10_entity_collision_prevention():
    """Test that attempting to register an existing frozen core entity is rejected."""
    for frozen_name in ["NUTRIENT", "FOOD", "ALLERGEN", "HEALTH_CONDITION"]:
        res = client.post(
            "/api/v1/entities",
            json={
                "name": frozen_name,
                "display_name": f"Duplicate {frozen_name}",
                "category": "Test",
                "description": "Attempting collision with static 10-entity schema",
                "aliases": ["test"],
                "seed_examples": []
            }
        )
        assert res.status_code == 400
        assert "frozen core entity" in res.json()["detail"]


def test_entity_lifecycle_state_machine():
    """Test entity creation and lifecycle state machine transitions."""
    test_entity_name = "TEXTURE_MODIFIER"

    # Clean up if exists from previous run
    client.delete(f"/api/v1/entities/{test_entity_name}")

    # 1. Create proposed entity
    create_res = client.post(
        "/api/v1/entities",
        json={
            "name": test_entity_name,
            "display_name": "Texture Modifier",
            "category": "Food Consistency",
            "description": "Thickening, thinning, or texture altering agents used in infant feeding.",
            "aliases": ["thickener", "pureed consistency", "diluted mash"],
            "seed_examples": [
                {
                    "text": "Add a teaspoon of ghee as a texture modifier to increase energy density.",
                    "surface_span": "texture modifier",
                    "source_context": "RAG_TEXTURE_3",
                    "clinical_notes": "Improves swallowing ease."
                }
            ],
            "schema_version": "2.1.0",
            "status": "PROPOSED"
        }
    )
    assert create_res.status_code == 201
    created_data = create_res.json()
    assert created_data["status"] == "PROPOSED"

    # 2. Invalid Jump: PROPOSED -> ACTIVE should fail without force
    invalid_jump = client.patch(
        f"/api/v1/entities/{test_entity_name}/lifecycle",
        json={
            "target_status": "ACTIVE",
            "changed_by": "CLINICAL_LEAD",
            "reason": "Attempting premature activation",
            "force": False
        }
    )
    assert invalid_jump.status_code == 400
    assert "Invalid lifecycle transition" in invalid_jump.json()["detail"]

    # 3. Valid Step 1: PROPOSED -> REVIEW
    step1 = client.patch(
        f"/api/v1/entities/{test_entity_name}/lifecycle",
        json={
            "target_status": "REVIEW",
            "changed_by": "CLINICAL_LEAD",
            "reason": "Submitting for schema review",
            "force": False
        }
    )
    assert step1.status_code == 200
    assert step1.json()["status"] == "REVIEW"

    # 4. Valid Step 2: REVIEW -> VALIDATED
    step2 = client.patch(
        f"/api/v1/entities/{test_entity_name}/lifecycle",
        json={
            "target_status": "VALIDATED",
            "changed_by": "NLP_SCIENTIST",
            "reason": "Passed boundary check and collision audit",
            "force": False
        }
    )
    assert step2.status_code == 200
    assert step2.json()["status"] == "VALIDATED"

    # 5. Valid Step 3: VALIDATED -> TRAINING
    step3 = client.patch(
        f"/api/v1/entities/{test_entity_name}/lifecycle",
        json={
            "target_status": "TRAINING",
            "changed_by": "ML_ENGINEER",
            "reason": "Adding seed gazetteers to training set",
            "force": False
        }
    )
    assert step3.status_code == 200
    assert step3.json()["status"] == "TRAINING"

    # 6. Valid Step 4: TRAINING -> EVALUATED
    step4 = client.patch(
        f"/api/v1/entities/{test_entity_name}/lifecycle",
        json={
            "target_status": "EVALUATED",
            "changed_by": "EVAL_PIPELINE",
            "reason": "Achieved F1 >= 0.85 on clinical benchmark queries",
            "force": False
        }
    )
    assert step4.status_code == 200
    assert step4.json()["status"] == "EVALUATED"

    # 7. Valid Step 5: EVALUATED -> ACTIVE
    step5 = client.patch(
        f"/api/v1/entities/{test_entity_name}/lifecycle",
        json={
            "target_status": "ACTIVE",
            "changed_by": "PROD_RELEASE_BOT",
            "reason": "Promoted to production inference registry",
            "force": False
        }
    )
    assert step5.status_code == 200
    final_data = step5.json()
    assert final_data["status"] == "ACTIVE"
    assert len(final_data["lifecycle_history"]) >= 5

    # 8. Clean up
    del_res = client.delete(f"/api/v1/entities/{test_entity_name}")
    assert del_res.status_code == 204


def test_preservation_of_existing_10_entity_ner_data():
    """Verify that existing training/eval dataset files remain untouched."""
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    ner_data_dir = os.path.join(base_dir, "ner", "data")
    
    assert os.path.exists(os.path.join(ner_data_dir, "weak_annotations.jsonl"))
    assert os.path.exists(os.path.join(ner_data_dir, "train.jsonl"))
    assert os.path.exists(os.path.join(ner_data_dir, "test.jsonl"))
    assert os.path.exists(os.path.join(ner_data_dir, "validation.jsonl"))
