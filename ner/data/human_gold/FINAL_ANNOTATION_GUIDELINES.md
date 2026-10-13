# Final Human Annotation Guidelines (Schema v2.0 — 10 Entities)

**Version:** 2.0 (Frozen)  
**Target Schema:** 10 Named Entity Classes (`FOOD`, `NUTRIENT`, `HEALTH_CONDITION`, `ALLERGEN`, `AGE_GROUP`, `MEAL_TYPE`, `GROWTH_METRIC`, `FOOD_GROUP`, `DIETARY_PROPERTY`, `FEEDING_METHOD`)  
**Corpus:** NutriBite Pediatric Nutrition Corpus  

---

## 1. Entity Classification Summary

| Label | Key Definition | Positive Examples |
| :--- | :--- | :--- |
| **`NUTRIENT`** | Chemical micronutrients, vitamins, minerals, fats, fiber | `iron`, `calcium`, `vitamin D`, `vitamin B12`, `zinc`, `omega-3 fatty acids` |
| **`FOOD`** | Specific individual foods, dishes, culinary items | `moong dal khichdi`, `ragi porridge`, `curd`, `paneer`, `egg`, `apple` |
| **`FOOD_GROUP`** | Collective dietary categories & food pyramid classes | `pulses`, `cereals`, `green leafy vegetables`, `millets`, `fruits` |
| **`DIETARY_PROPERTY`**| Food quality, texture, and nutritional traits | `energy-dense`, `nutrient-rich`, `easily digestible`, `fortified`, `semi-solid` |
| **`FEEDING_METHOD`** | Pediatric feeding modalities & practices | `exclusive breastfeeding`, `complementary feeding`, `finger foods` |
| **`HEALTH_CONDITION`**| Clinical diseases, deficiencies, growth failures | `iron deficiency anemia`, `severe acute malnutrition`, `stunting`, `rickets` |
| **`ALLERGEN`** | Antigenic triggers causing hypersensitivity | `cow's milk protein allergy`, `peanut allergy`, `egg allergen`, `soy` |
| **`AGE_GROUP`** | Pediatric developmental stages and age spans | `infants`, `toddlers`, `6 to 12 months`, `first 1000 days`, `adolescents` |
| **`MEAL_TYPE`** | Diurnal meal occasions | `breakfast`, `lunch`, `dinner`, `morning snack`, `evening snack` |
| **`GROWTH_METRIC`** | Anthropometric parameters and growth indices | `height`, `weight`, `length-for-age`, `MUAC`, `BMI`, `head circumference` |

---

## 2. Span Boundary & Tokenization Rules

1. **Quantities Excluded from Nutrients:**
   * In *"400 IU vitamin D"*, annotate only `"vitamin D"` as `NUTRIENT`.
   * In *"15 mg elemental iron"*, annotate only `"iron"` as `NUTRIENT`.
2. **Multi-Word Compounds:**
   * Annotate complete multi-word names as atomic spans:
     * `"green leafy vegetables"` $\rightarrow$ `FOOD_GROUP`
     * `"omega-3 fatty acids"` $\rightarrow$ `NUTRIENT`
     * `"exclusive breastfeeding"` $\rightarrow$ `FEEDING_METHOD`
     * `"severe acute malnutrition"` $\rightarrow$ `HEALTH_CONDITION`
3. **Hyphenated Compounds:**
   * In *"energy-dense mash"*, annotate `"energy-dense"` $\rightarrow$ `DIETARY_PROPERTY` and `"mash"` $\rightarrow$ `FOOD`.
   * In *"iron-rich food"*, annotate `"iron"` $\rightarrow$ `NUTRIENT` and `"rich"` $\rightarrow$ `DIETARY_PROPERTY` (or `"iron-rich"` $\rightarrow$ `DIETARY_PROPERTY` if hyphenated).
4. **Precedence Hierarchy for Overlapping Spans:**
   $$\text{HEALTH\_CONDITION} > \text{ALLERGEN} > \text{FEEDING\_METHOD} > \text{GROWTH\_METRIC} > \text{NUTRIENT} > \text{DIETARY\_PROPERTY} > \text{FOOD\_GROUP} > \text{FOOD} > \text{MEAL\_TYPE} > \text{AGE\_GROUP}$$

---

## 3. Ambiguity & Polysemy Resolution

* **`energy`:** Label as `NUTRIENT` when referring to dietary/metabolic calories (*"provide adequate energy for metabolism"*). Leave unannotated `O` when referring to physical play/vigor (*"the child is energetic and running"*).
* **`growth`:** Label as `GROWTH_METRIC` when referring to physical anthropometric growth monitoring (*"track growth using growth velocity charts"*). Leave `O` for demographic references (*"population growth"*).
* **`salt`:** Label as `FOOD` when referring to table salt/seasoning; label as `NUTRIENT` when discussing physiological sodium electrolytes.
