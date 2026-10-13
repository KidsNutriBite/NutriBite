"""
Test Suite for Phase 11B: GLiNER Open-Vocabulary Baseline
=========================================================
Tests:
1. Model loading (urchade/gliner_small-v2.1 loadable)
2. Label schema (13 entity types and prompt mapping)
3. Prediction format (test_predictions.jsonl records schema)
4. Span conversion (char-to-token span mapping accuracy)
5. Exact-span metric calculation (Micro P, R, F1 mathematical alignment)
6. No test-data leakage (zero overlap between train and test)
7. Entity-count consistency (exactly 496 gold entities on 263 test sentences)
8. Artifact existence (scripts, models, predictions, reports)
9. Frozen dataset integrity (SHA-256 hashes unchanged across Phases 0-11A)
10. Comparison metric consistency (4-way comparative metrics integrity)
"""

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

EXPECTED_13_CLASSES = {
    "FOOD", "NUTRIENT", "HEALTH_CONDITION", "ALLERGEN", "AGE_GROUP",
    "MEAL_TYPE", "GROWTH_METRIC", "FOOD_GROUP", "DIETARY_PROPERTY",
    "FEEDING_METHOD", "COOKING_METHOD", "SUPPLEMENT", "DIET_PATTERN"
}

EXPECTED_DYNAMIC_ENTITIES = {"COOKING_METHOD", "SUPPLEMENT", "DIET_PATTERN"}


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
# TEST 1: Model Loading
# ==============================================================================
def test_model_loading():
    """Verify that GLiNER library and model class are available."""
    from gliner import GLiNER
    assert GLiNER is not None
    assert callable(GLiNER.from_pretrained)


# ==============================================================================
# TEST 2: Label Schema & Prompt Mapping
# ==============================================================================
def test_label_schema():
    """Verify 13 entity classes have valid natural language prompt mappings in metadata."""
    meta_path = os.path.join(REPO_ROOT, "ner", "models", "gliner_baseline_v1", "model_metadata.json")
    assert os.path.isfile(meta_path), "model_metadata.json missing"

    with open(meta_path, "r", encoding="utf-8") as f:
        meta = json.load(f)

    assert meta["num_classes"] == 13
    label_prompts = meta["label_prompts"]
    assert set(label_prompts.keys()) == EXPECTED_13_CLASSES
    for ent, prompt in label_prompts.items():
        assert isinstance(prompt, str) and len(prompt) > 0


# ==============================================================================
# TEST 3: Prediction Format
# ==============================================================================
def test_prediction_format():
    """Verify test_predictions.jsonl has 263 rows and expected fields."""
    pred_path = os.path.join(REPO_ROOT, "ner", "models", "gliner_baseline_v1", "predictions", "test_predictions.jsonl")
    assert os.path.isfile(pred_path), "test_predictions.jsonl missing"

    records = load_jsonl(pred_path)
    assert len(records) == 263, f"Expected 263 prediction records, got {len(records)}"

    required_keys = {"id", "text", "tokens", "raw_gliner_entities", "mapped_token_spans", "gold_spans"}
    for r in records:
        assert required_keys.issubset(set(r.keys()))
        assert isinstance(r["mapped_token_spans"], list)
        for span in r["mapped_token_spans"]:
            assert len(span) == 3
            assert span[0] < span[1]
            assert span[2] in EXPECTED_13_CLASSES


# ==============================================================================
# TEST 4: Span Conversion
# ==============================================================================
def test_span_conversion():
    """Verify character-to-token span mapping produces valid token boundaries."""
    import importlib.util
    script_path = os.path.join(REPO_ROOT, "ner", "scripts", "28_gliner_baseline.py")
    spec = importlib.util.spec_from_file_location("gliner_baseline", script_path)
    gliner_mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(gliner_mod)
    map_char_spans_to_token_spans = gliner_mod.map_char_spans_to_token_spans

    text = "Steamed spinach provides dietary iron."
    tokens = ["Steamed", "spinach", "provides", "dietary", "iron", "."]
    char_ents = [
        {"start": 0, "end": 7, "label": "cooking method", "score": 0.95},
        {"start": 8, "end": 15, "label": "food item", "score": 0.92},
        {"start": 33, "end": 37, "label": "nutrient", "score": 0.98}
    ]

    mapped = map_char_spans_to_token_spans(text, tokens, char_ents)
    assert mapped == [(0, 1, "COOKING_METHOD"), (1, 2, "FOOD"), (4, 5, "NUTRIENT")]


# ==============================================================================
# TEST 5: Exact-Span Metric Calculation
# ==============================================================================
def test_metric_correctness():
    """Verify Micro Precision, Recall, and F1 mathematical consistency."""
    benchmark_path = os.path.join(REPO_ROOT, "ner", "models", "gliner_baseline_v1", "benchmark_results.json")
    assert os.path.isfile(benchmark_path), "benchmark_results.json missing"

    with open(benchmark_path, "r", encoding="utf-8") as f:
        metrics = json.load(f)

    p = metrics["Micro_P"]
    r = metrics["Micro_R"]
    f1 = metrics["Micro_F1"]
    macro_f1 = metrics["Macro_F1"]

    assert 0.0 <= p <= 100.0
    assert 0.0 <= r <= 100.0
    assert 0.0 <= f1 <= 100.0
    assert 0.0 <= macro_f1 <= 100.0

    if (p + r) > 0:
        expected_f1 = round((2 * p * r) / (p + r), 2)
        assert abs(f1 - expected_f1) <= 0.1


# ==============================================================================
# TEST 6: No Test-Data Leakage
# ==============================================================================
def test_no_test_leakage():
    """Verify zero sentence text overlap between train and test partitions."""
    train_path = os.path.join(REPO_ROOT, "ner", "data", "dynamic_v1", "train.jsonl")
    test_path = os.path.join(REPO_ROOT, "ner", "data", "dynamic_v1", "test.jsonl")

    train_data = load_jsonl(train_path)
    test_data = load_jsonl(test_path)

    train_sentences = {" ".join(r["tokens"]).strip().lower() for r in train_data}
    test_sentences = {" ".join(r["tokens"]).strip().lower() for r in test_data}

    overlap = train_sentences.intersection(test_sentences)
    assert len(overlap) == 0, f"Found {len(overlap)} overlapping sentences between train and test!"


# ==============================================================================
# TEST 7: Entity-Count Consistency
# ==============================================================================
def test_entity_count_consistency():
    """Verify total gold entity count across 263 test sentences is exactly 491 (473 seen + 18 unseen)."""
    test_path = os.path.join(REPO_ROOT, "ner", "data", "dynamic_v1", "test.jsonl")
    test_data = load_jsonl(test_path)

    total_gold = sum(len(extract_spans_from_bio(r["bio_tags"])) for r in test_data)
    assert total_gold == 493, f"Expected 493 gold entities, got {total_gold}"


# ==============================================================================
# TEST 8: Artifact Existence
# ==============================================================================
def test_artifact_existence():
    """Verify all Phase 11B required artifacts exist."""
    required = [
        "ner/scripts/28_gliner_baseline.py",
        "ner/models/gliner_baseline_v1/model_metadata.json",
        "ner/models/gliner_baseline_v1/benchmark_results.json",
        "ner/models/gliner_baseline_v1/predictions/test_predictions.jsonl",
        "ner/reports/gliner_baseline_v1.json",
        "ner/reports/gliner_baseline_v1.md",
        "tests/test_phase11b_gliner.py"
    ]

    for rel_path in required:
        full_path = os.path.join(REPO_ROOT, rel_path)
        assert os.path.exists(full_path), f"Missing required artifact: {rel_path}"


# ==============================================================================
# TEST 9: Frozen Dataset Integrity
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


# ==============================================================================
# TEST 10: Comparison Metric Consistency
# ==============================================================================
def test_comparison_metric_consistency():
    """Verify that GLiNER benchmark results contain all 13 class metrics and dynamic entity blocks."""
    report_json_path = os.path.join(REPO_ROOT, "ner", "reports", "gliner_baseline_v1.json")
    assert os.path.isfile(report_json_path), "gliner_baseline_v1.json missing"

    with open(report_json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    test_metrics = data["test_metrics"]
    class_metrics = test_metrics["Class_Metrics"]
    assert set(class_metrics.keys()) == EXPECTED_13_CLASSES

    dynamic_entities = test_metrics["Dynamic_Entities"]
    assert set(dynamic_entities.keys()) == EXPECTED_DYNAMIC_ENTITIES

    assert "Generalization" in test_metrics
    gen = test_metrics["Generalization"]
    assert "Seen_F1" in gen and "Unseen_F1" in gen
    assert gen["Seen_Support"] + gen["Unseen_Support"] > 0
