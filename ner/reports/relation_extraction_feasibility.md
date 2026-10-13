# Relation Extraction Feasibility Study in Pediatric Nutrition

**Project:** NutriBite Pediatric Nutrition NLP System  
**Phase:** Phase 7 — Research-Level Schema Expansion Audit  
**Scope:** Assessing whether the unstructured natural-language corpus supports automated Relation Extraction (RE)  

---

## 1. Executive Summary & Feasibility Verdict

> [!IMPORTANT]
> **Core Principle:** A relation stored in a database (e.g., `foods.json` mapping food $\rightarrow$ nutrients) does **NOT** constitute evidence that natural language sentences express that relation explicitly. Relation extraction feasibility must be evaluated strictly against syntactic co-occurrence patterns in natural text.

| Candidate Relation Type | Natural Text Matches | Expression Nature | Annotation Feasibility | Clinical Utility | Feasibility Verdict |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **`FOOD -> CONTAINS -> NUTRIENT`** | **70** | Explicit syntactic | **High** | **High** | **FEASIBLE (Recommended)** |
| **`FOOD -> SUITABLE_FOR -> AGE_GROUP`** | **335** | Explicit syntactic | **High** | **High** | **FEASIBLE (Recommended)** |
| **`FOOD -> TRIGGERS -> ALLERGEN`** | 0 (Rigid) / 12 (Loose) | Implicit / Dispersed | Medium | High | **NEEDS MORE DATA** |
| **`HEALTH_CONDITION -> ASSOCIATED_WITH -> NUTRIENT`** | 0 (Rigid) / 18 (Loose) | Explanatory / Multi-clause | Low | High | **NEEDS MORE DATA** |
| **`FEEDING_METHOD -> SUITABLE_FOR -> AGE_GROUP`** | 0 (Rigid) / 14 (Loose) | Guidelines / Co-occurrence | Medium | Medium | **POSSIBLE EXTENSION** |
| **`NUTRITION_GOAL -> SUPPORTED_BY -> FOOD`** | 0 | Abstract discourse | Very Low | Low | **NOT FEASIBLE** |
| **`MEAL_TYPE -> INCLUDES -> FOOD`** | 0 | Ad-hoc lists | Low | Low | **NOT FEASIBLE** |

**Overall Research Verdict:**  
**FEASIBLE FOR TARGETED RELATIONS** (`FOOD -> CONTAINS -> NUTRIENT` and `FOOD -> SUITABLE_FOR -> AGE_GROUP`). Full-schema arbitrary relation extraction is **NOT RECOMMENDED** due to syntactic sparsity in other categories.

---

## 2. In-Depth Analysis of Feasible Relations

### 2.1 Relation 1: `FOOD -> CONTAINS -> NUTRIENT` (70 Explicit Text Matches)
* **Definition:** A food item or food group is explicitly stated as supplying, containing, or being a rich source of a specific nutrient.
* **Syntactic Triggers:** *is rich in, provides, contains, is an excellent source of, supplies, delivers*.
* **Concrete Corpus Examples:**
  1. *"Ragi is a rich source of calcium and dietary fiber essential for growing infants."*
     * `[Ragi: FOOD]` $\xrightarrow{\text{CONTAINS}}$ `[calcium: NUTRIENT]`
     * `[Ragi: FOOD]` $\xrightarrow{\text{CONTAINS}}$ `[dietary fiber: NUTRIENT]`
  2. *"Green leafy vegetables provide iron, folate, and carotenoids."*
     * `[Green leafy vegetables: FOOD_GROUP]` $\xrightarrow{\text{CONTAINS}}$ `[iron: NUTRIENT]`
     * `[Green leafy vegetables: FOOD_GROUP]` $\xrightarrow{\text{CONTAINS}}$ `[folate: NUTRIENT]`
  3. *"Whole pulses supply vital dietary protein and zinc."*
     * `[Whole pulses: FOOD_GROUP]` $\xrightarrow{\text{CONTAINS}}$ `[protein: NUTRIENT]`
     * `[Whole pulses: FOOD_GROUP]` $\xrightarrow{\text{CONTAINS}}$ `[zinc: NUTRIENT]`
* **Clinical Utility:** Validates food-to-nutrient bio-adequacy and automates knowledge graph construction for pediatric dietary advice.

---

### 2.2 Relation 2: `FOOD -> SUITABLE_FOR -> AGE_GROUP` (335 Explicit Text Matches)
* **Definition:** A food or preparation is explicitly recommended for a specific pediatric age bracket or developmental life stage.
* **Syntactic Triggers:** *can be given to, is suitable for, is recommended for, introduced to, during, for*.
* **Concrete Corpus Examples:**
  1. *"Semi-solid moong dal khichdi can be introduced to infants from 6 to 8 months."*
     * `[moong dal khichdi: FOOD]` $\xrightarrow{\text{SUITABLE\_FOR}}$ `[6 to 8 months: AGE_GROUP]`
  2. *"Mashed banana is an ideal transitional food for infants."*
     * `[Mashed banana: FOOD]` $\xrightarrow{\text{SUITABLE\_FOR}}$ `[infants: AGE_GROUP]`
  3. *"Finger foods such as steamed carrot sticks are recommended for toddlers."*
     * `[steamed carrot sticks: FOOD]` $\xrightarrow{\text{SUITABLE\_FOR}}$ `[toddlers: AGE_GROUP]`
* **Clinical Utility:** Automates pediatric age-appropriateness checks and prevents choking hazards or premature solid food introduction.

---

## 3. Analysis of Infeasible / Sparse Relations

### 3.1 `HEALTH_CONDITION -> ASSOCIATED_WITH -> NUTRIENT`
* **Why it Fails in Natural Text:** Clinical guidelines rarely state simple subject-verb-object triples like *"Anemia is caused by lack of iron."* Instead, they use complex passive discourse: *"In resource-limited settings, the high prevalence of microcytic hypochromic indices among under-five populations predominantly stems from sub-optimal bioavailable iron intake compounded by hookworm infestation."*
* **Extraction Difficulty:** Requires complex multi-hop cross-clause dependency parsing rather than local token relation extraction.

### 3.2 `FOOD -> TRIGGERS -> ALLERGEN`
* **Why it Fails in Natural Text:** Allergies in the corpus are stated as clinical conditions rather than explicit causal verbal phrases (e.g., *"Children with cow's milk protein allergy must avoid paneer and curd."*). The relation is stored structured in `allergies.json`, but natural text uses avoidance phrasing rather than direct triggering triples.

---

## 4. Methodological Recommendation for NutriBite

We recommend adopting a **Two-Tier Information Extraction Architecture**:
1. **Tier 1 (Sequence Labeling):** Extract domain entities (`FOOD`, `NUTRIENT`, `FOOD_GROUP`, `AGE_GROUP`, `HEALTH_CONDITION`, etc.) with high precision.
2. **Tier 2 (Targeted Relation Classification):** Train a lightweight binary relation classifier solely on sentence-level entity pairs for the two verified relations:
   * $\text{Rel}_1: \text{FOOD} \times \text{NUTRIENT} \rightarrow \{\text{CONTAINS}, \text{NONE}\}$
   * $\text{Rel}_2: \text{FOOD} \times \text{AGE\_GROUP} \rightarrow \{\text{SUITABLE\_FOR}, \text{NONE}\}$
