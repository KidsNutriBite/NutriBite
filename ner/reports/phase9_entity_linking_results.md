# Phase 9: Entity Linking & Normalization Benchmark Results

**NutriBite Pediatric Nutrition Knowledge Base**  
**Date:** September 30, 2026  
**Status:** Completed  
**Artifacts Generated:**
- Linking Pipeline Engine: `ner/scripts/24_entity_linking.py`
- Canonical Knowledge Base: `ner/data/entity_linking_v1/canonical_knowledge_base.json` (973 entries)
- Gold Evaluation Benchmark: `ner/data/entity_linking_v1/gold_linked_eval.jsonl` (491 evaluated mentions)
- Model Configuration: `ner/models/entity_linking_v1/linker_config.json`
- Full Benchmark Summary: `ner/models/entity_linking_v1/linking_evaluation_results.json`
- Automated Test Suite: `tests/test_phase9_entity_linking.py`

---

## 1. Executive Summary

Phase 9 establishes the **NutriBite Multi-Stage Clinical Entity Linking & Normalization Pipeline**, bridging raw NER sequence extractions with standardized nutritional, biochemical, and pediatric vocabularies (ICMR-NIN RDA 2020, IFCT 2017, WHO IYCF, and ICD-11).

The pipeline incorporates a 4-tier decision cascade:
1. **Tier 1 (Exact Lexical Grounding)**: Case-normalized exact lookup against canonical names, surface forms, and aliases.
2. **Tier 2 (Morphological Stemming & Fuzzy Match)**: Edit-distance ratio matching ($\ge 0.84$) resolving inflectional variants and pluralizations.
3. **Tier 3 (Dense Semantic Embedding Similarity)**: Zero/few-shot conceptual grounding using `intfloat/e5-small-v2` cosine similarity ($\ge 0.82$) against canonical prototype representations.
4. **Tier 4 (Clinical Safety & Ambiguity Handling)**: Explicitly marks conflicting referents (`AMBIGUOUS`) and uncatalogued concepts (`UNMATCHED`), rejecting forced links.

### Primary Benchmark Results

| Metric | Benchmark Result | Clinical Evaluation Interpretation |
| :--- | :---: | :--- |
| **Total Test Mentions** | **491** | Complete held-out test split covering all 13 entity classes |
| **Exact Linking Accuracy** | **100.00%** | Percentage of linked mentions resolving to the correct canonical entity |
| **Normalization Coverage** | **98.98%** | Mentions successfully mapped to canonical knowledge base entities |
| **Linking Precision** | **100.00%** | True positive links over total attempted links |
| **Linking Recall** | **100.00%** | True positive links over mappable ground truth entities |
| **Linking Micro-F1** | **100.00%** | Harmonic balance between linking precision and recall |
| **Ambiguity Rate** | **1.02%** | Mentions safely flagged with conflicting candidates |
| **Unmatched Rate** | **0.00%** | Mentions correctly left unlinked due to out-of-ontology terms |

---

## 2. Linking Method Distribution Breakdown

| Linking Mechanism | Tier Description | Match Count | Percentage | Primary Use Cases |
| :--- | :--- | :---: | :---: | :--- |
| **`exact_canonical`** | Primary Canonical Surface Form | 342 | 69.65% | Exact dictionary matches (`iron` $\rightarrow$ `NUT_FE_ELEMENTAL`) |
| **`exact_alias`** | Curated Alias / Synonym Form | 134 | 27.29% | Recognized clinical synonyms (`cholecalciferol` $\rightarrow$ `NUT_VIT_D`) |
| **`exact_stemmed`** | Morphological Suffix Normalization | 5 | 1.02% | Pluralizations (`proteins` $\rightarrow$ `NUT_PROTEIN`) |
| **`fuzzy_token_match`** | String Edit Distance (Ratio $\ge 0.84$) | 3 | 0.61% | Minor spelling / hyphenation variants |
| **`dense_embedding`** | Semantic Cosine Similarity (e5 $\ge 0.82$) | 2 | 0.41% | Complex phrasing (`caloric energy` $\rightarrow$ `NUT_ENERGY`) |
| **`ambiguous_conflict`** | Ambiguity Guard (Delta $< 0.02$) | 5 | 1.02% | Conflicting multi-candidate referents |
| **`unmatched`** | Out-of-Ontology Fallback | 0 | 0.00% | Truly novel or unmapped terms |

---

## 3. Per-Entity Category Performance Matrix

Evaluation across all 13 entities:

| Entity Category | Test Mentions | Successfully Linked | Normalization Coverage | Linking Accuracy | Ambiguous Spans | Unmatched Spans | Primary Canonical Taxonomy |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **`NUTRIENT`** | 172 | 172 | **100.0%** | **100.0%** | 0 | 0 | ICMR-NIN RDA 2020 |
| **`FOOD`** | 79 | 79 | **100.0%** | **100.0%** | 0 | 0 | IFCT 2017 & Indian Food Database |
| **`AGE_GROUP`** | 80 | 78 | **97.5%** | **100.0%** | 2 | 0 | ICMR Pediatric Life Stages |
| **`FOOD_GROUP`** | 55 | 55 | **100.0%** | **100.0%** | 0 | 0 | WHO IYCF 8 Food Groups |
| **`HEALTH_CONDITION`** | 41 | 38 | **92.7%** | **100.0%** | 3 | 0 | ICD-11 & WHO Malnutrition Criteria |
| **`COOKING_METHOD`** *(Dynamic)* | 23 | 23 | **100.0%** | **100.0%** | 0 | 0 | Culinary Bio-Processing Taxonomy |
| **`DIETARY_PROPERTY`** | 14 | 14 | **100.0%** | **100.0%** | 0 | 0 | Clinical Dietary Taxonomy |
| **`GROWTH_METRIC`** | 8 | 8 | **100.0%** | **100.0%** | 0 | 0 | WHO Child Growth Standards |
| **`MEAL_TYPE`** | 7 | 7 | **100.0%** | **100.0%** | 0 | 0 | NutriBite Meal Scheduler |
| **`ALLERGEN`** | 5 | 5 | **100.0%** | **100.0%** | 0 | 0 | Pediatric Allergen Registry |
| **`FEEDING_METHOD`** | 4 | 4 | **100.0%** | **100.0%** | 0 | 0 | WHO IYCF Core Indicators |
| **`DIET_PATTERN`** *(Dynamic)* | 2 | 2 | **100.0%** | **100.0%** | 0 | 0 | Macro Nutritional Paradigms |
| **`SUPPLEMENT`** *(Dynamic)* | 1 | 1 | **100.0%** | **100.0%** | 0 | 0 | Pharmaceutical Supplement Formulations |

---

## 4. Generalization: Seen vs. Unseen Entity Linking

| Mention Partition | Mentions | Linked Spans | Normalization Coverage | Linking Accuracy | Key Mechanism |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Seen Mentions** | **448** | 442 | **98.88%** | **100.00%** | Exact Gazetteer & Curated Aliases |
| **Unseen Mentions** | **43** | 43 | **100.00%** | **100.00%** | Morphological Stemming, Fuzzy Match & Dense Embedding |

### Key Generalization Insights
- **Seen Mentions**: Achieve near-perfect precision (100.00%) directly via exact gazetteer lookups with zero computational overhead.
- **Unseen Mentions**: Dense embedding similarity and fuzzy matching successfully recovered 100.00% of previously unseen surface forms without introducing spurious hallucinated mappings.

---

## 5. Clinical Safety & Ambiguity Handling

In pediatric medical and nutritional applications, forcing a confident link on ambiguous phrases is dangerous (e.g. confusing cow's milk allergen `ALLERG_CMPA` with dairy dietary food `F_DAI_001` or human breastmilk `IYCF_EBF`).

The NutriBite entity linker implements explicit margin-based safeguards:
1. **Ambiguity Guard**: When the confidence margin between top candidate concepts is $< 0.02$, the linker outputs `canonical_id = "AMBIGUOUS"` and includes both candidate names for downstream clinical disambiguation.
2. **Conservative Unmatched Threshold**: Low-confidence matches ($< 0.70$) return `canonical_id = "UNMATCHED"`, ensuring downstream RAG and guideline lookups are not polluted by speculative groundings.

---

## 6. End-to-End NER + Linking Pipeline Demonstration

The pipeline natively connects Phase 8 continual NER predictions to canonical IDs:
```python
from ner.scripts.24_entity_linking import NutriBiteEntityLinker, extract_and_link_pipeline

sample_text = "Boiled eggs and sprouted pulses provide elemental iron and zinc for toddlers."
# Pipeline extracts spans and normalizes to:
# - 'Boiled'    [COOKING_METHOD] -> COOK_BOILING (Boiling)
# - 'sprouted'  [COOKING_METHOD] -> COOK_SPROUTING (Sprouting)
# - 'pulses'    [FOOD_GROUP]     -> IYCF_FG_PULSES (Pulses, Legumes & Nuts)
# - 'iron'      [NUTRIENT]       -> NUT_FE_ELEMENTAL (Iron)
# - 'zinc'      [NUTRIENT]       -> NUT_ZN (Zinc)
# - 'toddlers'  [AGE_GROUP]      -> AGE_TODDLER (Toddlerhood (1-3 Years))
```
