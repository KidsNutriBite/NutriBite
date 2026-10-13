# Candidate Entity Schema Inventory & Empirical Evidence

**Project:** NutriBite Pediatric Nutrition NLP System  
**Phase:** Phase 7 — Research-Level Schema Expansion Audit  
**Scope:** Systematic investigation of 15 candidate entity classes across natural language guidelines and structured databases  

---

## 1. Candidate Entity Evidence Table

The following table presents exact empirical counts measured directly from the NutriBite natural-language text corpus (1,748 sentences across `rag_data.json`, `retrieval_dataset.json`, and `retrieval_failures.json`):

| Candidate Entity | Occurrences | Unique Forms | Document Breadth | Sentence Count | Multi-Word % | Ambiguity Level | Annotation Difficulty | Downstream Clinical Utility |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`FOOD_GROUP`** | **374** | **15** | **171** | **197** | 13.6% | Low | Low | **High** (Dietary diversity, food pyramid) |
| **`FOOD_PREPARATION`** | **199** | **12** | **115** | **126** | 0.0% | Medium | Medium | Medium (Texture progression) |
| **`DIETARY_PROPERTY`** | **129** | **15** | **93** | **100** | 37.2% | Low-Medium | Medium | **High** (Energy density, digestibility) |
| **`FEEDING_METHOD`** | **66** | **6** | **56** | **57** | 36.4% | Low | Low | **High** (IYCF compliance, WHO milestones) |
| **`DEFICIENCY`** | **50** | **10** | **42** | **44** | 100.0% | Low | Low | Medium (Sub-category of `HEALTH_CONDITION`) |
| **`DIETARY_RESTRICTION`**| **43** | **5** | **34** | **39** | 34.9% | Medium | Medium | Medium (Overlaps with `ALLERGEN`) |
| **`COOKING_METHOD`** | **33** | **7** | **24** | **29** | 6.1% | Low | Low | Low (Nutrient retention advice) |
| **`ANTHROPOMETRIC_MEASURE`**| **29** | **10** | **18** | **21** | 96.6% | Low | Low | Redundant (Identical to `GROWTH_METRIC`) |
| **`RECOMMENDATION`** | **26** | **5** | **22** | **24** | 30.8% | High | High | Low (Clause-level concept, poor token span) |
| **`AGE_RANGE`** | **26** | **8** | **23** | **24** | 100.0% | Low | Low | Redundant (Identical to `AGE_GROUP`) |
| **`NUTRITION_GOAL`** | **22** | **6** | **20** | **21** | 100.0% | High | High | Low (Fragmented sentence clauses) |
| **`PORTION`** | **20** | **4** | **18** | **20** | 5.0% | Low | Low | Low (Sparse in natural guidelines) |
| **`BODY_MEASURE`** | **9** | **3** | **9** | **9** | 100.0% | Low | Low | Redundant (Subset of `GROWTH_METRIC`) |
| **`SUPPLEMENT`** | **6** | **3** | **5** | **6** | 33.3% | Medium | Medium | Low (Sparse in natural guidelines) |
| **`DIET_PATTERN`** | **6** | **2** | **6** | **6** | 0.0% | High | High | Low (Sparse; 6 total mentions) |

---

## 2. Natural-Language Evidence vs Structured Database Evidence

A critical methodological requirement of research-level NLP is distinguishing between **unstructured textual mentions** and **structured database records**. Structured relational fields must not be conflated with natural-language sequence labeling support.

```
                              DATA REPOSITORY DUALITY
   
   ┌────────────────────────────────────────┐  ┌────────────────────────────────────────┐
   │    NATURAL-LANGUAGE CORPUS EVIDENCE    │  │       STRUCTURED CATALOG EVIDENCE      │
   ├────────────────────────────────────────┤  ├────────────────────────────────────────┤
   │ • Source: Clinical text passages       │  │ • Source: Relational database tables   │
   │ • High natural frequency:              │  │ • Structured records:                  │
   │   - FOOD_GROUP: 374 text occurrences   │  │   - foods.json: 175 food items         │
   │   - DIETARY_PROPERTY: 129 occurrences  │  │   - conditions.json: 172 clinical rules│
   │   - FEEDING_METHOD: 66 occurrences     │  │   - goals.json: 148 goal records       │
   │ • Low natural frequency:               │  │   - allergies.json: 17 allergen rules  │
   │   - SUPPLEMENT: 6 occurrences          │  │ • High structured catalog presence     │
   │   - NUTRITION_GOAL: 22 occurrences     │  │   does NOT guarantee high natural-     │
   │   - PORTION: 20 occurrences            │  │   language token sequence density!     │
   └────────────────────────────────────────┘  └────────────────────────────────────────┘
```

### Detailed Breakdown by Candidate:

1. **`FOOD_GROUP` vs Structured `foods.json.category`:**
   * *Natural Language:* 374 mentions in 197 sentences (e.g., *"pulses and cereals form the backbone of Indian diets"*, *"green leafy vegetables provide carotenoids"*).
   * *Structured Data:* Every food in `foods.json` has a `category` field (`cereals`, `pulses`, `fruits`, `vegetables`, `dairy`).
   * *Alignment:* High natural-language support + complete structured database parity.

2. **`FEEDING_METHOD` vs Structured `conditions.json.feeding_route`:**
   * *Natural Language:* 66 mentions across 57 sentences (e.g., *"exclusive breastfeeding for the first six months"*, *"introduce complementary feeding at 180 days"*).
   * *Structured Data:* Implicitly referenced in infant guidelines and weaning protocols.
   * *Alignment:* Highly distinct clinical concept in pediatric nutrition (WHO IYCF core indicators).

3. **`DIETARY_PROPERTY` vs Structured Food Attributes:**
   * *Natural Language:* 129 mentions across 100 sentences (e.g., *"energy-dense mashed food"*, *"easily digestible curd"*, *"nutrient-rich snacks"*).
   * *Structured Data:* Expressed as boolean flags in food databases (`is_energy_dense`, `digestibility_score`).
   * *Alignment:* Essential modifier for pediatric meal texture and calorie density recommendations.

4. **`NUTRITION_GOAL` vs Structured `goals.json`:**
   * *Natural Language:* Only 22 mentions in text (e.g., *"to prevent stunting"*, *"support brain development"*).
   * *Structured Data:* 148 structured goal definitions in `goals.json` (e.g., `catch_up_growth`, `anemia_prevention`).
   * *Discrepancy:* While prominent in the structured system, goals are rarely stated as concise named entity spans in clinical passages; they are typically long dependent clauses.

5. **`SUPPLEMENT` vs Structured Medical Formulations:**
   * *Natural Language:* Only 6 natural mentions in guidelines (*"iron drops"*, *"vitamin D drops"*).
   * *Structured Data:* Present in clinical dosage tables.
   * *Discrepancy:* Too sparse in natural text to train a reliable statistical sequence classifier.
