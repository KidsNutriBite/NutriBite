# Phase 7 — Research-Level Schema Audit

**Project:** NutriBite Pediatric Nutrition NLP System  
**Task:** Evidence-Based Schema Expansion Audit & Research IE Architecture Design  
**Date:** September 2026  
**Status:** Completed & Validated  

---

## 1. Objective

The objective of Phase 7 is to conduct a rigorous, evidence-based audit of the NutriBite Named Entity Recognition schema to determine whether and how it should be expanded into a richer, research-level pediatric nutrition Information Extraction (IE) framework.

In accordance with strict scientific principles:
* No existing model code or datasets were modified during this phase.
* No annotations or performance metrics were fabricated.
* The analysis is grounded strictly in empirical counts from the 1,748 natural sentences and structured databases.

---

## 2. Current Schema

The current system operates on a 7-entity schema:
1. **`FOOD`:** Specific food items, dishes, and culinary preparations.
2. **`NUTRIENT`:** Vitamins, minerals, macronutrients, fatty acids, and dietary fiber (Flagship).
3. **`HEALTH_CONDITION`:** Pediatric diseases, deficiencies, and growth failure pathologies.
4. **`ALLERGEN`:** Food substances acting as allergic triggers or intolerances.
5. **`AGE_GROUP`:** Developmental cohorts and age intervals.
6. **`MEAL_TYPE`:** Diurnal meal occasions and feeding times.
7. **`GROWTH_METRIC`:** Anthropometric measurements and growth indices.

---

## 3. Current Corpus Evidence

Across the 1,748 natural language sentences in the corpus:

| Entity Label | Mentions | Unique Forms | Passages | Sentences | Multi-Word % | Empirical Support Tier |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **`NUTRIENT`** | **1,042** | **56** | **454** | **574** | **25.6%** | **Very High Support (Flagship)** |
| **`FOOD`** | **681** | **62** | **327** | **388** | **16.3%** | **High Support** |
| **`AGE_GROUP`** | **535** | **27** | **430** | **468** | **4.9%** | **High Support** |
| **`HEALTH_CONDITION`** | **295** | **54** | **219** | **233** | **16.3%** | **Moderate Support** |
| **`MEAL_TYPE`** | **57** | **9** | **49** | **55** | **7.0%** | **Low-to-Moderate Support** |
| **`GROWTH_METRIC`** | **51** | **26** | **27** | **32** | **66.7%** | **Low Support (Sparse)** |
| **`ALLERGEN`** | **50** | **19** | **37** | **42** | **86.0%** | **Low Support (Sparse)** |

---

## 4. Candidate Additional Entities

We systematically audited 15 candidate concepts:
`FOOD_GROUP`, `FEEDING_METHOD`, `DIETARY_PROPERTY`, `DEFICIENCY`, `NUTRITION_GOAL`, `RECOMMENDATION`, `SUPPLEMENT`, `DIETARY_RESTRICTION`, `PORTION`, `COOKING_METHOD`, `ANTHROPOMETRIC_MEASURE`, `BODY_MEASURE`, `FOOD_PREPARATION`, `AGE_RANGE`, `DIET_PATTERN`.

---

## 5. Candidate Statistics

| Candidate Entity | Occurrences | Unique Forms | Documents | Sentences | Multiword % | Ambiguity Level | Downstream Utility |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`FOOD_GROUP`** | **374** | **15** | **171** | **197** | 13.6% | Low | **High** |
| **`FOOD_PREPARATION`** | **199** | **12** | **115** | **126** | 0.0% | Medium | Medium |
| **`DIETARY_PROPERTY`** | **129** | **15** | **93** | **100** | 37.2% | Low-Med | **High** |
| **`FEEDING_METHOD`** | **66** | **6** | **56** | **57** | 36.4% | Low | **High** |
| **`DEFICIENCY`** | **50** | **10** | **42** | **44** | 100.0% | Low | Medium |
| **`DIETARY_RESTRICTION`**| **43** | **5** | **34** | **39** | 34.9% | Medium | Medium |
| **`COOKING_METHOD`** | **33** | **7** | **24** | **29** | 6.1% | Low | Low |
| **`ANTHROPOMETRIC_MEASURE`**| **29** | **10** | **18** | **21** | 96.6% | Low | Redundant |
| **`RECOMMENDATION`** | **26** | **5** | **22** | **24** | 30.8% | High | Low |
| **`AGE_RANGE`** | **26** | **8** | **23** | **24** | 100.0% | Low | Redundant |
| **`NUTRITION_GOAL`** | **22** | **6** | **20** | **21** | 100.0% | High | Low |
| **`PORTION`** | **20** | **4** | **18** | **20** | 5.0% | Low | Low |
| **`BODY_MEASURE`** | **9** | **3** | **9** | **9** | 100.0% | Low | Redundant |
| **`SUPPLEMENT`** | **6** | **3** | **5** | **6** | 33.3% | Medium | Low |
| **`DIET_PATTERN`** | **6** | **2** | **6** | **6** | 0.0% | High | Low |

---

## 6. Recommended Entities (Group A)

1. **`FOOD_GROUP` (374 mentions | 171 docs):** Strongly supported; separates broad food groups (*pulses, cereals, green leafy vegetables*) from specific dishes (*khichdi, curd*); enables WHO IYCF dietary diversity tracking.
2. **`DIETARY_PROPERTY` (129 mentions | 93 docs):** High clinical utility; captures critical pediatric meal texture and density attributes (*energy-dense, nutrient-rich, easily digestible, fortified*).
3. **`FEEDING_METHOD` (66 mentions | 56 docs):** Captures developmental feeding practices (*exclusive breastfeeding, complementary feeding, finger foods, responsive feeding*).

---

## 7. Rejected Entities (Group C)

* **Redundant:** `ANTHROPOMETRIC_MEASURE`, `BODY_MEASURE` (identical to `GROWTH_METRIC`), `AGE_RANGE` (identical to `AGE_GROUP`).
* **High Boundary Ambiguity:** `RECOMMENDATION`, `NUTRITION_GOAL` (clause-level phrases, not atomic entity spans).
* **Sparse Support:** `SUPPLEMENT` (6 mentions), `DIET_PATTERN` (6 mentions), `PORTION` (20 mentions).

---

## 8. Recommended Final Schema (10 Entities)

Following the **Principle of Parsimony**, we recommend expanding the schema from **7 to 10 entities**:

$$\mathbf{10\ \text{Entity Schema}} = \text{NUTRIENT} + \text{FOOD} + \mathbf{FOOD\_GROUP} + \mathbf{DIETARY\_PROPERTY} + \mathbf{FEEDING\_METHOD} + \text{HEALTH\_CONDITION} + \text{ALLERGEN} + \text{AGE\_GROUP} + \text{MEAL\_TYPE} + \text{GROWTH\_METRIC}$$

---

## 9. NUTRIENT Contribution

`NUTRIENT` remains the core flagship entity:
* Most frequent category in the corpus (1,042 mentions, 38.4% density).
* Central to clinical deficiency prevention, RDA target matching, and RAG knowledge retrieval.
* General-purpose NER systems (BERT/SpaCy) achieve **0% coverage** on `NUTRIENT`.

---

## 10. Boundary and Nested-Entity Analysis

* **Precedence Rule:** $\text{HEALTH\_CONDITION} > \text{ALLERGEN} > \text{GROWTH\_METRIC} > \text{NUTRIENT} > \text{FOOD\_GROUP} > \text{FOOD} > \text{MEAL\_TYPE} > \text{AGE\_GROUP}$.
* **Quantity Boundaries:** In `"400 IU vitamin D"`, `"400 IU"` is left unannotated; `"vitamin D"` is labeled as `NUTRIENT`.
* **Dishes vs Groups:** In `"moong dal khichdi"`, entire dish is `FOOD`; `"pulses"` is `FOOD_GROUP`.

---

## 11. Relation Extraction Feasibility

* **Feasible Relations:**
  * `FOOD -> CONTAINS -> NUTRIENT` (70 explicit natural language matches).
  * `FOOD -> SUITABLE_FOR -> AGE_GROUP` (335 explicit natural language matches).
* **Infeasible Relations:** `FOOD -> TRIGGERS -> ALLERGEN` and `HEALTH_CONDITION -> ASSOCIATED_WITH -> NUTRIENT` are stated implicitly or across multi-clause discourse in guidelines.
* **Verdict:** Targeted relation extraction is **FEASIBLE** for food-nutrient and food-age pairs.

---

## 12. Proposed Research Experiments

1. **EXP-1:** Silver Test Evaluation (Completed: 95.10% F1).
2. **EXP-2:** Human-Gold Evaluation (Pending manual annotation of 150 sentences).
3. **EXP-3:** Seen vs Unseen Generalization (Completed: 99.40% vs 60.00%).
4. **EXP-4:** Gazetteer Baseline Audit (Completed: 98.86% F1, circular).
5. **EXP-5:** General NER Coverage Audit (Completed: 0.00% coverage).
6. **EXP-6:** Comprehensive Feature Ablation Study (Planned for Phase 8).
7. **EXP-7:** Adversarial Challenge Testing (Completed: 45.71% F1).
8. **EXP-8:** Downstream RAG Retrieval Impact Benchmark (Planned for Phase 8).
9. **EXP-9:** Targeted Relation Extraction Benchmark (Planned for Phase 8).

---

## 13. Proposed End-to-End Pipeline

```
Unstructured Pediatric Text
            ↓
Sequence Labeling (10-Entity NER Perceptron)
            ↓
Independent Human-Gold Benchmark & Diagnostic Challenge Suite
            ↓
Entity Normalization (IFCT 2017 & ICMR Codes)
            ↓
Targeted Relation Extraction (Food-to-Nutrient & Food-to-Age)
            ↓
Structured Pediatric Nutrition Knowledge Graph
            ↓
RAG Query Enrichment & Safety Validation
            ↓
NutriBite Clinical Decision Support
```

---

## 14. Limitations

1. Base model training currently relies on distant supervision.
2. Sparse classes (`ALLERGEN`, `GROWTH_METRIC`, `FEEDING_METHOD`) require careful partitioning or targeted augmentation.
3. Single-layer BIO models cannot represent overlapping nested clinical concepts.

---

## 15. Recommended Phase 8

* **Phase 8 Focus:** Implement **Option B + Selective Option C** (Entity Normalization linking text spans to IFCT/ICMR tables + Feature Ablation Study + Downstream RAG Retrieval Impact Benchmark).
