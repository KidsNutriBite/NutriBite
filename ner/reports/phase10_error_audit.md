# Phase 10: Human-Gold Error Audit & Unseen Generalization Analysis

**Evaluation Date:** September 20, 2026  
**Benchmark Target:** 150 Human-Gold Sentences (387 Gold Spans, 354 Predicted Spans)  
**Baseline Model:** Schema v2 Averaged Sequence Perceptron (8 Epochs, BIO-constrained)  
**Baseline Metrics:** Micro Precision: **63.84%** | Micro Recall: **58.40%** | Micro F1: **61.00%** | Macro F1: **47.80%**  
**Flagship NUTRIENT Baseline:** Precision: **71.58%** | Recall: **78.16%** | F1: **74.73%**  
**Seen vs. Unseen Baseline:** Seen F1 = **76.79%** | Unseen F1 = **1.29%** | `NUTRIENT` Unseen F1 = **0.00%**  

---

## 1. Quantitative Error Breakdown Across 11 Diagnostic Categories

| ID | Diagnostic Error Category | Instance Count | % of Errors (Total FP+FN: 289) | Key Impacted Classes |
| :-: | :--- | :---: | :---: | :--- |
| **A** | **Unseen Lexical Forms** | **97** | **33.6%** | `HEALTH_CONDITION`, `FOOD`, `NUTRIENT`, `ALLERGEN` |
| **B** | **Synonyms & Lexical Variants** | **9** | **3.1%** | `NUTRIENT`, `HEALTH_CONDITION` |
| **C** | **Chemical / Biochemical Nutrient Names** | **6** | **2.1%** | `NUTRIENT` (*DHA*, *IgA*, *lactoferrin*, *LCPUFAs*) |
| **D** | **Multi-Word Span Truncations** | **78** | **27.0%** | `FOOD`, `GROWTH_METRIC`, `HEALTH_CONDITION`, `FEEDING_METHOD` |
| **E** | **Boundary Alignment Errors** | **41** | **14.2%** | `AGE_GROUP`, `GROWTH_METRIC`, `NUTRIENT`, `FOOD_GROUP` |
| **F** | **Entity-Type Confusion** | **22** | **7.6%** | `FOOD` vs `FOOD_GROUP`, `HEALTH_CONDITION` vs `ALLERGEN` |
| **G** | **Contextual Polysemy / Ambiguity** | **7** | **2.4%** | `FOOD`, `NUTRIENT`, `GROWTH_METRIC` (*energy*, *salt*, *growth*) |
| **H** | **Food vs. Food-Group Confusion** | **2** | **0.7%** | `FOOD`, `FOOD_GROUP` (*fish*, *fruit*) |
| **I** | **Feeding-Method Omissions** | **3** | **1.0%** | `FEEDING_METHOD` (*complementary foods*, *exclusive breastfeeding*) |
| **J** | **Dietary-Property Omissions** | **9** | **3.1%** | `DIETARY_PROPERTY` (*energy-dense*, *nutrient-dense*, *ultra-processed*) |
| **K** | **Health-Condition Omissions** | **15** | **5.2%** | `HEALTH_CONDITION` (*proctocolitis*, *angioedema*, *urticaria*) |

---

## 2. In-Depth Root Cause Investigation for Low Unseen F1 (1.29%)

### Why Did the Statistical Perceptron Collapse on Unseen Entities?
1. **Extreme Lexical Memorization in Sparse Linear Weights:**  
   The feature set $w[i], w[i-1], w[i+1]$, and character affixes (prefix-2/3, suffix-2/3) only learn strong weights for unigrams frequently observed during training. When a novel food (e.g. `"ragi sheera"`, `"makhana"`, `"sweet potato"`) or disease (e.g. `"proctocolitis"`, `"wheezing"`) appears, its unigram weight is 0.0.
2. **Context Window Limitations without Pretrained Semantics:**  
   Without pretrained word embeddings or contextual transformers (e.g. BioBERT / ClinicalBERT / Modern Subword Encoders), surrounding words like *"suffering from"* or *"rich in"* provide weak positive bias, but insufficient activation to overcome the default `O` transition penalty.
3. **Multi-Word Propagation Failure:**  
   When the model encounters multi-word expressions like `"long-chain omega-3 fatty acids"`, it either predicts only the seen core suffix (`"omega-3 fatty acids"`) causing an exact-boundary mismatch, or emits `O` for the unseen prefix.

---

## 3. Representative Error Examples by Category

### Category A & C: Unseen Clinical & Chemical Nutrient Names
* **Sentence (GOLD_CAND_044):** *"Breast milk contains Long Chain Polyunsaturated Fatty Acids (LCPUFAs) like DHA and Arachidonic acid for visual and neural development."*
  * Gold: `[Long Chain Polyunsaturated Fatty Acids: NUTRIENT]`, `[DHA: NUTRIENT]`, `[Arachidonic acid: NUTRIENT]`
  * Model: `[Breast milk: FOOD]` (All 3 chemical nutrients missed $\rightarrow$ FN).
* **Sentence (GOLD_CAND_045):** *"Preterm milk is nutrient-denser than term milk, containing higher protein, sodium, and IgA to support the baby's needs."*
  * Gold: `[Preterm milk: FOOD]`, `[nutrient-denser: DIETARY_PROPERTY]`, `[sodium: NUTRIENT]`, `[IgA: NUTRIENT]`
  * Model: Extracted `protein` and `milk`, but missed `nutrient-denser`, `sodium`, and `IgA`.

### Category D & E: Boundary Truncation on Multi-Word Clinical Expressions
* **Sentence (GOLD_CAND_121):** *"For infants aged 9 to 11 months, complementary feeding frequency should increase..."*
  * Gold: `[infants aged 9 to 11 months: AGE_GROUP]`
  * Model: `[infants: AGE_GROUP]` (Boundary mismatch $\rightarrow$ 1 FP, 1 FN).
* **Sentence (GOLD_CAND_142):** *"Preadolescence is characterized by accelerated linear growth velocity..."*
  * Gold: `[accelerated linear growth velocity: GROWTH_METRIC]`
  * Model: `[growth velocity: GROWTH_METRIC]` (Truncated prefix modifier $\rightarrow$ Boundary error).

### Category F & H: Semantic Confusion Across Taxonomy Hierarchy
* **Sentence (GOLD_CAND_023):** *"Fish and meat can be included as sources of high-quality protein and micronutrients."*
  * Gold: `[Fish: FOOD_GROUP]`, `[meat: FOOD_GROUP]`, `[protein: NUTRIENT]`
  * Model: `[Fish: FOOD]`, `[meat: FOOD]`, `[protein: NUTRIENT]` (Type confusion: FOOD vs FOOD_GROUP).
* **Sentence (GOLD_CAND_094):** *"CMPA requires complete elimination of milk proteins, whereas lactose intolerance allows dairy proteins..."*
  * Gold: `[CMPA: ALLERGEN]`, `[lactose intolerance: HEALTH_CONDITION]`
  * Model: `[CMPA: HEALTH_CONDITION]` (Type confusion: ALLERGEN vs HEALTH_CONDITION).
