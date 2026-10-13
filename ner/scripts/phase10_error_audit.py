"""
Phase 10: Human-Gold Error Audit & Unseen Analysis Engine
=========================================================
Performs a deep diagnostic error audit on the Phase 9 human-gold evaluation:
1. Re-generates exact baseline predictions.
2. Identifies all True Positives, False Positives, and False Negatives.
3. Categorizes errors across the 11 designated diagnostic error types:
   A. Unseen lexical forms
   B. Synonyms / chemical variants
   C. Chemical nutrient names
   D. Multi-word entities
   E. Boundary errors
   F. Entity-type confusion
   G. Contextual ambiguity
   H. Food vs Food-Group confusion
   I. Feeding-method errors
   J. Dietary-property errors
   K. Health-condition errors
4. Exports structured error audit report.
"""

import json
import os
import sys
import re
import random
from collections import defaultdict, Counter

sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
random.seed(42)

def load_jsonl(path):
    return [json.loads(l) for l in open(path, 'r', encoding='utf-8') if l.strip()]

train_data = load_jsonl('ner/data/schema_v2/train.jsonl')
gold_data = load_jsonl('ner/data/human_gold/human_gold.jsonl')

schema_v2_classes = [
    "FOOD", "NUTRIENT", "HEALTH_CONDITION", "ALLERGEN", "AGE_GROUP",
    "MEAL_TYPE", "GROWTH_METRIC", "FOOD_GROUP", "DIETARY_PROPERTY", "FEEDING_METHOD"
]
labels = ["O"]
for c in schema_v2_classes:
    labels.extend([f"B-{c}", f"I-{c}"])

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
    return re.findall(r"\w+(?:'\w+)?|[^\w\s]", text, re.UNICODE)

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

# Train baseline model
print("Training Baseline Model for Error Audit...")
model = AveragedSequencePerceptron(labels=labels, epochs=8)
model.fit(train_data)

train_surfaces_by_class = defaultdict(set)
train_surfaces_all = set()
for r in train_data:
    for e in r.get('entities', []):
        st = e.get('text', '').lower().strip()
        train_surfaces_by_class[e['label']].add(st)
        train_surfaces_all.add(st)

# Evaluate on Human Gold
all_records = []
all_gold_spans = []
all_pred_spans = []

for item in gold_data:
    sid = item['sentence_id']
    text = item['text']
    toks = tokenize_simple(text)
    pred_bio = model.predict(toks)
    pred_tok_spans = extract_spans_from_bio(pred_bio)
    pred_char_spans = get_char_spans(text, toks, pred_tok_spans)
    gold_entities = [(e['start'], e['end'], e['label'], e['text']) for e in item.get('entities', [])]
    
    gold_set = set(gold_entities)
    pred_set = set(pred_char_spans)
    
    tp_set = pred_set.intersection(gold_set)
    fp_set = pred_set - gold_set
    fn_set = gold_set - pred_set
    
    all_gold_spans.extend(gold_entities)
    all_pred_spans.extend(pred_char_spans)
    
    all_records.append({
        "sentence_id": sid,
        "text": text,
        "gold": gold_entities,
        "pred": pred_char_spans,
        "tp": list(tp_set),
        "fp": list(fp_set),
        "fn": list(fn_set)
    })

print(f"\nEvaluation Overview:")
print(f"  Gold Spans: {len(all_gold_spans)}")
print(f"  Pred Spans: {len(all_pred_spans)}")
tp_tot = sum(len(r['tp']) for r in all_records)
fp_tot = sum(len(r['fp']) for r in all_records)
fn_tot = sum(len(r['fn']) for r in all_records)
print(f"  True Positives  : {tp_tot}")
print(f"  False Positives : {fp_tot}")
print(f"  False Negatives : {fn_tot}")

# ─────────────────────────────────────────────────────────────────────────────
# DETAILED 11-CATEGORY AUDIT
# ─────────────────────────────────────────────────────────────────────────────
audit_results = defaultdict(list)

for r in all_records:
    sid = r['sentence_id']
    text = r['text']
    fps = r['fp']
    fns = r['fn']
    
    # Check type confusion (exact boundaries, wrong label)
    matched_fp = set()
    matched_fn = set()
    for fi, fp in enumerate(fps):
        for ni, fn in enumerate(fns):
            if fp[0] == fn[0] and fp[1] == fn[1]:
                matched_fp.add(fi)
                matched_fn.add(ni)
                entry = {
                    "sentence_id": sid,
                    "text": text,
                    "span": fp[3],
                    "predicted_label": fp[2],
                    "gold_label": fn[2],
                    "offsets": (fp[0], fp[1])
                }
                audit_results["F_entity_type_confusion"].append(entry)
                if (fp[2] == 'FOOD' and fn[2] == 'FOOD_GROUP') or (fp[2] == 'FOOD_GROUP' and fn[2] == 'FOOD'):
                    audit_results["H_food_vs_food_group"].append(entry)
                    
    # Check boundary errors (overlapping boundaries)
    for fi, fp in enumerate(fps):
        if fi in matched_fp:
            continue
        for ni, fn in enumerate(fns):
            if ni in matched_fn:
                continue
            if not (fp[1] <= fn[0] or fp[0] >= fn[1]):
                matched_fp.add(fi)
                matched_fn.add(ni)
                entry = {
                    "sentence_id": sid,
                    "text": text,
                    "predicted": f"'{fp[3]}' [{fp[2]} at {fp[0]}:{fp[1]}]",
                    "gold": f"'{fn[3]}' [{fn[2]} at {fn[0]}:{fn[1]}]"
                }
                audit_results["E_boundary_errors"].append(entry)
                if " " in fp[3] or " " in fn[3] or "-" in fp[3] or "-" in fn[3]:
                    audit_results["D_multi_word_errors"].append(entry)

    # Remaining FNs (missed mentions)
    for ni, fn in enumerate(fns):
        if ni in matched_fn:
            continue
        st_low = fn[3].lower().strip()
        is_unseen = (st_low not in train_surfaces_by_class[fn[2]])
        entry = {
            "sentence_id": sid,
            "text": text,
            "span": fn[3],
            "label": fn[2],
            "is_unseen": is_unseen
        }
        if is_unseen:
            audit_results["A_unseen_lexical_forms"].append(entry)
        if " " in fn[3] or "-" in fn[3]:
            audit_results["D_multi_word_errors"].append(entry)
        if fn[2] == 'FEEDING_METHOD':
            audit_results["I_feeding_method_errors"].append(entry)
        elif fn[2] == 'DIETARY_PROPERTY':
            audit_results["J_dietary_property_errors"].append(entry)
        elif fn[2] == 'HEALTH_CONDITION':
            audit_results["K_health_condition_errors"].append(entry)
        elif fn[2] == 'NUTRIENT':
            # Check if chemical / synonym
            if st_low in ["long chain polyunsaturated fatty acids", "lcpufas", "dha", "arachidonic acid", "iga", "sodium", "immunoglobulins", "lactoferrin"]:
                audit_results["C_chemical_nutrient_names"].append(entry)
            else:
                audit_results["B_synonyms"].append(entry)

    # Remaining FPs (spurious mentions)
    for fi, fp in enumerate(fps):
        if fi in matched_fp:
            continue
        st_low = fp[3].lower().strip()
        is_unseen = (st_low not in train_surfaces_by_class[fp[2]])
        entry = {
            "sentence_id": sid,
            "text": text,
            "span": fp[3],
            "label": fp[2],
            "is_unseen": is_unseen
        }
        if is_unseen:
            audit_results["A_unseen_lexical_forms"].append(entry)
        if fp[3].lower() in ["energy", "salt", "growth", "fat", "sugar"]:
            audit_results["G_contextual_ambiguity"].append(entry)

print("\n[PHASE 10 ERROR AUDIT COUNTS]")
for cat, items in sorted(audit_results.items()):
    print(f"  {cat:<35} : {len(items):>3} instances")

with open('ner/reports/phase10_error_audit_data.json', 'w', encoding='utf-8') as f:
    json.dump({k: v for k, v in audit_results.items()}, f, indent=2)

print("\nSaved raw error audit data to 'ner/reports/phase10_error_audit_data.json'.")
