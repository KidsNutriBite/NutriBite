# Phase 9 Reproducibility Manifest & Artifact Provenance

**Project:** NutriBite / NutriKids Pediatric Nutrition NER  
**Phase:** Phase 9 — Human-Gold Annotation, Validation & Genuine NER Evaluation  
**Date of Completion:** September 19, 2026  
**Reproducibility Status:** 100% Deterministic & Reproducible  

---

## 1. Provenance & Artifact Configuration

| Metadata Field | Specification / Value |
| :--- | :--- |
| **Schema Version** | `2.0` (Frozen 10-Entity Hierarchy) |
| **Schema Configuration File** | `ner/config/schema_v2.yaml` |
| **Annotation Guidelines Version** | `2.0` (`ner/data/human_gold/FINAL_ANNOTATION_GUIDELINES.md`) |
| **Gold Dataset Path** | `ner/data/human_gold/human_gold.jsonl` |
| **Candidate Source File** | `ner/data/human_gold/human_gold_candidates.jsonl` |
| **Candidate Count** | 150 Sentences |
| **Annotated Sentence Count** | 150 Sentences (100.0% Coverage) |
| **Total Labeled Entity Spans** | 387 Spans |
| **Verified Zero-Entity Sentences** | 10 Sentences |
| **Annotator Count** | 1 (`domain_expert_v1`) |
| **Inter-Annotator Agreement** | N/A (Single Expert Annotation + Second-Pass Review) |
| **Training Dataset** | `ner/data/schema_v2/train.jsonl` (1,223 sentences, 1,985 spans) |
| **Validation Dataset** | `ner/data/schema_v2/validation.jsonl` (262 sentences, 423 spans) |
| **Silver Test Dataset** | `ner/data/schema_v2/test.jsonl` (263 sentences, 437 spans) |
| **Challenge Suite Dataset** | `ner/data/human_gold/nutrient_challenge.jsonl` (25 sentences, 63 spans) |
| **Model Architecture** | Averaged Sequence Perceptron (BIO-constrained decoding, 8 epochs) |
| **Random Seed** | `42` |
| **Validation Script** | `ner/scripts/12_validate_human_gold.py` |
| **Evaluation Script** | `ner/scripts/11_evaluate_human_gold.py` |
| **Output JSON Results** | `ner/reports/human_gold_evaluation_results.json` |

---

## 2. Validation Execution Command

To execute the structural validation suite:

```bash
python ner/scripts/12_validate_human_gold.py
```

**Expected Result:**
```text
STATUS: VALIDATION PASSED (100% COMPLETE & STRUCTURALLY CLEAN)
Dataset is ready for independent evaluation.
```

---

## 3. Evaluation Execution Command

To train the Schema v2 sequence model and execute independent human-gold evaluation:

```bash
python ner/scripts/11_evaluate_human_gold.py
```

**Expected Metrics:**
* Silver Micro F1: **93.23%**
* Adversarial Challenge Micro F1: **41.90%**
* Human-Gold Exact-Span Micro F1: **61.00%** (Precision: **63.84%**, Recall: **58.40%**)
* Human-Gold Macro F1: **47.80%**
* Human-Gold Flagship `NUTRIENT` F1: **74.73%** (Precision: **71.58%**, Recall: **78.16%**)
* Seen Entity F1: **76.79%** vs. Unseen Entity F1: **1.29%**
