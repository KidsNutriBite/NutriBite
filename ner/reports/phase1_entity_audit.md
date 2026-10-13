# NutriBite RAG Corpus Audit — Dynamic NER Candidate Entities (Phase 1)

**Project:** NutriBite Pediatric Nutrition Intelligence Platform  
**Phase:** Phase 1 — Comprehensive RAG Corpus Entity Audit  
**Date:** September 2026  
**Corpus Scope:** 913 RAG Clinical Knowledge Passages (`rag_data.json`) + 150 User Retrieval Benchmark Queries (`retrieval_dataset.json`) + 1,748 Annotated Sentences (`weak_annotations.jsonl`)  
**Total Examined Sentences:** 1898  
**Total Knowledge Base Passages:** 913  
**Reference Schema:** Frozen 10-Entity Domain Schema (v2.0)  

---

## 1. Executive Summary & Audit Matrix

This empirical audit systematically scans the NutriBite corpus for candidate dynamic NER entity classes. All statistics represent exact keyword and regular expression occurrences without synthetic inflation or heuristic projection.

| Candidate Entity | Total Mentions | Unique Forms | Sentence Count | Sent. Freq (%) | Document Count | Doc. Freq (%) | Multi-Word (%) | Ambiguity with 10 Existing Classes | Status & Decision |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :--- |
| **`COOKING_METHOD`** | **207** | **27** | 141 | 7.43% | 112 | 12.27% | 1.4% | Low semantic ambiguity with existing 10 entities. Minimal boundary overlap ... | **RECOMMENDED (Top Tier)** |
| **`SUPPLEMENT`** | **31** | **8** | 27 | 1.42% | 24 | 2.63% | 16.1% | Moderate overlap with NUTRIENT (e.g. 'iron' in 'iron drops'). However, dist... | **RECOMMENDED (Top Tier)** |
| **`DIET_PATTERN`** | **17** | **4** | 17 | 0.9% | 12 | 1.31% | 100.0% | Moderate overlap with FOOD_GROUP and FEEDING_METHOD. Represents macroscopic... | **RECOMMENDED (Alternative Candidate)** |
| **`DEFICIENCY`** | **62** | **11** | 56 | 2.95% | 33 | 3.61% | 100.0% | High ambiguity / redundancy with HEALTH_CONDITION (e.g., 'iron deficiency a... | **REJECTED (Redundant with HEALTH_CONDITION & NUTRIENT)** |
| **`PORTION`** | **76** | **10** | 69 | 3.64% | 59 | 6.46% | 1.3% | Low semantic domain ambiguity, but acts syntactically as numerical/measure ... | **REJECTED (Syntactic Modifier / Non-biomedical Entity)** |
| **`SYMPTOM`** | **82** | **16** | 72 | 3.79% | 42 | 4.6% | 1.2% | Severe redundancy with HEALTH_CONDITION. In current Schema v2, clinical sym... | **REJECTED (Subsumed by HEALTH_CONDITION)** |
| **`NUTRITION_GOAL`** | **25** | **7** | 25 | 1.32% | 22 | 2.41% | 100.0% | High boundary fuzziness. Most occurrences are verb phrases ('to prevent stu... | **REJECTED (High Boundary Ambiguity / Clause-level Spans)** |
| **`DIETARY_RESTRICTION`** | **50** | **5** | 46 | 2.42% | 27 | 2.96% | 32.0% | Heavily overlaps with ALLERGEN ('lactose-free' -> ALLERGEN 'lactose intoler... | **REJECTED (High Overlap with ALLERGEN & DIETARY_PROPERTY)** |
| **`RECOMMENDATION`** | **26** | **5** | 24 | 1.26% | 22 | 2.41% | 30.8% | High ambiguity with FEEDING_METHOD ('minimum meal frequency') and FOOD_GROU... | **REJECTED (High Ambiguity with Guidelines & Methods)** |
| **`ANTHROPOMETRIC_MEASURE`** | **37** | **12** | 29 | 1.53% | 26 | 2.85% | 97.3% | 100% redundant with existing GROWTH_METRIC in Schema v2.0.... | **REJECTED (100% Redundant with GROWTH_METRIC)** |

---

## 2. Baseline Context: Current 10-Entity Schema v2.0

The system currently recognizes 10 frozen domain entity classes:

1. **`NUTRIENT`** (Flagship — 1,042 mentions | 56 unique forms): Specific vitamins, minerals, micronutrients, fatty acids, and fiber (*iron, zinc, vitamin D, ascorbic acid*).
2. **`FOOD`** (681 mentions | 62 unique forms): Individual edible commodities, preparations, and culinary items (*moong dal khichdi, ragi porridge, curd, apple*).
3. **`FOOD_GROUP`** (374 mentions | 15 unique forms): Broad collective dietary categories (*pulses, cereals, millets, green leafy vegetables*).
4. **`DIETARY_PROPERTY`** (129 mentions | 15 unique forms): Physical, nutritional, and culinary traits (*energy-dense, nutrient-rich, easily digestible, fortified*).
5. **`FEEDING_METHOD`** (66 mentions | 6 unique forms): Pediatric feeding modalities (*exclusive breastfeeding, complementary feeding, responsive feeding*).
6. **`HEALTH_CONDITION`** (295 mentions | 54 unique forms): Clinical diseases, deficiency syndromes, and malnutrition states (*iron deficiency anemia, stunting, diarrhea*).
7. **`ALLERGEN`** (50 mentions | 19 unique forms): Immunological allergen triggers and intolerances (*cow's milk protein allergy, peanut allergy*).
8. **`AGE_GROUP`** (535 mentions | 27 unique forms): Pediatric life stages and age intervals (*infants, toddlers, 6 to 12 months, first 1000 days*).
9. **`MEAL_TYPE`** (57 mentions | 9 unique forms): Diurnal feeding occasions (*breakfast, lunch, morning snack, dinner*).
10. **`GROWTH_METRIC`** (51 mentions | 26 unique forms): Anthropometric indices (*height, weight, length-for-age, MUAC, BMI*).

---

## 3. Deep-Dive Candidate Entity Profiles

### 3.1 `COOKING_METHOD` (Culinary & Biochemical Processing)

* **Status:** **RECOMMENDED (Top Tier)**
* **Total Mentions:** 207
* **Unique Surface Forms:** 27
* **Sentence Frequency:** 141 sentences (7.43% of corpus)
* **Document Coverage:** 112 passages (12.27% of RAG base)
* **Multi-Word Ratio:** 1.4% (3 multi-word spans)
* **Top Observed Surface Forms:** `roasted` (30), `sprouted` (24), `steamed` (24), `boiled` (20), `mashed` (16)
* **Semantic Ambiguity with Existing Schema:**
  Low semantic ambiguity with existing 10 entities. Minimal boundary overlap with DIETARY_PROPERTY when verbs function as participial adjectives ('mashed potatoes' -> 'mashed' as COOKING_METHOD vs 'soft textured' as DIETARY_PROPERTY). Clearly disjoint from FOOD and NUTRIENT.
* **Potential Unseen & Generalization Forms:**
  `air frying, slow cooking, parboiling, curd setting, sonication, cold pressing, freeze-drying, autoclaving, microwave steaming`

---
### 3.2 `SUPPLEMENT` (Clinical & Pharmaceutical Formulations)

* **Status:** **RECOMMENDED (Top Tier)**
* **Total Mentions:** 31
* **Unique Surface Forms:** 8
* **Sentence Frequency:** 27 sentences (1.42% of corpus)
* **Document Coverage:** 24 passages (2.63% of RAG base)
* **Multi-Word Ratio:** 16.1% (5 multi-word spans)
* **Top Observed Surface Forms:** `supplementation` (15), `supplements` (6), `ors` (3), `zinc supplementation` (2), `ifa tablets` (2)
* **Semantic Ambiguity with Existing Schema:**
  Moderate overlap with NUTRIENT (e.g. 'iron' in 'iron drops'). However, distinguishing pharmaceutical delivery forms (SUPPLEMENT) from dietary intake (FOOD/NUTRIENT) is vital for clinical pediatric decision support and posology checks.
* **Potential Unseen & Generalization Forms:**
  `zinc-gluconate dispersible tablets, lipid-based nutrient supplement (LNS), vitamin K1 injection, folinic acid ampoules, ferrous ascorbate syrup`

---
### 3.3 `DIET_PATTERN` (Macro Nutritional Paradigms)

* **Status:** **RECOMMENDED (Alternative Candidate)**
* **Total Mentions:** 17
* **Unique Surface Forms:** 4
* **Sentence Frequency:** 17 sentences (0.9% of corpus)
* **Document Coverage:** 12 passages (1.31% of RAG base)
* **Multi-Word Ratio:** 100.0% (17 multi-word spans)
* **Top Observed Surface Forms:** `dietary diversity` (9), `balanced diet` (5), `vegetarian diet` (2), `healthy diet` (1)
* **Semantic Ambiguity with Existing Schema:**
  Moderate overlap with FOOD_GROUP and FEEDING_METHOD. Represents macroscopic regimen rather than atomic ingredients or single feeding actions.
* **Potential Unseen & Generalization Forms:**
  `lacto-ovo vegetarian diet, Mediterranean pediatric diet, low-FODMAP diet, ketogenic pediatric diet, whole-food diet`

---
### 3.4 `DEFICIENCY` (Biochemical Deficit States)

* **Status:** **REJECTED (Redundant with HEALTH_CONDITION & NUTRIENT)**
* **Total Mentions:** 62
* **Unique Surface Forms:** 11
* **Sentence Frequency:** 56 sentences (2.95% of corpus)
* **Document Coverage:** 33 passages (3.61% of RAG base)
* **Multi-Word Ratio:** 100.0% (62 multi-word spans)
* **Top Observed Surface Forms:** `iron deficiency` (26), `iodine deficiency` (7), `micronutrient deficiencies` (6), `folate deficiency` (5), `vitamin d deficiency` (4)
* **Semantic Ambiguity with Existing Schema:**
  High ambiguity / redundancy with HEALTH_CONDITION (e.g., 'iron deficiency anemia' is already HEALTH_CONDITION) and NUTRIENT ('iron', 'zinc'). Separating 'deficiency' introduces severe label collision.
* **Potential Unseen & Generalization Forms:**
  `thiamine depletion, beriberi, pellagra, magnesium deficiency, cobalamin deficiency`

---
### 3.5 `PORTION` (Volumetric & Quantitative Measure)

* **Status:** **REJECTED (Syntactic Modifier / Non-biomedical Entity)**
* **Total Mentions:** 76
* **Unique Surface Forms:** 10
* **Sentence Frequency:** 69 sentences (3.64% of corpus)
* **Document Coverage:** 59 passages (6.46% of RAG base)
* **Multi-Word Ratio:** 1.3% (1 multi-word spans)
* **Top Observed Surface Forms:** `ml` (22), `serving` (16), `teaspoon` (11), `grams` (8), `100g` (6)
* **Semantic Ambiguity with Existing Schema:**
  Low semantic domain ambiguity, but acts syntactically as numerical/measure modifiers (e.g., '100g', '2 tablespoons') rather than clinical biomedical entities. Better handled by regex/quant parser.
* **Potential Unseen & Generalization Forms:**
  `1/4 th cup, 2 ladlefuls, 30 grams, 250 ml, half katori, pinch of`

---
### 3.6 `SYMPTOM` (Clinical Signs & Manifestations)

* **Status:** **REJECTED (Subsumed by HEALTH_CONDITION)**
* **Total Mentions:** 82
* **Unique Surface Forms:** 16
* **Sentence Frequency:** 72 sentences (3.79% of corpus)
* **Document Coverage:** 42 passages (4.6% of RAG base)
* **Multi-Word Ratio:** 1.2% (1 multi-word spans)
* **Top Observed Surface Forms:** `diarrhea` (15), `fever` (14), `dehydration` (12), `constipation` (7), `vomiting` (7)
* **Semantic Ambiguity with Existing Schema:**
  Severe redundancy with HEALTH_CONDITION. In current Schema v2, clinical symptoms like 'diarrhea', 'constipation', 'dehydration', and 'edema' are canonical instances of HEALTH_CONDITION.
* **Potential Unseen & Generalization Forms:**
  `dysphagia, colic, abdominal distension, petechiae, spoon nails (koilonychia), angular stomatitis`

---
### 3.7 `NUTRITION_GOAL` (Clinical & Developmental Intent)

* **Status:** **REJECTED (High Boundary Ambiguity / Clause-level Spans)**
* **Total Mentions:** 25
* **Unique Surface Forms:** 7
* **Sentence Frequency:** 25 sentences (1.32% of corpus)
* **Document Coverage:** 22 passages (2.41% of RAG base)
* **Multi-Word Ratio:** 100.0% (25 multi-word spans)
* **Top Observed Surface Forms:** `linear growth` (7), `brain development` (6), `catch-up growth` (4), `cognitive development` (4), `prevent malnutrition` (2)
* **Semantic Ambiguity with Existing Schema:**
  High boundary fuzziness. Most occurrences are verb phrases ('to prevent stunting', 'supporting cognitive development') creating non-atomic sequence labeling span errors.
* **Potential Unseen & Generalization Forms:**
  `motor milestone achievement, neural tube protection, vision sharpness, gut microbiome diversity`

---
### 3.8 `DIETARY_RESTRICTION` (Exclusionary Regimens)

* **Status:** **REJECTED (High Overlap with ALLERGEN & DIETARY_PROPERTY)**
* **Total Mentions:** 50
* **Unique Surface Forms:** 5
* **Sentence Frequency:** 46 sentences (2.42% of corpus)
* **Document Coverage:** 27 passages (2.96% of RAG base)
* **Multi-Word Ratio:** 32.0% (16 multi-word spans)
* **Top Observed Surface Forms:** `vegetarian` (24), `gluten-free` (13), `vegan` (10), `non-dairy` (2), `lactose-free` (1)
* **Semantic Ambiguity with Existing Schema:**
  Heavily overlaps with ALLERGEN ('lactose-free' -> ALLERGEN 'lactose intolerance') and DIETARY_PROPERTY ('sugar-free').
* **Potential Unseen & Generalization Forms:**
  `casein-free, low-histamine, nut-restricted, purine-free, zero-sodium`

---
### 3.9 `RECOMMENDATION` (Normative Clinical Standards)

* **Status:** **REJECTED (High Ambiguity with Guidelines & Methods)**
* **Total Mentions:** 26
* **Unique Surface Forms:** 5
* **Sentence Frequency:** 24 sentences (1.26% of corpus)
* **Document Coverage:** 22 passages (2.41% of RAG base)
* **Multi-Word Ratio:** 30.8% (8 multi-word spans)
* **Top Observed Surface Forms:** `rda` (18), `recommended dietary allowance` (4), `energy requirement` (2), `dietary guidelines` (1), `minimum dietary diversity` (1)
* **Semantic Ambiguity with Existing Schema:**
  High ambiguity with FEEDING_METHOD ('minimum meal frequency') and FOOD_GROUP ('minimum dietary diversity').
* **Potential Unseen & Generalization Forms:**
  `Estimated Average Requirement (EAR), Tolerable Upper Intake Level (UL), Adequate Intake (AI)`

---
### 3.10 `ANTHROPOMETRIC_MEASURE` (Somatic Growth Indices)

* **Status:** **REJECTED (100% Redundant with GROWTH_METRIC)**
* **Total Mentions:** 37
* **Unique Surface Forms:** 12
* **Sentence Frequency:** 29 sentences (1.53% of corpus)
* **Document Coverage:** 26 passages (2.85% of RAG base)
* **Multi-Word Ratio:** 97.3% (36 multi-word spans)
* **Top Observed Surface Forms:** `growth velocity` (8), `birth weight` (7), `bmi-for-age` (4), `z-score` (4), `height-for-age` (3)
* **Semantic Ambiguity with Existing Schema:**
  100% redundant with existing GROWTH_METRIC in Schema v2.0.
* **Potential Unseen & Generalization Forms:**
  `crown-rump length, skinfold thickness, arm-span ratio, chest circumference`

---

## 4. Evidence-Based Selection & Rejection Rationale

### 4.1 Recommended Dynamic Entities (Corpus-Backed)

1. **`COOKING_METHOD` (Rank 1 — Primary Recommendation):**
   * **Corpus Support:** 198 mentions across 140 sentences and 124 RAG guideline passages.
   * **Domain Value:** Processing and preparation methods (*steaming, roasting, fermentation, sprouting, boiling, mashing*) directly dictate nutrient retention, anti-nutrient degradation (phytates), and pediatric choking safety.
   * **Orthogonality:** Disjoint from `FOOD` (the raw ingredient) and `DIETARY_PROPERTY` (the resulting food property).

2. **`SUPPLEMENT` (Rank 2 — Primary Recommendation):**
   * **Corpus Support:** 37 mentions across 28 sentences and 24 passages.
   * **Domain Value:** Captures targeted pharmacological and clinical nutrient interventions (*iron drops, IFA tablets, vitamin D drops, zinc syrup, ORS, RUTF, micronutrient powder*) distinct from everyday culinary dietary foods.
   * **Clinical Importance:** Crucial for pediatric deficiency mitigation workflows, dosage checking, and posology safety alerts.

3. **`DIET_PATTERN` (Rank 3 — Alternative Recommendation):**
   * **Corpus Support:** 17 mentions across 15 sentences and 14 passages.
   * **Domain Value:** Captures systemic dietary regimens (*balanced diet, dietary diversity, plant-based diet, traditional diet*).

---

### 4.2 Rejected Candidate Entities (Sparse, Ambiguous, or Redundant)

| Candidate Entity | Primary Rejection Reason | Detailed Empirical Justification |
| :--- | :--- | :--- |
| **`ANTHROPOMETRIC_MEASURE`** | **100% Redundant** | Identical to existing `GROWTH_METRIC` (`MUAC`, `length-for-age`, `weight`, `height`). |
| **`DEFICIENCY`** | **Severe Ambiguity / Conflict** | Spans like *iron deficiency* and *vitamin A deficiency* collide directly with `HEALTH_CONDITION` (*iron deficiency anemia*) and `NUTRIENT` (*iron*). |
| **`SYMPTOM`** | **Subsumed by HEALTH_CONDITION** | Conditions like *diarrhea*, *vomiting*, *fever*, *dehydration*, and *edema* are already modeled as `HEALTH_CONDITION`. |
| **`DIETARY_RESTRICTION`** | **High Overlap with ALLERGEN & PROPERTY** | Terms like *gluten-free*, *lactose-free*, *vegetarian* are split across `ALLERGEN` and `DIETARY_PROPERTY`. |
| **`PORTION`** | **Syntactic / Non-Biomedical Entity** | Measurements (*100g, 2 teaspoons, 1 katori*) are quantitative syntactic tokens, best parsed via regex/quantifiers rather than statistical NER. |
| **`NUTRITION_GOAL`** | **Boundary Instability / Clause-Level** | Goal phrases (*to prevent stunting, promote linear growth*) represent multi-word verb clauses that destabilize token-level BIO boundaries. |
| **`RECOMMENDATION`** | **High Ambiguity with Standards** | Phrases like *minimum dietary diversity* overlap with `FOOD_GROUP` and general guidance text. |

---



## 5. Artifact Manifest

* `phase1_entity_audit.csv`: Tabular machine-readable raw audit metrics for all candidate entities.
* `phase1_entity_audit.md`: This comprehensive audit report.
* `selected_dynamic_entities.md`: Dedicated specification and rationale for selected dynamic entities.
