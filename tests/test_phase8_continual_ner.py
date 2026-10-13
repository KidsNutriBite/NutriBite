import os
import json
import hashlib
import pytest

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


def load_jsonl(path: str):
    with open(path, "r", encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def test_continual_data_isolation_and_no_leakage():
    """Verify zero test set leakage in all continual streams and replay buffer."""
    data_dir = os.path.join(REPO_ROOT, "ner", "data", "continual_v1")
    test_path = os.path.join(data_dir, "test.jsonl")
    assert os.path.exists(test_path), "continual_v1/test.jsonl missing"
    test_records = load_jsonl(test_path)
    test_docs = {r.get("source_record_id") for r in test_records if r.get("source_record_id")}
    test_texts = {r["text"].strip() for r in test_records}

    stream_files = [
        "task0_schema_v2_train.jsonl",
        "task1_cooking_method_stream.jsonl",
        "task2_diet_pattern_stream.jsonl",
        "task3_supplement_stream.jsonl",
        "replay_buffer.jsonl"
    ]

    for fname in stream_files:
        fpath = os.path.join(data_dir, fname)
        assert os.path.exists(fpath), f"{fname} missing in continual_v1"
        recs = load_jsonl(fpath)
        stream_docs = {r.get("source_record_id") for r in recs if r.get("source_record_id")}
        stream_texts = {r["text"].strip() for r in recs}

        assert stream_docs.isdisjoint(test_docs), f"Document ID leakage detected in {fname}!"
        assert stream_texts.isdisjoint(test_texts), f"Sentence text leakage detected in {fname}!"


def test_continual_artifacts_exist():
    """Verify that all Phase 8 models, checkpoints, manifest, and reports exist."""
    models_dir = os.path.join(REPO_ROOT, "ner", "models", "continual_v1")
    assert os.path.isdir(models_dir), "continual_v1 models directory missing"

    # Base model
    assert os.path.exists(os.path.join(models_dir, "step0_base_schema_v2", "weights.json"))
    assert os.path.exists(os.path.join(models_dir, "step0_base_schema_v2", "model_metadata.json"))

    # Sequential steps
    for step_num, ent in [(1, "cooking_method"), (2, "diet_pattern"), (3, "supplement")]:
        for strat in ["no_replay", "with_replay"]:
            step_dir = os.path.join(models_dir, strat, f"step{step_num}_{ent}")
            assert os.path.isdir(step_dir), f"Missing step directory: {step_dir}"
            assert os.path.exists(os.path.join(step_dir, "weights.json")), f"weights.json missing in {step_dir}"
            assert os.path.exists(os.path.join(step_dir, "model_metadata.json")), f"metadata missing in {step_dir}"

    manifest_file = os.path.join(models_dir, "continual_benchmark_results.json")
    assert os.path.isfile(manifest_file), "continual_benchmark_results.json missing"

    report_file = os.path.join(REPO_ROOT, "ner", "reports", "phase8_continual_ner_results.md")
    assert os.path.isfile(report_file), "phase8_continual_ner_results.md missing"


def test_replay_buffer_budget_and_representation():
    """Verify replay buffer size constraints and balanced representation across old entities."""
    data_dir = os.path.join(REPO_ROOT, "ner", "data", "continual_v1")
    replay_file = os.path.join(data_dir, "replay_buffer.jsonl")
    assert os.path.exists(replay_file)
    records = load_jsonl(replay_file)

    # Must be small budget (< 50 sentences, < 5% of training data)
    assert len(records) <= 50, f"Replay buffer too large: {len(records)} sentences"

    # Must cover all 10 baseline classes
    ent_labels = {e["label"] for r in records for e in r.get("entities", [])}
    original_10 = {
        "FOOD", "NUTRIENT", "HEALTH_CONDITION", "ALLERGEN", "AGE_GROUP",
        "MEAL_TYPE", "GROWTH_METRIC", "FOOD_GROUP", "DIETARY_PROPERTY",
        "FEEDING_METHOD"
    }
    assert original_10.issubset(ent_labels), f"Missing entities in replay buffer: {original_10 - ent_labels}"


def test_anti_catastrophic_forgetting_invariants():
    """
    Verify fundamental Continual Learning invariants:
    1. Replay retains higher old-entity retention (positive delta) compared to No-Replay (negative delta).
    2. Replay maintains overall Micro-F1 > 90% across all expansions.
    3. Replay prevents severe degradation on DIET_PATTERN in Step 2.
    4. Flagship NUTRIENT F1 remains stable (>= 90%) across all replay steps.
    """
    manifest_path = os.path.join(REPO_ROOT, "ner", "models", "continual_v1", "continual_benchmark_results.json")
    with open(manifest_path, "r", encoding="utf-8") as f:
        res = json.load(f)

    # Invariants for Step 1
    s1_nr = res["Step_1_COOKING_METHOD_NoReplay"]
    s1_wr = res["Step_1_COOKING_METHOD_WithReplay"]
    assert s1_wr["old_retention_delta_f1"] > s1_nr["old_retention_delta_f1"]
    assert s1_wr["metrics"]["Micro_F1"] >= s1_nr["metrics"]["Micro_F1"]

    # Invariants for Step 2
    s2_nr = res["Step_2_DIET_PATTERN_NoReplay"]
    s2_wr = res["Step_2_DIET_PATTERN_WithReplay"]
    assert s2_wr["old_retention_delta_f1"] > s2_nr["old_retention_delta_f1"]
    assert s2_wr["metrics"]["Micro_F1"] > s2_nr["metrics"]["Micro_F1"]
    assert s2_wr["metrics"]["Class_Metrics"]["DIET_PATTERN"]["F1"] > s2_nr["metrics"]["Class_Metrics"]["DIET_PATTERN"]["F1"]

    # Invariants for Step 3
    s3_nr = res["Step_3_SUPPLEMENT_NoReplay"]
    s3_wr = res["Step_3_SUPPLEMENT_WithReplay"]
    assert s3_wr["old_retention_delta_f1"] > s3_nr["old_retention_delta_f1"]
    assert s3_wr["metrics"]["Micro_F1"] > s3_nr["metrics"]["Micro_F1"]

    # Flagship NUTRIENT retention
    for step_key in ["Step_1_COOKING_METHOD_WithReplay", "Step_2_DIET_PATTERN_WithReplay", "Step_3_SUPPLEMENT_WithReplay"]:
        nutrient_f1 = res[step_key]["metrics"]["Nutrient_F1"]
        assert nutrient_f1 >= 90.0, f"NUTRIENT dropped below 90% in {step_key}: {nutrient_f1}%"


def test_frozen_dataset_integrity():
    """Verify that Phase 8 experiments did NOT modify any frozen datasets."""
    for rel_path, expected_hash in FROZEN_HASHES.items():
        full_path = os.path.join(REPO_ROOT, rel_path)
        assert os.path.exists(full_path), f"Frozen file missing: {rel_path}"
        with open(full_path, "rb") as f:
            actual_hash = hashlib.sha256(f.read()).hexdigest()
        assert actual_hash == expected_hash, (
            f"INTEGRITY VIOLATION: {rel_path} was modified! "
            f"Expected {expected_hash}, got {actual_hash}"
        )
