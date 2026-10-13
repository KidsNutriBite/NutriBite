"""
NutriBite NER — Phase 6: Human-Gold Annotation Validator
=========================================================
Performs comprehensive validation on `ner/data/human_gold/human_gold.jsonl`:
1. Structural integrity (offsets, text slices, valid labels).
2. Overlap detection (ensures standard BIO compatibility).
3. Duplicate span detection.
4. Completeness check (ensures all 150 candidates have been reviewed).

Run: python ner/scripts/12_validate_human_gold.py
"""

import os
import sys
import json
from collections import Counter, defaultdict

sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)

PERMITTED_LABELS = {
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
}

GOLD_PATH = 'ner/data/human_gold/human_gold.jsonl'
CANDIDATE_PATH = 'ner/data/human_gold/human_gold_candidates.jsonl'

def validate_human_gold():
    print("=" * 75)
    print("  NUTRIBITE NER — PHASE 9 HUMAN-GOLD ANNOTATION VALIDATOR (Schema v2.0, 10 Classes)")
    print("=" * 75)

    if not os.path.exists(GOLD_PATH):
        print(f"\n[ERROR] Target file not found: {GOLD_PATH}")
        return False, {"status": "FILE_NOT_FOUND"}

    with open(GOLD_PATH, 'r', encoding='utf-8') as f:
        records = [json.loads(line) for line in f if line.strip()]

    candidate_count = 150
    if os.path.exists(CANDIDATE_PATH):
        with open(CANDIDATE_PATH, 'r', encoding='utf-8') as f:
            candidate_count = len([line for line in f if line.strip()])

    total_sentences = len(records)
    annotated_sentences = 0
    unannotated_sentences = 0
    zero_entity_sentences = 0
    
    structural_errors = []
    overlap_errors = []
    duplicate_errors = []
    
    entity_counts = Counter()
    annotator_counts = Counter()

    for idx, r in enumerate(records, start=1):
        s_id = r.get('sentence_id', f"ROW_{idx}")
        text = r.get('text', '')
        entities = r.get('entities', [])
        annotator = r.get('annotator', '').strip()
        is_zero_verified = r.get('is_zero_entity_verified', False)

        # Completeness probe
        is_annotated = (len(entities) > 0) or bool(annotator) or is_zero_verified
        if is_annotated:
            annotated_sentences += 1
            if annotator:
                annotator_counts[annotator] += 1
        else:
            unannotated_sentences += 1

        if len(entities) == 0 and is_annotated:
            zero_entity_sentences += 1

        # Text checks
        if not text or len(text.strip()) == 0:
            structural_errors.append(f"Sentence {s_id}: Missing or empty text.")
            continue

        # Entity offset and label checks
        spans_seen = []
        for e_idx, e in enumerate(entities):
            lbl = e.get('label')
            st = e.get('start')
            end = e.get('end')
            span_text = e.get('text')

            # Type & value checks
            if lbl not in PERMITTED_LABELS:
                structural_errors.append(f"Sentence {s_id} Entity {e_idx}: Invalid label '{lbl}'. Permitted: {sorted(list(PERMITTED_LABELS))}")
            if not isinstance(st, int) or not isinstance(end, int):
                structural_errors.append(f"Sentence {s_id} Entity {e_idx}: Offsets must be integers. Got start={st}, end={end}")
                continue
            if st < 0 or end > len(text) or st >= end:
                structural_errors.append(f"Sentence {s_id} Entity {e_idx}: Bad offset bounds [{st}:{end}] in text of len {len(text)}")
                continue

            actual_sub = text[st:end]
            if span_text and span_text != actual_sub:
                structural_errors.append(f"Sentence {s_id} Entity '{span_text}': Span string mismatch vs text[{st}:{end}]='{actual_sub}'")

            # Duplicate check
            span_key = (st, end, lbl)
            if span_key in spans_seen:
                duplicate_errors.append(f"Sentence {s_id}: Duplicate entity span {span_key} ('{actual_sub}')")
            spans_seen.append(span_key)
            entity_counts[lbl] += 1

        # Overlap check
        sorted_spans = sorted(spans_seen, key=lambda x: (x[0], x[1]))
        for i in range(len(sorted_spans) - 1):
            curr_s, curr_e, curr_lbl = sorted_spans[i]
            next_s, next_e, next_lbl = sorted_spans[i + 1]
            if next_s < curr_e:
                overlap_errors.append(
                    f"Sentence {s_id}: Overlapping spans detected: '{text[curr_s:curr_e]}' [{curr_lbl} at {curr_s}:{curr_e}] vs '{text[next_s:next_e]}' [{next_lbl} at {next_s}:{next_e}]"
                )

    # Summary Display
    print(f"\n[DATASET COMPLETENESS AUDIT]")
    print(f"  Target Candidate Sentences : {candidate_count}")
    print(f"  Total Sentences in File    : {total_sentences}")
    print(f"  Manually Annotated Sents   : {annotated_sentences}")
    print(f"  Unannotated Sentences      : {unannotated_sentences}")
    print(f"  Verified Zero-Entity Sents : {zero_entity_sentences}")
    print(f"  Total Entity Spans Labeled : {sum(entity_counts.values())}")

    print(f"\n[ENTITY CLASS DISTRIBUTION]")
    for lbl in sorted(list(PERMITTED_LABELS)):
        print(f"  {lbl:<20} : {entity_counts[lbl]:>4} spans")

    print(f"\n[ANNOTATOR BREAKDOWN]")
    if annotator_counts:
        for ann, cnt in annotator_counts.items():
            print(f"  {ann:<25} : {cnt} sentences")
    else:
        print("  No human annotator identity recorded yet.")

    print(f"\n[STRUCTURAL VALIDATION RESULTS]")
    print(f"  Structural Errors : {len(structural_errors)} {'OK' if len(structural_errors) == 0 else 'FAIL ❌'}")
    print(f"  Duplicate Errors  : {len(duplicate_errors)} {'OK' if len(duplicate_errors) == 0 else 'FAIL ❌'}")
    print(f"  Overlap Errors    : {len(overlap_errors)} {'OK' if len(overlap_errors) == 0 else 'FAIL ❌'}")

    for err in structural_errors[:5]:
        print(f"    [Structural Error] {err}")
    for err in duplicate_errors[:5]:
        print(f"    [Duplicate Error] {err}")
    for err in overlap_errors[:5]:
        print(f"    [Overlap Error] {err}")

    # Verdict
    is_structurally_clean = (len(structural_errors) == 0 and len(duplicate_errors) == 0 and len(overlap_errors) == 0)
    is_fully_complete = (annotated_sentences == candidate_count and unannotated_sentences == 0)

    print("\n" + "=" * 75)
    if is_structurally_clean and is_fully_complete:
        print("  STATUS: VALIDATION PASSED (100% COMPLETE & STRUCTURALLY CLEAN)")
        print("  Dataset is ready for independent evaluation.")
        print("=" * 75)
        return True, {
            "status": "PASS",
            "total_sentences": total_sentences,
            "annotated_sentences": annotated_sentences,
            "entity_counts": dict(entity_counts)
        }
    else:
        print("  STATUS: NOT READY / INCOMPLETE")
        if not is_fully_complete:
            print(f"  Annotation pending: {unannotated_sentences}/{candidate_count} sentences remain unannotated.")
            print(f"  Use 'ner/data/human_gold/annotation_tool.html' or edit 'human_gold_template.jsonl' to complete manual annotation.")
        print("=" * 75)
        return False, {
            "status": "INCOMPLETE" if is_structurally_clean else "ERRORS",
            "total_sentences": total_sentences,
            "annotated_sentences": annotated_sentences,
            "unannotated_sentences": unannotated_sentences,
            "entity_counts": dict(entity_counts)
        }

if __name__ == '__main__':
    validate_human_gold()
