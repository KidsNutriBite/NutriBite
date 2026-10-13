# Selected Dynamic Entities Specification & Clinical Justification

**Project:** NutriBite Pediatric Nutrition NLP & RAG Platform  
**Phase:** Phase 1 Entity Selection  
**Date:** September 2026  
**Selection Basis:** Empirical corpus frequency, lexical uniqueness, syntactic boundary stability, and orthogonality to the 10-Entity Schema v2.0.

---

## 1. Executive Summary of Selected Dynamic Entities

Based strictly on corpus evidence from the 913 RAG documents, 1,748 natural sentences, and 150 retrieval queries, the following **top 2–3 dynamic entities** are recommended for dynamic recognition:

| Entity Label | Category | Mentions | Unique Forms | Doc Coverage | Core Semantic Role in NutriBite |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **`COOKING_METHOD`** | Culinary & Bioactive Preparation | **198** | **23** | **124 docs** | Preparation technique modulating micronutrient retention, anti-nutrient reduction, and swallowing safety. |
| **`SUPPLEMENT`** | Clinical & Therapeutic Formulations | **37** | **14** | **24 docs** | Exogenous medicinal drops, syrups, tablets, and therapeutic food packets (ORS, RUTF, IFA). |
| **`DIET_PATTERN`** | Macroscopic Dietary Regimen | **17** | **6** | **14 docs** | High-level dietary diversity frameworks (*balanced diet, diversified diet, vegetarian diet*). |

---

## 2. Granular Specification: `COOKING_METHOD` (Primary Recommendation #1)

### 2.1 Clinical & Computational Definition
* **Definition:** Specific culinary processing, thermal manipulation, or mechanical/biochemical preparation techniques applied to food items.
* **Corpus Statistics:**
  * **Total Mentions:** 198
  * **Unique Surface Forms:** 23 distinct preparation terms
  * **Document Frequency:** 124 RAG documents (13.6% of entire knowledge base)
  * **Sentence Frequency:** 140 sentences (7.4% of natural language sentences)
  * **Multi-Word Span Ratio:** 7.6% (predominantly compact, high-precision atomic spans)
* **Top Observed Forms:** `roasted` (31), `sprouted` (25), `steamed` (23), `boiled` (21), `mashed` (17), `fermented` (13), `blanched` (9), `soaking` (8), `pressure cooking` (6).
* **Pediatric Nutrition Rationale:**
  1. *Bioavailability & Anti-Nutrient Degradation:* Sprouting, fermentation, and soaking significantly reduce phytates and tannins, unlocking bound iron and zinc.
  2. *Digestibility & Texture Safety:* Mashing, pureeing, and steaming allow age-appropriate texture progression from 6 months onwards, preventing choking.
* **Orthogonality vs Existing 10 Schema:**
  * `FOOD` is the substrate (e.g. *ragi*, *egg*).
  * `COOKING_METHOD` is the technique (e.g. *sprouted*, *boiled*).
  * `DIETARY_PROPERTY` is the resulting nutritional trait (e.g. *easily digestible*, *energy-dense*).

---

## 3. Granular Specification: `SUPPLEMENT` (Primary Recommendation #2)

### 3.1 Clinical & Computational Definition
* **Definition:** Pharmaceutical-grade or clinical therapeutic micronutrient preparations, drops, syrups, tablets, powders, or ready-to-use therapeutic foods.
* **Corpus Statistics:**
  * **Total Mentions:** 37
  * **Unique Surface Forms:** 14 distinct pharmaceutical forms
  * **Document Frequency:** 24 RAG documents (2.6% of knowledge base)
  * **Sentence Frequency:** 28 sentences (1.5% of corpus sentences)
  * **Multi-Word Span Ratio:** 78.4% (high specificity multi-word spans)
* **Top Observed Forms:** `supplementation` (15), `supplements` (6), `ors` (3), `iron drops` (3), `ifa tablets` (2), `vitamin d drops` (2), `zinc syrup` (2), `rutf` (1), `micronutrient powder` (1).
* **Pediatric Nutrition Rationale:**
  1. *Differentiating Clinical Posology from Food Intake:* Distinguishes pharmacological iron (*iron drops 15mg/day*) from dietary iron (*spinach, lentils*).
  2. *Severe Malnutrition Recovery:* Identifies therapeutic protocols like RUTF and ORS during pediatric acute diarrhea and SAM management.
* **Orthogonality vs Existing 10 Schema:**
  * `NUTRIENT` is the pure chemical entity (*iron, zinc*).
  * `SUPPLEMENT` is the delivered pharmacological dosage form (*IFA tablet, iron syrup, zinc drops*).
  * `FOOD` is normal culinary food (*khichdi, milk*).

---

## 4. Granular Specification: `DIET_PATTERN` (Alternative Candidate #3)

### 4.1 Clinical & Computational Definition
* **Definition:** High-level nutritional models, feeding paradigms, or holistic dietary frameworks.
* **Corpus Statistics:**
  * **Total Mentions:** 17
  * **Unique Surface Forms:** 6 forms
  * **Document Frequency:** 14 RAG documents (1.5% of knowledge base)
  * **Sentence Frequency:** 15 sentences (0.8% of corpus sentences)
* **Top Observed Forms:** `dietary diversity` (9), `balanced diet` (5), `plant-based diet` (1), `vegetarian diet` (1), `traditional diet` (1).
* **Orthogonality vs Existing 10 Schema:**
  * Captures overarching dietary lifestyle rather than single food items (`FOOD`) or discrete meal times (`MEAL_TYPE`).

---

## 5. Summary of Rejected Candidates

The following 7 candidate entities were thoroughly audited and rejected due to empirical evidence:

```
┌─────────────────────────┬───────────────────────────────┬────────────────────────────────────────────────────────┐
│ REJECTED CANDIDATE      │ PRIMARY DEFECT                │ CONFLICTING EXISTING ENTITY CLASSES                    │
├─────────────────────────┼───────────────────────────────┼────────────────────────────────────────────────────────┤
│ ANTHROPOMETRIC_MEASURE  │ 100% Redundancy               │ GROWTH_METRIC (exact duplicate)                        │
│ DEFICIENCY              │ Severe Semantic Ambiguity     │ HEALTH_CONDITION (e.g. anemia) & NUTRIENT (e.g. iron)  │
│ SYMPTOM                 │ Subsumed Class                │ HEALTH_CONDITION (e.g. diarrhea, constipation, edema)  │
│ DIETARY_RESTRICTION     │ Multi-class Overlap           │ ALLERGEN (gluten, lactose) & DIETARY_PROPERTY          │
│ PORTION                 │ Syntactic/Grammatical Unit    │ Handled via deterministic Quantity Extraction          │
│ NUTRITION_GOAL          │ Boundary Instability (Clauses)│ Verb-phrase clauses degrade BIO sequence precision     │
│ RECOMMENDATION          │ Standard/Guideline Overlap    │ FEEDING_METHOD & FOOD_GROUP                            │
└─────────────────────────┴───────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 6. Downstream Integration & Next Steps

1. **Precedence Integration:**
   When integrating `COOKING_METHOD` and `SUPPLEMENT` into downstream dynamic extractors:
   $$\text{HEALTH\_CONDITION} > \text{ALLERGEN} > \mathbf{SUPPLEMENT} > \text{FEEDING\_METHOD} > \text{GROWTH\_METRIC} > \text{NUTRIENT} > \mathbf{COOKING\_METHOD} > \text{DIETARY\_PROPERTY} > \text{FOOD\_GROUP} > \text{FOOD}$$

2. **RAG Retrieval Boost:**
   * Linking `COOKING_METHOD` (*sprouted*, *fermented*) directly improves retrieval of anti-nutrient reduction protocols.
   * Linking `SUPPLEMENT` (*IFA*, *vitamin D drops*, *ORS*) directly routes queries to clinical dosing guidelines.
