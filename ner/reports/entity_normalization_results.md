# Entity Normalization & Grounding Benchmark Results

**Resource File:** `ner/data/entity_normalization.json`  
**Total Normalization Dictionary Entries:** 810  
**Evaluation Scope:** 2,654 non-MEAL_TYPE corpus mentions from the NutriBite corpus  
**Overall Coverage:** **85.64%** | **Exact-Match Accuracy:** **85.64%**

---

## 1. Normalization Performance by Entity Category

| Entity Category | Total Mentions | Normalized Spans | Normalization Coverage | Exact-Match Accuracy | Ambiguous Matches | Unmatched Mentions | Canonical Knowledge Source |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **`AGE_GROUP`** | 535 | 496 | **92.7%** | **92.7%** | 0 | 39 | ICMR / IFCT / WHO |
| **`ALLERGEN`** | 50 | 31 | **62.0%** | **62.0%** | 0 | 19 | ICMR / IFCT / WHO |
| **`FOOD`** | 681 | 628 | **92.2%** | **92.2%** | 0 | 53 | ICMR / IFCT / WHO |
| **`GROWTH_METRIC`** | 51 | 33 | **64.7%** | **64.7%** | 0 | 18 | ICMR / IFCT / WHO |
| **`HEALTH_CONDITION`** | 295 | 209 | **70.8%** | **70.8%** | 0 | 86 | ICMR / IFCT / WHO |
| **`NUTRIENT`** | 1042 | 876 | **84.1%** | **84.1%** | 0 | 166 | ICMR / IFCT / WHO |
| **OVERALL TOTAL** | **2654** | **2273** | **85.6%** | **85.6%** | **0** | **381** | **Multi-Source Standard** |

---

## 2. Methodological Disclosure
* **Evaluation Nature:** This evaluation measures dictionary-based exact and alias normalization against domain knowledge bases (`foods.json`, `conditions.json`, `allergies.json`, ICMR RDA tables, and WHO growth standards).
* **Heuristic Grounding:** Because human-annotated gold normalization spans are pending, this is reported as a **rule-based normalization coverage baseline** rather than a human-gold score.
