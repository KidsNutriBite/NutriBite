# Phase 6 Summary: Human-Gold Annotation & Independent NER Evaluation

**Project:** NutriBite Pediatric Nutrition NLP System  
**Phase:** Phase 6 — Human-Gold Annotation Workflow & Independent Evaluation Engine  
**Date:** September 2026  
**Status:** Infrastructure & Workflow Completed; Awaiting Manual Human Annotations  

---

## 1. Objective

Phase 6 implements a **strictly independent evaluation methodology** for the NutriBite domain-specific NER system. The goal is to ensure that final academic claims are backed by genuine human-annotated gold evaluation data rather than automated distant supervision or circular gazetteer matching.

---

## 2. Annotation Dataset & Infrastructure

1. **Stratified Candidate Corpus:**
   * `ner/data/human_gold/human_gold_candidates.jsonl`: 150 natural-language sentences sampled across 11 balanced linguistic categories (single-word nutrients, multi-word compounds, food items, clinical conditions, allergens, age groups, meal types, growth metrics, polysemy/ambiguity cases, numerical quantities, and negative zero-entity examples).
2. **Interactive Annotation Tool:**
   * `ner/data/human_gold/annotation_tool.html`: A dedicated, responsive HTML/JS annotation tool that enables token span selection, entity label assignment across the 7 domain classes, offset preservation (`text[start:end] === entity_text`), and JSONL export/import.
3. **Rigorous Operational Guidelines:**
   * `ner/data/human_gold/annotation_guidelines.md`: Formally defines span boundaries, excludes quantities from nutrient entities (`400 IU vitamin D` $\rightarrow$ `vitamin D` as `NUTRIENT`), and specifies the flat sequence precedence hierarchy ($\text{HEALTH\_CONDITION} > \text{ALLERGEN} > \text{GROWTH\_METRIC} > \text{NUTRIENT} > \dots$).
4. **Automated Structural & Completeness Validator:**
   * `ner/scripts/12_validate_human_gold.py`: Enforces string slice matching, valid integer offsets, legal label verification, overlap detection, duplicate detection, and completeness auditing.

---

## 3. Annotation & Validation Status

```text
Target Candidate Sentences : 150
Manually Annotated Sents   : 0 (Awaiting human manual input)
Unannotated Sentences      : 150
Annotation Completeness    : NO
Validation Verdict         : NOT READY / INCOMPLETE (Structural checks passed, awaiting manual annotations)
Human-Gold Evaluation      : PENDING
```

> [!IMPORTANT]
> **No Synthetic Shortcuts:** In accordance with rigorous scientific standards, `human_gold.jsonl` has **NOT** been populated using automated distant supervision, gazetteers, or model predictions. The evaluation pipeline remains in a clean `PENDING` state until the human annotator reviews the 150 sentences.

---

## 4. Current Evaluated Performance

| Evaluation Benchmark | Dataset Source | Annotation Nature | Micro Precision | Micro Recall | Micro F1 | NUTRIENT F1 | Independent? | Status |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Silver Test Set** | `test.jsonl` (263 sents) | Distant Supervision | 95.86% | 94.34% | **95.10%** | **97.18%** | No | Verified |
| **Gazetteer Baseline** | `test.jsonl` (263 sents) | Distant Supervision | 99.54% | 98.19% | 98.86% | 99.14% | No (Circular) | Verified |
| **Seen Nutrients** | Silver Test Set (167 spans) | Distant Supervision | 99.40% | 99.40% | **99.40%** | **99.40%** | No | Audited |
| **Unseen Nutrients** | Silver Test Set (7 spans) | Distant Supervision | 46.15% | 85.71% | **60.00%** | **60.00%** | Partial | Audited |
| **Nutrient Challenge** | `nutrient_challenge.jsonl` | Adversarial Gold (25 sents) | 57.14% | 38.10% | **45.71%** | 44.4% (Synonyms) | Yes | Evaluated |
| **Human-Gold Evaluation** | `human_gold.jsonl` (150 sents) | Manual Human Gold | *Pending* | *Pending* | *Pending* | *Pending* | **Yes** | **Ready for Human Input** |

---

## 5. Independent NUTRIENT Evaluation Strategy

Once manual annotations are completed in `human_gold.jsonl`, `11_evaluate_human_gold.py` will compute and report:
* `NUTRIENT Precision`, `NUTRIENT Recall`, `NUTRIENT F1`, and `Support`
* Exact comparison against the silver 97.18% score
* Breakdown of errors across the 9 formal categories (unseen chemical synonyms, polysemy, multi-word truncation, quantity attachment, nested condition conflicts).

---

## 6. Inter-Annotator Agreement Protocol

* **Number of Annotators:** 1 (primary human annotator)
* **Inter-Annotator Agreement (IAA):** Not applicable for single annotator (reported transparently; no fabricated Kappa statistics).

---

## 7. Methodological Limitations Disclosed

1. **Silver Evaluation Bias:** The primary 95.10% micro F1 and 97.18% NUTRIENT F1 are silver distant-supervision scores where 96.0% of test nutrients overlap with training vocabulary.
2. **Circular Gazetteer Score:** The 98.86% gazetteer baseline is circular because the gazetteer generated the distant supervision labels.
3. **Low Class Support:** `ALLERGEN` (5 test spans) and `GROWTH_METRIC` (2 test spans) have wide confidence intervals.

---

## 8. Final Defensible Academic Contribution

> **"We introduce and operationalize a domain-specific NUTRIENT entity category within a dedicated pediatric nutrition NER schema and evaluate its extraction on the NutriBite corpus."**

---

## 9. Next Steps to Complete Phase 6 Evaluation

1. Open `ner/data/human_gold/annotation_tool.html` in a web browser.
2. Annotate the 150 candidate sentences following `annotation_guidelines.md`.
3. Export and save the completed file as `ner/data/human_gold/human_gold.jsonl`.
4. Run validation and evaluation:
   ```bash
   python ner/scripts/12_validate_human_gold.py
   python ner/scripts/11_evaluate_human_gold.py
   ```
