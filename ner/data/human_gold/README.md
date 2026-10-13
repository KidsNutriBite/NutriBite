# NutriBite Independent Human-Gold Evaluation Benchmark

This directory contains the protocol, guidelines, candidate sentences, and template for an **independent human-annotated gold evaluation set** for the NutriBite Named Entity Recognition (NER) system.

---

## 1. Motivation & Academic Rationale

In Phase 3 and Phase 4 audits, the existing 95.10% micro F1 score was demonstrated to be measured on **silver/distant-supervision test data** generated using automated gazetteer dictionary rules. Furthermore, the 98.86% gazetteer baseline is **circular** because the same dictionary contributed to generating the silver labels.

To establish an academically rigorous, non-circular, and defensible evaluation:
1. **Candidate sentences** were sampled across stratified linguistic categories from natural clinical pediatric guidelines.
2. **Annotation guidelines** define precise boundaries, entity definitions, and nested precedence rules.
3. **A clean template** is provided for genuine human annotation without automated silver leakage.

---

## 2. Directory Contents

| File | Description | Status |
| :--- | :--- | :--- |
| `annotation_guidelines.md` | Formal boundary definitions, precedence rules, and examples for all 7 entity types | Finalized |
| `human_gold_candidates.jsonl` | 150 stratified candidate sentences extracted from corpus sources | Finalized (150 sents) |
| `human_gold_template.jsonl` | Clean JSONL template with empty `entities: []` awaiting manual human annotation | Ready for annotator |
| `human_gold.jsonl` | Target evaluation file where human-verified labels are stored | Awaiting Human Input |
| `nutrient_challenge.jsonl` | Curated challenge suite testing synonyms, polysemy, multiwords, and unseen nutrients | Finalized |
| `README.md` | This overview document | Finalized |

---

## 3. Stratification Breakdown (150 Sentences)

The 150 candidate sentences in `human_gold_candidates.jsonl` cover:
- **NUTRIENT (Single-word):** 25 sentences (e.g., *iron, zinc, folate, calcium, protein*)
- **NUTRIENT (Multi-word):** 20 sentences (e.g., *vitamin B12, omega-3 fatty acids, dietary fiber*)
- **FOOD:** 20 sentences (e.g., *millets, pulses, curd, green leafy vegetables, idli*)
- **HEALTH_CONDITION:** 20 sentences (e.g., *iron deficiency anemia, rickets, severe acute malnutrition*)
- **ALLERGEN:** 15 sentences (e.g., *cow's milk protein allergy, peanut allergy, soy*)
- **AGE_GROUP:** 15 sentences (e.g., *infants, toddlers, first 1000 days, 6 to 12 months*)
- **MEAL_TYPE:** 15 sentences (e.g., *exclusive breastfeeding, complementary feeding, snack*)
- **GROWTH_METRIC:** 15 sentences (e.g., *length-for-age, MUAC, weight-for-age, BMI*)
- **AMBIGUOUS / POLYSEMY:** 15 sentences (words like *energy, salt, formula, growth, normal*)
- **NUMERICAL QUANTITIES:** 15 sentences (e.g., *400 IU, 10 mg elemental iron, 1500 kcal*)
- **NEGATIVE / NO ENTITY:** 10 sentences (sentences with no domain entities)

---

## 4. How to Conduct Manual Annotation

1. Open `human_gold_template.jsonl`.
2. For each sentence, read the text and consult `annotation_guidelines.md`.
3. Add character span dictionaries into `"entities": [{"start": X, "end": Y, "label": "LABEL", "text": "SPAN"}]`.
4. Enter your name in `"annotator": "..."`.
5. Save the completed file as `human_gold.jsonl`.
6. Run the evaluation script:
   ```bash
   python ner/scripts/11_evaluate_human_gold.py
   ```
