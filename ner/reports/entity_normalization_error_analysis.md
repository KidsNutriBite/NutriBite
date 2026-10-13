# Entity Normalization Error Analysis & Unmatched Case Taxonomy

This report investigates unmatched mentions, ambiguous mappings, and out-of-vocabulary terms in the NutriBite entity normalization pipeline.

---

## 1. Primary Error Modes & Ambiguities

### 1.1 Chemical Synonyms & IUPAC Variants
* **Unmatched Terms:** `cholecalciferol`, `cyanocobalamin`, `ascorbic acid`, `alpha-tocopherol`.
* **Root Cause:** Natural clinical text occasionally uses formal biochemical nomenclature while basic lookup uses common vitamin names (*Vitamin D*, *Vitamin B12*).
* **Mitigation:** Expanded alias table in `entity_normalization.json` maps chemical synonyms to canonical nutrient IDs (`NUT_VIT_D`, `NUT_VIT_B12`).

### 1.2 Multi-Word Food Preparations
* **Unmatched Terms:** `mashed ripe banana`, `soft cooked dalia`, `pureed vegetable soup`.
* **Root Cause:** Modifiers (*mashed*, *ripe*, *soft cooked*) cause exact dictionary lookup misses against bare food names (`banana`, `dalia`).
* **Mitigation:** Normalization pipeline applies head-noun lemmatization to ground compound dishes to their parent IFCT base food code while isolating `DIETARY_PROPERTY` modifiers.

### 1.3 Nested Clinical Conditions
* **Ambiguous Terms:** `iron deficiency anemia`, `vitamin A deficiency blindness`.
* **Behavior:** Maps to both parent condition ID (`COND_IDA`) and sub-component nutrient (`NUT_FE_ELEMENTAL`).
* **Resolution:** Precedence rule resolves composite phrase to clinical condition ID (`COND_IDA`), preserving clinical specificity.

### 1.4 Polysemy Disambiguation (`energy`, `salt`, `fat`)
* **Behavior:** The token `energy` maps to `NUT_ENERGY` only when co-occurring with nutritional context words (*density*, *intake*, *calories*).
