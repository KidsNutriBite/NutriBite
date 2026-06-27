# 📋 Knowledge Base Audit: NutriKids Datasets

This document presents a comprehensive audit of all raw datasets currently indexed inside `ai-service-v2/datasets/`.

---

## 1. Overall Dataset Summary

| Dataset File | Record Count | Duplicate Entries | Metadata Quality / Coverage | Source Quality / Authenticity |
| :--- | :--- | :--- | :--- | :--- |
| **`rag_data.json`** | 551 | 1 | **Excellent**: 100% metadata keys (`id`, `text`, `metadata`) present. | **High**: Grounded directly in ICMR, WHO, and NIN (National Institute of Nutrition) guidelines. |
| **`foods.json`** | 125 | 12 | **High**: Contains nutritional tags, glycemic index, age guidelines, and meal fits. | **High**: Standard Indian food nutrient tables. |
| **`conditions.json`** | 172 | 12 | **Medium**: Dynamic tag matrices (`required_tags`, `avoid_tags`) mapping child conditions. | **Medium**: Custom rule templates. |
| **`goals.json`** | 148 | 147 | **Low**: High redundancy; almost all records repeat goals and tag matrices. | **Low**: High duplication rate. |
| **`allergies.json`** | 17 | 8 | **High**: Standard allergy avoidance tags. | **Medium**: Basic exclusion rules. |

---

## 2. Detailed Dataset Profile

### A. RAG Guidelines (`rag_data.json`)
* **Record Count**: 551
* **Schema**:
  ```json
  {
    "id": "RAG_LIFE_3",
    "text": "Children need nutrient-rich foods for growth, brain development, and cognition.",
    "metadata": {
      "type": "general",
      "tags": ["child_growth"]
    }
  }
  ```
* **Analysis**: Extremely clean. Only 1 text duplicate found. No records are missing metadata keys. Coverage of standard pediatric guidelines is comprehensive.

### B. Foods Inventory (`foods.json`)
* **Record Count**: 125
* **Duplicates**: 12 duplicate entries.
* **Schema**:
  ```json
  {
    "food_id": "F050",
    "food_name": "egg",
    "category": "protein",
    "energy_kcal_per_100g": 155,
    "protein_g": 13,
    "fat_g": 11,
    "carbs_g": 1.1,
    "iron_mg": 1.8,
    "portion_unit": "1 egg (~50g)",
    "portion_energy_kcal": 78,
    "portion_protein_g": 6,
    "digestibility_boiled": "high",
    "digestibility_fried": "medium",
    "fat_level_fried": "high",
    "glycemic_index": "low",
    "age_min": 1,
    "allergy_tags": ["egg_protein"],
    "meal_types": ["breakfast", "lunch", "snack"],
    "tags": ["high_protein", "nutrient_dense", "animal_based"]
  }
  ```
* **Analysis**: Standard Indian pediatric foods represented. Discovered 12 minor duplications of names which should be deduplicated in Stage 2B to prevent search conflicts.

### C. Clinical Goals (`goals.json`)
* **Record Count**: 148
* **Duplicates**: **147 duplicates**!
* **Schema**:
  ```json
  {
    "goal_name": "weight_gain",
    "required_tags": ["high_calorie", "protein_rich"],
    "avoid_tags": ["low_calorie"],
    "meal_frequency": 5
  }
  ```
* **Analysis**: Critical anomaly identified. A massive quantity of goals data contains identical, repeated dictionaries of target parameters (e.g. repeated records for `weight_gain` or `healthy_maintain`). This bloats database load pipelines and must be deduplicated to a single rule per goal name.

