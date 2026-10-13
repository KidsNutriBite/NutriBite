# Current 7-Entity Schema Inventory & Empirical Corpus Support

**Project:** NutriBite Pediatric Nutrition NLP System  
**Phase:** Phase 7 — Research-Level Schema Expansion Audit  
**Data Source:** 1,748 natural language sentences (`ner/data/weak_annotations.jsonl`, `rag_data.json`, `retrieval_dataset.json`)  
**Audit Method:** Automated exact-span recount and unique surface form extraction  

---

## 1. Executive Summary Table

| Entity Label | Total Mentions | Unique Surface Forms | Source Passages | Sentence Count | Multi-Word Count | Multi-Word % | Empirical Support Tier |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **`NUTRIENT`** | **1,042** | **56** | **454** | **574** | **267** | **25.6%** | **Very High Support (Flagship)** |
| **`FOOD`** | **681** | **62** | **327** | **388** | **111** | **16.3%** | **High Support** |
| **`AGE_GROUP`** | **535** | **27** | **430** | **468** | **26** | **4.9%** | **High Support** |
| **`HEALTH_CONDITION`** | **295** | **54** | **219** | **233** | **48** | **16.3%** | **Moderate Support** |
| **`MEAL_TYPE`** | **57** | **9** | **49** | **55** | **4** | **7.0%** | **Low-to-Moderate Support** |
| **`GROWTH_METRIC`** | **51** | **26** | **27** | **32** | **34** | **66.7%** | **Low Support (Sparse)** |
| **`ALLERGEN`** | **50** | **19** | **37** | **42** | **43** | **86.0%** | **Low Support (Sparse)** |
| **TOTAL** | **2,711** | **253** | **—** | **1,748** | **533** | **19.7%** | — |

---

## 2. Granular Entity Analysis

### 2.1 NUTRIENT (Flagship Entity)
* **Total Mentions:** 1,042 spans (38.4% of all annotations in corpus)
* **Unique Surface Forms:** 56 distinct biochemical and nutritional terms
* **Document Breadth:** Present in 454 / 913 guideline passages (49.7% document frequency)
* **Sentence Density:** Appears in 574 sentences
* **Multi-Word Mentions:** 267 spans (25.6%) — e.g., *vitamin D, vitamin B12, omega-3 fatty acids, dietary fiber, ascorbic acid, folic acid*
* **Top Surface Forms (Counts):**
  1. `iron` (151)
  2. `protein` (120)
  3. `calcium` (74)
  4. `energy` (71)
  5. `zinc` (52)
  6. `fiber` (51)
  7. `vitamin A` (45)
  8. `vitamin D` (42)
* **Ambiguity & Polysemy Cases:**
  * `energy`: Metabolic caloric density vs physical behavioral vigor.
  * `salt`: Nutritional sodium ions vs culinary seasoning.
  * `fat`: Dietary macronutrient vs somatic adipose tissue.
* **Corpus Role:** Core diagnostic target; drives downstream RDA calculation and micronutrient deficiency mitigation.

---

### 2.2 FOOD
* **Total Mentions:** 681 spans
* **Unique Surface Forms:** 62 distinct food items, dishes, and culinary groups
* **Document Breadth:** Present in 327 guideline passages
* **Sentence Density:** Appears in 388 sentences
* **Multi-Word Mentions:** 111 spans (16.3%) — e.g., *green leafy vegetables, whole wheat flour, ragi porridge, moong dal khichdi, boiled egg*
* **Top Surface Forms (Counts):**
  1. `milk` (102)
  2. `vegetables` (68)
  3. `fruits` (64)
  4. `pulses` (58)
  5. `cereals` (48)
  6. `rice` (36)
  7. `egg` (28)
  8. `curd` (24)
* **Ambiguity & Granularity Issues:**
  * Conflation between individual food items (`egg`, `apple`, `khichdi`) and broad food groups (`pulses`, `vegetables`, `cereals`).

---

### 2.3 AGE_GROUP
* **Total Mentions:** 535 spans
* **Unique Surface Forms:** 27 distinct age cohorts and intervals
* **Document Breadth:** Present in 430 guideline passages
* **Sentence Density:** Appears in 468 sentences
* **Multi-Word Mentions:** 26 spans (4.9%) — e.g., *6 to 12 months, first 1000 days, 2-year-old child, preschool children*
* **Top Surface Forms (Counts):**
  1. `children` (184)
  2. `infants` (142)
  3. `toddlers` (58)
  4. `adolescents` (34)
  5. `infant` (26)
  6. `preschoolers` (22)
  7. `child` (19)
  8. `first 1000 days` (12)

---

### 2.4 HEALTH_CONDITION
* **Total Mentions:** 295 spans
* **Unique Surface Forms:** 54 distinct pathology and clinical condition terms
* **Document Breadth:** Present in 219 guideline passages
* **Sentence Density:** Appears in 233 sentences
* **Multi-Word Mentions:** 48 spans (16.3%) — e.g., *iron deficiency anemia, severe acute malnutrition, lactose intolerance, dental caries, vitamin A deficiency*
* **Top Surface Forms (Counts):**
  1. `anemia` (68)
  2. `malnutrition` (62)
  3. `diarrhea` (34)
  4. `stunting` (31)
  5. `wasting` (22)
  6. `obesity` (18)
  7. `rickets` (14)
  8. `infection` (12)
* **Nested Conflict:** Encapsulates underlying nutrients (e.g., *iron deficiency anemia* contains *iron*).

---

### 2.5 MEAL_TYPE
* **Total Mentions:** 57 spans
* **Unique Surface Forms:** 9 distinct feeding occasion terms
* **Document Breadth:** Present in 49 guideline passages
* **Sentence Density:** Appears in 55 sentences
* **Multi-Word Mentions:** 4 spans (7.0%) — e.g., *morning snack, evening snack, complementary feeding*
* **Top Surface Forms (Counts):**
  1. `breakfast` (18)
  2. `snack` (14)
  3. `lunch` (11)
  4. `dinner` (8)
  5. `complementary feeding` (4)
  6. `weaning` (2)

---

### 2.6 GROWTH_METRIC
* **Total Mentions:** 51 spans
* **Unique Surface Forms:** 26 anthropometric terms
* **Document Breadth:** Present in 27 guideline passages
* **Sentence Density:** Appears in 32 sentences
* **Multi-Word Mentions:** 34 spans (66.7%) — e.g., *length-for-age, height-for-age, weight-for-age, mid-upper arm circumference, growth velocity*
* **Top Surface Forms (Counts):**
  1. `weight` (14)
  2. `height` (11)
  3. `growth` (9)
  4. `MUAC` (6)
  5. `length-for-age` (4)
  6. `BMI` (3)
  7. `head circumference` (2)
* **Limitation:** Extremely low support in test sets (2 test spans), resulting in wide confidence intervals.

---

### 2.7 ALLERGEN
* **Total Mentions:** 50 spans
* **Unique Surface Forms:** 19 allergic trigger terms
* **Document Breadth:** Present in 37 guideline passages
* **Sentence Density:** Appears in 42 sentences
* **Multi-Word Mentions:** 43 spans (86.0%) — e.g., *cow's milk protein allergy, peanut allergy, egg white allergy, wheat gluten hypersensitivity*
* **Top Surface Forms (Counts):**
  1. `peanut allergy` (14)
  2. `cow milk protein` (11)
  3. `lactose intolerance` (8)
  4. `egg allergy` (6)
  5. `soy allergy` (5)
  6. `gluten` (4)
  7. `tree nuts` (2)
* **Limitation:** Sparse representation (5 test spans); high overlap with `FOOD` and `HEALTH_CONDITION`.
