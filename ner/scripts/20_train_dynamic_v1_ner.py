"""
Phase 5: Dynamic 13-Entity NER Training & Retention Evaluation Engine
=====================================================================
1. Loads augmented 13-entity dataset from ner/data/dynamic_v1/
2. Trains FastAveragedSequencePerceptron across 13 entity classes (27 BIO tags)
3. Evaluates overall and per-entity metrics on test split
4. Compares retention against baseline Schema v2 10-entity performance (Delta-F1)
5. Saves model weights and metadata to ner/models/dynamic_v1/
6. Generates full evaluation report ner/reports/phase5_dynamic_ner_training_results.md
"""

import os
import sys
import json
import random
from collections import defaultdict, Counter

sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
random.seed(42)


def load_jsonl(path: str):
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def extract_features(tokens: list, i: int, prev_tag: str):
    w = tokens[i]
    w_low = w.lower()
    feats = [
        "BIAS",
        f"w={w_low}",
        f"is_title={w.istitle()}",
        f"is_upper={w.isupper()}",
        f"is_digit={w.isdigit()}",
        f"has_hyphen={'-' in w}",
        f"len={min(len(w), 12)}",
        f"pref2={w_low[:2]}",
        f"pref3={w_low[:3]}",
        f"suff2={w_low[-2:]}",
        f"suff3={w_low[-3:]}",
        f"prev_tag={prev_tag}"
    ]
    if i > 0:
        p = tokens[i - 1].lower()
        feats.append(f"prev_w={p}")
        feats.append(f"bigram_prev={p}_{w_low}")
    else:
        feats.append("BOS")
    if i < len(tokens) - 1:
        n = tokens[i + 1].lower()
        feats.append(f"next_w={n}")
        feats.append(f"bigram_next={w_low}_{n}")
    else:
        feats.append("EOS")
    return feats


def extract_spans_from_bio(bio_tags: list):
    spans = []
    curr_label = None
    curr_start = None
    for i, tag in enumerate(bio_tags):
        if tag.startswith("B-"):
            if curr_label is not None:
                spans.append((curr_start, i, curr_label))
            curr_label = tag[2:]
            curr_start = i
        elif tag.startswith("I-"):
            tag_type = tag[2:]
            if curr_label == tag_type:
                continue
            else:
                if curr_label is not None:
                    spans.append((curr_start, i, curr_label))
                curr_label = tag_type
                curr_start = i
        else:
            if curr_label is not None:
                spans.append((curr_start, i, curr_label))
                curr_label = None
                curr_start = None
    if curr_label is not None:
        spans.append((curr_start, len(bio_tags), curr_label))
    return spans


LABELS_13 = [
    "O",
    # 10 Frozen baseline entities
    "B-FOOD", "I-FOOD",
    "B-NUTRIENT", "I-NUTRIENT",
    "B-HEALTH_CONDITION", "I-HEALTH_CONDITION",
    "B-ALLERGEN", "I-ALLERGEN",
    "B-AGE_GROUP", "I-AGE_GROUP",
    "B-MEAL_TYPE", "I-MEAL_TYPE",
    "B-GROWTH_METRIC", "I-GROWTH_METRIC",
    "B-FOOD_GROUP", "I-FOOD_GROUP",
    "B-DIETARY_PROPERTY", "I-DIETARY_PROPERTY",
    "B-FEEDING_METHOD", "I-FEEDING_METHOD",
    # 3 Dynamic entities
    "B-COOKING_METHOD", "I-COOKING_METHOD",
    "B-SUPPLEMENT", "I-SUPPLEMENT",
    "B-DIET_PATTERN", "I-DIET_PATTERN"
]

ALL_ENTITY_CLASSES = [
    "FOOD", "NUTRIENT", "HEALTH_CONDITION", "ALLERGEN", "AGE_GROUP",
    "MEAL_TYPE", "GROWTH_METRIC", "FOOD_GROUP", "DIETARY_PROPERTY",
    "FEEDING_METHOD", "COOKING_METHOD", "SUPPLEMENT", "DIET_PATTERN"
]

ORIGINAL_10_CLASSES = [
    "FOOD", "NUTRIENT", "HEALTH_CONDITION", "ALLERGEN", "AGE_GROUP",
    "MEAL_TYPE", "GROWTH_METRIC", "FOOD_GROUP", "DIETARY_PROPERTY",
    "FEEDING_METHOD"
]

DYNAMIC_3_CLASSES = [
    "COOKING_METHOD", "SUPPLEMENT", "DIET_PATTERN"
]


class DynamicSequencePerceptron:
    def __init__(self, labels: list, epochs: int = 8):
        self.labels = labels
        self.epochs = epochs
        self.weights = defaultdict(lambda: defaultdict(float))
        self._totals = defaultdict(lambda: defaultdict(float))
        self._tstamps = defaultdict(lambda: defaultdict(int))
        self.step = 0

    def predict(self, tokens: list):
        preds = []
        prev_tag = "O"
        for i in range(len(tokens)):
            feats = extract_features(tokens, i, prev_tag)
            scores = defaultdict(float)
            for f in feats:
                if f in self.weights:
                    for lbl, w in self.weights[f].items():
                        scores[lbl] += w
            if not scores:
                best_label = "O"
            else:
                valid_candidates = []
                for lbl in self.labels:
                    sc = scores[lbl]
                    if lbl.startswith("I-"):
                        needed = lbl[2:]
                        if prev_tag != f"B-{needed}" and prev_tag != f"I-{needed}":
                            sc -= 100.0
                    valid_candidates.append((sc, lbl))
                best_label = max(valid_candidates)[1]
            preds.append(best_label)
            prev_tag = best_label
        return preds

    def fit(self, dataset: list):
        print(f"Training DynamicSequencePerceptron for {self.epochs} epochs over {len(dataset)} examples...")
        for epoch in range(1, self.epochs + 1):
            shuffled = list(dataset)
            random.shuffle(shuffled)
            mistakes = 0
            total_tokens = 0
            for item in shuffled:
                tokens = item["tokens"]
                gold_tags = item["bio_tags"]
                prev_tag = "O"
                for i in range(len(tokens)):
                    self.step += 1
                    total_tokens += 1
                    gold = gold_tags[i]
                    feats = extract_features(tokens, i, prev_tag)
                    scores = defaultdict(float)
                    for f in feats:
                        if f in self.weights:
                            for lbl, w in self.weights[f].items():
                                scores[lbl] += w
                    valid_candidates = []
                    for lbl in self.labels:
                        sc = scores[lbl]
                        if lbl.startswith("I-"):
                            needed = lbl[2:]
                            if prev_tag != f"B-{needed}" and prev_tag != f"I-{needed}":
                                sc -= 100.0
                        valid_candidates.append((sc, lbl))
                    pred = max(valid_candidates)[1]
                    if pred != gold:
                        mistakes += 1
                        for f in feats:
                            self._totals[f][gold] += (self.step - self._tstamps[f][gold]) * self.weights[f][gold]
                            self._tstamps[f][gold] = self.step
                            self.weights[f][gold] += 1.0
                            self._totals[f][pred] += (self.step - self._tstamps[f][pred]) * self.weights[f][pred]
                            self._tstamps[f][pred] = self.step
                            self.weights[f][pred] -= 1.0
                    prev_tag = gold
            tok_err = (mistakes / total_tokens * 100) if total_tokens > 0 else 0
            print(f"  Epoch {epoch}/{self.epochs} completed — Token error rate: {tok_err:.2f}% ({mistakes}/{total_tokens})")

        # Average weights across training trajectory
        for f, lbl_dict in self.weights.items():
            for lbl, w in lbl_dict.items():
                self._totals[f][lbl] += (self.step - self._tstamps[f][lbl]) * w
                self.weights[f][lbl] = self._totals[f][lbl] / self.step
        print("Training complete. Averaged weights computed.")


def evaluate_ner(model: DynamicSequencePerceptron, dataset: list):
    per_class_tp = Counter()
    per_class_fp = Counter()
    per_class_fn = Counter()
    per_class_sup = Counter()

    for item in dataset:
        toks = item["tokens"]
        gold_bio = item["bio_tags"]
        pred_bio = model.predict(toks)
        gold_spans = set(extract_spans_from_bio(gold_bio))
        pred_spans = set(extract_spans_from_bio(pred_bio))

        for g in gold_spans:
            per_class_sup[g[2]] += 1
            if g in pred_spans:
                per_class_tp[g[2]] += 1
            else:
                per_class_fn[g[2]] += 1
        for p in pred_spans:
            if p not in gold_spans:
                per_class_fp[p[2]] += 1

    tot_tp = sum(per_class_tp.values())
    tot_fp = sum(per_class_fp.values())
    tot_fn = sum(per_class_fn.values())

    micro_p = (tot_tp / (tot_tp + tot_fp) * 100) if (tot_tp + tot_fp) > 0 else 0.0
    micro_r = (tot_tp / (tot_tp + tot_fn) * 100) if (tot_tp + tot_fn) > 0 else 0.0
    micro_f1 = (2 * micro_p * micro_r / (micro_p + micro_r)) if (micro_p + micro_r) > 0 else 0.0

    class_metrics = {}
    f1_list_all = []
    f1_list_original = []
    f1_list_dynamic = []

    for lbl in ALL_ENTITY_CLASSES:
        tp = per_class_tp[lbl]
        fp = per_class_fp[lbl]
        fn = per_class_fn[lbl]
        sup = per_class_sup[lbl]
        p = (tp / (tp + fp) * 100) if (tp + fp) > 0 else 0.0
        r = (tp / (tp + fn) * 100) if (tp + fn) > 0 else 0.0
        f1 = (2 * p * r / (p + r)) if (p + r) > 0 else 0.0

        if sup > 0:
            f1_list_all.append(f1)
            if lbl in ORIGINAL_10_CLASSES:
                f1_list_original.append(f1)
            elif lbl in DYNAMIC_3_CLASSES:
                f1_list_dynamic.append(f1)

        class_metrics[lbl] = {
            "Precision": round(p, 2),
            "Recall": round(r, 2),
            "F1": round(f1, 2),
            "Support": sup,
            "TP": tp,
            "FP": fp,
            "FN": fn
        }

    macro_f1_all = sum(f1_list_all) / len(f1_list_all) if f1_list_all else 0.0
    macro_f1_orig = sum(f1_list_original) / len(f1_list_original) if f1_list_original else 0.0
    macro_f1_dyn = sum(f1_list_dynamic) / len(f1_list_dynamic) if f1_list_dynamic else 0.0

    return {
        "Micro_P": round(micro_p, 2),
        "Micro_R": round(micro_r, 2),
        "Micro_F1": round(micro_f1, 2),
        "Macro_F1_All": round(macro_f1_all, 2),
        "Macro_F1_Original10": round(macro_f1_orig, 2),
        "Macro_F1_Dynamic3": round(macro_f1_dyn, 2),
        "Nutrient_F1": class_metrics["NUTRIENT"]["F1"],
        "Class_Metrics": class_metrics
    }


def run_dynamic_v1_training():
    print("=" * 75)
    print("  PHASE 5: DYNAMIC 13-ENTITY NER MODEL TRAINING & EVALUATION")
    print("=" * 75)

    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    data_dir = os.path.join(repo_root, "ner", "data", "dynamic_v1")
    model_dir = os.path.join(repo_root, "ner", "models", "dynamic_v1")
    v2_meta_path = os.path.join(repo_root, "ner", "models", "nutribite_ner_v2", "model_metadata.json")

    train_data = load_jsonl(os.path.join(data_dir, "train.jsonl"))
    val_data = load_jsonl(os.path.join(data_dir, "validation.jsonl"))
    test_data = load_jsonl(os.path.join(data_dir, "test.jsonl"))

    print(f"Loaded dynamic_v1 partitions:")
    print(f"  Train:      {len(train_data)} sentences")
    print(f"  Validation: {len(val_data)} sentences")
    print(f"  Test:       {len(test_data)} sentences")

    # Load baseline Schema v2 results for retention comparison
    baseline_metrics = {}
    if os.path.exists(v2_meta_path):
        with open(v2_meta_path, "r", encoding="utf-8") as f:
            v2_meta = json.load(f)
            baseline_metrics = v2_meta.get("metrics", {})
        print(f"Loaded Schema v2 baseline: Micro-F1={baseline_metrics.get('Micro_F1')}%, Macro-F1={baseline_metrics.get('Macro_F1')}%")

    # Instantiate and fit model
    model = DynamicSequencePerceptron(labels=LABELS_13, epochs=8)
    model.fit(train_data)

    # Evaluate on Validation and Test splits
    print("\nEvaluating on Validation Set...")
    val_eval = evaluate_ner(model, val_data)
    print(f"  Validation -> Micro-F1: {val_eval['Micro_F1']}% | Macro-F1: {val_eval['Macro_F1_All']}%")

    print("\nEvaluating on Test Set...")
    test_eval = evaluate_ner(model, test_data)
    print(f"  Test -> Micro-P: {test_eval['Micro_P']}% | Micro-R: {test_eval['Micro_R']}% | Micro-F1: {test_eval['Micro_F1']}% | Macro-F1: {test_eval['Macro_F1_All']}%")

    # Compute retention table
    retention_table = []
    base_class_metrics = baseline_metrics.get("Class_Metrics", {})
    for lbl in ORIGINAL_10_CLASSES:
        dyn_f1 = test_eval["Class_Metrics"][lbl]["F1"]
        base_f1 = base_class_metrics.get(lbl, {}).get("F1", 0.0)
        delta_f1 = round(dyn_f1 - base_f1, 2)
        retention_ratio = round((dyn_f1 / base_f1 * 100), 2) if base_f1 > 0 else 100.0
        retention_table.append({
            "Entity": lbl,
            "Baseline_F1": base_f1,
            "Dynamic_F1": dyn_f1,
            "Delta_F1": delta_f1,
            "Retention_Pct": retention_ratio,
            "Support": test_eval["Class_Metrics"][lbl]["Support"]
        })

    # Save model metadata and weights
    os.makedirs(model_dir, exist_ok=True)
    metadata = {
        "schema_version": "2.1.0",
        "model_name": "nutribite_dynamic_perceptron_v1",
        "architecture": "Structured Averaged Sequence Perceptron with BIO Transition Constraints",
        "num_classes": 13,
        "labels": LABELS_13,
        "epochs": 8,
        "seed": 42,
        "baseline_comparison": {
            "baseline_micro_f1": baseline_metrics.get("Micro_F1"),
            "dynamic_micro_f1": test_eval["Micro_F1"],
            "delta_micro_f1": round(test_eval["Micro_F1"] - baseline_metrics.get("Micro_F1", 0.0), 2),
            "baseline_macro_f1": baseline_metrics.get("Macro_F1"),
            "dynamic_macro_f1": test_eval["Macro_F1_All"],
            "delta_macro_f1": round(test_eval["Macro_F1_All"] - baseline_metrics.get("Macro_F1", 0.0), 2),
            "baseline_nutrient_f1": baseline_metrics.get("Nutrient_F1"),
            "dynamic_nutrient_f1": test_eval["Nutrient_F1"],
            "delta_nutrient_f1": round(test_eval["Nutrient_F1"] - baseline_metrics.get("Nutrient_F1", 0.0), 2)
        },
        "test_metrics": test_eval,
        "validation_metrics": val_eval,
        "retention_analysis": retention_table
    }

    meta_save_path = os.path.join(model_dir, "model_metadata.json")
    with open(meta_save_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    print(f"\nSaved model metadata to: {meta_save_path}")

    # Serialize weights
    weights_dict = {f: dict(lbls) for f, lbls in model.weights.items()}
    weights_save_path = os.path.join(model_dir, "weights.json")
    with open(weights_save_path, "w", encoding="utf-8") as f:
        json.dump(weights_dict, f, ensure_ascii=False)
    print(f"Saved model weights to: {weights_save_path} ({len(weights_dict)} active features)")

    # Print summary tables to stdout
    print("\n" + "=" * 75)
    print("  DYNAMIC 13-ENTITY TEST EVALUATION RESULTS")
    print("=" * 75)
    print(f"Overall Metrics: Micro-P={test_eval['Micro_P']}% | Micro-R={test_eval['Micro_R']}% | Micro-F1={test_eval['Micro_F1']}% | Macro-F1={test_eval['Macro_F1_All']}%")
    print(f"Flagship NUTRIENT F1: {test_eval['Nutrient_F1']}% (Baseline: {baseline_metrics.get('Nutrient_F1')}%)")
    print("\nDYNAMIC ENTITIES PERFORMANCE:")
    for dyn in DYNAMIC_3_CLASSES:
        m = test_eval["Class_Metrics"][dyn]
        print(f"  {dyn:18s} | P: {m['Precision']:6.2f}% | R: {m['Recall']:6.2f}% | F1: {m['F1']:6.2f}% | Support: {m['Support']}")

    print("\nOLD-ENTITY RETENTION & DELTA-F1:")
    for row in retention_table:
        sign = "+" if row["Delta_F1"] >= 0 else ""
        print(f"  {row['Entity']:18s} | Base F1: {row['Baseline_F1']:6.2f}% | Dyn F1: {row['Dynamic_F1']:6.2f}% | Delta: {sign}{row['Delta_F1']:5.2f}% | Support: {row['Support']}")

    return metadata


if __name__ == "__main__":
    run_dynamic_v1_training()
