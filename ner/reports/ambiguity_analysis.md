# NutriBite Ambiguity Resolution Analysis Report

This evaluation measures the model's ability to resolve polysemous terms across divergent semantic contexts.

* **Ambiguity Benchmark Accuracy:** **60.0%** (6/10 test items resolved)

| Test ID | Sentence Context | Target Word | Expected Label | Resolved? | Predicted Spans |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `ambig_001` | "Dietary diversification helps reduce micronutrient deficiencies such as iron and folate deficiency." | **`iron`** | `NUTRIENT` | ✓ Yes | iron [NUTRIENT], folate [NUTRIENT] |
| `ambig_002` | "Pediatric iron deficiency progresses sequentially to iron deficiency anemia." | **`iron`** | `HEALTH_CONDITION` | ✗ No | iron [NUTRIENT], iron [NUTRIENT], anemia [HEALTH_CONDITION] |
| `ambig_003` | "Child had a cup of warm milk and 1 banana for breakfast." | **`milk`** | `FOOD` | ✓ Yes | Child [AGE_GROUP], milk [FOOD], banana [FOOD], breakfast [MEAL_TYPE] |
| `ambig_004` | "The toddler has a severe milk allergy and cannot consume dairy." | **`milk`** | `ALLERGEN` | ✗ No | toddler [AGE_GROUP], milk [FOOD] |
| `ambig_005` | "In case of cow milk protein allergy, substitute with extensively hydrolyzed formula." | **`milk`** | `ALLERGEN` | ✗ No | milk [FOOD], protein [NUTRIENT] |
| `ambig_006` | "1 carbohydrate exchange equals 1 medium apple or half a cup of papaya." | **`apple`** | `FOOD` | ✗ No | carbohydrate [NUTRIENT] |
| `ambig_007` | "Pulses and legumes provide high quality protein and dietary fiber for children." | **`protein`** | `NUTRIENT` | ✓ Yes | Pulses [FOOD], protein [NUTRIENT], dietary fiber [NUTRIENT], children [AGE_GROUP] |
| `ambig_008` | "Nutrition in the first 1000 days plays a critical role in child growth and development." | **`growth`** | `O` | ✓ Yes | first 1000 days [AGE_GROUP], child [AGE_GROUP] |
| `ambig_009` | "Preterm infants exhibit accelerated growth velocity during the first year of life." | **`growth`** | `GROWTH_METRIC` | ✓ Yes | infants [AGE_GROUP], growth velocity [GROWTH_METRIC] |
| `ambig_010` | "High intake of ultra-processed food rich in fat and sugar contributes to childhood obesity." | **`fat`** | `NUTRIENT` | ✓ Yes | fat [NUTRIENT], obesity [HEALTH_CONDITION] |
