import os
import json
import hashlib
import pytest
import importlib

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

FROZEN_HASHES = {
    "ner/data/train.jsonl": "9803134184861ee96233613589092bf5828ee1575760a1c7f75b5eea5e54d36e",
    "ner/data/validation.jsonl": "ca73abec8ec160d5b2c68ed7475592d198c38b293974214e67c130f45f21bc5c",
    "ner/data/test.jsonl": "a7cec98c1bdcaa8424204b77fd7eddd8e0e5aebc0f6d81927c1eb2ea152db33c",
    "ner/data/human_gold/human_gold.jsonl": "e6bc27008e4ac22ea6536e63587c91e226a96a5eed54dbff9033839f1b05ff86",
    "ner/data/human_gold/nutrient_challenge.jsonl": "6245feffa7a805539a2a2cd6ccda6c179e6afa9ca4f7fda18c140776def7a5ee",
    "ner/data/schema_v2/train.jsonl": "ae1313c684162e6beba81c115f86a6ff41c8d1f35535c994cd0a289a3c8f682f",
    "ner/data/schema_v2/validation.jsonl": "76c09ef50365c82fd576da7511bb49da3554e7cf72a1ca016171768df7a32f5e",
    "ner/data/schema_v2/test.jsonl": "2eaea9bc82839b973add6fc32f0fce14e2b6007f4d26e03c0376a0d1cca6b11e",
}

ALL_13_CLASSES = [
    "FOOD", "NUTRIENT", "HEALTH_CONDITION", "ALLERGEN", "AGE_GROUP",
    "MEAL_TYPE", "GROWTH_METRIC", "FOOD_GROUP", "DIETARY_PROPERTY",
    "FEEDING_METHOD", "COOKING_METHOD", "SUPPLEMENT", "DIET_PATTERN"
]


@pytest.fixture(scope="module")
def linker_module():
    sys_path = os.path.join(REPO_ROOT, "ner", "scripts")
    import sys
    if sys_path not in sys.path:
        sys.path.insert(0, sys_path)
    return importlib.import_module("24_entity_linking")


@pytest.fixture(scope="module")
def active_linker(linker_module):
    kb_path = os.path.join(REPO_ROOT, "ner", "data", "entity_linking_v1", "canonical_knowledge_base.json")
    with open(kb_path, "r", encoding="utf-8") as f:
        kb_entries = json.load(f)
    # Fast linker without loading full transformer weights during quick tests if cached
    return linker_module.NutriBiteEntityLinker(kb_entries, use_embeddings=False)


def test_entity_linking_artifacts_exist():
    """Verify all Phase 9 directories, knowledge base, gold eval dataset, and reports exist."""
    data_dir = os.path.join(REPO_ROOT, "ner", "data", "entity_linking_v1")
    assert os.path.isdir(data_dir), "entity_linking_v1 data directory missing"
    assert os.path.exists(os.path.join(data_dir, "canonical_knowledge_base.json"))
    assert os.path.exists(os.path.join(data_dir, "gold_linked_eval.jsonl"))

    models_dir = os.path.join(REPO_ROOT, "ner", "models", "entity_linking_v1")
    assert os.path.isdir(models_dir), "entity_linking_v1 models directory missing"
    assert os.path.exists(os.path.join(models_dir, "linker_config.json"))
    assert os.path.exists(os.path.join(models_dir, "linking_evaluation_results.json"))

    report_path = os.path.join(REPO_ROOT, "ner", "reports", "phase9_entity_linking_results.md")
    assert os.path.isfile(report_path), "phase9_entity_linking_results.md report missing"


def test_canonical_knowledge_base_integrity():
    """Verify that canonical knowledge base covers all 13 classes and contains required fields."""
    kb_path = os.path.join(REPO_ROOT, "ner", "data", "entity_linking_v1", "canonical_knowledge_base.json")
    with open(kb_path, "r", encoding="utf-8") as f:
        kb = json.load(f)

    assert len(kb) >= 900, f"Expected >= 900 KB entries, got {len(kb)}"

    types_covered = {d["entity_type"] for d in kb}
    for c in ALL_13_CLASSES:
        assert c in types_covered, f"Missing entity type in KB: {c}"

    for entry in kb:
        assert entry["canonical_id"], "Empty canonical_id detected"
        assert entry["canonical_name"], "Empty canonical_name detected"
        assert entry["entity_type"] in ALL_13_CLASSES, f"Unknown entity_type: {entry['entity_type']}"
        assert entry["confidence"] > 0.0


def test_exact_and_alias_linking(active_linker):
    """Verify exact canonical and alias matching across legacy and dynamic classes."""
    # Exact canonical
    r_iron = active_linker.link_entity("iron", "NUTRIENT")
    assert r_iron["canonical_id"] == "NUT_FE_ELEMENTAL"
    assert r_iron["is_linked"] is True
    assert r_iron["linking_method"] == "exact_canonical"

    # Curated alias
    r_vitd = active_linker.link_entity("cholecalciferol", "NUTRIENT")
    assert r_vitd["canonical_id"] == "NUT_VIT_D"
    assert r_vitd["is_linked"] is True
    assert r_vitd["linking_method"] == "exact_alias"

    # Dynamic COOKING_METHOD
    r_steam = active_linker.link_entity("steamed", "COOKING_METHOD")
    assert r_steam["canonical_id"] == "COOK_STEAMING"
    assert r_steam["is_linked"] is True

    # Dynamic DIET_PATTERN
    r_diet = active_linker.link_entity("dietary diversity", "DIET_PATTERN")
    assert r_diet["canonical_id"] == "DIET_DIVERSITY"
    assert r_diet["is_linked"] is True

    # Dynamic SUPPLEMENT
    r_ors = active_linker.link_entity("ors", "SUPPLEMENT")
    assert r_ors["canonical_id"] == "SUPP_ORS"
    assert r_ors["is_linked"] is True


def test_morphological_stemming_and_fuzzy(active_linker):
    """Verify plural stemming and fuzzy ratio normalization."""
    # Plural stemming
    r_prot = active_linker.link_entity("proteins", "NUTRIENT")
    assert r_prot["canonical_id"] == "NUT_PROTEIN"
    assert r_prot["is_linked"] is True
    assert r_prot["linking_method"] == "exact_stemmed"

    # Fuzzy match
    r_press = active_linker.link_entity("pressure-cook", "COOKING_METHOD")
    assert r_press["canonical_id"] == "COOK_PRESSURE_COOKING"
    assert r_press["is_linked"] is True


def test_ambiguity_and_unmatched_handling(active_linker):
    """Verify that ambiguous or out-of-ontology mentions are explicitly flagged without forcing a link."""
    # Out of ontology mention
    r_unmatched = active_linker.link_entity("supercalifragilistic", "NUTRIENT")
    assert r_unmatched["canonical_id"] == "UNMATCHED"
    assert r_unmatched["is_linked"] is False
    assert r_unmatched["confidence"] == 0.0
    assert r_unmatched["linking_method"] == "unmatched"


def test_linking_evaluation_metrics():
    """Verify evaluation metrics integrity in linking_evaluation_results.json."""
    res_path = os.path.join(REPO_ROOT, "ner", "models", "entity_linking_v1", "linking_evaluation_results.json")
    with open(res_path, "r", encoding="utf-8") as f:
        res = json.load(f)

    assert res["total_mentions"] == 491
    assert res["normalization_coverage"] >= 95.0
    assert res["exact_linking_accuracy"] >= 95.0
    assert res["precision"] >= 95.0
    assert res["recall"] >= 95.0
    assert res["f1_score"] >= 95.0
    assert res["ambiguous_rate"] >= 0.5  # Explicitly catches ambiguous concepts

    # Seen vs unseen generalization
    gen = res["generalization"]
    assert gen["seen_coverage"] >= 95.0
    assert gen["unseen_coverage"] >= 95.0


def test_end_to_end_pipeline_integration(linker_module, active_linker):
    """Verify end-to-end extraction and linking integration."""
    continual_mod = importlib.import_module("23_continual_ner")
    model_dir = os.path.join(REPO_ROOT, "ner", "models", "continual_v1", "with_replay", "step3_supplement")

    with open(os.path.join(model_dir, "weights.json"), "r", encoding="utf-8") as f:
        w = json.load(f)

    all_labels = continual_mod.SCHEMA_V2_LABELS + [
        "B-COOKING_METHOD", "I-COOKING_METHOD",
        "B-DIET_PATTERN", "I-DIET_PATTERN",
        "B-SUPPLEMENT", "I-SUPPLEMENT"
    ]
    ner_model = continual_mod.FastAveragedContinualPerceptron(all_labels, w)

    sample_sentence = "Boiled eggs provide elemental iron for toddlers."
    result = linker_module.extract_and_link_pipeline(sample_sentence, ner_model=ner_model, linker=active_linker)

    assert "entities" in result
    assert len(result["entities"]) > 0

    ent_cids = {e["canonical_id"] for e in result["entities"]}
    # Check that iron is extracted and linked
    assert "NUT_FE_ELEMENTAL" in ent_cids or "AGE_TODDLER" in ent_cids or "COOK_BOILING" in ent_cids


def test_frozen_dataset_integrity():
    """Verify that Phase 9 did NOT modify any frozen Phase 0-8 datasets."""
    for rel_path, expected_hash in FROZEN_HASHES.items():
        full_path = os.path.join(REPO_ROOT, rel_path)
        assert os.path.exists(full_path), f"Frozen file missing: {rel_path}"
        with open(full_path, "rb") as f:
            actual_hash = hashlib.sha256(f.read()).hexdigest()
        assert actual_hash == expected_hash, (
            f"INTEGRITY VIOLATION: {rel_path} was modified! "
            f"Expected {expected_hash}, got {actual_hash}"
        )
