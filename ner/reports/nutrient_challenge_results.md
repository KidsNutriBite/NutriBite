# Nutrient Challenge Suite Evaluation Results

**Test Suite:** `ner/data/human_gold/nutrient_challenge.jsonl`  
**Total Challenge Sentences:** 25  
**Total Target Spans:** 63  
**Overall Performance:** Precision = 57.14% | Recall = 38.10% | Micro F1 = 45.71%

---

## 1. Performance by Linguistic Challenge Category

| Category | Description | Gold Spans | True Positives | False Positives | False Negatives | Precision | Recall | F1 Score |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **ambiguity_polysemy** | Stress test for ambiguity_polysemy | 21 | 5 | 2 | 16 | 71.4% | 23.8% | **35.7%** |
| **contextual_edge** | Stress test for contextual_edge | 0 | 0 | 1 | 0 | 0.0% | 0.0% | **0.0%** |
| **morphological_variants** | Stress test for morphological_variants | 6 | 2 | 2 | 4 | 50.0% | 33.3% | **40.0%** |
| **multiword_nutrients** | Stress test for multiword_nutrients | 13 | 8 | 4 | 5 | 66.7% | 61.5% | **64.0%** |
| **nested_conflict** | Stress test for nested_conflict | 7 | 2 | 5 | 5 | 28.6% | 28.6% | **28.6%** |
| **quantity_boundaries** | Stress test for quantity_boundaries | 5 | 3 | 1 | 2 | 75.0% | 60.0% | **66.7%** |
| **synonyms_variants** | Stress test for synonyms_variants | 11 | 4 | 3 | 7 | 57.1% | 36.4% | **44.4%** |

---

## 2. Key Error Patterns Identified in Challenge Suite

1. **Unseen Chemical Synonyms (e.g., `cholecalciferol`, `ascorbic acid`, `cyanocobalamin`):**
   * Perceptron sequence model misses chemical IUPAC names that did not appear in training gazetteers.
2. **Abbreviated Variants (e.g., `Vit D`, `DHA`, `EPA`):**
   * Successfully extracts uppercase acronyms when flanked by nutritional verbs.
3. **Compound Modifiers (e.g., `protein-rich`, `whole wheat flour`):**
   * Hyphenated tokens cause boundary truncation.
4. **Polysemy Disambiguation (`energy`, `salt`, `growth`):**
   * Successfully distinguishes physiological `energy` from non-clinical activity when context words like `density` or `metabolism` are present.
5. **Quantity Boundary Separation (`400 IU vitamin D3`, `15 mg elemental iron`):**
   * Cleanly separates numbers and metric units from base nutrient entities.
