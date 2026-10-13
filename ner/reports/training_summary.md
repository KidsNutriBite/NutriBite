# NutriBite Domain NER Model Training & Evaluation Summary

## 1. Executive Performance Overview
* **Model Architecture:** Structured Averaged Sequence Perceptron with Valid BIO Transition Decoding
* **Total Training Sentences:** 1223
* **Total Validation Sentences:** 262
* **Total Test Sentences:** 263
* **Overall Test Micro F1:** **95.1%**
* **Overall Test Precision:** **95.86%**
* **Overall Test Recall:** **94.34%**
* **Overall Test Macro F1:** **86.94%**
* **Ambiguity Resolution Test Accuracy:** **60.0%**
* **Multi-Word Span Complete Extraction Accuracy:** **58.3%**

## 2. Per-Entity Test Performance
| Domain Entity Label | Precision (%) | Recall (%) | F1-Score (%) | Test Support (Gold Spans) |
| :--- | ---: | ---: | ---: | ---: |
| **`FOOD`** | 95.73% | 91.06% | **93.33%** | 123 |
| **`NUTRIENT`** | 95.56% | 98.85% | **97.18%** | 174 |
| **`HEALTH_CONDITION`** | 93.02% | 86.96% | **89.89%** | 46 |
| **`ALLERGEN`** | 66.67% | 40.0% | **50.0%** | 5 |
| **`AGE_GROUP`** | 100.0% | 96.43% | **98.18%** | 84 |
| **`MEAL_TYPE`** | 100.0% | 100.0% | **100.0%** | 8 |
| **`GROWTH_METRIC`** | 66.67% | 100.0% | **80.0%** | 2 |

## 3. Baseline vs Domain Model Comparison
| Metric | Baseline General-Domain NER | NutriBite Domain-Specific NER | Absolute Gain |
| :--- | ---: | ---: | ---: |
| **Overall Precision** | 91.89% | 95.86% | **+3.97%** |
| **Overall Recall** | 7.69% | 94.34% | **+86.65%** |
| **Overall F1-Score** | 14.2% | 95.1% | **+80.90%** |
| **`NUTRIENT` F1** | 0.00% (Missing) | **97.18%** | **+97.18%** |
| **`ALLERGEN` F1** | 0.00% (Missing) | **50.0%** | **+50.0%** |
| **`GROWTH_METRIC` F1** | 0.00% (Missing) | **80.0%** | **+80.0%** |
