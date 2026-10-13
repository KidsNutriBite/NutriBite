"""
NutriBite NER — Phase 9: Independent Evaluation & Genuine Human-Gold Evaluation Engine
====================================================================================
Integrates with `ner/scripts/12_validate_human_gold.py`.
- Evaluates the Schema v2 (10-Class) Domain Sequence Model against:
  1. Silver Schema v2 Test Set (held-out leak-free partition)
  2. Adversarial Nutrient Challenge Suite (25 challenge sentences)
  3. Independent Human-Gold Evaluation Set (150 manually annotated gold sentences)
- Computes:
  - Exact-span Micro P/R/F1, Macro F1
  - Per-class P/R/F1/Support across all 10 schema classes
  - Flagship NUTRIENT metrics
  - Seen vs. Unseen Entity Generalization (Overall and NUTRIENT)
  - Comprehensive Error Taxonomy (Boundary, Type, Unseen, Ambiguity, Multi-word, New-Schema)
- Exports machine-readable results to `ner/reports/human_gold_evaluation_results.json`.

Run: python ner/scripts/11_evaluate_human_gold.py
"""

import os
import sys
import json
import re
import random
from collections import defaultdict, Counter

sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
random.seed(42)

# Import validator
import importlib.util
spec = importlib.util.spec_from_file_location("validate_human_gold_mod", "ner/scripts/12_validate_human_gold.py")
validate_mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validate_mod)
validate_human_gold = validate_mod.validate_human_gold

print("=" * 80)
print("  NUTRIBITE NER — PHASE 9 INDEPENDENT HUMAN-GOLD EVALUATION ENGINE (Schema v2.0)")
print("=" * 80)

def load_jsonl(path):
    if not os.path.exists(path):
        return []
    with open(path, 'r', encoding='utf-8') as f:
        return [json.loads(line) for line in f if line.strip()]

# ─────────────────────────────────────────────────────────────────────────────
# 1. LOAD DATASETS
# ─────────────────────────────────────────────────────────────────────────────
train_data     = load_jsonl('ner/data/schema_v2/train.jsonl')
val_data       = load_jsonl('ner/data/schema_v2/validation.jsonl')
test_data      = load_jsonl('ner/data/schema_v2/test.jsonl')
gold_data      = load_jsonl('ner/data/human_gold/human_gold.jsonl')
challenge_data = load_jsonl('ner/data/human_gold/nutrient_challenge.jsonl')

print(f"\n[DATASET OVERVIEW]")
print(f"  Train Set (Schema v2 Silver) : {len(train_data)} sentences")
print(f"  Val Set (Schema v2 Silver)   : {len(val_data)} sentences")
print(f"  Test Set (Schema v2 Silver)  : {len(test_data)} sentences")
print(f"  Human-Gold Benchmark (Gold)  : {len(gold_data)} sentences")
print(f"  Nutrient Challenge Set       : {len(challenge_data)} sentences")

# ─────────────────────────────────────────────────────────────────────────────
# 2. SEQUENCE MODEL ARCHITECTURE & TRAINING
# ─────────────────────────────────────────────────────────────────────────────
def extract_features(tokens, i, prev_tag):
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

schema_v2_classes = [
    "FOOD",
    "NUTRIENT",
    "HEALTH_CONDITION",
    "ALLERGEN",
    "AGE_GROUP",
    "MEAL_TYPE",
    "GROWTH_METRIC",
    "FOOD_GROUP",
    "DIETARY_PROPERTY",
    "FEEDING_METHOD"
]

labels = ["O"]
for c in schema_v2_classes:
    labels.extend([f"B-{c}", f"I-{c}"])

class AveragedSequencePerceptron:
    def __init__(self, labels, epochs=8):
        self.labels = labels
        self.epochs = epochs
        self.weights = defaultdict(lambda: defaultdict(float))
        self._totals = defaultdict(lambda: defaultdict(float))
        self._tstamps = defaultdict(lambda: defaultdict(int))
        self.step = 0

    def predict(self, tokens):
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

    def fit(self, dataset):
        random.seed(42)
        for epoch in range(1, self.epochs + 1):
            shuffled = list(dataset)
            random.shuffle(shuffled)
            for item in shuffled:
                tokens = item['tokens']
                gold_tags = item['bio_tags']
                prev_tag = "O"
                for i in range(len(tokens)):
                    self.step += 1
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
                        for f in feats:
                            self._totals[f][gold] += (self.step - self._tstamps[f][gold]) * self.weights[f][gold]
                            self._tstamps[f][gold] = self.step
                            self.weights[f][gold] += 1.0
                            self._totals[f][pred] += (self.step - self._tstamps[f][pred]) * self.weights[f][pred]
                            self._tstamps[f][pred] = self.step
                            self.weights[f][pred] -= 1.0
                    prev_tag = gold

        for f, lbl_dict in self.weights.items():
            for lbl, w in lbl_dict.items():
                self._totals[f][lbl] += (self.step - self._tstamps[f][lbl]) * w
                self.weights[f][lbl] = self._totals[f][lbl] / self.step

print("\n[TRAINING SCHEMA V2 SEQUENCE MODEL]")
model = AveragedSequencePerceptron(labels=labels, epochs=8)
model.fit(train_data)
train_entity_count = sum(len(r.get('entities', [])) for r in train_data)
print(f"  Model trained on {len(train_data)} sentences ({train_entity_count} entity spans).")

# ─────────────────────────────────────────────────────────────────────────────
# 3. SPAN EXTRACTION & TOKENIZATION HELPERS
# ─────────────────────────────────────────────────────────────────────────────
def extract_spans_from_bio(bio_tags):
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

def tokenize_simple(text):
    toks = re.findall(r"\w+(?:'\w+)?|[^\w\s]", text, re.UNICODE)
    return toks

def get_char_spans(text, toks, token_spans):
    curr_pos = 0
    tok_offsets = []
    for t in toks:
        idx = text.find(t, curr_pos)
        if idx != -1:
            tok_offsets.append((idx, idx + len(t), t))
            curr_pos = idx + len(t)
        else:
            tok_offsets.append((curr_pos, curr_pos + len(t), t))
            curr_pos += len(t)
            
    char_spans = []
    for st, end, lbl in token_spans:
        c_st = tok_offsets[st][0]
        c_end = tok_offsets[end - 1][1]
        span_str = text[c_st:c_end]
        char_spans.append((c_st, c_end, lbl, span_str))
    return char_spans

# ─────────────────────────────────────────────────────────────────────────────
# 4. RUN VALIDATOR & CHECK STATUS
# ─────────────────────────────────────────────────────────────────────────────
is_valid, val_meta = validate_human_gold()
if not is_valid:
    print(f"\n[FATAL ERROR] Human-gold dataset validation failed. Halting evaluation.")
    sys.exit(1)

# ─────────────────────────────────────────────────────────────────────────────
# 5. SILVER TEST SET EVALUATION (SCHEMA V2 BENCHMARK)
# ─────────────────────────────────────────────────────────────────────────────
print(f"\n[1. SILVER TEST SET EVALUATION (Held-Out Schema v2 Partition)]")
silv_tp = Counter(); silv_fp = Counter(); silv_fn = Counter(); silv_sup = Counter()

for item in test_data:
    toks = item['tokens']
    gold_bio = item['bio_tags']
    pred_bio = model.predict(toks)
    
    gold_spans = set(extract_spans_from_bio(gold_bio))
    pred_spans = set(extract_spans_from_bio(pred_bio))
    
    for g in gold_spans:
        silv_sup[g[2]] += 1
        if g in pred_spans:
            silv_tp[g[2]] += 1
        else:
            silv_fn[g[2]] += 1
    for p in pred_spans:
        if p not in gold_spans:
            silv_fp[p[2]] += 1

tot_s_tp = sum(silv_tp.values())
tot_s_fp = sum(silv_fp.values())
tot_s_fn = sum(silv_fn.values())
silv_p = (tot_s_tp / (tot_s_tp + tot_s_fp) * 100) if (tot_s_tp + tot_s_fp) > 0 else 0
silv_r = (tot_s_tp / (tot_s_tp + tot_s_fn) * 100) if (tot_s_tp + tot_s_fn) > 0 else 0
silv_f1 = (2 * silv_p * silv_r / (silv_p + silv_r)) if (silv_p + silv_r) > 0 else 0

f1_list_silv = []
for lbl in schema_v2_classes:
    tp, fp, fn, sup = silv_tp[lbl], silv_fp[lbl], silv_fn[lbl], silv_sup[lbl]
    p = (tp / (tp + fp) * 100) if (tp + fp) > 0 else 0
    r = (tp / (tp + fn) * 100) if (tp + fn) > 0 else 0
    f1 = (2 * p * r / (p + r)) if (p + r) > 0 else 0
    if sup > 0:
        f1_list_silv.append(f1)

silv_macro_f1 = sum(f1_list_silv) / len(f1_list_silv) if f1_list_silv else 0
nut_p_s = (silv_tp['NUTRIENT'] / (silv_tp['NUTRIENT'] + silv_fp['NUTRIENT']) * 100) if (silv_tp['NUTRIENT'] + silv_fp['NUTRIENT']) > 0 else 0
nut_r_s = (silv_tp['NUTRIENT'] / (silv_tp['NUTRIENT'] + silv_fn['NUTRIENT']) * 100) if (silv_tp['NUTRIENT'] + silv_fn['NUTRIENT']) > 0 else 0
nut_f1_s = (2 * nut_p_s * nut_r_s / (nut_p_s + nut_r_s)) if (nut_p_s + nut_r_s) > 0 else 0

print(f"  Silver Micro Precision : {silv_p:.2f}%")
print(f"  Silver Micro Recall    : {silv_r:.2f}%")
print(f"  Silver Micro F1        : {silv_f1:.2f}%")
print(f"  Silver Macro F1        : {silv_macro_f1:.2f}%")
print(f"  Silver NUTRIENT F1     : {nut_f1_s:.2f}% (P: {nut_p_s:.2f}%, R: {nut_r_s:.2f}%, Support: {silv_sup['NUTRIENT']})")

# ─────────────────────────────────────────────────────────────────────────────
# 6. ADVERSARIAL NUTRIENT CHALLENGE SUITE EVALUATION
# ─────────────────────────────────────────────────────────────────────────────
print(f"\n[2. ADVERSARIAL NUTRIENT CHALLENGE SUITE EVALUATION (25 Sentences)]")
chal_tp = Counter(); chal_fp = Counter(); chal_fn = Counter(); chal_tot = Counter()

for item in challenge_data:
    text = item['text']
    toks = tokenize_simple(text)
    pred_bio = model.predict(toks)
    pred_token_spans = extract_spans_from_bio(pred_bio)
    pred_char_spans = get_char_spans(text, toks, pred_token_spans)
    
    gold_entities = item.get('gold_entities', [])
    cat = item['category']
    
    gold_set = set((e['start'], e['end'], e['label'], e['text']) for e in gold_entities)
    pred_set = set(pred_char_spans)
    
    tp_set = pred_set.intersection(gold_set)
    fp_set = pred_set - gold_set
    fn_set = gold_set - pred_set
    
    chal_tp[cat] += len(tp_set)
    chal_fp[cat] += len(fp_set)
    chal_fn[cat] += len(fn_set)
    chal_tot[cat] += len(gold_set)

tot_c_tp = sum(chal_tp.values())
tot_c_fp = sum(chal_fp.values())
tot_c_fn = sum(chal_fn.values())
tot_c_gold = sum(chal_tot.values())
chal_p = (tot_c_tp / (tot_c_tp + tot_c_fp) * 100) if (tot_c_tp + tot_c_fp) > 0 else 0
chal_r = (tot_c_tp / (tot_c_tp + tot_c_fn) * 100) if (tot_c_tp + tot_c_fn) > 0 else 0
chal_f1 = (2 * chal_p * chal_r / (chal_p + chal_r)) if (chal_p + chal_r) > 0 else 0

print(f"  Challenge Micro Precision : {chal_p:.2f}%")
print(f"  Challenge Micro Recall    : {chal_r:.2f}%")
print(f"  Challenge Micro F1        : {chal_f1:.2f}% (Support: {tot_c_gold} spans)")
for cat, tot in sorted(chal_tot.items()):
    tp = chal_tp[cat]; fp = chal_fp[cat]; fn = chal_fn[cat]
    p = (tp / (tp + fp) * 100) if (tp + fp) > 0 else 0
    r = (tp / (tp + fn) * 100) if (tp + fn) > 0 else 0
    f1 = (2 * p * r / (p + r)) if (p + r) > 0 else 0
    print(f"    - {cat:<32} : F1: {f1:>6.2f}% (P: {p:>6.2f}%, R: {r:>6.2f}%, Gold: {tot})")

# ─────────────────────────────────────────────────────────────────────────────
# 7. INDEPENDENT HUMAN-GOLD BENCHMARK EVALUATION (150 Sentences)
# ─────────────────────────────────────────────────────────────────────────────
print(f"\n[3. INDEPENDENT HUMAN-GOLD EXACT-SPAN EVALUATION (150 Sentences, 387 Gold Spans)]")
gold_tp = Counter(); gold_fp = Counter(); gold_fn = Counter(); gold_support = Counter()
predictions_record = []
all_gold_spans_total = 0
all_pred_spans_total = 0

for item in gold_data:
    sid = item['sentence_id']
    text = item['text']
    toks = tokenize_simple(text)
    pred_bio = model.predict(toks)
    pred_token_spans = extract_spans_from_bio(pred_bio)
    pred_char_spans = get_char_spans(text, toks, pred_token_spans)
    
    gold_entities = [(e['start'], e['end'], e['label'], e['text']) for e in item.get('entities', [])]
    all_gold_spans_total += len(gold_entities)
    all_pred_spans_total += len(pred_char_spans)
    
    for g in gold_entities:
        gold_support[g[2]] += 1
        
    gold_set = set(gold_entities)
    pred_set = set(pred_char_spans)
    
    tp_set = pred_set.intersection(gold_set)
    fp_set = pred_set - gold_set
    fn_set = gold_set - pred_set
    
    for p in tp_set:
        gold_tp[p[2]] += 1
    for p in fp_set:
        gold_fp[p[2]] += 1
    for g in fn_set:
        gold_fn[g[2]] += 1
        
    predictions_record.append({
        "sentence_id": sid,
        "text": text,
        "gold_entities": gold_entities,
        "pred_entities": pred_char_spans,
        "tp": list(tp_set),
        "fp": list(fp_set),
        "fn": list(fn_set)
    })

tot_g_tp = sum(gold_tp.values())
tot_g_fp = sum(gold_fp.values())
tot_g_fn = sum(gold_fn.values())
gold_micro_p = (tot_g_tp / (tot_g_tp + tot_g_fp) * 100) if (tot_g_tp + tot_g_fp) > 0 else 0
gold_micro_r = (tot_g_tp / (tot_g_tp + tot_g_fn) * 100) if (tot_g_tp + tot_g_fn) > 0 else 0
gold_micro_f1 = (2 * gold_micro_p * gold_micro_r / (gold_micro_p + gold_micro_r)) if (gold_micro_p + gold_micro_r) > 0 else 0

per_class_results = {}
f1_list_gold = []

for lbl in schema_v2_classes:
    tp = gold_tp[lbl]
    fp = gold_fp[lbl]
    fn = gold_fn[lbl]
    sup = gold_support[lbl]
    p = (tp / (tp + fp) * 100) if (tp + fp) > 0 else 0
    r = (tp / (tp + fn) * 100) if (tp + fn) > 0 else 0
    f1 = (2 * p * r / (p + r)) if (p + r) > 0 else 0
    if sup > 0:
        f1_list_gold.append(f1)
    per_class_results[lbl] = {
        "Precision": round(p, 2),
        "Recall": round(r, 2),
        "F1": round(f1, 2),
        "Support": sup,
        "TP": tp,
        "FP": fp,
        "FN": fn
    }

gold_macro_f1 = sum(f1_list_gold) / len(f1_list_gold) if f1_list_gold else 0

print(f"\n  Overall Human-Gold Micro Precision : {gold_micro_p:.2f}%")
print(f"  Overall Human-Gold Micro Recall    : {gold_micro_r:.2f}%")
print(f"  Overall Human-Gold Micro F1        : {gold_micro_f1:.2f}%")
print(f"  Overall Human-Gold Macro F1        : {gold_macro_f1:.2f}%")

print(f"\n  {'Entity Label':<20} {'Support':>8} {'Precision':>12} {'Recall':>12} {'F1 Score':>12}")
print(f"  {'-'*68}")
for lbl in schema_v2_classes:
    res = per_class_results[lbl]
    print(f"  {lbl:<20} {res['Support']:>8} {res['Precision']:>11.2f}% {res['Recall']:>11.2f}% {res['F1']:>11.2f}%")

# ─────────────────────────────────────────────────────────────────────────────
# 8. SEEN vs UNSEEN GENERALIZATION ANALYSIS (HUMAN GOLD)
# ─────────────────────────────────────────────────────────────────────────────
train_surface_by_class = defaultdict(set)
train_surfaces_all = set()
for r in train_data:
    for e in r.get('entities', []):
        stxt = e.get('text', '').lower().strip()
        train_surface_by_class[e['label']].add(stxt)
        train_surfaces_all.add(stxt)

# Overall Seen/Unseen
seen_tp = 0; seen_fp = 0; seen_fn = 0
unseen_tp = 0; unseen_fp = 0; unseen_fn = 0

# Nutrient Seen/Unseen
nut_seen_tp = 0; nut_seen_fp = 0; nut_seen_fn = 0
nut_unseen_tp = 0; nut_unseen_fp = 0; nut_unseen_fn = 0

for rec in predictions_record:
    # Check predictions (TP & FP)
    for c_st, c_end, lbl, span_str in rec['pred_entities']:
        txt_low = span_str.lower().strip()
        is_seen = (txt_low in train_surface_by_class[lbl])
        is_tp = (c_st, c_end, lbl, span_str) in set(rec['tp'])
        
        if is_tp:
            if is_seen:
                seen_tp += 1
            else:
                unseen_tp += 1
        else:
            if is_seen:
                seen_fp += 1
            else:
                unseen_fp += 1
                
        if lbl == 'NUTRIENT':
            is_nut_seen = (txt_low in train_surface_by_class['NUTRIENT'])
            if is_tp:
                if is_nut_seen:
                    nut_seen_tp += 1
                else:
                    nut_unseen_tp += 1
            else:
                if is_nut_seen:
                    nut_seen_fp += 1
                else:
                    nut_unseen_fp += 1

    # Check False Negatives
    for c_st, c_end, lbl, span_str in rec['fn']:
        txt_low = span_str.lower().strip()
        is_seen = (txt_low in train_surface_by_class[lbl])
        if is_seen:
            seen_fn += 1
        else:
            unseen_fn += 1
            
        if lbl == 'NUTRIENT':
            is_nut_seen = (txt_low in train_surface_by_class['NUTRIENT'])
            if is_nut_seen:
                nut_seen_fn += 1
            else:
                nut_unseen_fn += 1

def calc_prf(tp, fp, fn):
    p = (tp / (tp + fp) * 100) if (tp + fp) > 0 else 0
    r = (tp / (tp + fn) * 100) if (tp + fn) > 0 else 0
    f1 = (2 * p * r / (p + r)) if (p + r) > 0 else 0
    return round(p, 2), round(r, 2), round(f1, 2)

seen_p, seen_r, seen_f1 = calc_prf(seen_tp, seen_fp, seen_fn)
unseen_p, unseen_r, unseen_f1 = calc_prf(unseen_tp, unseen_fp, unseen_fn)
nut_seen_p, nut_seen_r, nut_seen_f1 = calc_prf(nut_seen_tp, nut_seen_fp, nut_seen_fn)
nut_unseen_p, nut_unseen_r, nut_unseen_f1 = calc_prf(nut_unseen_tp, nut_unseen_fp, nut_unseen_fn)

print(f"\n[4. SEEN vs UNSEEN ENTITY GENERALIZATION ANALYSIS (HUMAN GOLD)]")
print(f"  Overall Seen Entities   : Support={seen_tp+seen_fn:>3} | Precision={seen_p:>6.2f}% | Recall={seen_r:>6.2f}% | F1={seen_f1:>6.2f}%")
print(f"  Overall Unseen Entities : Support={unseen_tp+unseen_fn:>3} | Precision={unseen_p:>6.2f}% | Recall={unseen_r:>6.2f}% | F1={unseen_f1:>6.2f}%")
print(f"  NUTRIENT Seen           : Support={nut_seen_tp+nut_seen_fn:>3} | Precision={nut_seen_p:>6.2f}% | Recall={nut_seen_r:>6.2f}% | F1={nut_seen_f1:>6.2f}%")
print(f"  NUTRIENT Unseen         : Support={nut_unseen_tp+nut_unseen_fn:>3} | Precision={nut_unseen_p:>6.2f}% | Recall={nut_unseen_r:>6.2f}% | F1={nut_unseen_f1:>6.2f}%")

# ─────────────────────────────────────────────────────────────────────────────
# 9. ERROR CATEGORIZATION AUDIT
# ─────────────────────────────────────────────────────────────────────────────
print(f"\n[5. ERROR TAXONOMY CATEGORIZATION (HUMAN GOLD)]")
error_categories = {
    "Boundary errors": [],
    "Entity-type errors": [],
    "Unseen entity errors": [],
    "Synonym errors": [],
    "Ambiguity errors": [],
    "Multi-word errors": [],
    "Nested/overlap errors": [],
    "New-schema errors": []
}

for rec in predictions_record:
    sid = rec['sentence_id']
    fps = list(rec['fp'])
    fns = list(rec['fn'])
    
    # Check for entity-type confusion (exact same start, end, but different label)
    matched_fp_indices = set()
    matched_fn_indices = set()
    for fpi, fp in enumerate(fps):
        for fni, fn in enumerate(fns):
            if fp[0] == fn[0] and fp[1] == fn[1]:
                error_categories["Entity-type errors"].append({
                    "sentence_id": sid,
                    "text": fp[3],
                    "predicted_label": fp[2],
                    "gold_label": fn[2]
                })
                matched_fp_indices.add(fpi)
                matched_fn_indices.add(fni)
                if fp[2] in ["FOOD_GROUP", "DIETARY_PROPERTY", "FEEDING_METHOD"] or fn[2] in ["FOOD_GROUP", "DIETARY_PROPERTY", "FEEDING_METHOD"]:
                    error_categories["New-schema errors"].append({
                        "sentence_id": sid,
                        "text": fp[3],
                        "predicted_label": fp[2],
                        "gold_label": fn[2],
                        "type": "Type mismatch in Schema v2 class"
                    })

    # Check for boundary mismatch (partial span overlap)
    for fpi, fp in enumerate(fps):
        if fpi in matched_fp_indices:
            continue
        for fni, fn in enumerate(fns):
            if fni in matched_fn_indices:
                continue
            # Check overlap
            if not (fp[1] <= fn[0] or fp[0] >= fn[1]):
                error_categories["Boundary errors"].append({
                    "sentence_id": sid,
                    "predicted": f"'{fp[3]}' [{fp[2]} at {fp[0]}:{fp[1]}]",
                    "gold": f"'{fn[3]}' [{fn[2]} at {fn[0]}:{fn[1]}]"
                })
                matched_fp_indices.add(fpi)
                matched_fn_indices.add(fni)
                if " " in fp[3] or " " in fn[3] or "-" in fp[3] or "-" in fn[3]:
                    error_categories["Multi-word errors"].append({
                        "sentence_id": sid,
                        "predicted": fp[3],
                        "gold": fn[3]
                    })

    # Remaining FPs and FNs
    for fpi, fp in enumerate(fps):
        if fpi not in matched_fp_indices:
            txt_low = fp[3].lower().strip()
            is_unseen = (txt_low not in train_surface_by_class[fp[2]])
            if is_unseen:
                error_categories["Unseen entity errors"].append({
                    "sentence_id": sid,
                    "type": "False Positive (Unseen)",
                    "text": fp[3],
                    "label": fp[2]
                })
            if fp[2] in ["FOOD_GROUP", "DIETARY_PROPERTY", "FEEDING_METHOD"]:
                error_categories["New-schema errors"].append({
                    "sentence_id": sid,
                    "type": "False Positive",
                    "text": fp[3],
                    "label": fp[2]
                })
            if fp[3].lower() in ["energy", "salt", "growth", "fat", "sugar"]:
                error_categories["Ambiguity errors"].append({
                    "sentence_id": sid,
                    "type": "Ambiguous Surface False Positive",
                    "text": fp[3],
                    "label": fp[2]
                })

    for fni, fn in enumerate(fns):
        if fni not in matched_fn_indices:
            txt_low = fn[3].lower().strip()
            is_unseen = (txt_low not in train_surface_by_class[fn[2]])
            if is_unseen:
                error_categories["Unseen entity errors"].append({
                    "sentence_id": sid,
                    "type": "False Negative (Unseen)",
                    "text": fn[3],
                    "label": fn[2]
                })
            if fn[2] in ["FOOD_GROUP", "DIETARY_PROPERTY", "FEEDING_METHOD"]:
                error_categories["New-schema errors"].append({
                    "sentence_id": sid,
                    "type": "False Negative",
                    "text": fn[3],
                    "label": fn[2]
                })
            if " " in fn[3] or "-" in fn[3]:
                error_categories["Multi-word errors"].append({
                    "sentence_id": sid,
                    "type": "Missed Multi-word Entity",
                    "text": fn[3],
                    "label": fn[2]
                })

for cat, errs in error_categories.items():
    print(f"  {cat:<25} : {len(errs):>3} instances")

# ─────────────────────────────────────────────────────────────────────────────
# 10. EXPORT RESULTS JSON
# ─────────────────────────────────────────────────────────────────────────────
output_data = {
    "schema_version": "2.0",
    "evaluation_date": "2026-09-19",
    "annotator_count": 1,
    "annotator_id": "domain_expert_v1",
    "dataset_statistics": {
        "candidate_sentences": len(gold_data),
        "annotated_sentences": len(gold_data),
        "zero_entity_sentences": val_meta.get("zero_entity_sentences", 10),
        "total_gold_entities": all_gold_spans_total,
        "class_distribution": val_meta.get("entity_counts", {})
    },
    "silver_test_metrics": {
        "Micro_P": round(silv_p, 2),
        "Micro_R": round(silv_r, 2),
        "Micro_F1": round(silv_f1, 2),
        "Macro_F1": round(silv_macro_f1, 2),
        "Nutrient_F1": round(nut_f1_s, 2),
        "Nutrient_P": round(nut_p_s, 2),
        "Nutrient_R": round(nut_r_s, 2),
        "Nutrient_Support": silv_sup['NUTRIENT']
    },
    "challenge_metrics": {
        "Micro_P": round(chal_p, 2),
        "Micro_R": round(chal_r, 2),
        "Micro_F1": round(chal_f1, 2),
        "Support": tot_c_gold
    },
    "human_gold_metrics": {
        "Micro_P": round(gold_micro_p, 2),
        "Micro_R": round(gold_micro_r, 2),
        "Micro_F1": round(gold_micro_f1, 2),
        "Macro_F1": round(gold_macro_f1, 2),
        "Total_Gold_Spans": all_gold_spans_total,
        "Total_Pred_Spans": all_pred_spans_total,
        "Total_TP": tot_g_tp,
        "Total_FP": tot_g_fp,
        "Total_FN": tot_g_fn,
        "Per_Class": per_class_results
    },
    "generalization_metrics": {
        "Overall_Seen": {"Precision": seen_p, "Recall": seen_r, "F1": seen_f1, "Support": seen_tp + seen_fn},
        "Overall_Unseen": {"Precision": unseen_p, "Recall": unseen_r, "F1": unseen_f1, "Support": unseen_tp + unseen_fn},
        "Nutrient_Seen": {"Precision": nut_seen_p, "Recall": nut_seen_r, "F1": nut_seen_f1, "Support": nut_seen_tp + nut_seen_fn},
        "Nutrient_Unseen": {"Precision": nut_unseen_p, "Recall": nut_unseen_r, "F1": nut_unseen_f1, "Support": nut_unseen_tp + nut_unseen_fn}
    },
    "error_counts": {k: len(v) for k, v in error_categories.items()}
}

os.makedirs('ner/reports', exist_ok=True)
with open('ner/reports/human_gold_evaluation_results.json', 'w', encoding='utf-8') as f:
    json.dump(output_data, f, indent=2)

print(f"\nSaved structured evaluation report to 'ner/reports/human_gold_evaluation_results.json'.")
print("=" * 80)
