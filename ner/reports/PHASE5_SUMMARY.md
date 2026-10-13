# Phase 5 Summary: Independent NER Evaluation, New Entity Validation & Academic Strengthening

**Project:** NutriBite Pediatric Nutrition NLP System  
**Phase:** Phase 5 — Academic Strengthening & Independent Benchmark Protocol  
**Date:** September 2026  
**Status:** Completed & Validated  

---

## 1. Objective

Phase 4 successfully audited the codebase, corrected all historical metrics, proved zero data leakage, and identified that previous evaluations measured distant-supervision silver performance with a circular gazetteer baseline.

The primary objective of **Phase 5** was to transform the NER experiment into an **academically defensible, scientifically rigorous, and transparent contribution** by:
1. Formulating the exact, non-inflated academic claim regarding the operationalization of the `NUTRIENT` entity.
2. Building an independent, stratified **Human-Gold annotation benchmark package** (150 sentences) with formal boundary guidelines.
3. Conducting a granular **Seen vs Unseen Generalization Audit** for the flagship `NUTRIENT` class.
4. Evaluating an adversarial **Nutrient Challenge Suite** (25 sentences, 63 spans) to expose precise linguistic failure modes.
5. Clarifying gazetteer circularity and distinguishing silver metrics from human-gold validation.

---

## 2. What Was Added in Phase 5

1. **Human-Gold Annotation Package (`ner/data/human_gold/`):**
   * `human_gold_candidates.jsonl`: 150 stratified natural-language sentences sampled across 11 linguistic categories.
   * `human_gold_template.jsonl`: Clean JSONL template ready for genuine manual human annotation without automated silver shortcuts.
   * `annotation_guidelines.md`: Rigorous operational definitions, token boundary rules (quantities, multi-words), and nested precedence hierarchy ($\text{HEALTH\_CONDITION} > \text{ALLERGEN} > \dots$).
   * `README.md`: Protocol, structure, and instructions for human annotators.
2. **Adversarial Challenge Benchmark (`ner/data/human_gold/nutrient_challenge.jsonl`):**
   * 25 curated sentences testing 7 failure modes: chemical IUPAC synonyms, multi-words, polysemy, quantity boundary separation, compound modifiers, and nested clinical conflicts.
3. **Independent Evaluation Engine (`ner/scripts/11_evaluate_human_gold.py`):**
   * Evaluates Seen vs Unseen nutrient generalization.
   * Evaluates the challenge suite and outputs category-level precision, recall, and F1.
   * Probes for genuine human annotations in `human_gold.jsonl` (reporting `NO` when unannotated rather than fabricating scores).
4. **Academic Analysis Reports (`ner/reports/`):**
   * `what_is_new.md`: Academic rationale, novelty boundaries, why `NUTRIENT` is useful in NutriBite, why it differs from gazetteers.
   * `phase5_experiment_results.md`: Complete comparative experimental benchmark table.
   * `nutrient_challenge_results.md`: Detailed stress-test breakdown.
   * `nutrient_error_analysis.md`: Exhaustive 9-category error taxonomy with real corpus examples.
   * `phase5_reproducibility.md`: Full reproducibility and runtime specification.
   * Updated `NutriBite_NER_Academic_Report.md` and `NER_Viva_QA.md`.

---

## 3. Human-Gold Dataset Protocol

* **Candidate Sentences:** 150 sentences sampled from ICMR-NIN guidelines, WHO standards, and caregiver queries.
* **Stratification:**
  * `NUTRIENT (Single-word)`: 25 sentences
  * `NUTRIENT (Multi-word)`: 20 sentences
  * `FOOD`: 20 sentences
  * `HEALTH_CONDITION`: 20 sentences
  * `ALLERGEN`: 15 sentences
  * `AGE_GROUP`: 15 sentences
  * `MEAL_TYPE`: 15 sentences
  * `GROWTH_METRIC`: 15 sentences
  * `AMBIGUOUS / POLYSEMY`: 15 sentences
  * `NUMERICAL QUANTITY`: 15 sentences
  * `NEGATIVE (NO ENTITY)`: 10 sentences
* **Human Annotation Status:** `NO` (Awaiting human expert manual annotation; zero synthetic human labels were fabricated).

---

## 4. NUTRIENT Evaluation: Seen vs Unseen Generalization

To understand what the 97.18% silver NUTRIENT F1 actually measures, we separated test set nutrients into seen vs unseen surface forms relative to the 1,223 training sentences:

| Category | Support (Test Spans) | Precision | Recall | Exact F1 Score |
| :--- | :---: | :---: | :---: | :---: |
| **Seen in Training** | 167 spans (96.0%) | 99.40% | 99.40% | **99.40%** |
| **Unseen in Training** | 7 spans (4.0%) | 46.15% | 85.71% | **60.00%** |

* **Finding:** The distant-supervision test set is 96.0% seen vocabulary. The model excels at contextual tagging and boundary alignment for known nutrients, but precision drops to 60.0% on completely unseen surface forms.

---

## 5. Silver Evaluation vs Baseline Comparison

| Model / Setting | Evaluation Partition | Micro Precision | Micro Recall | Micro F1 | NUTRIENT F1 | Independent? |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **NutriBite Sequence Perceptron** | Silver Test Set (263 sents) | 95.86% | 94.34% | **95.10%** | **97.18%** | **No** (Silver label bias) |
| **Gazetteer-Only Baseline** | Silver Test Set (263 sents) | 99.54% | 98.19% | 98.86% | 99.14% | **No** (Circular evaluation) |
| **General Pretrained NER** | General Domain (BERT/SpaCy) | N/A | N/A | **0.00%** | **0.00%** | **Yes** (Categories absent) |

---

## 6. Independent Adversarial Challenge Evaluation

On the 25-sentence `nutrient_challenge.jsonl` benchmark (63 gold entity spans), the model achieved:
* **Overall Challenge Micro F1:** **45.71%** (Precision: 57.14%, Recall: 38.10%)
* **Strongest Performance:** Quantity boundary separation (F1: 66.7%), Multi-word nutrients (F1: 64.0%).
* **Primary Vulnerabilities:** Unseen chemical synonyms (e.g., *cholecalciferol*, *ascorbic acid*; F1: 44.4%), Polysemy disambiguation (e.g., vigor *energy*; F1: 35.7%), Nested clinical conflicts (e.g., *iron deficiency anemia*; F1: 28.6%).

---

## 7. Error Analysis Taxonomy

We categorized all nutrient extraction errors into 9 formal categories (`nutrient_error_analysis.md`):
1. **False Positive:** Non-nutrients tagged as nutrients due to nutritional context words (*water*, *solids*).
2. **False Negative:** Unseen chemical synonyms missed (*cholecalciferol*, *cyanocobalamin*).
3. **Boundary Error:** Hyphenation shifts (*omega-3 fatty acids* split at hyphen).
4. **Ambiguity / Polysemy Error:** Vigor *energy* vs caloric *energy*.
5. **Multi-Word Truncation:** Dropping modifier prefix (*fiber* instead of *dietary fiber*).
6. **Contextual Error:** Non-nutritional senses (*iron gates*).
7. **Acronym / Abbreviation Error:** Shorthand variants (*Vit D*).
8. **Quantity + Nutrient Error:** Numbers attached without whitespace (*15mg*).
9. **Nested Entity Conflict:** Fracturing composite condition (*iron deficiency anemia* split into *iron* + *deficiency anemia*).

---

## 8. Limitations

1. **Silver-Label Dependence:** Base training relies on distant supervision from gazetteers.
2. **Seen Entity Bias:** 96.0% of test nutrients overlap with training vocabulary.
3. **Sparse Classes:** `ALLERGEN` (5 test spans) and `GROWTH_METRIC` (2 test spans) have wide confidence intervals.
4. **Single-Layer BIO:** Cannot represent hierarchical nested spans.

---

## 9. Academic Contribution & Defensible Claims

### Final Defensible Academic Claims:
> **"We introduce and operationalize a domain-specific NUTRIENT entity category within a dedicated pediatric nutrition NER schema and evaluate its extraction on the NutriBite corpus."**

* We demonstrate that general-purpose NER models provide **0% coverage** on critical pediatric nutrition concepts.
* We establish an end-to-end extraction pipeline with sub-millisecond inference, strict BIO decoding, and direct downstream RAG and dietary gap integration.
* We provide a leak-free, verified, reproducible distant-supervision evaluation and an independent Human-Gold benchmark protocol.

---

## 10. Claims We Must NOT Make

* ❌ *"We invented nutrient recognition."*
* ❌ *"We created a novel deep learning sequence labeling architecture."*
* ❌ *"Our 95.10% F1 is a human-verified gold standard score."*
* ❌ *"Our model outperforms gazetteers by 98.86% F1."* (Disclosed as circular).
* ❌ *"Our model generalizes out-of-domain with 97% zero-shot accuracy."* (Unseen F1 is 60.00%).

---

## 11. Next Steps

1. **Human Gold Annotation:** Complete manual annotation of `human_gold_template.jsonl` by human annotator(s) and compute inter-annotator agreement (Fleiss' Kappa).
2. **Downstream Pipeline Hardening:** Integrate entity-linking output into conversational chat responses and dietary safety filters.
3. **Journal / Thesis Integration:** Incorporate Phase 5 reports into the final project thesis or research paper manuscript.
