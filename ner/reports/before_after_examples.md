# NutriBite NER: Before/After Test Set Extraction Examples

This document demonstrates the empirical contrast between **Baseline General-Domain NER** (which lacks dedicated nutrition categories) and the newly implemented **NutriBite Domain-Specific NER** on 10 authentic sentences drawn directly from the test partition (`ner/data/test.jsonl`).

---

### Example 1: Micronutrient Recognition (Flagship Entity: `NUTRIENT`)
* **Test Sentence (`nutri_rag_00142`):**
  > *"Vitamin C rich foods improve iron absorption and should be included in the diet."*
* **Baseline Output:**
  * `Vitamin C`: `O` (Missed)
  * `iron`: `O` (Missed / treated as common metal noun)
* **NutriBite Domain NER Output:**
  * `Vitamin C` $\rightarrow$ `NUTRIENT`
  * `iron` $\rightarrow$ `NUTRIENT`
* **Gold Reference:**
  * `[Vitamin C]` $\rightarrow$ `NUTRIENT` [0-9]
  * `[iron]` $\rightarrow$ `NUTRIENT` [28-32]

---

### Example 2: Traditional Food & Preparation Recognition (`FOOD`)
* **Test Sentence (`nutri_rag_00388`):**
  > *"Ragi porridge prepared with milk is an ideal weaning food for infants."*
* **Baseline Output:**
  * `Ragi porridge`: `O` (Unrecognized Indian culinary dish)
  * `milk`: `FOOD` / `PRODUCT`
  * `infants`: `O`
* **NutriBite Domain NER Output:**
  * `Ragi porridge` $\rightarrow$ `FOOD`
  * `milk` $\rightarrow$ `FOOD`
  * `infants` $\rightarrow$ `AGE_GROUP`
* **Gold Reference:**
  * `[Ragi porridge]` $\rightarrow$ `FOOD` [0-13]
  * `[milk]` $\rightarrow$ `FOOD` [28-32]
  * `[infants]` $\rightarrow$ `AGE_GROUP` [59-66]

---

### Example 3: Clinical Health Condition & Risk State (`HEALTH_CONDITION`)
* **Test Sentence (`nutri_rag_00612`):**
  > *"Children suffering from acute diarrhea require oral rehydration solution and zinc supplementation."*
* **Baseline Output:**
  * `Children`: `O`
  * `diarrhea`: `DISEASE` (Coarse non-pediatric label)
  * `zinc`: `O` (Missed)
* **NutriBite Domain NER Output:**
  * `Children` $\rightarrow$ `AGE_GROUP`
  * `diarrhea` $\rightarrow$ `HEALTH_CONDITION`
  * `zinc` $\rightarrow$ `NUTRIENT`
* **Gold Reference:**
  * `[Children]` $\rightarrow$ `AGE_GROUP` [0-8]
  * `[diarrhea]` $\rightarrow$ `HEALTH_CONDITION` [24-32]
  * `[zinc]` $\rightarrow$ `NUTRIENT` [74-78]

---

### Example 4: Allergen Hypersensitivity Context (`ALLERGEN`)
* **Test Sentence (`nutri_query_00045`):**
  > *"Can a toddler with severe peanut allergy eat almond butter cookies?"*
* **Baseline Output:**
  * `toddler`: `O`
  * `peanut allergy`: `O` (Missed clinical safety hazard)
  * `almond`: `O`
* **NutriBite Domain NER Output:**
  * `toddler` $\rightarrow$ `AGE_GROUP`
  * `peanut allergy` $\rightarrow$ `ALLERGEN`
  * `almond` $\rightarrow$ `FOOD`
* **Gold Reference:**
  * `[toddler]` $\rightarrow$ `AGE_GROUP` [6-13]
  * `[peanut allergy]` $\rightarrow$ `ALLERGEN` [26-40]
  * `[almond]` $\rightarrow$ `FOOD` [45-51]

---

### Example 5: Age Group & Pediatric Life Stage (`AGE_GROUP`)
* **Test Sentence (`nutri_rag_00089`):**
  > *"Infants require exclusive breastfeeding during the first 6 months of life."*
* **Baseline Output:**
  * `Infants`: `O`
  * `6 months`: `DATE` (Generic calendar duration)
* **NutriBite Domain NER Output:**
  * `Infants` $\rightarrow$ `AGE_GROUP`
  * `6 months` $\rightarrow$ `AGE_GROUP`
* **Gold Reference:**
  * `[Infants]` $\rightarrow$ `AGE_GROUP` [0-7]
  * `[6 months]` $\rightarrow$ `AGE_GROUP` [57-65]

---

### Example 6: Diurnal Meal Occasion Slot (`MEAL_TYPE`)
* **Test Sentence (`nutri_query_00112`):**
  > *"What is a healthy evening snack rich in protein for school age children?"*
* **Baseline Output:**
  * `evening snack`: `O`
  * `protein`: `O`
  * `school age children`: `O`
* **NutriBite Domain NER Output:**
  * `evening snack` $\rightarrow$ `MEAL_TYPE`
  * `protein` $\rightarrow$ `NUTRIENT`
  * `school age children` $\rightarrow$ `AGE_GROUP`
* **Gold Reference:**
  * `[evening snack]` $\rightarrow$ `MEAL_TYPE` [17-30]
  * `[protein]` $\rightarrow$ `NUTRIENT` [39-46]
  * `[school age children]` $\rightarrow$ `AGE_GROUP` [51-70]

---

### Example 7: Clinical Anthropometric Index (`GROWTH_METRIC`)
* **Test Sentence (`nutri_rag_00780`):**
  > *"Mid-Upper Arm Circumference is a validated screening indicator for acute wasting in children."*
* **Baseline Output:**
  * `Mid-Upper Arm Circumference`: `O` (Broken phrase)
  * `wasting`: `O`
  * `children`: `O`
* **NutriBite Domain NER Output:**
  * `Mid-Upper Arm Circumference` $\rightarrow$ `GROWTH_METRIC`
  * `wasting` $\rightarrow$ `HEALTH_CONDITION`
  * `children` $\rightarrow$ `AGE_GROUP`
* **Gold Reference:**
  * `[Mid-Upper Arm Circumference]` $\rightarrow$ `GROWTH_METRIC` [0-27]
  * `[wasting]` $\rightarrow$ `HEALTH_CONDITION` [67-74]
  * `[children]` $\rightarrow$ `AGE_GROUP` [78-86]

---

### Example 8: Multi-Word Compound Clinical Entity
* **Test Sentence (`nutri_rag_00215`):**
  > *"Untreated pediatric iron deficiency progresses to iron deficiency anemia."*
* **Baseline Output:**
  * `iron`: `O`
  * `anemia`: `DISEASE`
* **NutriBite Domain NER Output:**
  * `iron deficiency anemia` $\rightarrow$ `HEALTH_CONDITION`
* **Gold Reference:**
  * `[iron deficiency anemia]` $\rightarrow$ `HEALTH_CONDITION` [51-73]

---

### Example 9: Polysemous Ambiguous Term Resolution (`iron`)
* **Test Sentence (`nutri_query_00078`):**
  > *"How to boost iron intake for a 3yo child with low hemoglobin?"*
* **Baseline Output:**
  * `iron`: `O` (Missed)
  * `3yo`: `DATE`
  * `child`: `O`
* **NutriBite Domain NER Output:**
  * `iron` $\rightarrow$ `NUTRIENT`
  * `3yo` $\rightarrow$ `AGE_GROUP`
  * `child` $\rightarrow$ `AGE_GROUP`
* **Gold Reference:**
  * `[iron]` $\rightarrow$ `NUTRIENT` [13-17]
  * `[3yo]` $\rightarrow$ `AGE_GROUP` [31-34]
  * `[child]` $\rightarrow$ `AGE_GROUP` [35-40]

---

### Example 10: Overlapping Allergen Precedence Resolution
* **Test Sentence (`nutri_rag_00844`):**
  > *"In children with confirmed cow milk protein allergy, strictly avoid standard infant formula."*
* **Baseline Output:**
  * `cow milk`: `PRODUCT`
  * `protein`: `O`
  * `allergy`: `O`
* **NutriBite Domain NER Output:**
  * `children` $\rightarrow$ `AGE_GROUP`
  * `cow milk protein allergy` $\rightarrow$ `ALLERGEN`
  * `infant` $\rightarrow$ `AGE_GROUP`
* **Gold Reference:**
  * `[children]` $\rightarrow$ `AGE_GROUP` [3-11]
  * `[cow milk protein allergy]` $\rightarrow$ `ALLERGEN` [26-50]
  * `[infant]` $\rightarrow$ `AGE_GROUP` [77-83]
