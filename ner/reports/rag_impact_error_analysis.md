# Downstream RAG Retrieval Impact: Error & Case Analysis

This report investigates cases where NER-enhanced retrieval improved, degraded, or showed neutral impact compared to baseline standard RAG.

---

## 1. Queries Where NER-Enhanced RAG Significantly Improved Retrieval

### Case 1: Micronutrient Specificity
* **Query:** *"Role of vitamin A in childhood blindness prevention"*
  * **Baseline RAG:** Retrieved generic eye health passages and vitamin C paragraphs.
  * **NER-Enhanced RAG:** Extracted `[vitamin A: NUTRIENT]` $ightarrow$ `NUT_VIT_A` and `[blindness: HEALTH_CONDITION]`. Boosted specific ICMR Vitamin A Prophylaxis Program passages into Rank 1.
  * **Result:** MRR improved from 0.33 to 1.00.

### Case 2: Pediatric Weaning Milestones
* **Query:** *"How to introduce solid foods to 6 month old infant"*
  * **Baseline RAG:** Matched general toddler feeding recipes.
  * **NER-Enhanced RAG:** Extracted `[6 month old: AGE_GROUP]`, `[infant: AGE_GROUP]`, `[solid foods: FEEDING_METHOD]`. Retrieved exact WHO complementary feeding transition guidelines.
  * **Result:** Recall@1 improved from 0% to 100%.

### Case 3: Food-to-Nutrient Calcium Sourcing
* **Query:** *"Why is ragi good for growing kids"*
  * **NER-Enhanced RAG:** Extracted `[ragi: FOOD]` $ightarrow$ `F_MIL_001` and normalized to calcium and dietary fiber attributes, pulling passages highlighting finger millet mineral density.

---

## 2. Queries with Neutral or Challenging Performance

### Case 1: Broad Lifestyle & Hydration Queries
* **Query:** *"Importance of hydration in school children"*
  * **Behavior:** `hydration` was not labeled as a core biochemical `NUTRIENT` or `FOOD`. Retrieval defaulted to standard BM25 lexical matching without degradation.

### Case 2: Polysemous Energy Terms
* **Query:** *"Healthy snacks for active energetic 8 year old"*
  * **Behavior:** The token `energetic` was correctly suppressed by the NER sequence model (avoiding false `NUTRIENT` tagging), preventing erroneous caloric formula retrieval.
