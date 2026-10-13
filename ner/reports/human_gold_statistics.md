# Human-Gold Benchmark Dataset Statistics (Schema v2.0)

**Corpus Version:** 2.0 (Frozen Schema, 10 Entity Classes)  
**Annotator Count:** 1 (Domain Expert Annotator: `domain_expert_v1`)  
**Inter-Annotator Agreement:** N/A (Single Expert Annotation with Second-Pass Consistency Review)  
**Validation Status:** Passed (100% complete, 0 structural errors, 0 duplicate errors, 0 overlap errors)  
**Annotation Date:** September 19, 2026  

---

## 1. Corpus-Level Overview

| Metric | Measured Value |
| :--- | :---: |
| **Total Candidate Sentences** | 150 |
| **Manually Annotated Sentences** | 150 (100.0%) |
| **Sentences with Extracted Entities** | 140 (93.3%) |
| **Verified Zero-Entity Sentences** | 10 (6.7%) |
| **Total Labeled Entity Spans** | 387 |
| **Mean Entity Spans per Sentence** | 2.58 |
| **Single-Token Spans** | 261 (67.4%) |
| **Multi-Word Spans** | 126 (32.6%) |

---

## 2. Per-Entity Class Support & Lexical Diversity

| Entity Class | Sentence Support | Span Count | Unique Surface Forms | Top Surface Forms |
| :--- | :---: | :---: | :---: | :--- |
| **`FOOD`** | 38 | 76 | 44 | *milk*, *salt*, *curd*, *sweet corn*, *roasted makhana*, *vegetable upma*, *paneer*, *sweet potato* |
| **`NUTRIENT`** | 55 | 87 | 31 | *iron*, *protein*, *fats*, *vitamins*, *calcium*, *folate*, *fiber*, *carbohydrates*, *omega-3 fatty acids* |
| **`HEALTH_CONDITION`** | 23 | 42 | 24 | *anemia*, *obesity*, *iron deficiency*, *lactose intolerance*, *malnutrition*, *diarrhea*, *type 2 diabetes* |
| **`ALLERGEN`** | 8 | 9 | 5 | *Cow's Milk Protein Allergy*, *CMPA*, *egg allergy*, *soya protein allergy*, *cow's milk allergy* |
| **`AGE_GROUP`** | 45 | 48 | 18 | *infants*, *children*, *infant*, *toddlers*, *adolescents*, *first 1000 days*, *child*, *preschoolers* |
| **`MEAL_TYPE`** | 15 | 22 | 5 | *snacks*, *meals*, *snack*, *breakfast*, *mid-afternoon snack* |
| **`GROWTH_METRIC`** | 13 | 17 | 10 | *BMI*, *growth velocity*, *height*, *weight*, *linear growth velocity*, *Mid Arm Circumference* |
| **`FOOD_GROUP`** | 24 | 58 | 17 | *pulses*, *cereals*, *fruits*, *vegetables*, *green leafy vegetables*, *whole grains*, *nuts*, *seeds* |
| **`DIETARY_PROPERTY`** | 9 | 10 | 7 | *energy-dense*, *nutrient-dense*, *ultra-processed*, *nutrient-rich*, *highly processed*, *processed foods* |
| **`FEEDING_METHOD`** | 16 | 18 | 4 | *breastfeeding*, *exclusive breastfeeding*, *complementary foods*, *complementary feeding* |
| **Total / Aggregate** | **150** | **387** | **180** | — |

---

## 3. Structural Integrity & Validation Audit

The dataset underwent automated validation via `ner/scripts/12_validate_human_gold.py`:
* **Exact Offsets:** 100% of labeled character spans match exact sentence text substrings.
* **Label Conformance:** 100% of labels strictly belong to Schema v2.0.
* **No Overlaps:** 0 span overlaps (ensuring standard BIO tag sequence compatibility).
* **Zero Duplicates:** 0 duplicate entity records across all sentences.
* **No Empty Unverified Records:** All 10 empty sentences are explicitly confirmed as verified zero-entity instances (`is_zero_entity_verified=True`).
