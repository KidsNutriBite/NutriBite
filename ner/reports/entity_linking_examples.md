# NutriBite Entity Linking Examples and Proof of Concept

This document demonstrates how Named Entity Recognition (NER) outputs are programmatically mapped to canonical database IDs in the NutriBite database.

| Surface Text | Extracted Label | Canonical ID | Canonical Concept | Match Strategy | Structured DB Integration |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ragi porridge` | **`FOOD`** | `F_MIL_001` | ragi porridge | `exact_match` | Mapped to `foods.json` (cereal) |
| `moong dal khichdi` | **`FOOD`** | `F1266` | moong_dal_khichdi | `exact_match` | Mapped to `foods.json` (balanced_meal) |
| `vitamin D` | **`NUTRIENT`** | `NUT_VIT_D` | vitamin d | `exact_match` | Gazetteer Grounding |
| `vit B12` | **`NUTRIENT`** | `NUT_VIT_B12` | vitamin b12 | `alias_match` | Gazetteer Grounding |
| `iron deficiency anemia` | **`HEALTH_CONDITION`** | `anemia` | anemia | `partial_match` | Gazetteer Grounding |
| `peanut allergy` | **`ALLERGEN`** | `ALLERG_PEANUT` | peanut allergy | `exact_match` | Gazetteer Grounding |
| `lactose intolerance` | **`ALLERGEN`** | `ALLERG_LACTOSE` | lactose intolerance | `exact_match` | Gazetteer Grounding |
| `toddler` | **`AGE_GROUP`** | `AGE_TODDLER` | toddler | `exact_match` | Gazetteer Grounding |
| `breakfast` | **`MEAL_TYPE`** | `MEAL_BREAKFAST` | breakfast | `exact_match` | Gazetteer Grounding |
| `MUAC` | **`GROWTH_METRIC`** | `METRIC_MUAC` | mid-upper arm circumference | `alias_match` | Gazetteer Grounding |
