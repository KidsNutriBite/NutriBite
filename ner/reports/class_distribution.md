# NutriBite NER Dataset Class Distribution

This report details the exact distribution of the 7 domain-specific entity labels across the train, validation, and test partitions.

* **Dataset Splitting Policy:** Passage-level grouped splitting (70% train, 15% validation, 15% test) with random seed `42` to prevent data leakage between adjacent sentences of the same passage.
* **Total Natural-Language Sentences:** 1748
* **Total Annotated Entity Spans:** 2711

| Entity Label | Train Spans | Validation Spans | Test Spans | Total Spans | Proportion (%) |
| :--- | ---: | ---: | ---: | ---: | ---: |
| **`FOOD`** | 468 | 90 | 123 | 681 | 25.12% |
| **`NUTRIENT`** | 699 | 169 | 174 | 1042 | 38.44% |
| **`HEALTH_CONDITION`** | 202 | 47 | 46 | 295 | 10.88% |
| **`ALLERGEN`** | 34 | 11 | 5 | 50 | 1.84% |
| **`AGE_GROUP`** | 360 | 91 | 84 | 535 | 19.73% |
| **`MEAL_TYPE`** | 42 | 7 | 8 | 57 | 2.10% |
| **`GROWTH_METRIC`** | 46 | 3 | 2 | 51 | 1.88% |
| **TOTAL** | **1851** | **418** | **442** | **2711** | **100.00%** |
