# Human-Gold Benchmark Error Analysis (Schema v2.0)

**Date:** September 19, 2026  
**Evaluation Target:** 150 Human-Gold Sentences (387 Gold Spans, 353 Predicted Spans)  
**Total Exact Matches (True Positives):** 226  
**Total False Positives:** 127  
**Total False Negatives:** 161  

---

## 1. Error Taxonomy Breakdown

| Error Category | Instance Count | Primary Root Cause | Impacted Entity Classes |
| :--- | :---: | :--- | :--- |
| **Unseen Entity Errors** | 98 | Lexical gap between training corpus and novel clinical mentions | `HEALTH_CONDITION`, `FOOD`, `DIETARY_PROPERTY`, `ALLERGEN` |
| **Multi-Word Span Errors** | 78 | Premature token truncation or failure to propagate `I-` tags | `FOOD`, `GROWTH_METRIC`, `HEALTH_CONDITION`, `FEEDING_METHOD` |
| **Boundary Errors** | 41 | Inexact span edge matching against multi-token clinical expressions | `AGE_GROUP`, `GROWTH_METRIC`, `NUTRIENT`, `FOOD_GROUP` |
| **New-Schema Addition Errors** | 35 | Insufficient weak silver exemplars for newly introduced v2 classes | `DIETARY_PROPERTY`, `FEEDING_METHOD` |
| **Entity-Type Misclassification** | 22 | Semantic confusion across closely related hierarchy classes | `FOOD` vs `FOOD_GROUP`, `HEALTH_CONDITION` vs `ALLERGEN` |
| **Ambiguity / Polysemy Errors** | 7 | Context-dependent shifts for dual-use tokens (*salt*, *fat*, *energy*) | `FOOD`, `NUTRIENT`, `GROWTH_METRIC` |
| **Nested / Precedence Errors** | 0 | Resolved via frozen schema hierarchy; model outputs single flat tags | — |

---

## 2. In-Depth Error Category Analysis

### A. Boundary & Multi-Word Errors (41 Boundary, 78 Multi-Word Instances)
* **Age Phrases with Qualifiers:**
  * Gold: `"infants aged 9 to 11 months"` [`AGE_GROUP`]
  * Model Pred: `"infants"` [`AGE_GROUP`] + `"9 to 11 months"` [`AGE_GROUP`] or unannotated numeral.
  * *Analysis:* The model frequently segments extended age descriptions into core nouns and age ranges rather than capturing the full descriptive noun phrase.
* **Compound Growth Metrics:**
  * Gold: `"accelerated linear growth velocity"` [`GROWTH_METRIC`]
  * Model Pred: `"growth velocity"` [`GROWTH_METRIC`]
  * *Analysis:* The prefix modifiers (*linear*, *accelerated*) were omitted by the model, matching the core unigram/bigram seen in training.
* **Compound Dishes & Foods:**
  * Gold: `"malted ragi porridge"` [`FOOD`], `"stuffed paneer paratha"` [`FOOD`]
  * Model Pred: `"ragi"` [`FOOD`] + `"porridge"` [`FOOD`] or missing `"malted"`.

---

### B. Unseen Lexical Entity Failures (98 Instances)
* **Specific Indian Dishes & Foods:**
  * Novel mentions: `"poha"`, `"sweet corn"`, `"roasted makhana"`, `"ragi sheera"`, `"turmeric milk"`, `"lassi"`, `"dry fruits"`.
  * *Analysis:* The linear perceptron lacks word vector embeddings (Word2Vec/BERT) to generalize from seen foods like `"khichdi"` or `"curd"` to unseen dishes like `"poha"` without prior lexical exposure.
* **Clinical Disease & Symptom Terms:**
  * Novel clinical conditions: `"urticaria"`, `"angioedema"`, `"wheezing"`, `"anaphylaxis"`, `"proctocolitis"`, `"severe eczema"`, `"secondary lactase deficiency"`.
  * *Analysis:* These specialized medical terms did not occur in the general nutritional advice training partition, resulting in complete false negatives.

---

### C. New Schema v2 Class Analysis (`DIETARY_PROPERTY`, `FEEDING_METHOD`, `FOOD_GROUP`)
* **`FOOD_GROUP` (Success — F1: 85.45%):**
  * The model achieved high precision (90.38%) and recall (81.03%) on food groups (*pulses*, *cereals*, *fruits*, *vegetables*, *green leafy vegetables*, *whole grains*, *nuts*, *seeds*).
  * Feature ablation proved that subword affixes and context bigrams strongly reinforce food group detection.
* **`FEEDING_METHOD` (Severe Recall Deficit — F1: 10.53%, Recall: 5.56%):**
  * Precision was 100%, but recall fell to 5.56% because phrases like `"complementary feeding"`, `"exclusive breastfeeding"`, and `"complementary foods"` in gold data were either tagged as `O` or misclassified due to insufficient training variations.
* **`DIETARY_PROPERTY` (Zero Extraction — F1: 0.00%):**
  * Spans like `"energy-dense"`, `"nutrient-dense"`, `"nutrient-rich"`, `"ultra-processed"`, `"highly processed"` had 0 true positive predictions on human gold.
  * The hyphenated syntax and adjectival positioning were often assigned `O` because the training perceptron prioritized noun-headed tags.

---

### D. Semantic Confusion / Entity-Type Misclassification (22 Instances)
* **`FOOD` vs `FOOD_GROUP` Confusion:**
  * Example: In *"Fresh seasonal fruit slices"*, gold labeled `"fresh seasonal fruit"` as `FOOD_GROUP`, while model predicted `"fruit"` as `FOOD`.
  * In *"fish and meat"*, model tagged `"fish"` as `FOOD` while gold guideline categorized collective animal classes as `FOOD_GROUP`.
* **`ALLERGEN` vs `HEALTH_CONDITION`:**
  * Example: `"Cow's Milk Protein Allergy"` labeled as `ALLERGEN` vs predicted as `HEALTH_CONDITION`.
  * In pediatric nutrition, immunologic allergy and clinical hypersensitivity syndrome often share identical token triggers (*allergy*, *intolerance*, *deficiency*).

---

### E. Ambiguity & Contextual Polysemy (7 Instances)
* **`energy`:** Correctly disambiguated in dietary context (*"daily energy intake"*) vs non-annotated in general physical activity statements.
* **`salt`:** Correctly extracted as `FOOD` when referring to seasoning in infant food guidelines (*"Salt and sugar should be avoided in infant food"*).
* **`growth`:** Accurately filtered when referring to economic progress (*"economic growth rate"* $\rightarrow$ `O`) versus somatic growth (*"growth velocity"* $\rightarrow$ `GROWTH_METRIC`).
