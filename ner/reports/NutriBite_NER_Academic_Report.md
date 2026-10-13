# Domain-Specific Named Entity Recognition for Pediatric Nutrition

**Project:** NutriBite / NutriKids Domain-Specific NLP System  
**Task:** Named Entity Recognition (NER), Sequence Labeling, and Domain Entity Induction  
**Academic Benchmark:** Phase 3 Implementation + Phase 4 Audit + Phase 5 Independent Hardening  
**Audit Status:** Fully Verified — Independent Human-Gold Benchmark Ready, Seen/Unseen Generalization Audited, Adversarial Challenge Evaluated  

---

## Abstract

General-purpose Named Entity Recognition (NER) architectures trained on standard benchmarks (such as OntoNotes or CoNLL-2003) target broad entity categories (e.g., `PERSON`, `ORGANIZATION`, `LOCATION`, `QUANTITY`) and consistently fail to capture domain-critical concepts in specialized medical and nutritional domains. In pediatric clinical nutrition, dietary assessments, deficiency diagnosis, and automated meal planning depend fundamentally on recognizing specific foods, biochemical nutrients, clinical pathology states, and physiological developmental cohorts.

In this work, we design, implement, and empirically validate a domain-specific Named Entity Recognition system for the **NutriBite pediatric nutrition corpus**. Using an evidence-based schema induced from 913 clinical guideline passages (`rag_data.json`), 150 conversational caregiver queries (`retrieval_dataset.json`), and 175 structured food composition records (`foods.json`), we introduce seven domain-specific semantic categories: `FOOD`, `NUTRIENT`, `HEALTH_CONDITION`, `ALLERGEN`, `AGE_GROUP`, `MEAL_TYPE`, and `GROWTH_METRIC`. We introduce and operationalize **`NUTRIENT`** as our primary academic contribution, demonstrating that general NER systems omit this critical diagnostic entity. We construct a distant-supervision annotation engine with deterministic overlap precedence, compile leak-free passage-grouped dataset partitions (1,748 sentences, 2,711 entity spans), and train a structured sequence classifier with BIO transition decoding.

On the held-out silver test partition (263 sentences, 442 entity spans), our domain model achieves an **Overall Micro F1 of 95.10%** (Precision: 95.86%, Recall: 94.34%) and a **Macro F1 of 86.94%**. For the newly introduced `NUTRIENT` entity, the model achieves **97.18% F1** (Precision: 95.56%, Recall: 98.85% across 174 test spans). In Phase 5 hardening, we establish an independent human-gold benchmark package (150 stratified candidate sentences with formal annotation guidelines), audit Seen (99.40% F1) vs Unseen (60.00% F1) nutrient generalization, evaluate an adversarial 25-sentence challenge suite (45.71% F1), and explicitly document gazetteer circularity and distant-supervision boundaries.

---

## 1. Introduction & Academic Contribution Framing

Named Entity Recognition (NER) is a core information extraction task that locates and classifies named entity mentions in unstructured natural-language text into predefined semantic categories. While general-domain NER has matured significantly with transformer-based language models, applying standard NER to specialized clinical domains reveals acute semantic blindness.

In the pediatric nutrition domain—instantiated in the **NutriBite** clinical decision support platform—caregivers and pediatricians communicate via unstructured text:
* *"My 2-year-old child with severe diarrhea needs iron-dense digestible food for dinner."*

A conventional general-purpose NER model processes this sentence with no awareness of pediatric nutritional entities:
* `2-year-old` → `DATE` (temporal duration; misses AGE_GROUP developmental context)
* `diarrhea` → `DISEASE` / `O` (missed as generic symptom; misses pediatric HEALTH_CONDITION)
* `iron` → `O` (missed — treated as a common English noun or industrial metal)
* `food` → `O` (missed as generic common noun)
* `dinner` → `O` (missed as generic common noun)

### Precise Academic Claim
The project does **not** claim to have invented a new deep learning sequence architecture, nor does it claim to have "invented nutrient recognition" in the abstract. Instead, the academic contribution is framed as:
> **"We introduce and operationalize a domain-specific NUTRIENT entity category within a dedicated pediatric nutrition NER schema and evaluate its extraction on the NutriBite corpus."**

---

## 2. Corpus Description

The NutriBite corpus is a hybrid repository comprising unstructured clinical guideline text, caregiver queries, clinical test benchmarks, and structured nutritional databases:

```
                              NUTRIBITE CORPUS CONSTITUENTS
   
   ┌─────────────────────────────────────────────────────────────────────┐
   │                   UNSTRUCTURED NATURAL-LANGUAGE TEXT                │
   ├─────────────────────────────────────────────────────────────────────┤
   │ • rag_data.json          : 913 clinical guideline passages (~53,500 │
   │                           words, 446 KB)                            │
   │ • retrieval_dataset.json : 150 real-world parental queries (18.7 KB)│
   │ • eval_fixtures.json     : 9 clinical safety scenario prompts       │
   │ • Total Annotated Sents  : 1,748 segmented text instances           │
   └──────────────────────────────┬──────────────────────────────────────┘
                                  │
                                  ▼
   ┌─────────────────────────────────────────────────────────────────────┐
   │                    STRUCTURED DOMAIN CATALOGS                       │
   ├─────────────────────────────────────────────────────────────────────┤
   │ • foods.json             : 175 foods with 19 nutritional attributes │
   │ • conditions.json        : 172 condition adaptation rules           │
   │ • allergies.json         : 17 allergen avoidance records            │
   │ • goals.json             : 148 dietary goal definitions             │
   └─────────────────────────────────────────────────────────────────────┘
```

The natural text incorporates formal ICMR-NIN recommendations, WHO child growth standards, IAP pediatric hematology guidelines, regional Indian culinary preparations (`ragi porridge`, `khichdi`, `sundal`, `avial`), and conversational parental inquiries.

---

## 3. General NER vs Domain-Specific NER Coverage

| Semantic Category | General-Domain Baseline NER (CoNLL/OntoNotes) | NutriBite Domain-Specific NER | Empirical Evidence in Corpus |
| :--- | :--- | :--- | :--- |
| **`ORGANIZATION`** | Conventional (`ORG`) | Conventional (`ORG`) | `ICMR`, `WHO`, `NIN`, `IAP`, `FSSAI` (~110 mentions) |
| **`LOCATION`** | Conventional (`GPE`/`LOC`) | Conventional (`LOC`) | `India`, `Kerala`, `Punjab`, `Tamil Nadu` (~50 mentions) |
| **`QUANTITY`** | Conventional (`QUANTITY`) | Conventional (`QUANTITY`) | `400g`, `250ml`, `10 g`, `1 lakh IU` (>350 mentions) |
| **`FOOD`** | Missing / Conflated with `PRODUCT` | **Custom Domain Label (`FOOD`)** | `ragi`, `khichdi`, `curd`, `paneer`, `egg` (>450 mentions) |
| **`NUTRIENT`** | **Missing / Discarded as Common Noun** | **Custom Flagship Label (`NUTRIENT`)** | `iron`, `calcium`, `zinc`, `protein`, `vit D` (>550 mentions) |
| **`HEALTH_CONDITION`**| Coarse `DISEASE` / Misses Growth Deficits | **Custom Domain Label (`HEALTH_CONDITION`)**| `malnutrition`, `anemia`, `stunting`, `wasting` (>120 mentions) |
| **`ALLERGEN`** | Missing (Cannot detect safety hazards) | **Custom Domain Label (`ALLERGEN`)** | `peanut allergy`, `lactose intolerance` (~30 mentions) |
| **`AGE_GROUP`** | Generic Temporal `DATE` / `TIME` | **Custom Domain Label (`AGE_GROUP`)** | `infant`, `toddler`, `preschooler`, `6-8 mo` (>380 mentions) |
| **`MEAL_TYPE`** | Missing / Common Noun | **Custom Domain Label (`MEAL_TYPE`)** | `breakfast`, `lunch`, `evening snack` (~80 mentions) |
| **`GROWTH_METRIC`** | Missing / Tokenizer breaks hyphenation | **Custom Domain Label (`GROWTH_METRIC`)** | `growth velocity`, `height-for-age`, `MUAC` (~45 mentions) |

---

## 4. Proposed Entity Schema

The NutriBite NER schema defines seven mutually exclusive domain entity categories:

1. **`FOOD`:** Any named edible substance, individual food item, traditional culinary preparation, or collective food group (e.g., `ragi porridge`, `moong dal khichdi`, `paneer`, `green leafy vegetables`).
2. **`NUTRIENT`:** Any dietary macronutrient, micronutrient, vitamin, essential mineral, fatty acid, or dietary fiber (e.g., `iron`, `calcium`, `zinc`, `protein`, `vitamin D`, `vitamin B12`).
3. **`HEALTH_CONDITION`:** Any pediatric disease, clinical pathology, acute symptom, nutritional deficiency state, or anthropometric growth failure (e.g., `malnutrition`, `anemia`, `stunting`, `wasting`, `diarrhea`).
4. **`ALLERGEN`:** Any food substance designated as an allergic trigger, clinical hypersensitivity, or food intolerance condition (e.g., `peanut allergy`, `lactose intolerance`, `cow milk protein allergy`).
5. **`AGE_GROUP`:** Any pediatric developmental life stage, developmental milestone cohort, or numeric age span (e.g., `infant`, `toddler`, `preschooler`, `adolescent`, `6 to 8 months`).
6. **`MEAL_TYPE`:** Any designated diurnal meal occasion or daily feeding schedule slot (e.g., `breakfast`, `lunch`, `dinner`, `morning snack`, `evening snack`).
7. **`GROWTH_METRIC`:** Any clinical anthropometric measurement index, growth velocity parameter, or pediatric growth chart indicator (e.g., `growth velocity`, `height-for-age`, `MUAC`, `Z-score`).

---

## 5. Primary Domain Entity: NUTRIENT

### Comprehensive Evidentiary Argument for the Flagship Entity

```
                        THE FLAGSHIP ENTITY: NUTRIENT
   
   1. Overwhelming Corpus Frequency:
      Nutrients represent the highest single density concept in the entire corpus
      with 1,042 annotated spans (iron: 151, protein: 120, calcium: 74, energy: 71,
      zinc: 52, fiber: 51).
   
   2. Absolute Failure of Conventional NER:
      Standard OntoNotes models have zero support for nutritional biochemistry.
      Elements like "iron" and "zinc" are discarded as common nouns or
      misclassified as industrial raw materials.
   
   3. Diagnostic Centrality in Pediatric Care:
      Nutritional adequacy is calculated at the micronutrient level. Detecting
      that a child lacks "iron" or "vitamin D" drives clinical rickets prevention,
      brain development, and anemia care.
   
   4. High Annotation Consistency & Reproducibility:
      Nutrient terminology is biochemically standardized with rigid nomenclature
      (e.g., [vitamin B12], [omega-3 fatty acids]), making annotation rules
      unambiguous and deterministic.
   
   5. Direct Platform Integration:
      Extracted nutrient spans directly populate the NutriBite Nutrient Gap Engine
      (nutrientGapEngine.js) and trigger targeted RAG deficiency passage retrieval.
```

---

## 6. Distant-Supervision Annotation Methodology

> **Important Methodological Note:** The base corpus was annotated using **distant supervision** with deterministic gazetteer rules. `manual_validation.jsonl` represents a distant-supervision validation sample, not human-annotated gold data.

The distant supervision pipeline followed four steps:
1. **Sentence Segmentation:** 1,748 natural sentences extracted from corpus sources.
2. **Normalized Gazetteers:** Induced 172 foods, 18 nutrients, 172 conditions, 10 allergens, 6 age groups, 6 meal types, and 9 growth metrics from structured files.
3. **Distant Supervision with Overlap Precedence:**
   * *Rule 1:* `ALLERGEN` overrides `FOOD` (e.g., `[peanut allergy]` → `ALLERGEN`).
   * *Rule 2:* Compound `HEALTH_CONDITION` overrides `NUTRIENT` (e.g., `[iron deficiency anemia]` → `HEALTH_CONDITION`).
   * *Rule 3:* Culinary modifiers are bound to `FOOD` (e.g., `[moong dal khichdi]` → `FOOD`).
   * *Rule 4:* Alphanumeric vitamins are atomic spans (e.g., `[vitamin B12]` → `NUTRIENT`).
4. **Passage-Grouped Leak-Free Splitting:** Sentences grouped by source record ID and deterministically partitioned with seed `42` into Train (1,223 sentences, 70%), Validation (262 sentences, 15%), and Test (263 sentences, 15%).

---

## 7. Model Architecture

The domain NER sequence classifier is implemented as a **Structured Averaged Sequence Perceptron with Constrained BIO Transition Decoding**:

```
   Tokenized Sentence:  [ "Ragi", "porridge", "provides", "calcium", "for", "infants" ]
                               |
                               v
   Feature Extraction:  * Word n-grams (w[i], w[i-1]_w[i], w[i]_w[i+1])
                        * Subword affixes (prefix-2/3, suffix-2/3, length)
                        * Orthographic shapes (TitleCase, UPPERCASE, digits, hyphens)
                        * Previous prediction transition state (prev_tag)
                               |
                               v
   Linear Weight Scoring: S(y_i | x_i, y_{i-1}) = sum_k w_k * f_k(x, i, y_i, y_{i-1})
                               |
                               v
   BIO Transition Filter: Masks illegal transitions (e.g., I-FOOD cannot follow O)
                               |
                               v
   Decoded Span Output: [ FOOD, FOOD, O, NUTRIENT, O, AGE_GROUP ]
```

* **Parameters:** 8 epochs, averaged weight parameters across 26,643 training tokens, seed 42.
* **Transition Enforcement:** Strictly guarantees that no orphaned `I-X` tags are generated.

---

## 8. Experimental Setup

* **Hardware & Runtime:** Windows OS, Python 3.12+, unbuffered execution.
* **Corpus Partitions (Audited Actual Values):**

| Split | Sentences | Entity Spans | Annotation Nature |
| :--- | ---: | ---: | :--- |
| Train | 1,223 | 1,851 | Silver (Distant Supervision) |
| Validation | 262 | 418 | Silver (Distant Supervision) |
| Test (held-out) | 263 | 442 | Silver (Distant Supervision) |

* **Evaluation Metrics:** Exact span-level Precision, Recall, F1 (Micro and Macro) computed via strict entity span matching `[token_start, token_end, label]`.

---

## 9. Silver Test Set Experimental Results

### Test Set Exact Span-Level Results (263 sentences, 442 silver entity spans):

| Domain Entity Label | Test Precision (%) | Test Recall (%) | Test F1-Score (%) | Test Support (Spans) |
| :--- | ---: | ---: | ---: | ---: |
| **`NUTRIENT` (Flagship)** | **95.56%** | **98.85%** | **97.18%** | **174** |
| **`FOOD`** | **95.73%** | **91.06%** | **93.33%** | **123** |
| **`AGE_GROUP`** | **100.00%** | **96.43%** | **98.18%** | **84** |
| **`HEALTH_CONDITION`** | **93.02%** | **86.96%** | **89.89%** | **46** |
| **`MEAL_TYPE`** | **100.00%** | **100.00%** | **100.00%** | **8** |
| **`GROWTH_METRIC`** * | **66.67%** | **100.00%** | **80.00%** | **2** |
| **`ALLERGEN`** * | **66.67%** | **40.00%** | **50.00%** | **5** |
| **OVERALL (Micro)** | **95.86%** | **94.34%** | **95.10%** | **442** |
| **OVERALL (Macro)** | **88.24%** | **87.61%** | **86.94%** | **442** |

\* *ALLERGEN (5 spans) and GROWTH_METRIC (2 spans) have statistically low test support; their F1 values must be treated as indicative only.*

---

## 10. Phase 5: Independent Evaluation Benchmark & Hardening

To overcome distant-supervision bias and circular gazetteer baselines, Phase 5 established four critical evaluation enhancements:

### 10.1 Independent Human-Gold Benchmark Package
* **Candidate Selection:** 150 stratified natural-language sentences sampled across 11 linguistic categories (`ner/data/human_gold/human_gold_candidates.jsonl`).
* **Annotation Guidelines:** Formal operational definitions, token boundary rules, and nested entity precedence hierarchy (`annotation_guidelines.md`).
* **Blank Annotation Template:** `human_gold_template.jsonl` provided for genuine human annotation without synthetic or silver shortcuts.
* **Status:** Human annotation package created and awaiting manual annotation; no synthetic human labels were fabricated.

### 10.2 Seen vs Unseen NUTRIENT Generalization
Evaluating whether the model's 97.18% NUTRIENT F1 is driven by surface-form memorization:
* **Seen Nutrients in Test Set:** 167 spans (96.0% of test nutrients) → **Precision: 99.40% | Recall: 99.40% | F1: 99.40%**
* **Unseen Nutrients in Test Set:** 7 spans (4.0% of test nutrients) → **Precision: 46.15% | Recall: 85.71% | F1: 60.00%**
* **Finding:** The model performs strongly on familiar vocabulary and learns contextual triggers, but out-of-vocabulary precision drops when novel chemical synonyms are encountered.

### 10.3 Adversarial Nutrient Challenge Suite
An adversarial 25-sentence benchmark (`nutrient_challenge.jsonl`, 63 gold entity spans) evaluated the model across 7 complex failure modes:

| Category | Stress Test Description | Gold Spans | Precision | Recall | Micro F1 |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Ambiguity & Polysemy** | *energy* (vigor vs calories), *salt*, *growth* | 21 | 71.4% | 23.8% | 35.7% |
| **Synonyms & Variants** | IUPAC names (*cholecalciferol*, *ascorbic acid*) | 11 | 57.1% | 36.4% | 44.4% |
| **Multi-Word Nutrients** | *omega-3 fatty acids*, *dietary fiber* | 13 | 66.7% | 61.5% | 64.0% |
| **Quantity Boundaries** | *400 IU vitamin D3*, *15 mg iron* | 5 | 75.0% | 60.0% | 66.7% |
| **Morphological Variants** | *protein-rich*, *intake* | 6 | 50.0% | 33.3% | 40.0% |
| **Nested Conflicts** | *iron deficiency anemia* vs *iron* | 7 | 28.6% | 28.6% | 28.6% |
| **Overall Challenge** | Full adversarial evaluation | **63** | **57.1%** | **38.1%** | **45.7%** |

---

## 11. Gazetteer Circularity Disclosure

> **Methodological Disclosure:** The gazetteer-only baseline achieves **98.86% F1** on the silver test set. This high score is **circular** because the same gazetteer dictionaries were used to generate the distant-supervision labels. This score cannot be presented as independent evidence of model superiority. The model's true value lies in sequence constraint decoding, ambiguity suppression, and contextual integration into the clinical pipeline.

---

## 12. Complete Experiment Summary Table

| Evaluation | Dataset | Annotation Type | Model Architecture | Micro F1 | NUTRIENT F1 | Independent? |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| **Silver Evaluation** | `test.jsonl` (263 sents) | Distant Supervision | Averaged Sequence Perceptron | **95.10%** | **97.18%** | **No** (Silver bias) |
| **Gazetteer Baseline**| `test.jsonl` (263 sents) | Distant Supervision | Dictionary Lookup | 98.86% | 99.14% | **No** (Circular) |
| **Nutrient Challenge**| `nutrient_challenge.jsonl` (25 sents) | Adversarial Gold | Averaged Sequence Perceptron | **45.71%** | Evaluated | **Yes** (Stress test) |
| **General NER** | Pediatric Corpus | Standard Pretrained | BERT / SpaCy General NER | **0.00%** | **0.00%** | **Yes** (Schema omitted) |
| **Human-Gold Eval** | `human_gold.jsonl` (150 sents) | Manual Annotation | Averaged Sequence Perceptron | *Pending* | *Pending* | **Yes** (Ready) |

---

## 13. Limitations

1. **Distant Supervision Dependency:** The primary training dataset relies on rule-guided gazetteer induction.
2. **Seen Entity Overlap:** 96.0% of test nutrients appear in training vocabulary.
3. **Sparse Classes:** `ALLERGEN` (5 test spans) and `GROWTH_METRIC` (2 test spans) have wide confidence intervals.
4. **Single-Layer BIO:** Cannot represent overlapping clinical nested spans.
5. **General NER Absence:** General NLP models cannot serve as direct F1 baselines because their schemas omit nutrition categories entirely.

---

## 14. Conclusion

Phase 5 has strengthened the NutriBite domain-specific NER project into an academically transparent, reproducible, and defensible benchmark. By framing the contribution accurately around the operationalization of the `NUTRIENT` entity in pediatric clinical NLP, establishing a genuine Human-Gold evaluation package, isolating Seen vs Unseen generalization, and stress-testing adversarial challenge modes, the methodology is fully prepared for peer-reviewed academic presentation and defense.
