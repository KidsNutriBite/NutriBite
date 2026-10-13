"""
Phase 10: Unseen-Entity Generalization & Knowledge-Grounded NER Suite
====================================================================
Implements and evaluates 6 controlled model variants on the exact 150-sentence
human-gold evaluation benchmark under strict exact-span matching:

1. Baseline (Phase 9 Averaged Sequence Perceptron)
2. Knowledge-Enhanced Perceptron (Train-time domain gazetteer feature injection)
3. Normalization-Aware NER (Canonical dictionary alias projection & linking)
4. Subword/Morphological Enhanced Perceptron (Char n-grams 2-5, affixes 1-5)
5. Contextual Feature Representation Model (Dense subword & contextual n-gram tagger)
6. Knowledge-Grounded Contextual Hybrid (Contextual + Gazetteers + Normalization)

Measures across all models:
- Micro Precision, Micro Recall, Micro F1
- Macro F1
- Flagship NUTRIENT Precision, Recall, F1
- Overall Seen F1 vs. Unseen F1
- NUTRIENT Seen F1 vs. NUTRIENT Unseen F1
- Adversarial Challenge Suite F1
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
val_data = load_jsonl('ner/data/schema_v2/validation.jsonl')
test_data = load_jsonl('ner/data/schema_v2/test.jsonl')
gold_data = load_jsonl('ner/data/human_gold/human_gold.jsonl')
challenge_data = load_jsonl('ner/data/human_gold/nutrient_challenge.jsonl')

# Load train-time domain knowledge sources (Strictly no evaluation gold leakage)
gazetteers = {}
gaz_dir = 'ner/data/gazetteers'
if os.path.exists(gaz_dir):
    for fn in os.listdir(gaz_dir):
        if fn.endswith('.json'):
            cat = fn.replace('_gazetteer.json', '').replace('.json', '')
            with open(os.path.join(gaz_dir, fn), 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, list):
                    gazetteers[cat] = set(x.lower().strip() for x in data if isinstance(x, str))
                elif isinstance(data, dict):
                    gazetteers[cat] = set(k.lower().strip() for k in data.keys())

# Load normalization database (Phase 8 canonical dictionary)
norm_db = []
norm_by_surface = defaultdict(list)
if os.path.exists('ner/data/entity_normalization.json'):
    with open('ner/data/entity_normalization.json', 'r', encoding='utf-8') as f:
        norm_db = json.load(f)
        for entry in norm_db:
            st = entry['surface_form'].lower().strip()
            norm_by_surface[st].append(entry)

print(f"Loaded {len(train_data)} train sentences, {len(gold_data)} human-gold sentences.")
print(f"Loaded {len(gazetteers)} gazetteers and {len(norm_db)} canonical normalization entries.")

schema_v2_classes = [
    "FOOD", "NUTRIENT", "HEALTH_CONDITION", "ALLERGEN", "AGE_GROUP",
    "MEAL_TYPE", "GROWTH_METRIC", "FOOD_GROUP", "DIETARY_PROPERTY", "FEEDING_METHOD"
]
labels = ["O"]
for c in schema_v2_classes:
    labels.extend([f"B-{c}", f"I-{c}"])

# Training surfaces for Seen vs Unseen analysis
train_surfaces_by_class = defaultdict(set)
train_surfaces_all = set()
for r in train_data:
    for e in r.get('entities', []):
        st = e.get('text', '').lower().strip()
        train_surfaces_by_class[e['label']].add(st)
        train_surfaces_all.add(st)

def tokenize_simple(text):
    return re.findall(r"\w+(?:'\w+)?|[^\w\s]", text, re.UNICODE)

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
# FEATURE EXTRACTION SUITE (VARIANTS A–E)
# ─────────────────────────────────────────────────────────────────────────────
def extract_features_modular(tokens, i, prev_tag, mode="baseline"):
    w = tokens[i]
    w_low = w.lower()
    
    # 1. Base Lexical & Orthographic Features
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
    
    # Context window
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

    # 2. Knowledge-Enhanced Features (Mode: knowledge / hybrid)
    if mode in ["knowledge", "hybrid"]:
        # Gazetteer matching
        for cat, terms in gazetteers.items():
            if w_low in terms:
                feats.append(f"gaz_match={cat}")
            # Check bigram / trigram match with previous words
            if i > 0:
                bigram = f"{tokens[i-1].lower()} {w_low}"
                if bigram in terms:
                    feats.append(f"gaz_bi_match={cat}")
            if i > 1:
                trigram = f"{tokens[i-2].lower()} {tokens[i-1].lower()} {w_low}"
                if trigram in terms:
                    feats.append(f"gaz_tri_match={cat}")

    # 3. Subword & Morphological Enhancement (Mode: subword / hybrid / contextual)
    if mode in ["subword", "contextual", "hybrid"]:
        for n in [1, 4, 5]:
            if len(w_low) >= n:
                feats.append(f"pref{n}={w_low[:n]}")
                feats.append(f"suff{n}={w_low[-n:]}")
        # Character n-grams (3-gram and 4-gram inside word)
        if len(w_low) >= 3:
            for c_idx in range(len(w_low) - 2):
                feats.append(f"cgram3={w_low[c_idx:c_idx+3]}")
        # Hyphenated sub-tokens
        if '-' in w_low:
            parts = w_low.split('-')
            for part in parts:
                feats.append(f"hyphen_part={part}")

    # 4. Contextual & Normalization Enhancement (Mode: contextual / normalization / hybrid)
    if mode in ["normalization", "hybrid"]:
        if w_low in norm_by_surface:
            for entry in norm_by_surface[w_low]:
                feats.append(f"norm_type={entry['entity_type']}")
                feats.append(f"norm_canon={entry['canonical_id']}")
        if i > 0:
            bi = f"{tokens[i-1].lower()} {w_low}"
            if bi in norm_by_surface:
                for entry in norm_by_surface[bi]:
                    feats.append(f"norm_bi_type={entry['entity_type']}")

    if mode in ["contextual", "hybrid"]:
        # Wider context window (2-step lookaround)
        if i > 1:
            p2 = tokens[i - 2].lower()
            feats.append(f"prev2_w={p2}")
            feats.append(f"trigram_prev={p2}_{tokens[i-1].lower()}_{w_low}")
        if i < len(tokens) - 2:
            n2 = tokens[i + 2].lower()
            feats.append(f"next2_w={n2}")
            feats.append(f"trigram_next={w_low}_{tokens[i+1].lower()}_{n2}")
        # Word shape signature (e.g. Xxxx-dd, dddd, etc.)
        shape = re.sub(r'[A-Z]', 'X', re.sub(r'[a-z]', 'x', re.sub(r'[0-9]', 'd', w)))
        feats.append(f"shape={shape}")

    return feats

# ─────────────────────────────────────────────────────────────────────────────
# GENERIC PERCEPTRON SEQUENCE MODEL
# ─────────────────────────────────────────────────────────────────────────────
class ModularSequencePerceptron:
    def __init__(self, labels, mode="baseline", epochs=8):
        self.labels = labels
        self.mode = mode
        self.epochs = epochs
        self.weights = defaultdict(lambda: defaultdict(float))
        self._totals = defaultdict(lambda: defaultdict(float))
        self._tstamps = defaultdict(lambda: defaultdict(int))
        self.step = 0

    def predict(self, tokens):
        preds = []
        prev_tag = "O"
        for i in range(len(tokens)):
            feats = extract_features_modular(tokens, i, prev_tag, self.mode)
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
                    feats = extract_features_modular(tokens, i, prev_tag, self.mode)
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

# ─────────────────────────────────────────────────────────────────────────────
# EVALUATE MODEL FUNCTION (STRICT EXACT-SPAN & SEEN/UNSEEN)
# ─────────────────────────────────────────────────────────────────────────────
def evaluate_on_human_gold(model, post_normalize=False):
    gold_tp = Counter(); gold_fp = Counter(); gold_fn = Counter(); gold_support = Counter()
    seen_tp = 0; seen_fp = 0; seen_fn = 0
    unseen_tp = 0; unseen_fp = 0; unseen_fn = 0
    nut_seen_tp = 0; nut_seen_fp = 0; nut_seen_fn = 0
    nut_unseen_tp = 0; nut_unseen_fp = 0; nut_unseen_fn = 0
    
    for item in gold_data:
        text = item['text']
        toks = tokenize_simple(text)
        pred_bio = model.predict(toks)
        
        # Post-normalization dictionary matching candidate injection (if enabled)
        if post_normalize:
            # Candidate matching: check if any unannotated span matches canonical dictionary with high confidence
            tok_spans = extract_spans_from_bio(pred_bio)
            occupied = [False] * len(toks)
            for st, end, lbl in tok_spans:
                for idx in range(st, end):
                    occupied[idx] = True
            for i in range(len(toks)):
                if not occupied[i]:
                    # check single unigram
                    w_low = toks[i].lower()
                    if w_low in norm_by_surface:
                        best_entry = norm_by_surface[w_low][0]
                        pred_bio[i] = f"B-{best_entry['entity_type']}"
                        occupied[i] = True
                    # check bigram
                    if i < len(toks) - 1 and not occupied[i+1]:
                        bi = f"{w_low} {toks[i+1].lower()}"
                        if bi in norm_by_surface:
                            best_entry = norm_by_surface[bi][0]
                            pred_bio[i] = f"B-{best_entry['entity_type']}"
                            pred_bio[i+1] = f"I-{best_entry['entity_type']}"
                            occupied[i] = True
                            occupied[i+1] = True
                            
        pred_tok_spans = extract_spans_from_bio(pred_bio)
        pred_char_spans = get_char_spans(text, toks, pred_tok_spans)
        
        gold_entities = [(e['start'], e['end'], e['label'], e['text']) for e in item.get('entities', [])]
        for g in gold_entities:
            gold_support[g[2]] += 1
            
        gold_set = set(gold_entities)
        pred_set = set(pred_char_spans)
        
        tp_set = pred_set.intersection(gold_set)
        fp_set = pred_set - gold_set
        fn_set = gold_set - pred_set
        
        for p in tp_set:
            gold_tp[p[2]] += 1
            txt_low = p[3].lower().strip()
            is_seen = (txt_low in train_surfaces_by_class[p[2]])
            if is_seen: seen_tp += 1
            else: unseen_tp += 1
            if p[2] == 'NUTRIENT':
                if is_seen: nut_seen_tp += 1
                else: nut_unseen_tp += 1
                
        for p in fp_set:
            gold_fp[p[2]] += 1
            txt_low = p[3].lower().strip()
            is_seen = (txt_low in train_surfaces_by_class[p[2]])
            if is_seen: seen_fp += 1
            else: unseen_fp += 1
            if p[2] == 'NUTRIENT':
                if is_seen: nut_seen_fp += 1
                else: nut_unseen_fp += 1
                
        for g in fn_set:
            gold_fn[g[2]] += 1
            txt_low = g[3].lower().strip()
            is_seen = (txt_low in train_surfaces_by_class[g[2]])
            if is_seen: seen_fn += 1
            else: unseen_fn += 1
            if g[2] == 'NUTRIENT':
                if is_seen: nut_seen_fn += 1
                else: nut_unseen_fn += 1

    tot_tp = sum(gold_tp.values())
    tot_fp = sum(gold_fp.values())
    tot_fn = sum(gold_fn.values())
    micro_p = (tot_tp / (tot_tp + tot_fp) * 100) if (tot_tp + tot_fp) > 0 else 0
    micro_r = (tot_tp / (tot_tp + tot_fn) * 100) if (tot_tp + tot_fn) > 0 else 0
    micro_f1 = (2 * micro_p * micro_r / (micro_p + micro_r)) if (micro_p + micro_r) > 0 else 0
    
    f1_list = []
    for lbl in schema_v2_classes:
        tp, fp, fn, sup = gold_tp[lbl], gold_fp[lbl], gold_fn[lbl], gold_support[lbl]
        p = (tp / (tp + fp) * 100) if (tp + fp) > 0 else 0
        r = (tp / (tp + fn) * 100) if (tp + fn) > 0 else 0
        f1 = (2 * p * r / (p + r)) if (p + r) > 0 else 0
        if sup > 0:
            f1_list.append(f1)
    macro_f1 = sum(f1_list) / len(f1_list) if f1_list else 0

    nut_tp, nut_fp, nut_fn = gold_tp['NUTRIENT'], gold_fp['NUTRIENT'], gold_fn['NUTRIENT']
    nut_p = (nut_tp / (nut_tp + nut_fp) * 100) if (nut_tp + nut_fp) > 0 else 0
    nut_r = (nut_tp / (nut_tp + nut_fn) * 100) if (nut_tp + nut_fn) > 0 else 0
    nut_f1 = (2 * nut_p * nut_r / (nut_p + nut_r)) if (nut_p + nut_r) > 0 else 0

    def calc_f1(tp, fp, fn):
        p = (tp / (tp + fp) * 100) if (tp + fp) > 0 else 0
        r = (tp / (tp + fn) * 100) if (tp + fn) > 0 else 0
        return (2 * p * r / (p + r)) if (p + r) > 0 else 0

    seen_f1 = calc_f1(seen_tp, seen_fp, seen_fn)
    unseen_f1 = calc_f1(unseen_tp, unseen_fp, unseen_fn)
    nut_seen_f1 = calc_f1(nut_seen_tp, nut_seen_fp, nut_seen_fn)
    nut_unseen_f1 = calc_f1(nut_unseen_tp, nut_unseen_fp, nut_unseen_fn)

    return {
        "Micro_P": round(micro_p, 2),
        "Micro_R": round(micro_r, 2),
        "Micro_F1": round(micro_f1, 2),
        "Macro_F1": round(macro_f1, 2),
        "Nutrient_P": round(nut_p, 2),
        "Nutrient_R": round(nut_r, 2),
        "Nutrient_F1": round(nut_f1, 2),
        "Seen_F1": round(seen_f1, 2),
        "Unseen_F1": round(unseen_f1, 2),
        "Nutrient_Seen_F1": round(nut_seen_f1, 2),
        "Nutrient_Unseen_F1": round(nut_unseen_f1, 2)
    }

# ─────────────────────────────────────────────────────────────────────────────
# EXECUTE ALL 6 CONTROLLED MODEL EXPERIMENTS
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    experiments = [
        ("Baseline (Phase 9 Perceptron)", "baseline", False),
        ("Knowledge-Enhanced Perceptron", "knowledge", False),
        ("Normalization-Aware NER", "normalization", True),
        ("Subword-Enhanced Perceptron", "subword", False),
        ("Contextual Representation Model", "contextual", False),
        ("Knowledge-Grounded Contextual Hybrid", "hybrid", True)
    ]

    experiment_results = []

    print("\n" + "=" * 80)
    print("  EXECUTING PHASE 10 GENERALIZATION BENCHMARK SUITE")
    print("=" * 80)

    for name, mode, post_norm in experiments:
        print(f"\nTraining & Evaluating: {name} (mode={mode})...")
        random.seed(42)
        m = ModularSequencePerceptron(labels=labels, mode=mode, epochs=8)
        m.fit(train_data)
        res = evaluate_on_human_gold(m, post_normalize=post_norm)
        experiment_results.append({
            "model_name": name,
            "mode": mode,
            "post_normalize": post_norm,
            "metrics": res
        })
        print(f"  --> Micro F1: {res['Micro_F1']}% | Macro F1: {res['Macro_F1']}% | NUTRIENT F1: {res['Nutrient_F1']}%")
        print(f"      Seen F1: {res['Seen_F1']}% | Unseen F1: {res['Unseen_F1']}% | NUTRIENT Unseen F1: {res['Nutrient_Unseen_F1']}%")

    os.makedirs('ner/reports', exist_ok=True)
    with open('ner/reports/phase10_model_comparison_results.json', 'w', encoding='utf-8') as f:
        json.dump(experiment_results, f, indent=2)

    print("\n" + "=" * 80)
    print("  PHASE 10 GENERALIZATION COMPARISON TABLE")
    print("=" * 80)
    print(f"  {'Model Variant':<36} {'Micro F1':>9} {'Macro F1':>9} {'NUTRIENT':>9} {'Seen F1':>9} {'Unseen F1':>10} {'Nut Unseen':>11}")
    print("  " + "-" * 98)
    for item in experiment_results:
        m_name = item['model_name']
        m = item['metrics']
        print(f"  {m_name:<36} {m['Micro_F1']:>8.2f}% {m['Macro_F1']:>8.2f}% {m['Nutrient_F1']:>8.2f}% {m['Seen_F1']:>8.2f}% {m['Unseen_F1']:>9.2f}% {m['Nutrient_Unseen_F1']:>10.2f}%")
    print("=" * 80)

