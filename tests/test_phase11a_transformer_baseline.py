"""
Test Suite for Phase 11A: Transformer NER Baseline
==================================================
Tests:
1. Dataset integrity (splits, record counts, schemas)
2. BIO conversion (span extraction round-trip, tag validity)
3. Label mapping (27 BIO labels, 13 entity classes, bijective id mapping)
4. Train/test leakage (zero sentence overlap between splits)
5. Model loading (AutoTokenizer & AutoModelForTokenClassification loadable)
6. Prediction shape (logits shape matches [1, seq_len, 27])
7. Metric consistency (Micro F1, Precision, Recall mathematical alignment)
8. Per-entity metric consistency (all 13 classes evaluated with valid support)
9. Artifact existence (models, configs, tokenizers, metadata, benchmarks, reports)
10. Frozen dataset integrity (SHA-256 hash preservation for Phase 0-10 data)
"""

import os
import json
import hashlib
import pytest
import torch
from transformers import AutoTokenizer, AutoModelForTokenClassification

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

EXPECTED_13_CLASSES = {
    "FOOD", "NUTRIENT", "HEALTH_CONDITION", "ALLERGEN", "AGE_GROUP",
    "MEAL_TYPE", "GROWTH_METRIC", "FOOD_GROUP", "DIETARY_PROPERTY",
    "FEEDING_METHOD", "COOKING_METHOD", "SUPPLEMENT", "DIET_PATTERN"
}

EXPECTED_DYNAMIC_ENTITIES = {"COOKING_METHOD", "DIET_PATTERN", "SUPPLEMENT"}


def load_jsonl(path: str):
    with open(path, "r", encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def extract_spans_from_bio(bio_tags):
    spans = []
    current_label = None
    start = -1
    for i, tag in enumerate(bio_tags):
        if tag.startswith("B-"):
            if current_label is not None:
                spans.append((start, i, current_label))
            current_label = tag[2:]
            start = i
        elif tag.startswith("I-"):
            if current_label is not None and tag[2:] == current_label:
                continue
            else:
                if current_label is not None:
                    spans.append((start, i, current_label))
                current_label = tag[2:]
                start = i
        else:
            if current_label is not None:
                spans.append((start, i, current_label))
                current_label = None
                start = -1
    if current_label is not None:
        spans.append((start, len(bio_tags), current_label))
    return spans


# ==============================================================================
# TEST 1: Dataset Integrity
# ==============================================================================
def test_dataset_integrity():
    """Verify that dataset splits exist, have exact expected sizes, and match expected schema."""
    data_dir = os.path.join(REPO_ROOT, "ner", "data", "dynamic_v1")
    train_path = os.path.join(data_dir, "train.jsonl")
    val_path = os.path.join(data_dir, "validation.jsonl")
    test_path = os.path.join(data_dir, "test.jsonl")

    assert os.path.isfile(train_path), "train.jsonl missing"
    assert os.path.isfile(val_path), "validation.jsonl missing"
    assert os.path.isfile(test_path), "test.jsonl missing"

    train_data = load_jsonl(train_path)
    val_data = load_jsonl(val_path)
    test_data = load_jsonl(test_path)

    assert len(train_data) == 1223, f"Expected 1223 train records, got {len(train_data)}"
    assert len(val_data) == 262, f"Expected 262 val records, got {len(val_data)}"
    assert len(test_data) == 263, f"Expected 263 test records, got {len(test_data)}"

    for split_name, dataset in [("train", train_data), ("val", val_data), ("test", test_data)]:
        for i, row in enumerate(dataset):
            assert "tokens" in row, f"Missing 'tokens' in {split_name} row {i}"
            assert "bio_tags" in row, f"Missing 'bio_tags' in {split_name} row {i}"
            assert len(row["tokens"]) == len(row["bio_tags"]), (
                f"Mismatch in {split_name} row {i}: {len(row['tokens'])} tokens vs {len(row['bio_tags'])} tags"
            )


# ==============================================================================
# TEST 2: BIO Conversion
# ==============================================================================
def test_bio_conversion():
    """Verify BIO tag parsing to span annotations and round-trip consistency."""
    sample_tags = ["O", "B-FOOD", "I-FOOD", "O", "B-NUTRIENT", "O", "B-COOKING_METHOD"]
    spans = extract_spans_from_bio(sample_tags)
    assert spans == [(1, 3, "FOOD"), (4, 5, "NUTRIENT"), (6, 7, "COOKING_METHOD")]

    # Check across held-out test set
    test_path = os.path.join(REPO_ROOT, "ner", "data", "dynamic_v1", "test.jsonl")
    test_data = load_jsonl(test_path)
    total_spans = 0
    for row in test_data:
        extracted = extract_spans_from_bio(row["bio_tags"])
        total_spans += len(extracted)
        for st, end, lbl in extracted:
            assert st < end
            assert lbl in EXPECTED_13_CLASSES
    assert total_spans > 0, "No spans extracted from test dataset"


# ==============================================================================
# TEST 3: Label Mapping
# ==============================================================================
def test_label_mapping():
    """Verify 13 entity classes, 27 BIO labels, and bijective mapping consistency."""
    meta_path = os.path.join(REPO_ROOT, "ner", "models", "transformer_baseline_v1", "model_metadata.json")
    config_path = os.path.join(REPO_ROOT, "ner", "models", "transformer_baseline_v1", "model", "config.json")
    assert os.path.isfile(meta_path), "model_metadata.json missing"
    assert os.path.isfile(config_path), "config.json missing"

    with open(meta_path, "r", encoding="utf-8") as f:
        meta = json.load(f)
    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)

    assert meta["num_classes"] == 13
    assert len(meta["labels"]) == 27
    assert meta["labels"][0] == "O"

    entity_classes = {lbl.split("-")[1] for lbl in meta["labels"] if "-" in lbl}
    assert entity_classes == EXPECTED_13_CLASSES

    id2label = config["id2label"]
    label2id = config["label2id"]
    assert len(id2label) == 27
    assert len(label2id) == 27

    for lbl, idx in label2id.items():
        assert id2label[str(idx)] == lbl


# ==============================================================================
# TEST 4: Train/Test Leakage
# ==============================================================================
def test_train_test_leakage():
    """Verify zero sentence text leakage between train and test partitions."""
    data_dir = os.path.join(REPO_ROOT, "ner", "data", "dynamic_v1")
    train_data = load_jsonl(os.path.join(data_dir, "train.jsonl"))
    test_data = load_jsonl(os.path.join(data_dir, "test.jsonl"))

    train_sentences = {" ".join(r["tokens"]).strip().lower() for r in train_data}
    test_sentences = {" ".join(r["tokens"]).strip().lower() for r in test_data}

    overlap = train_sentences.intersection(test_sentences)
    assert len(overlap) == 0, f"Found {len(overlap)} overlapping sentences between train and test!"


# ==============================================================================
# TEST 5: Model Loading
# ==============================================================================
def test_model_loading():
    """Verify that the fine-tuned Transformer model and tokenizer load successfully."""
    model_dir = os.path.join(REPO_ROOT, "ner", "models", "transformer_baseline_v1", "model")
    tok_dir = os.path.join(REPO_ROOT, "ner", "models", "transformer_baseline_v1", "tokenizer")

    assert os.path.isdir(model_dir), "Model directory does not exist"
    assert os.path.isdir(tok_dir), "Tokenizer directory does not exist"

    tokenizer = AutoTokenizer.from_pretrained(tok_dir)
    model = AutoModelForTokenClassification.from_pretrained(model_dir)

    assert tokenizer is not None
    assert model is not None
    assert model.num_labels == 27


# ==============================================================================
# TEST 6: Prediction Shape
# ==============================================================================
def test_prediction_shape():
    """Verify model forward pass produces valid tensor shape [batch_size, seq_len, 27]."""
    model_dir = os.path.join(REPO_ROOT, "ner", "models", "transformer_baseline_v1", "model")
    tok_dir = os.path.join(REPO_ROOT, "ner", "models", "transformer_baseline_v1", "tokenizer")

    tokenizer = AutoTokenizer.from_pretrained(tok_dir)
    model = AutoModelForTokenClassification.from_pretrained(model_dir)
    model.eval()

    test_tokens = ["Steamed", "carrots", "provide", "vitamin", "A", "for", "infants", "."]
    encoding = tokenizer(
        test_tokens,
        is_split_into_words=True,
        return_tensors="pt"
    )

    with torch.no_grad():
        outputs = model(**encoding)

    logits = outputs.logits
    assert logits.dim() == 3
    assert logits.shape[0] == 1
    assert logits.shape[1] == encoding["input_ids"].shape[1]
    assert logits.shape[2] == 27


# ==============================================================================
# TEST 7: Metric Consistency
# ==============================================================================
def test_metric_consistency():
    """Verify overall metric validity and mathematical consistency of Precision, Recall, and F1."""
    report_json_path = os.path.join(REPO_ROOT, "ner", "reports", "phase11a_transformer_baseline_results.json")
    assert os.path.isfile(report_json_path), "phase11a_transformer_baseline_results.json missing"

    with open(report_json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    test_res = data["test_metrics"]
    p = test_res["Micro_P"]
    r = test_res["Micro_R"]
    f1 = test_res["Micro_F1"]
    macro_f1 = test_res["Macro_F1"]

    assert 0.0 <= p <= 100.0
    assert 0.0 <= r <= 100.0
    assert 0.0 <= f1 <= 100.0
    assert 0.0 <= macro_f1 <= 100.0

    if (p + r) > 0:
        expected_f1 = round((2 * p * r) / (p + r), 2)
        assert abs(f1 - expected_f1) <= 0.1, f"Micro F1 ({f1}) does not match 2PR/(P+R) ({expected_f1})"


# ==============================================================================
# TEST 8: Per-Entity Metric Consistency
# ==============================================================================
def test_per_entity_metric_consistency():
    """Verify all 13 entity classes and dynamic entities have consistent metrics and non-negative support."""
    report_json_path = os.path.join(REPO_ROOT, "ner", "reports", "phase11a_transformer_baseline_results.json")
    with open(report_json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    class_metrics = data["test_metrics"]["Class_Metrics"]
    assert len(class_metrics) == 13
    assert set(class_metrics.keys()) == EXPECTED_13_CLASSES

    for entity, metrics in class_metrics.items():
        assert "Precision" in metrics
        assert "Recall" in metrics
        assert "F1" in metrics
        assert "Support" in metrics
        assert metrics["Support"] >= 0

    dynamic_entities = data["test_metrics"]["Dynamic_Entities"]
    assert set(dynamic_entities.keys()) == EXPECTED_DYNAMIC_ENTITIES
    for dyn_entity, metrics in dynamic_entities.items():
        assert metrics["Support"] >= 0
        assert metrics["F1"] >= 0.0


# ==============================================================================
# TEST 9: Artifact Existence
# ==============================================================================
def test_artifact_existence():
    """Verify that all Phase 11A required artifacts exist."""
    required_paths = [
        "ner/scripts/27_transformer_ner_baseline.py",
        "ner/models/transformer_baseline_v1/model/config.json",
        "ner/models/transformer_baseline_v1/tokenizer/tokenizer_config.json",
        "ner/models/transformer_baseline_v1/model_metadata.json",
        "ner/models/transformer_baseline_v1/benchmark_results.json",
        "ner/reports/phase11a_transformer_baseline_results.md",
        "ner/reports/phase11a_transformer_baseline_results.json",
        "tests/test_phase11a_transformer_baseline.py"
    ]

    for rel_path in required_paths:
        full_path = os.path.join(REPO_ROOT, rel_path)
        assert os.path.exists(full_path), f"Required artifact missing: {rel_path}"


# ==============================================================================
# TEST 10: Frozen Dataset Integrity
# ==============================================================================
def test_frozen_dataset_integrity():
    """Verify SHA-256 hashes of all frozen datasets to guarantee zero unintended mutations."""
    for rel_path, expected_hash in FROZEN_HASHES.items():
        full_path = os.path.join(REPO_ROOT, rel_path)
        assert os.path.exists(full_path), f"Frozen dataset missing: {rel_path}"
        with open(full_path, "rb") as f:
            actual_hash = hashlib.sha256(f.read()).hexdigest()
        assert actual_hash == expected_hash, (
            f"Frozen dataset mutated! {rel_path}\nExpected: {expected_hash}\nActual:   {actual_hash}"
        )
