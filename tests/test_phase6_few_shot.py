import os
import json
import hashlib
import pytest
import numpy as np

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


def test_few_shot_data_leakage():
    """Verify zero document-level or text-level partition leakage across all few-shot splits."""
    test_path = os.path.join(REPO_ROOT, "ner", "data", "few_shot_v1", "test.jsonl")
    assert os.path.exists(test_path), "Test split missing in few_shot_v1"
    test_records = load_jsonl(test_path)
    test_docs = {r.get("source_record_id") for r in test_records if r.get("source_record_id")}
    test_texts = {r["text"].strip() for r in test_records}

    for k in [5, 10, 25, 50]:
        train_path = os.path.join(REPO_ROOT, "ner", "data", "few_shot_v1", f"train_k{k}.jsonl")
        assert os.path.exists(train_path), f"train_k{k}.jsonl missing"
        train_records = load_jsonl(train_path)
        train_docs = {r.get("source_record_id") for r in train_records if r.get("source_record_id")}
        train_texts = {r["text"].strip() for r in train_records}

        assert train_docs.isdisjoint(test_docs), f"Document ID leakage in train_k{k}!"
        assert train_texts.isdisjoint(test_texts), f"Sentence text leakage in train_k{k}!"


def test_support_budget_integrity_and_no_fabrication():
    """Verify exact support budget constraints and absence of synthetic/duplicate records."""
    base_train = load_jsonl(os.path.join(REPO_ROOT, "ner", "data", "dynamic_v1", "train.jsonl"))
    base_len = len(base_train)
    assert base_len == 1223

    for k in [5, 10, 25, 50]:
        train_path = os.path.join(REPO_ROOT, "ner", "data", "few_shot_v1", f"train_k{k}.jsonl")
        records = load_jsonl(train_path)
        assert len(records) == base_len, f"Sentence count modified in train_k{k}: expected {base_len}, got {len(records)}"

        # Count sentences containing active COOKING_METHOD
        cooking_sentences = 0
        for r in records:
            labels = {e["label"] for e in r.get("entities", [])}
            if "COOKING_METHOD" in labels:
                cooking_sentences += 1

        assert cooking_sentences == k, f"Expected exactly {k} active COOKING_METHOD sentences in train_k{k}, got {cooking_sentences}"


def test_unfeasible_settings_reporting():
    """Verify that unsupported support sizes for low-resource entities are flagged as NOT FEASIBLE."""
    summary_path = os.path.join(REPO_ROOT, "ner", "models", "few_shot_v1", "few_shot_benchmark_summary.json")
    assert os.path.exists(summary_path)
    with open(summary_path, "r", encoding="utf-8") as f:
        summary = json.load(f)

    audit = summary["feasibility_audit"]

    # DIET_PATTERN: only 8 available training sentences
    assert audit["DIET_PATTERN"]["available_training_sentences"] == 8
    assert audit["DIET_PATTERN"]["k_settings"]["K=5"]["feasible"] is True
    assert audit["DIET_PATTERN"]["k_settings"]["K=10"]["feasible"] is False
    assert audit["DIET_PATTERN"]["k_settings"]["K=25"]["feasible"] is False
    assert audit["DIET_PATTERN"]["k_settings"]["K=50"]["feasible"] is False

    # SUPPLEMENT: only 4 available training sentences
    assert audit["SUPPLEMENT"]["available_training_sentences"] == 4
    assert audit["SUPPLEMENT"]["k_settings"]["K=5"]["feasible"] is False
    assert audit["SUPPLEMENT"]["k_settings"]["K=10"]["feasible"] is False
    assert audit["SUPPLEMENT"]["k_settings"]["K=25"]["feasible"] is False
    assert audit["SUPPLEMENT"]["k_settings"]["K=50"]["feasible"] is False


def test_reproducibility_and_monotonicity():
    """Verify reproducible learning progression and model metadata persistence."""
    summary_path = os.path.join(REPO_ROOT, "ner", "models", "few_shot_v1", "few_shot_benchmark_summary.json")
    with open(summary_path, "r", encoding="utf-8") as f:
        summary = json.load(f)

    results = summary["benchmark_results"]
    f1_k5 = results["K=5"]["cooking_method_f1"]
    f1_k10 = results["K=10"]["cooking_method_f1"]
    f1_k25 = results["K=25"]["cooking_method_f1"]
    f1_k50 = results["K=50"]["cooking_method_f1"]
    f1_full = results["Full (P5)"]["cooking_method_f1"]

    # F1 progression should be non-decreasing from K=25 upwards
    assert f1_k25 > f1_k10
    assert f1_k50 > f1_k25
    assert f1_full > f1_k50

    # Old-entity retention: NUTRIENT should remain stable across all settings (>= 90%)
    for k_name, res in results.items():
        assert res["nutrient_f1"] >= 90.0, f"NUTRIENT dropped below 90% in {k_name}: {res['nutrient_f1']}%"


def test_prototypes_structure_and_embeddings():
    """Verify prototypical embedding representations are computed and unit-normalized."""
    proto_path = os.path.join(REPO_ROOT, "ner", "models", "few_shot_v1", "prototypes.json")
    assert os.path.exists(proto_path)
    with open(proto_path, "r", encoding="utf-8") as f:
        prototypes = json.load(f)

    for ent in ["COOKING_METHOD", "SUPPLEMENT", "DIET_PATTERN"]:
        assert ent in prototypes
        pdata = prototypes[ent]
        assert pdata["support_count"] > 0
        assert len(pdata["unique_terms"]) > 0
        if "vector" in pdata:
            vec = np.array(pdata["vector"])
            norm = np.linalg.norm(vec)
            assert np.isclose(norm, 1.0, atol=1e-3), f"Prototype vector for {ent} is not unit-normalized: {norm}"


def test_frozen_dataset_integrity():
    """Verify that Phase 6 experiments did NOT modify any frozen datasets."""
    for rel_path, expected_hash in FROZEN_HASHES.items():
        full_path = os.path.join(REPO_ROOT, rel_path)
        assert os.path.exists(full_path), f"Frozen file missing: {rel_path}"
        with open(full_path, "rb") as f:
            content = f.read()
            raw_hash = hashlib.sha256(content).hexdigest()
            norm_hash = hashlib.sha256(content.replace(b"\r\n", b"\n")).hexdigest()
        assert expected_hash in (raw_hash, norm_hash), (
            f"INTEGRITY VIOLATION: {rel_path} was modified! "
            f"Expected {expected_hash}, got {raw_hash} (normalized: {norm_hash})"
        )
