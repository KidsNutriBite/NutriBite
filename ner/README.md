# NutriBite Domain-Specific Named Entity Recognition (NER)

A complete, reproducible domain-specific Named Entity Recognition and Information Extraction system tailored for **pediatric clinical nutrition**, deployed as part of the NutriBite / NutriKids clinical decision support platform.

---

## 1. Problem
Off-the-shelf general-domain Named Entity Recognition (NER) models (trained on OntoNotes 5.0 or CoNLL-2003) target broad classes (`PERSON`, `ORGANIZATION`, `LOCATION`, `DATE`). In pediatric clinical nutrition, these models exhibit severe semantic blindness:
* `NUTRIENT` (`iron`, `calcium`, `vitamin D`) is discarded as a common noun or misclassified as raw industrial material.
* Traditional Indian culinary dishes (`ragi porridge`, `khichdi`, `sundal`) are completely unrecognized.
* Critical clinical growth metrics (`height-for-age`, `MUAC`) are fragmented by standard tokenizers.
* **Empirical Baseline General NER Recall on this corpus:** Only **3.64%**.

---

## 2. Corpus Statistics
The pipeline operates strictly on the actual repository datasets:
* **Unstructured Text:** 913 clinical guideline passages (`rag_data.json`), 150 parental queries (`retrieval_dataset.json`), 9 clinical scenario prompts (`eval_fixtures.json`).
* **Total Segmented Sentences:** 1,748 natural sentences.
* **Total Annotated Entity Spans:** 2,711 domain spans.
* **Structured Databases:** 175 foods (`foods.json`), 172 conditions (`conditions.json`), 17 allergens (`allergies.json`), 148 goals (`goals.json`).

---

## 3. The Seven Domain-Specific Entity Labels
1. **`FOOD`:** Named edible foods, dishes, preparations, and food groups (`ragi porridge`, `moong dal khichdi`, `curd`, `green leafy vegetables`).
2. **`NUTRIENT`:** Macronutrients, micronutrients, vitamins, minerals, and dietary fibers (`iron`, `calcium`, `zinc`, `protein`, `vitamin D`, `vitamin B12`).
3. **`HEALTH_CONDITION`:** Pediatric diseases, acute symptoms, and malnutrition failure states (`malnutrition`, `anemia`, `stunting`, `wasting`, `diarrhea`, `fever`).
4. **`ALLERGEN`:** Food substances designated as clinical allergic triggers or intolerances (`peanut allergy`, `lactose intolerance`, `cow milk protein allergy`).
5. **`AGE_GROUP`:** Pediatric developmental stages and age brackets (`infant`, `toddler`, `preschooler`, `adolescent`, `6 to 8 months`, `under 5 years`).
6. **`MEAL_TYPE`:** Diurnal meal occasions and daily feeding slots (`breakfast`, `lunch`, `dinner`, `morning snack`, `evening snack`).
7. **`GROWTH_METRIC`:** Clinical anthropometric measurement indices and growth chart tools (`growth velocity`, `height-for-age`, `weight-for-height`, `MUAC`, `Z-score`).

---

## 4. Primary Flagship Contribution: `NUTRIENT`
`NUTRIENT` was selected as the flagship domain-specific entity because:
* **Overwhelming Corpus Density:** 1,042 annotated spans in the corpus.
* **Zero Conventional NER Coverage:** Off-the-shelf NER completely lacks a nutrient class.
* **Clinical Diagnostic Centrality:** Pediatric dietary assessments are conducted at the micronutrient level to prevent deficiency syndromes (rickets, anemia).
* **Empirical Performance:** Achieves **97.18% F1** on the held-out test set.

---

## 5. Annotation Methodology
```
Corpus (1,748 Sentences)
  ↓
Gazetteer Induction (7 Normalized Gazetteers)
  ↓
Distant Supervision with Overlap Precedence (ALLERGEN > HEALTH_CONDITION > NUTRIENT > FOOD)
  ↓
Validation Sample (350 Stratified Sentences)
  ↓
Passage-Grouped Leak-Free Splitting (70% Train, 15% Val, 15% Test)
```

---

## 6. Model Architecture
* **Type:** Structured Averaged Sequence Perceptron with Constrained BIO Transition Decoding.
* **Features:** Subword prefixes/suffixes, token orthography, word n-grams, contextual window tokens, and previous tag transition states.
* **Decoding:** Enforces valid BIO transitions, eliminating illegal `I-X` transitions without preceding `B-X`.

---

## 7. Training Configuration
* **Training Partitions:** Train: 1,223 sentences (70%) | Validation: 262 sentences (15%) | Test: 263 sentences (15%).
* **Splitting Strategy:** Grouped by source passage ID (`source_record_id`) with random seed `42` to guarantee zero source passage leakage.
* **Epochs:** 8 epochs (deterministic convergence in ~3 seconds on CPU).

---

## 8. Evaluation Results (Held-Out Test Set: 263 Sentences, 404 Spans)

| Domain Entity Label | Test Precision (%) | Test Recall (%) | Test F1-Score (%) | Test Gold Support |
| :--- | ---: | ---: | ---: | ---: |
| **`NUTRIENT` (Flagship)** | **95.56%** | **98.85%** | **97.18%** | **174** |
| **`FOOD`** | **95.73%** | **91.06%** | **93.33%** | **123** |
| **`AGE_GROUP`** | **100.00%** | **96.43%** | **98.18%** | **84** |
| **`HEALTH_CONDITION`** | **93.02%** | **86.96%** | **89.89%** | **46** |
| **`MEAL_TYPE`** | **100.00%** | **100.00%** | **100.00%** | **8** |
| **`GROWTH_METRIC`** | **66.67%** | **100.00%** | **80.00%** | **2** |
| **`ALLERGEN`** | **66.67%** | **40.00%** | **50.00%** | **5** |
| **OVERALL (Micro)** | **95.86%** | **94.34%** | **95.10%** | **442** |
| **OVERALL (Macro)** | **88.24%** | **87.61%** | **86.94%** | **442** |

* **Baseline General NER Micro F1:** **7.02%** (Recall: 3.64%)
* **Absolute Performance Gain:** **+88.08% F1**

---

## 9. Error Analysis
* **Rare Class Support:** `ALLERGEN` suffered lower recall (40.00%) due to sparse training representation (50 total instances).
* **Culinary Boundary Truncation:** Complex modifying dish names (`mashed ripe banana`) occasionally truncated to core nouns (`banana`).
* **Ambiguity Edge Cases:** Polysemous terms (`iron` in non-dietary contexts) resolved with 60% accuracy on the dedicated ambiguity suite.

---

## 10. Entity Linking
Extracted entities are linked to canonical database identifiers:
* `"ragi porridge"` $\rightarrow$ `FOOD` $\rightarrow$ `food_id: "F_MIL_001"` (328 kcal, cereal)
* `"vitamin D"` $\rightarrow$ `NUTRIENT` $\rightarrow$ `nutrient_id: "NUT_VIT_D"`

---

## 11. Experimental RAG Integration
Extracted entities construct structured search payloads for hybrid FAISS + BM25 retrieval:
```json
{
  "nutrients": ["iron"],
  "conditions": ["diarrhea"],
  "age_groups": ["toddler"]
}
```

---

## 12. Limitations
* Annotations rely on distant rule-guided supervision rather than multi-annotator human adjudication.
* Rare clinical entities (`ALLERGEN`, `GROWTH_METRIC`) require synthetic augmentation.
* Flat BIO encoding cannot represent nested clinical spans.

---

## 13. Quick Start & Reproduction

### Run Full Pipeline:
```bash
python ner/run_pipeline.py --stage all
```

### Run Interactive Demonstration:
```bash
python ner/demo.py "Child ate 2 idlis and milk for breakfast to boost iron and calcium"
```
