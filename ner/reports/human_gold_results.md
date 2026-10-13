# Human-Gold Benchmark Evaluation Results (Schema v2.0)

**Evaluation Date:** September 19, 2026  
**Evaluation Protocol:** Strict Exact-Span Evaluation ($\text{start}_{\text{pred}} = \text{start}_{\text{gold}}$, $\text{end}_{\text{pred}} = \text{end}_{\text{gold}}$, $\text{label}_{\text{pred}} = \text{label}_{\text{gold}}$)  
**Evaluator Script:** `ner/scripts/11_evaluate_human_gold.py`  
**Model Architecture:** Averaged Sequence Perceptron (8 Epochs, BIO-constrained Decoding)  
**Training Corpus:** 1,223 sentences, 1,985 entity spans (`ner/data/schema_v2/train.jsonl`)  

---

## 1. Executive Summary & Benchmark Comparison

| Evaluation Benchmark | Schema Version | Evaluation Source | Micro Precision | Micro Recall | Micro F1 | Macro F1 | Flagship `NUTRIENT` F1 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Historical Silver Test (Phase 5)** | v1.0 (7 classes) | Silver Partition | 95.80% | 94.40% | **95.10%** | 89.20% | **97.18%** |
| **Schema v2 Silver Test (Phase 8)** | v2.0 (10 classes) | Silver Partition | 94.68% | 91.83% | **93.23%** | 82.76% | **92.40%** |
| **Adversarial Challenge (Phase 6/8)** | v2.0 (10 classes) | 25 Adversarial Sents | 52.38% | 34.92% | **41.90%** | — | **41.90%** |
| **Human-Gold Benchmark (Phase 9)** | **v2.0 (10 classes)** | **150 Human Gold Sents** | **63.84%** | **58.40%** | **61.00%** | **47.80%** | **74.73%** |

> [!IMPORTANT]
> **Methodological Reality Shift:**  
> The drop from 93.23% (Silver) to 61.00% (Human-Gold) does **not** represent a regression in model capability; rather, it unmasks the intrinsic circularity and memorization artifacts of weak silver evaluation. The Phase 9 Human-Gold evaluation is the project's first **unbiased, non-circular, empirical assessment** of genuine generalization in pediatric clinical nutrition text.

---

## 2. Full 10-Class Exact-Span Performance on Human Gold

Evaluated on 150 manually annotated sentences containing 387 gold entity spans:

| Entity Class | Gold Support | Pred Spans | True Positives | False Positives | False Negatives | Precision | Recall | F1 Score |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`FOOD`** | 76 | 50 | 29 | 21 | 47 | 58.00% | 38.16% | **46.03%** |
| **`NUTRIENT`** | 87 | 95 | 68 | 27 | 19 | 71.58% | 78.16% | **74.73%** |
| **`HEALTH_CONDITION`** | 42 | 53 | 15 | 38 | 27 | 28.30% | 35.71% | **31.58%** |
| **`ALLERGEN`** | 9 | 18 | 3 | 15 | 6 | 16.67% | 33.33% | **22.22%** |
| **`AGE_GROUP`** | 48 | 52 | 40 | 12 | 8 | 76.92% | 83.33% | **80.00%** |
| **`MEAL_TYPE`** | 22 | 16 | 15 | 1 | 7 | 93.75% | 68.18% | **78.95%** |
| **`GROWTH_METRIC`** | 17 | 16 | 8 | 8 | 9 | 50.00% | 47.06% | **48.48%** |
| **`FOOD_GROUP`** | 58 | 52 | 47 | 5 | 11 | 90.38% | 81.03% | **85.45%** |
| **`DIETARY_PROPERTY`** | 10 | 0 | 0 | 0 | 10 | 0.00% | 0.00% | **0.00%** |
| **`FEEDING_METHOD`** | 18 | 1 | 1 | 0 | 17 | 100.00% | 5.56% | **10.53%** |
| **Overall (Micro Aggregate)** | **387** | **353** | **226** | **127** | **161** | **63.84%** | **58.40%** | **61.00%** |
| **Macro Average** | — | — | — | — | — | — | — | **47.80%** |

---

## 3. Flagship `NUTRIENT` Entity Analysis

* **Gold Mentions in Human Gold:** 87 spans across 55 sentences.
* **Precision:** **71.58%** (68 True Positives out of 95 predictions).
* **Recall:** **78.16%** (68 True Positives out of 87 gold entities).
* **F1 Score:** **74.73%**.
* **Key Strengths:** Core mineral and vitamin terms (*iron*, *calcium*, *vitamin D*, *zinc*, *folate*, *vitamin B12*, *protein*, *fats*, *carbohydrates*) achieved >90% extraction recall.
* **Key Vulnerabilities:** Sub-compound fatty acids (*LCPUFAs*, *Arachidonic acid*), immunological proteins (*IgA*, *lactoferrin*), and boundary overlaps with dietary properties (*iron-rich* vs *iron*).

---

## 4. Generalization Analysis: Seen vs. Unseen Mentions

To assess whether the model relies on lexical memorization versus generalized contextual extraction, all gold entities were partitioned based on whether their exact lowercased surface string appeared in the Schema v2 training set:

| Entity Partition | Support | Precision | Recall | F1 Score |
| :--- | :---: | :---: | :---: | :---: |
| **All Seen Entities** | 238 | 64.66% | 94.54% | **76.79%** |
| **All Unseen Entities** | 149 | 16.67% | 0.67% | **1.29%** |
| **`NUTRIENT` Seen** | 69 | 72.34% | 98.55% | **83.44%** |
| **`NUTRIENT` Unseen** | 18 | 0.00% | 0.00% | **0.00%** |

### Key Generalization Insights:
1. **Seen Entity Robustness:** When an entity has appeared in training, the model achieves high recall (**94.54%** overall, **98.55%** for NUTRIENT).
2. **The Unseen Entity Generalization Barrier:** When encountering novel domain entities (*e.g., specific regional foods like 'ragi sheera', 'makhana', 'poha', or rare conditions like 'proctocolitis', 'angioedema'*), statistical linear sequence models collapse to near-zero recall without extensive contextual pretraining or transformer embeddings.

---

## 5. Adversarial Nutrient Challenge Suite Results

Evaluated across the 25 diagnostic adversarial sentences (63 gold spans):

| Challenge Category | Gold Spans | Precision | Recall | F1 Score |
| :--- | :---: | :---: | :---: | :---: |
| **Quantity Boundaries** (*e.g., '400 IU vitamin D'*) | 5 | 75.00% | 60.00% | **66.67%** |
| **Multi-Word Nutrients** (*e.g., 'omega-3 fatty acids'*) | 13 | 50.00% | 46.15% | **48.00%** |
| **Ambiguity & Polysemy** (*e.g., 'energy intake' vs 'energetic'*) | 21 | 75.00% | 28.57% | **41.38%** |
| **Morphological Variants** (*e.g., 'fortification' vs 'fortified'*) | 6 | 40.00% | 33.33% | **36.36%** |
| **Synonyms & Chemical Variants** (*e.g., 'ascorbic acid', 'alpha-tocopherol'*) | 11 | 50.00% | 27.27% | **35.29%** |
| **Nested Conflicts** (*e.g., 'iron deficiency anemia'*) | 7 | 33.33% | 28.57% | **30.77%** |
| **Overall Challenge Suite** | **63** | **52.38%** | **34.92%** | **41.90%** |
