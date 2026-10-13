"""
Phase 5: Dynamic NER Dataset Generation Engine
==============================================
Builds the isolated 13-entity dynamic NER dataset:
- Base: Schema v2 partitions (10 frozen baseline entities)
- Augmentation: 156 clinician-accepted dynamic candidates from
  ai-service-v2/datasets/validated_candidates.json
  (COOKING_METHOD, SUPPLEMENT, DIET_PATTERN)
- Output directory: ner/data/dynamic_v1/
  - train.jsonl
  - validation.jsonl
  - test.jsonl
  - dataset_statistics.json

Strict constraints:
- Preserves valid BIO transitions without orphaned I- tags
- Prevents overlapping/duplicate spans
- Zero partition leakage (document-level separation preserved)
- Never modifies existing schema_v2 or human-gold files
"""

import os
import sys
import json
import re
from collections import defaultdict, Counter

sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)


def load_jsonl(path: str):
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def save_jsonl(records, path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")


def align_tokens_to_char_spans(text: str, tokens: list):
    curr_pos = 0
    spans = []
    for t in tokens:
        idx = text.find(t, curr_pos)
        if idx != -1:
            spans.append((idx, idx + len(t)))
            curr_pos = idx + len(t)
        else:
            spans.append((curr_pos, curr_pos + len(t)))
            curr_pos += len(t)
    return spans


def generate_bio_tags(text: str, tokens: list, entities: list):
    tok_spans = align_tokens_to_char_spans(text, tokens)
    bio = ["O"] * len(tokens)
    
    # Sort entities by start character
    sorted_ents = sorted(entities, key=lambda x: x["start"])
    for e in sorted_ents:
        e_st, e_end, lbl = e["start"], e["end"], e["label"]
        first = True
        for t_idx, (t_s, t_e) in enumerate(tok_spans):
            # Token falls within or overlaps with entity span
            if t_s >= e_st and t_e <= e_end:
                if first:
                    bio[t_idx] = f"B-{lbl}"
                    first = False
                else:
                    bio[t_idx] = f"I-{lbl}"
    return bio


def validate_bio_sequence(bio_tags: list) -> bool:
    prev = "O"
    for tag in bio_tags:
        if tag.startswith("I-"):
            needed = tag[2:]
            if prev != f"B-{needed}" and prev != f"I-{needed}":
                return False
        prev = tag
    return True


def build_dynamic_v1_datasets():
    print("=" * 75)
    print("  PHASE 5: BUILDING 13-ENTITY DYNAMIC NER DATASETS (dynamic_v1)")
    print("=" * 75)

    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    schema_v2_dir = os.path.join(repo_root, "ner", "data", "schema_v2")
    out_dir = os.path.join(repo_root, "ner", "data", "dynamic_v1")
    validated_path = os.path.join(repo_root, "ai-service-v2", "datasets", "validated_candidates.json")

    if not os.path.exists(validated_path):
        raise FileNotFoundError(f"Validated candidates file not found at: {validated_path}")

    with open(validated_path, "r", encoding="utf-8") as f:
        val_data = json.load(f)

    accepted_candidates = val_data.get("validated_candidates", [])
    print(f"Loaded {len(accepted_candidates)} accepted dynamic candidates from {validated_path}")
    cand_counts_by_ent = Counter([c["entity_id"] for c in accepted_candidates])
    print(f"Accepted candidate breakdown: {dict(cand_counts_by_ent)}")

    dataset_stats = {
        "schema_version": "2.1.0",
        "entity_classes": [
            "FOOD", "NUTRIENT", "HEALTH_CONDITION", "ALLERGEN", "AGE_GROUP",
            "MEAL_TYPE", "GROWTH_METRIC", "FOOD_GROUP", "DIETARY_PROPERTY",
            "FEEDING_METHOD", "COOKING_METHOD", "SUPPLEMENT", "DIET_PATTERN"
        ],
        "accepted_candidates_used": len(accepted_candidates),
        "splits": {},
        "totals": Counter()
    }

    # Process each partition: train, validation, test
    for split in ["train", "validation", "test"]:
        in_path = os.path.join(schema_v2_dir, f"{split}.jsonl")
        records = load_jsonl(in_path)
        print(f"\nProcessing {split} split ({len(records)} base records)...")

        text_to_rec = {r["text"].strip(): r for r in records}
        doc_to_recs = defaultdict(list)
        for r in records:
            doc_to_recs[r.get("source_record_id")].append(r)

        added_dynamic_counts = Counter()
        matched_candidates = 0

        for c in accepted_candidates:
            ctext = c["context"].strip()
            cdoc = c.get("source_document")
            cand_text = c["candidate_text"].strip()
            lbl = c["entity_id"]

            target_r = text_to_rec.get(ctext)
            if not target_r and cdoc in doc_to_recs:
                for r in doc_to_recs[cdoc]:
                    if cand_text.lower() in r["text"].lower():
                        target_r = r
                        break

            if not target_r:
                continue

            matched_candidates += 1
            txt = target_r["text"]

            # Exact word-boundary span matching
            pattern = rf"\b{re.escape(cand_text)}\b"
            m = re.search(pattern, txt, re.IGNORECASE)
            if not m:
                m = re.search(re.escape(cand_text), txt, re.IGNORECASE)

            if not m:
                continue

            st, end = m.start(), m.end()

            # Prevent overlapping spans with existing entities
            existing_ents = target_r.setdefault("entities", [])
            overlap = any(not (end <= e["start"] or st >= e["end"]) for e in existing_ents)

            if not overlap:
                existing_ents.append({
                    "start": st,
                    "end": end,
                    "label": lbl,
                    "text": txt[st:end]
                })
                added_dynamic_counts[lbl] += 1

        # Re-sort entities and generate pristine BIO tags
        augmented_records = []
        split_entity_counts = Counter()
        total_tokens = 0

        for r in records:
            txt = r["text"]
            toks = r["tokens"]
            ents = sorted(r.get("entities", []), key=lambda x: x["start"])
            bio_tags = generate_bio_tags(txt, toks, ents)

            if not validate_bio_sequence(bio_tags):
                raise ValueError(f"Invalid BIO sequence detected in record {r.get('id')}: {bio_tags}")

            for e in ents:
                split_entity_counts[e["label"]] += 1
                dataset_stats["totals"][e["label"]] += 1

            total_tokens += len(toks)

            augmented_records.append({
                "id": r["id"],
                "source_record_id": r.get("source_record_id", "RAG_CORPUS"),
                "text": txt,
                "tokens": toks,
                "bio_tags": bio_tags,
                "entities": ents,
                "schema_version": "2.1.0"
            })

        out_split_path = os.path.join(out_dir, f"{split}.jsonl")
        save_jsonl(augmented_records, out_split_path)

        dataset_stats["splits"][split] = {
            "num_sentences": len(augmented_records),
            "num_tokens": total_tokens,
            "matched_candidates": matched_candidates,
            "added_dynamic_entities": dict(added_dynamic_counts),
            "total_entities_by_class": dict(split_entity_counts),
            "total_entities": sum(split_entity_counts.values())
        }

        print(f"  -> Saved {out_split_path} ({len(augmented_records)} records, {total_tokens} tokens)")
        print(f"  -> Matched candidates: {matched_candidates}")
        print(f"  -> Added dynamic mentions: {dict(added_dynamic_counts)}")
        print(f"  -> Total entities by class: {dict(split_entity_counts)}")

    dataset_stats["totals"] = dict(dataset_stats["totals"])
    dataset_stats["total_entities"] = sum(dataset_stats["totals"].values())
    dataset_stats_path = os.path.join(out_dir, "dataset_statistics.json")
    with open(dataset_stats_path, "w", encoding="utf-8") as f:
        json.dump(dataset_stats, f, indent=2, ensure_ascii=False)

    print(f"\nSaved dataset statistics to: {dataset_stats_path}")
    print("=" * 75)
    print("  DYNAMIC V1 DATASET GENERATION COMPLETE")
    print("=" * 75)
    return dataset_stats


if __name__ == "__main__":
    build_dynamic_v1_datasets()
