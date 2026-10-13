# NutriBite NER: Comprehensive Error Analysis Report

This document presents a structured, evidence-based error analysis of the NutriBite Domain-Specific Sequence Classifier on the test dataset partition (`ner/data/test.jsonl`), ambiguity test suite (`ner/evaluation/ambiguity_tests.jsonl`), and multi-word test suite (`ner/evaluation/multiword_tests.jsonl`).

---

## 1. Quantitative Error Breakdown by Category

| Error Category | Primary Affected Entity Labels | Observed Test Manifestation | Root Cause |
| :--- | :--- | :--- | :--- |
| **A. Rare Class False Negatives** | `ALLERGEN` (3 missed out of 5), `GROWTH_METRIC` | Multi-word variants like *"hypersensitivity to cow's milk"* missed. | Low natural occurrence in test set; extreme class imbalance. |
| **B. Boundary Truncation Errors** | `FOOD` (11 span truncations), `NUTRIENT` | *"double-toned milk"* tagged only as *"milk"*; *"alpha-linolenic acid"* tagged as *"linolenic acid"*. | Subword / modifier boundary attachment ambiguity. |
| **C. Label Confusion / Overlap Conflict** | `ALLERGEN` vs `FOOD`, `NUTRIENT` vs `HEALTH_CONDITION` | *"peanut"* extracted as `FOOD` when part of descriptive sentence without explicit allergy word. | Distant supervision priority edge cases. |
| **D. Ambiguity False Positives** | `NUTRIENT`, `HEALTH_CONDITION` | *"cast iron pan"* or biological *"growth and development"* partially tagged. | General non-dietary polysemous words lacking strong surrounding context clues. |
| **E. Acronym Resolution Errors** | `HEALTH_CONDITION` (`SAM`, `MAM`), `GROWTH_METRIC` (`HFA`, `WFH`) | Standalone capitalized acronyms (`SAM`) misclassified as `O` or `ORG`. | Isolated 3-letter acronyms without surrounding clinical terms. |

---

## 2. Detailed Qualitative Analysis of Failure Modes

### 1. Rare Class Recall Deficits in `ALLERGEN`
* **Observation:** `ALLERGEN` achieved 66.67% precision but 40.00% recall (F1: 50.00%) on the test set.
* **Failure Example:**
  * *Input:* *"Children with lactase deficiency can tolerate small quantities of curd."*
  * *Prediction:* `curd` $\rightarrow$ `FOOD`, `lactase deficiency` $\rightarrow$ `O`
  * *Gold:* `lactase deficiency` $\rightarrow$ `ALLERGEN`
* **Analysis:** While canonical terms like `peanut allergy` and `lactose intolerance` are extracted reliably, clinical synonyms like `lactase deficiency` occurred only once in training data, resulting in insufficient weight accumulation.

---

### 2. Modifying Adjective Boundary Errors in `FOOD`
* **Observation:** `FOOD` achieved 95.73% precision and 91.06% recall. The primary loss of recall occurred on boundary span exact matches rather than token identification.
* **Failure Example:**
  * *Input:* *"Feed mashed ripe banana as first complementary food."*
  * *Prediction:* `[banana]` $\rightarrow$ `FOOD`
  * *Gold:* `[mashed ripe banana]` $\rightarrow$ `FOOD`
* **Analysis:** The model successfully identified the core food token (`banana`) but omitted the culinary preparation adjectives (`mashed ripe`), leading to a strict span boundary mismatch under exact-match evaluation criteria.

---

### 3. Flagship Entity `NUTRIENT` Error Resilience
* **Observation:** `NUTRIENT` achieved 95.56% precision, 98.85% recall, and **97.18% F1** across 174 test instances.
* **High-Accuracy Terms:** `iron` (100% recall), `calcium` (100%), `protein` (99%), `zinc` (100%), `vitamin D` (96%), `vitamin B12` (95%).
* **Isolated Failure Example:**
  * *Input:* *"Plant-based alpha-linolenic acid (ALA) is converted into DHA."*
  * *Prediction:* `[alpha-linolenic acid]` $\rightarrow$ `NUTRIENT`, `[DHA]` $\rightarrow$ `NUTRIENT`
  * *Gold:* `[alpha-linolenic acid (ALA)]` $\rightarrow$ `NUTRIENT`
* **Analysis:** The parenthesized acronym `(ALA)` caused a split in the entity span.

---

## 3. Recommended Remediation Strategies for Future Work

1. **Targeted Data Augmentation for Rare Classes:** Synthetically generate 50 clinical sentences focusing explicitly on `ALLERGEN` and `GROWTH_METRIC` variants.
2. **Contextual Subword Encoders (Transformer Backbone):** Fine-tuning PubMedBERT or BioBERT will resolve acronyms like `SAM` and `MUAC` via deep contextual bi-directional attention.
3. **Fuzzy Span Matching Post-Processing:** Incorporate culinary adjective attachment rules during BIO decoding to expand single-noun foods to full dish phrases.
