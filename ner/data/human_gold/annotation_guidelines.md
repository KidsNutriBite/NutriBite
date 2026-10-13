# NutriBite Domain NER: Formal Human Annotation Guidelines

**Version:** 1.0  
**Phase:** Phase 5 (Independent Academic Evaluation)  
**Corpus:** NutriBite Pediatric Nutrition Corpus  
**Target Schema:** 7 Named Entity Classes (`NUTRIENT`, `FOOD`, `HEALTH_CONDITION`, `ALLERGEN`, `AGE_GROUP`, `MEAL_TYPE`, `GROWTH_METRIC`)

---

## 1. Scope & Objective

These guidelines define the operational criteria for human annotation of pediatric nutrition texts. The primary objective is to produce a genuine, non-circular **Human-Gold Evaluation Benchmark** to rigorously assess the extraction performance of domain-specific named entities, with special emphasis on the newly operationalized **`NUTRIENT`** entity class.

---

## 2. Entity Definitions & Boundaries

### 2.1 NUTRIENT
A chemical substance, micronutrient, macronutrient, vitamin, mineral, essential fatty acid, or specific dietary fiber component required by the human body for physiological function, growth, and cellular maintenance.

* **Inclusions:**
  * Single-word nutrients: `iron`, `zinc`, `calcium`, `protein`, `potassium`, `folate`, `iodine`, `phosphorus`
  * Multi-word vitamin compounds: `vitamin D`, `vitamin B12`, `vitamin A`, `vitamin C`, `ascorbic acid`, `cholecalciferol`
  * Complex lipids & fatty acids: `omega-3 fatty acids`, `DHA`, `EPA`, `alpha-linolenic acid`
  * Carbohydrate fractions: `dietary fiber`, `soluble fiber`, `complex carbohydrates`
* **Exclusions:**
  * Generic food terms (e.g., `food`, `diet`, `meal`)
  * Vague vitality descriptors (e.g., `energy` when used as physical vigor rather than metabolic calories)
  * Non-nutritive additives or contaminants

---

### 2.2 FOOD
Specific edible substances, raw agricultural commodities, whole ingredients, prepared dishes, or beverage preparations intended for human consumption.

* **Inclusions:**
  * Raw commodities: `apple`, `spinach`, `banana`, `egg`, `rice`, `wheat`, `ragi`, `lentils`
  * Prepared foods & dishes: `curd`, `dal`, `khichdi`, `idli`, `porridge`, `yogurt`
  * Dietary groups: `green leafy vegetables`, `citrus fruits`, `pulses`, `whole grains`
* **Exclusions:**
  * Isolated chemical nutrients (e.g., `ascorbic acid` is `NUTRIENT`, not `FOOD`)
  * Clinical formulas labeled strictly as medical treatments

---

### 2.3 HEALTH_CONDITION
Named physiological diseases, clinical syndromes, nutritional deficiencies, metabolic disorders, or pathological states.

* **Inclusions:**
  * Deficiency states: `iron deficiency anemia`, `vitamin A deficiency`, `rickets`, `scurvy`
  * Malnutrition states: `severe acute malnutrition`, `stunting`, `wasting`, `underweight`
  * Metabolic / Chronic conditions: `lactose intolerance`, `celiac disease`, `type 1 diabetes`, `obesity`
* **Exclusions:**
  * Normal physiological milestones (e.g., `healthy growth`, `normal weight`)

---

### 2.4 ALLERGEN
Specific dietary substances, proteins, or food items explicitly identified as antigenic triggers causing immunologically mediated adverse reactions.

* **Inclusions:**
  * `cow's milk protein`, `peanut`, `tree nuts`, `soy`, `wheat gluten`, `egg white`, `shellfish`
* **Context Rule:** A food item (e.g., `milk`) is labeled as `ALLERGEN` only when the sentence context explicitly discusses allergies, sensitization, hypersensitivity, or elimination diets. Otherwise, it is labeled as `FOOD`.

---

### 2.5 AGE_GROUP
Explicit age-related population categories, developmental stages, or age intervals defining the pediatric target group.

* **Inclusions:**
  * Pediatric stages: `infants`, `toddlers`, `preschool children`, `school-age children`, `adolescents`, `neonates`
  * Exact age ranges: `6 to 12 months`, `first 1000 days`, `2-year-old child`, `under 5 years`
* **Exclusions:**
  * Generic references like `people`, `family`, `patients` (unless specifying pediatric age)

---

### 2.6 MEAL_TYPE
Specific dietary feeding occasions, meal timings, or feeding transition periods.

* **Inclusions:**
  * Standard meals: `breakfast`, `lunch`, `dinner`, `morning snack`, `evening snack`
  * Infant feeding stages: `exclusive breastfeeding`, `complementary feeding`, `weaning`
* **Exclusions:**
  * Generic terms like `food intake`, `daily routine`

---

### 2.7 GROWTH_METRIC
Anthropometric, somatic, or physical measurement parameters used to track child physical development.

* **Inclusions:**
  * Anthropometric measures: `height`, `weight`, `length-for-age`, `weight-for-height`, `BMI`, `head circumference`, `MUAC` (mid-upper arm circumference), `growth velocity`
* **Exclusions:**
  * Subjective terms like `bigger`, `stronger`, `tall`

---

## 3. Strict Span Boundary Rules

To maintain high inter-annotator agreement and match standard tokenization boundaries, adhere to the following rules:

1. **Quantity vs Nutrient:**
   * Do **not** include numeric quantities or units in the nutrient span.
   * *Example:* In `"400 IU vitamin D"`, annotate `"vitamin D"` as `NUTRIENT`. The `"400 IU"` is left unannotated.
   * *Example:* In `"10 mg of elemental iron"`, annotate `"iron"` as `NUTRIENT`.

2. **Multi-Word Compounds:**
   * Annotate complete multi-word names as a single contiguous span.
   * *Example:* `"vitamin B12"`, `"omega-3 fatty acids"`, `"dietary fiber"`, `"green leafy vegetables"`.

3. **Compound Modifiers & Adjectives:**
   * In `"iron-rich foods"`, annotate `"iron"` as `NUTRIENT` and `"foods"` as `O` (or `"iron-rich foods"` contextually if food dish). Prefer isolating the base nutrient: `"iron"` -> `NUTRIENT`.
   * In `"calcium-fortified milk"`, annotate `"calcium"` -> `NUTRIENT`, `"milk"` -> `FOOD`.

4. **Ambiguous Terms (Polysemy):**
   * `"iron"` in *"Iron deficiency is widespread"* -> `HEALTH_CONDITION` (composite) or `NUTRIENT` (see precedence below).
   * `"salt"` as seasoning -> `FOOD`; `"salt"` as chemical sodium compound -> `NUTRIENT` only if clearly physiological.
   * `"energy"` in *"provides adequate energy for metabolism"* -> `NUTRIENT`; in *"active and full of energy"* -> `O`.

---

## 4. Nested & Overlapping Entity Precedence Rule

### 4.1 Sequence Labeling Constraint
The NutriBite NER architecture uses standard flat BIO token sequence labeling (`B-X`, `I-X`, `O`), which can assign exactly **one** tag per token. It cannot natively represent hierarchical or multi-layer overlapping spans.

### 4.2 Precedence Hierarchy
When a text span contains overlapping candidate entity definitions, apply the following strict hierarchy:

$$\text{HEALTH\_CONDITION} > \text{ALLERGEN} > \text{GROWTH\_METRIC} > \text{NUTRIENT} > \text{FOOD} > \text{MEAL\_TYPE} > \text{AGE\_GROUP}$$

### 4.3 Concrete Examples
* **Example 1:** `"iron deficiency anemia"`
  * Contains the sub-span `"iron"` (`NUTRIENT`) and full span `"iron deficiency anemia"` (`HEALTH_CONDITION`).
  * **Rule:** Annotate the full span `"iron deficiency anemia"` as `HEALTH_CONDITION`. Do not annotate `"iron"` separately.
* **Example 2:** `"cow's milk protein allergy"`
  * Contains `"cow's milk"` (`FOOD`), `"protein"` (`NUTRIENT`), and `"allergy"` (`ALLERGEN`).
  * **Rule:** When referring to the immunological disorder, annotate `"cow's milk protein allergy"` as `HEALTH_CONDITION` / `ALLERGEN`.
* **Example 3:** `"adequate protein and iron for child growth"`
  * `"protein"` -> `NUTRIENT`
  * `"iron"` -> `NUTRIENT`
  * `"child"` -> `AGE_GROUP`
  * `"growth"` -> `GROWTH_METRIC` (if anthropometric context)

---

## 5. Annotation File Format

Each annotated sentence in `human_gold.jsonl` must follow this exact JSON schema:

```json
{
  "sentence_id": "GOLD_CAND_001",
  "source_id": "RAG_CORPUS",
  "text": "Children between 6 to 12 months require adequate iron and vitamin C for optimal development.",
  "entities": [
    {"start": 17, "end": 31, "label": "AGE_GROUP", "text": "6 to 12 months"},
    {"start": 49, "end": 53, "label": "NUTRIENT", "text": "iron"},
    {"start": 58, "end": 67, "label": "NUTRIENT", "text": "vitamin C"}
  ],
  "annotator": "Human_Expert_1",
  "notes": "Verified exact character offsets."
}
```

Ensure exact character offset matching: `text[start:end] == entity_text`.
