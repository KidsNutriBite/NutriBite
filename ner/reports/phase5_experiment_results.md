# Phase 5 NER Evaluation & Comparative Experiment Results

This report provides the full experimental evaluation of the NutriBite domain-specific NER system, clearly separating **silver distant-supervision test performance** from **independent evaluation** and **gazetteer baseline**.

---

## 1. Primary Evaluation Benchmark Table

| Evaluation Setting | Evaluation Dataset | Annotation Nature | Model Architecture | Micro Precision | Micro Recall | Micro F1 | NUTRIENT F1 | Independent Evidence? |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Silver Test Evaluation** | `test.jsonl` (263 sents) | Silver (Distant Supervision) | Averaged Sequence Perceptron | 95.86% | 94.34% | **95.10%** | **97.18%** | **NO** (Silver-label bias) |
| **Gazetteer Baseline** | `test.jsonl` (263 sents) | Silver (Distant Supervision) | Exact & Alias Dictionary Match | 99.54% | 98.19% | 98.86% | 99.14% | **NO** (Circular: gazetteer created silver labels) |
| **Nutrient Challenge Suite** | `nutrient_challenge.jsonl` (25 sents) | Gold Challenge Set | Averaged Sequence Perceptron | 57.14% | 38.10% | **45.71%** | Evaluated Below | **YES** (Adversarial stress test) |
| **General NER Coverage** | Pediatric Nutrition Text | N/A (Standard CoNLL / OntoNotes) | General Pretrained NER (BERT/SpaCy) | N/A | N/A | **0.00%** | **0.00%** | **YES** (Category not supported) |
| **Independent Human-Gold** | `human_gold.jsonl` (150 sents) | Manual Human Annotation | Averaged Sequence Perceptron | *Pending Annotation* | *Pending Annotation* | *Pending Annotation* | *Pending Annotation* | **YES** (Awaiting manual annotation) |

---

## 2. Seen vs Unseen NUTRIENT Generalization

Because distant supervision relies on gazetteers, we evaluated whether the model generalizes to surface forms not seen in the 1,223 training sentences:

| NUTRIENT Surface Form | Test Spans (Support) | Span Precision | Span Recall | Exact F1 Score |
| :--- | :---: | :---: | :---: | :---: |
| **Seen in Training Data** | 167 spans (98.9%) | 99.40% | 99.40% | **99.40%** |
| **Unseen in Training Data** | 7 spans (1.1%) | 46.15% | 85.71% | **60.00%** |

> [!WARNING]
> **Generalization Limitation:** The held-out silver test partition contains 98.9% seen nutrient surface forms. High distant-supervision F1 (97.18%) primarily measures memorization and contextual boundary tagging of known nutrients rather than out-of-vocabulary zero-shot generalization.

---

## 3. General NER vs Domain NER Analysis

* General NER models (e.g., standard `bert-base-NER` trained on CoNLL-2003 or OntoNotes) provide entities such as `PERSON`, `ORGANIZATION`, `LOCATION`, `DATE`, `GPE`.
* **Zero Domain Coverage:** None of these models define or recognize `NUTRIENT`, `FOOD`, `ALLERGEN`, `GROWTH_METRIC`, or `MEAL_TYPE`.
* General NER models cannot be evaluated as an F1 baseline against pediatric nutrition targets because the entity categories are **completely absent from their schemas**.
* The previously reported "5-word heuristic baseline" in Phase 3 is explicitly acknowledged as a keyword coverage demonstration, not a true general NER baseline.

---

## 4. Methodological Corrections Maintained
- Silver span counts verified: Train = 1,851 | Val = 418 | Test = 442.
- Data Leakage: 0 exact sentence overlaps, 0 passage ID overlaps.
- BIO Integrity: 0 illegal tag transitions.
- Gazetteer Circularity: Explicitly documented and uncoupled from model superiority claims.
