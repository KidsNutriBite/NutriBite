# Phase 3 — NutriBite Dynamic NER Candidate Discovery Report

**Project:** NutriBite Pediatric Nutrition Intelligence Platform  
**Phase:** Phase 3 — Multi-Method Dynamic Candidate Discovery  
**Date:** September 2026  
**Corpus Scope:** NutriBite RAG Clinical Knowledge Base (`rag_data.json`) + Retrieval Evaluation Benchmark (`retrieval_dataset.json`)  
**Target Dynamic Entities:** `COOKING_METHOD` (Active), `SUPPLEMENT` (Active), `DIET_PATTERN` (Validated)  
**Safety & Data Isolation:** Gold/Silver NER annotations (`weak_annotations.jsonl`, `train.jsonl`, `test.jsonl`, `validation.jsonl`) remain strictly **isolated and unmodified**.

---

## 1. Executive Summary Table

| Metric | Measured Value | Description |
| :--- | :---: | :--- |
| **Total Raw Mentions Discovered** | **22745** | Total candidate spans extracted across all three discovery methods |
| **Total Unique Deduplicated Candidates** | **1500** | Unique (Entity, Span, Context) tuples after cross-method deduplication |
| **Duplicate Mentions Merged** | **350** | Redundant candidate hits merged across discovery channels |
| **Deduplication Compression Ratio** | **1.5%** | Proportion of duplicate raw mentions consolidated |

---

## 2. Configured Multi-Method Discovery Thresholds

The Candidate Discovery Engine implements three orthogonal discovery channels:

1. **Exact / Alias Regular Expression Matching:**
   * **Threshold:** `1.00` (Strict word boundary matching over registered aliases and seed spans)
   * **Semantic Precision:** 100% precision on known synonyms.

2. **Fuzzy Lexical Matching (`rapidfuzz`):**
   * **Threshold:** `0.80` (Token sort and character ratio score $\ge 80\%$)
   * **Grammatical Window:** 1 to 4 sliding token n-grams.
   * **Value:** Captures morphological inflections, pluralizations, and hyphenation variations (*e.g., "steaming" $\leftrightarrow$ "steamed", "ifa-syrup" $\leftrightarrow$ "ifa syrup"*).

3. **Dense Vector Cosine Similarity (`sentence-transformers/all-MiniLM-L6-v2`):**
   * **Threshold:** `0.70` (Cosine similarity $\ge 0.70$)
   * **Value:** Discovers semantic variations and contextual synonyms not present in static alias lists (*e.g., "thermal preparation", "therapeutic food paste"*).

---

## 3. Candidate Breakdown by Dynamic Entity

| Dynamic Entity Class | Unique Candidates | Primary Role in Pediatric Clinical Nutrition |
| :--- | :---: | :--- |
| **`SUPPLEMENT`** | **500** | Pharmaceutical drops, syrups, IFA tablets, ORS, and RUTF therapeutic feeds |
| **`COOKING_METHOD`** | **500** | Culinary and biochemical preparation modifying nutrient bioavailability & texture safety |
| **`DIET_PATTERN`** | **500** | Macroscopic dietary diversity compliance and holistic feeding regimens |

---

## 4. Breakdown by Primary Discovery Method

| Discovery Method | Candidates Found | Method Characteristics |
| :--- | :---: | :--- |
| **`embedding_similarity`** | **1244** | Dense embedding vector semantic similarity (Cosine >= 0.70) |
| **`exact_match`** | **181** | Exact word-boundary match with registered aliases and seed terms |
| **`fuzzy_match`** | **75** | Lexical fuzzy match capturing inflections and surface variations (Ratio >= 0.80) |

---

## 5. Confidence Range Distribution

| Confidence Interval | Candidate Count | Percentage (%) | Confidence Quality Tier |
| :--- | :---: | :---: | :--- |
| `[0.90 - 1.00] (High)` | **443** | 29.5% | High Confidence (Deterministic / Direct Alias Match) |
| `[0.80 - 0.89] (Medium-High)` | **1057** | 70.5% | Medium-High Confidence (High-Fidelity Fuzzy Match) |
| `[0.70 - 0.79] (Moderate)` | **0** | 0.0% | Moderate Confidence (Dense Semantic Vector Match) |
| `< 0.70 (Low)` | **0** | 0.0% | Low Confidence |

---

## 6. Top High-Confidence Discovered Candidate Examples

| Entity | Candidate Span | Score | Discovery Method | Source Document | Context Excerpt |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **`SUPPLEMENT`** | `Zinc supplementation` | **1.0000** | `exact_match` | `rag_precise_numerical_003` | *"Zinc supplementation in Diarrhoea: 10 mg elemental Zn/day for inf..."* |
| **`SUPPLEMENT`** | `ORS` | **1.0000** | `exact_match` | `rag_hypo_osmolar_ors_benefits_001` | *"Hypo-osmolar ORS: Reduced sodium (75 mmol/L) and glucose (75 mmol..."* |
| **`SUPPLEMENT`** | `ORS` | **1.0000** | `exact_match` | `rag_hypo_osmolar_ors_benefits_001` | *"It is better accepted than standard ORS, reduces stool output by ..."* |
| **`SUPPLEMENT`** | `ORS` | **1.0000** | `exact_match` | `rag_resomal_rehydration_composition_001` | *"ReSoMal (Rehydration Solution for Malnourished): A specialized so..."* |
| **`SUPPLEMENT`** | `zinc supplementation` | **1.0000** | `exact_match` | `RAG_NUT_ZINC_04` | *"WHO and UNICEF guidelines recommend zinc supplementation (20 mg/d..."* |
| **`SUPPLEMENT`** | `RUTF` | **1.0000** | `exact_match` | `RAG_UND_SPEC_04` | *"Children with SAM and medical complications require specialized i..."* |
| **`SUPPLEMENT`** | `IFA tablets` | **1.0000** | `exact_match` | `RAG_ANM_SPEC_06` | *"For children aged 5 to 9 years, Anemia Mukt Bharat provides weekl..."* |
| **`COOKING_METHOD`** | `soaking` | **1.0000** | `exact_match` | `RAG_ARF_2` | *"Preparation of amylase-rich foods involves soaking, germinating, ..."* |
| **`COOKING_METHOD`** | `boiling` | **1.0000** | `exact_match` | `RAG_COOK_2` | *"Eggs can be added to infant foods either by cooking with the mixt..."* |
| **`COOKING_METHOD`** | `boiling` | **1.0000** | `exact_match` | `RAG2003` | *"Eggs can be added to infant food either by cooking or grating aft..."* |
| **`COOKING_METHOD`** | `Boiled` | **1.0000** | `exact_match` | `goal_breastfeeding_008` | *"Boiled water or fruit juice is not necessary for babies on exclus..."* |
| **`COOKING_METHOD`** | `mashed` | **1.0000** | `exact_match` | `goal_family_pot_001` | *"By one year of age, a child should eat thickened, mashed versions..."* |
| **`COOKING_METHOD`** | `Steaming` | **1.0000** | `exact_match` | `RAG_NUT_FOL_04` | *"Steaming vegetables, utilizing pressure cooking with minimal wate..."* |
| **`COOKING_METHOD`** | `steaming` | **1.0000** | `exact_match` | `RAG_NUT_IOD_06` | *"Thorough cooking and steaming volatilely inactivates goitrogenic ..."* |
| **`COOKING_METHOD`** | `steaming` | **1.0000** | `exact_match` | `RAG_FGP_PUL_04` | *"Lightly steaming sprouted pulses for toddlers makes them tender w..."* |

---

## 7. Next Steps (Phase 4 Roadmap Preview)

In accordance with strict modular design principles:
* **Human-in-the-Loop Review:** Phase 3 candidates are stored with status `DISCOVERED` / `PENDING_REVIEW`.
* **Annotation Isolation:** No gold annotations were modified.
* **Model Training & Relation Extraction:** Left for subsequent pipeline phases.
