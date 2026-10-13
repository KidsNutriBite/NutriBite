# Final 10-Entity Domain Schema Specification (Schema v2.0)

**Project:** NutriBite / NutriKids Domain-Specific Information Extraction System  
**Task:** Fine-grained Domain-Specific Named Entity Recognition for Pediatric Nutrition Text  
**Schema Version:** 2.0 (Frozen — September 2026)  
**Flagship Entity:** `NUTRIENT`  
**Total Entity Classes:** 10  

---

## 1. Research Task Definition & Academic Contribution

### 1.1 Task Scope
The research task is defined as **fine-grained, domain-specific Named Entity Recognition and Information Extraction for clinical and conversational pediatric nutrition text**. General-domain NER schemas (such as CoNLL-2003 or OntoNotes) restrict labeling to coarse categories (`PERSON`, `ORG`, `LOC`, `DATE`) and achieve **0% coverage** on nutritional biochemistry and clinical pediatric concepts.

### 1.2 Defensible Academic Contribution
We do not claim to have invented sequence labeling algorithms or to be the first to ever process chemical names. Rather, the academic contribution is:
> **"We introduce and operationalize a fine-grained 10-entity pediatric nutrition NER schema—with a dedicated flagship NUTRIENT category—for structured information extraction, entity normalization, and downstream retrieval in the NutriBite corpus."**

---

## 2. Complete 10-Entity Specification

```
                                10-ENTITY DOMAIN SCHEMA
   
   ┌───────────────────┬────────────────────────────────────────────────────────┐
   │ ENTITY LABEL      │ SEMANTIC DEFINITION                                    │
   ├───────────────────┼────────────────────────────────────────────────────────┤
   │ NUTRIENT          │ Biochemical nutrients, vitamins, minerals, fats, fiber │
   │ FOOD              │ Specific edible foods, dishes, and culinary items      │
   │ FOOD_GROUP        │ Collective dietary categories (pulses, cereals, GLV)   │
   │ DIETARY_PROPERTY  │ Nutritional characteristics (energy-dense, digestible) │
   │ FEEDING_METHOD    │ Pediatric feeding modalities (breastfeeding, weaning)  │
   │ HEALTH_CONDITION  │ Diseases, deficiency states, and malnutrition syndromes│
   │ ALLERGEN          │ Antigenic dietary triggers causing hypersensitivity    │
   │ AGE_GROUP         │ Pediatric developmental life stages and age intervals  │
   │ MEAL_TYPE         │ Diurnal feeding occasions (breakfast, snack, dinner)   │
   │ GROWTH_METRIC     │ Anthropometric measurements and growth velocity indices│
   └───────────────────┴────────────────────────────────────────────────────────┘
```

---

### 2.1 NUTRIENT (Flagship Entity)
* **Definition:** Chemical substances, micronutrients, macronutrients, vitamins, minerals, essential fatty acids, or dietary fiber components required for human physiological function and growth.
* **Inclusions:** `iron`, `calcium`, `zinc`, `protein`, `vitamin D`, `vitamin B12`, `ascorbic acid`, `folate`, `omega-3 fatty acids`, `dietary fiber`, `DHA`, `potassium`.
* **Exclusions:** Broad food categories (`cereals`), non-nutritive additives, vague vitality words (`energy` when referring to behavioral vigor).
* **Positive Examples:** *"Infants need adequate **iron** and **vitamin C**."*
* **Negative Examples:** *"The baby was full of energy [O] today."*
* **Boundary Rules:** Exclude quantities (*"400 IU vitamin D"* $\rightarrow$ label only `vitamin D`).
* **Downstream RAG Use:** Micronutrient gap analysis, ICMR RDA target comparison, deficiency alert routing.

---

### 2.2 FOOD
* **Definition:** Specific edible individual commodities, prepared dishes, beverages, or culinary recipes.
* **Inclusions:** `ragi porridge`, `moong dal khichdi`, `paneer`, `curd`, `apple`, `boiled egg`, `idli`, `banana mash`.
* **Exclusions:** Collective food groups (`pulses`, `cereals`), isolated chemical nutrients.
* **Positive Examples:** *"Feed **moong dal khichdi** to the toddler."*
* **Negative Examples:** *"Pulses [FOOD_GROUP] provide protein."*
* **Downstream RAG Use:** Recipe matching, culinary substitution, caloric estimation.

---

### 2.3 FOOD_GROUP (New in Schema v2)
* **Definition:** Broad collective dietary classifications used in dietary guidelines and food pyramid frameworks.
* **Inclusions:** `pulses`, `whole grains`, `cereals`, `millets`, `green leafy vegetables`, `dairy products`, `fruits`, `nuts and seeds`, `animal source foods`.
* **Exclusions:** Specific single-item foods (`apple`, `ragi porridge`).
* **Positive Examples:** *"A diversified diet must contain **pulses**, **millets**, and **green leafy vegetables**."*
* **Downstream RAG Use:** WHO IYCF Minimum Dietary Diversity (MDD) scoring ($\ge 5$ of 8 food groups daily).

---

### 2.4 DIETARY_PROPERTY (New in Schema v2)
* **Definition:** Specific physical, nutritional, physiological, or culinary traits describing the preparation or quality of food.
* **Inclusions:** `energy-dense`, `nutrient-rich`, `easily digestible`, `fortified`, `semi-solid`, `soft textured`, `bioavailable`, `ultra-processed`.
* **Exclusions:** The food noun itself (`khichdi`), quantitative weight measurements (`100g`).
* **Positive Examples:** *"Add a teaspoon of ghee to create an **energy-dense** mash."*
* **Downstream RAG Use:** Age-appropriate weaning texture verification, calorie density augmentation for faltering growth.

---

### 2.5 FEEDING_METHOD (New in Schema v2)
* **Definition:** Specific pediatric infant and young child feeding modalities, behavioral practices, and delivery methods.
* **Inclusions:** `exclusive breastfeeding`, `complementary feeding`, `spoon feeding`, `responsive feeding`, `finger foods`, `cup feeding`, `baby-led weaning`.
* **Exclusions:** Standard meal timing slots (`breakfast`, `dinner`).
* **Positive Examples:** *"WHO recommends **exclusive breastfeeding** for the first six months."*
* **Downstream RAG Use:** IYCF milestone compliance checks, weaning transition advice.

---

### 2.6 HEALTH_CONDITION
* **Definition:** Named pediatric diseases, acute symptoms, clinical nutritional deficiencies, or malnutrition syndromes.
* **Inclusions:** `iron deficiency anemia`, `severe acute malnutrition`, `stunting`, `wasting`, `diarrhea`, `rickets`, `lactose intolerance`.
* **Exclusions:** Normal physiological states (`healthy weight`, `normal growth`).
* **Positive Examples:** *"Children suffering from **severe acute malnutrition** require therapeutic feeds."*
* **Downstream RAG Use:** Clinical contraindication checking, therapeutic feeding guideline retrieval.

---

### 2.7 ALLERGEN
* **Definition:** Specific dietary substances explicitly identified as immunological triggers causing adverse allergic reactions.
* **Inclusions:** `cow's milk protein allergy`, `peanut allergy`, `egg white allergen`, `soy allergy`, `wheat gluten`.
* **Exclusions:** Non-allergic culinary uses of foods.
* **Positive Examples:** *"Avoid all dairy in suspected **cow's milk protein allergy**."*
* **Downstream RAG Use:** Zero-tolerance allergen blacklisting, safe food substitution.

---

### 2.8 AGE_GROUP
* **Definition:** Pediatric life stages, developmental milestone cohorts, or explicit age intervals.
* **Inclusions:** `infants`, `toddlers`, `preschool children`, `6 to 12 months`, `first 1000 days`, `neonates`, `adolescents`.
* **Exclusions:** Generic non-pediatric terms (`people`, `family`).
* **Positive Examples:** *"During the **first 1000 days**, rapid brain growth occurs."*
* **Downstream RAG Use:** Age-stratified guideline retrieval, developmental safety filtering.

---

### 2.9 MEAL_TYPE
* **Definition:** Specific diurnal meal occasions or daily scheduled feeding times.
* **Inclusions:** `breakfast`, `lunch`, `dinner`, `morning snack`, `evening snack`.
* **Exclusions:** Feeding methods (`breastfeeding`, `weaning`).
* **Positive Examples:** *"Provide a nutrient-dense **morning snack** between meals."*
* **Downstream RAG Use:** Diurnal meal distribution, schedule planning.

---

### 2.10 GROWTH_METRIC
* **Definition:** Anthropometric measurement indices, somatic growth parameters, and growth velocity metrics.
* **Inclusions:** `height`, `weight`, `length-for-age`, `weight-for-height`, `MUAC`, `BMI`, `head circumference`, `growth velocity`.
* **Exclusions:** Qualitative descriptions (`big`, `tall`, `strong`).
* **Positive Examples:** *"Measure **MUAC** and **length-for-age** at every wellness visit."*
* **Downstream RAG Use:** Anthropometric Z-score tracking, growth faltering detection.

---

## 3. Key Semantic Distinctions & Boundary Disambiguation

1. **`FOOD` vs `FOOD_GROUP`:**
   * `FOOD` refers to individual edible items or preparations (`curd`, `apple`, `khichdi`, `paneer`).
   * `FOOD_GROUP` refers to collective dietary classes (`pulses`, `cereals`, `green leafy vegetables`, `millets`).
2. **`NUTRIENT` vs `DIETARY_PROPERTY`:**
   * `NUTRIENT` is a chemical substance (`iron`, `calcium`, `vitamin D`).
   * `DIETARY_PROPERTY` is an adjective/trait (`nutrient-rich`, `energy-dense`, `bioavailable`).
3. **`AGE_GROUP` vs `FEEDING_METHOD`:**
   * `AGE_GROUP` is the population cohort (`infants`, `toddlers`, `6-12 months`).
   * `FEEDING_METHOD` is the feeding action or practice (`exclusive breastfeeding`, `complementary feeding`).
4. **`HEALTH_CONDITION` vs `GROWTH_METRIC`:**
   * `HEALTH_CONDITION` is a pathological diagnosis (`stunting`, `wasting`, `anemia`).
   * `GROWTH_METRIC` is the measurement instrument/index (`height-for-age`, `weight-for-height`, `MUAC`).

---

## 4. Flat BIO Precedence Hierarchy

Because standard sequence labelers assign one tag per token, overlapping spans follow this strict precedence:

$$\text{HEALTH\_CONDITION} > \text{ALLERGEN} > \text{FEEDING\_METHOD} > \text{GROWTH\_METRIC} > \text{NUTRIENT} > \text{DIETARY\_PROPERTY} > \text{FOOD\_GROUP} > \text{FOOD} > \text{MEAL\_TYPE} > \text{AGE\_GROUP}$$
