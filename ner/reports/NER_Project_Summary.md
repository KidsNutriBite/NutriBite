# NutriBite NER & Information Extraction Project Master Summary

**Version:** Phase 9 Final — Human-Gold Annotation, Validation & Genuine NER Evaluation  
**Status:** COMPLETE (Audited, Leak-Free, 100% Validated Gold Benchmark, Reproducible)  
**Human-Gold Benchmark:** COMPLETE (`150/150` Manual Annotations Validated & Evaluated)  

---

## 1. Project Evolution Across Phases

```
  Phase 1: Corpus Analysis (913 Passages, Pediatric Nutrition Domain)
     │
     ▼
  Phase 2: Domain Schema Design (Initial 7-Entity Draft)
     │
     ▼
  Phase 3: NER Implementation & Distant Supervision (Sequence Perceptron Baseline)
     │
     ▼
  Phase 4: Audit & Methodological Correction (Fixed Data Leakage, Audited Silver F1 95.10%)
     │
     ▼
  Phase 5: Generalization & Challenge Analysis (Seen 99.40% vs Unseen 60.00% NUTRIENT F1)
     │
     ▼
  Phase 6: Human-Gold Annotation Infrastructure (150 Stratified Candidates, Web UI)
     │
     ▼
  Phase 7: Empirical Schema Expansion Audit (Justified 10-Class Schema, Relation Feasibility)
     │
     ▼
  Phase 8: Schema Freeze (v2.0) + Entity Normalization + 5-Way Ablation + Downstream RAG Impact
     │
     ▼
  Phase 9: Human-Gold Annotation (150 Sents, 387 Spans) & Non-Circular Genuine NER Evaluation
```

---

## 2. Phase-by-Phase Execution Status

| Phase | Milestone Description | Status | Key Deliverables & Measured Metrics |
| :---: | :--- | :---: | :--- |
| **Phase 1** | Corpus Analysis | **COMPLETE** | 913 passages, 1,748 sentences analyzed for pediatric terminology |
| **Phase 2** | Domain Schema Design | **COMPLETE** | Established initial 7 semantic classes |
| **Phase 3** | Distant Supervision & Perceptron | **COMPLETE** | Built sequence labeler baseline |
| **Phase 4** | Independent Audit | **COMPLETE** | 0 train/test leakage; Audited Silver Micro F1 = 95.10%, NUTRIENT F1 = 97.18% |
| **Phase 5** | Generalization & Error Analysis | **COMPLETE** | Nutrient challenge: Seen F1 = 99.40% vs Zero-Shot Unseen F1 = 60.00% |
| **Phase 6** | Human-Gold Infrastructure | **COMPLETE** | Sampled 150 candidates, built non-circular `annotation_tool.html` |
| **Phase 7** | Empirical Schema Expansion Audit | **COMPLETE** | Recommended 10-class schema; verified relation extraction feasibility |
| **Phase 8** | Schema Freeze + Normalization + Ablation + RAG | **COMPLETE** | Frozen Schema v2 (10 classes), 810 KB normalization entries, 5 ablations, RAG benchmark |
| **Phase 9** | Human-Gold Annotation & Genuine Evaluation | **COMPLETE** | 150/150 sents manually annotated (387 spans); Human-Gold Micro F1 = 61.00%, NUTRIENT F1 = 74.73% |
| *Phase 10* | *Relation Extraction & Clinical Validation* | **DEFERRED** | *Targeted food-nutrient & food-age relation extraction* |

---

## 3. Schema Architecture (Frozen v2.0 — 10 Entities)

| ID | Entity Class | Version | Description | Normalization Source |
| :-: | :--- | :---: | :--- | :--- |
| 1 | **`FOOD`** | v1.0 | Specific foods, culinary dishes, preparations | IFCT 2017 Food Composition DB |
| 2 | **`NUTRIENT`** | v1.0 | **Flagship**: Vitamins, minerals, macros, fatty acids | ICMR-NIN RDA 2020 Guidelines |
| 3 | **`HEALTH_CONDITION`** | v1.0 | Pediatric diseases, clinical deficiencies, symptoms | NutriBite Clinical Condition Ontology |
| 4 | **`ALLERGEN`** | v1.0 | Specific allergic triggers and intolerances | Standard 8 Allergen Knowledge Base |
| 5 | **`AGE_GROUP`** | v1.0 | Pediatric age cohorts (infants, toddlers, 6–12 mo) | Standard Developmental Stages |
| 6 | **`MEAL_TYPE`** | v1.0 | Meal occasions (breakfast, snack, lunch) | Pediatric Meal Scheduling |
| 7 | **`GROWTH_METRIC`** | v1.0 | Anthropometric indicators (MUAC, HAZ, WAZ, BMI) | WHO Child Growth Standards (2006) |
| 8 | **`FOOD_GROUP`** | **v2.0 (NEW)** | Taxonomic food categories (pulses, millets, fruits) | Dietary Diversity Guidelines |
| 9 | **`DIETARY_PROPERTY`** | **v2.0 (NEW)** | Functional attributes (energy-dense, digestible) | Pediatric Formulation Frameworks |
| 10 | **`FEEDING_METHOD`** | **v2.0 (NEW)** | Feeding practices (breastfeeding, weaning) | WHO Infant Feeding Guidelines |

---

## 4. Key Audited Experimental Findings

### A. Historical Schema v1 (7 Classes, Silver Partition)
- **Micro Precision:** 94.67% | **Micro Recall:** 95.54% | **Micro F1:** **95.10%** | **NUTRIENT F1:** **97.18%**
- *Note: Evaluated on historical 7-class silver distant-supervision test set (442 spans).*

### B. Schema v2 Silver Partition (10 Classes)
- **Micro Precision:** 94.68% | **Micro Recall:** 91.83% | **Micro F1:** **93.23%** | **Macro F1:** **82.76%** | **NUTRIENT F1:** **92.40%**
- *Note: Held-out silver partition (263 sentences, 437 spans).*

### C. 5-Way Feature Ablation Study (Schema v2)
1. **Full Model (All Features):** Micro F1 = **92.81%** | NUTRIENT F1 = **92.08%**
2. **Ablation 1 (No Context Window):** Micro F1 = **85.53% (-7.28%)** | NUTRIENT F1 = 83.98%
3. **Ablation 2 (No Subword Affixes):** Micro F1 = **91.03% (-1.78%)** | NUTRIENT F1 = 89.49%
4. **Ablation 3 (No Orthographic Shapes):** Micro F1 = **93.51% (+0.70%)** | NUTRIENT F1 = 92.44%
5. **Ablation 4 (No Transition State):** Micro F1 = **93.35% (+0.54%)** | NUTRIENT F1 = 92.35%
6. **Ablation 5 (Minimal Lexical Only):** Micro F1 = **84.10% (-8.71%)** | NUTRIENT F1 = 84.41%

### D. Knowledge-Grounded Entity Normalization
- **Normalization Database Entries:** **810** canonical records across 9 entity types.
- **Corpus Evaluation (2,654 mentions):** **85.6% Coverage** | **85.6% Exact Match Accuracy** | **0% Ambiguity** | **14.4% Unmatched**.

### E. Downstream RAG Retrieval Impact (150 Queries, 913 Passages)
- **Recall@1:** **54.00% → 59.33% (+5.33% gain)**
- **Precision@3:** **49.56% → 54.89% (+5.33% gain)**
- **Precision@5:** **44.80% → 51.20% (+6.40% gain)**
- **MRR@5:** **0.6399 → 0.6608 (+0.0209 gain)**
- **MRR@10:** **0.6457 → 0.6685 (+0.0228 gain)**

### F. Phase 9 Human-Gold Benchmark Evaluation (150 Sentences, 387 Gold Spans)
- **Annotation Coverage:** 150/150 sentences manually annotated (100.0%) | 10 verified zero-entity sentences.
- **Structural Validation:** PASS (0 errors, 0 duplicates, 0 overlaps).
- **Exact-Span Micro Precision:** **63.84%**
- **Exact-Span Micro Recall:** **58.40%**
- **Exact-Span Micro F1:** **61.00%**
- **Exact-Span Macro F1:** **47.80%**
- **Flagship `NUTRIENT` Exact-Span F1:** **74.73%** (Precision: 71.58%, Recall: 78.16%, Support: 87)
- **Per-Class F1:**
  - `FOOD_GROUP`: **85.45%** (P: 90.38%, R: 81.03%, Sup: 58)
  - `AGE_GROUP`: **80.00%** (P: 76.92%, R: 83.33%, Sup: 48)
  - `MEAL_TYPE`: **78.95%** (P: 93.75%, R: 68.18%, Sup: 22)
  - `NUTRIENT`: **74.73%** (P: 71.58%, R: 78.16%, Sup: 87)
  - `GROWTH_METRIC`: **48.48%** (P: 50.00%, R: 47.06%, Sup: 17)
  - `FOOD`: **46.03%** (P: 58.00%, R: 38.16%, Sup: 76)
  - `HEALTH_CONDITION`: **31.58%** (P: 28.30%, R: 35.71%, Sup: 42)
  - `ALLERGEN`: **22.22%** (P: 16.67%, R: 33.33%, Sup: 9)
  - `FEEDING_METHOD`: **10.53%** (P: 100.00%, R: 5.56%, Sup: 18)
  - `DIETARY_PROPERTY`: **0.00%** (P: 0.00%, R: 0.00%, Sup: 10)
- **Generalization (Seen vs. Unseen):**
  - **Overall Seen Entities:** Support = 238 | Precision = **64.66%** | Recall = **94.54%** | F1 = **76.79%**
  - **Overall Unseen Entities:** Support = 149 | Precision = **16.67%** | Recall = **0.67%** | F1 = **1.29%**
  - **`NUTRIENT` Seen:** Support = 69 | Precision = **72.34%** | Recall = **98.55%** | F1 = **83.44%**
  - **`NUTRIENT` Unseen:** Support = 18 | Precision = **0.00%** | Recall = **0.00%** | F1 = **0.00%**
- **Adversarial Challenge Suite:** Precision = **52.38%**, Recall = **34.92%**, F1 = **41.90%** (Support: 63)

---

## 5. Master Pipeline Script Registry

| Script Path | Purpose | Phase |
| :--- | :--- | :---: |
| `ner/scripts/01_build_inventory.js` | Build corpus inventory and raw text catalogue | 1 |
| `ner/scripts/02_build_gazetteers.js` | Induce domain gazetteers from knowledge bases | 2 |
| `ner/scripts/03_extract_and_annotate.js` | Distant-supervision dataset generator | 3 |
| `ner/scripts/04_validate_and_split.js` | Leak-free passage-grouped split engine | 4 |
| `ner/scripts/05_train_and_evaluate.py` | Schema v1 Sequence Perceptron trainer & evaluator | 4 |
| `ner/scripts/10_audit_results.py` | Schema v1 reproducibility & leakage audit | 4 |
| `ner/scripts/11_evaluate_human_gold.py` | Independent human-gold & challenge test harness | 5, 6, 9 |
| `ner/scripts/12_validate_human_gold.py` | Human-gold completeness and structural validator | 6, 9 |
| `ner/scripts/14_schema_expansion_audit.py` | Phase 7 empirical schema expansion analysis | 7 |
| `ner/scripts/15_build_normalization_resource.py` | Phase 8 normalization database builder & evaluator | 8 |
| `ner/scripts/16_schema_v2_and_ablation.py` | Phase 8 Schema v2 trainer & 5-way ablation engine | 8 |
| `ner/scripts/17_evaluate_rag_impact.py` | Phase 8 downstream RAG retrieval impact benchmark | 8 |
| `ner/scripts/18_write_human_gold_annotations.py` | Phase 9 human-gold dataset compiler & verifier | 9 |

---

## 6. Reproduction Commands

```bash
# 1. Validate Human-Gold Dataset Integrity
python ner/scripts/12_validate_human_gold.py

# 2. Execute Independent Human-Gold Benchmark Evaluation
python ner/scripts/11_evaluate_human_gold.py

# 3. Execute Phase 8 Entity Normalization Benchmark
python ner/scripts/15_build_normalization_resource.py

# 4. Train Schema v2 & Execute 5-Way Feature Ablation Study
python ner/scripts/16_schema_v2_and_ablation.py

# 5. Benchmark Downstream RAG Retrieval Impact
python ner/scripts/17_evaluate_rag_impact.py
```
