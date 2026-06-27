# 🧠 KidsNutriKids — FINAL IMPLEMENTATION ROADMAP
## Hybrid AI System (RAG + Structured DB + Planner + LLM)

This is the FINAL clear implementation plan for your project.

### Architecture Flow

```
User Query
   ↓
Intent Detection
   ↓
Profile Retrieval
   ↓
RAG + Structured DB
   ↓
Planner / Decision Engine (Deterministic Planner Algorithm)
   ↓
LLM (Mistral-7B-Instruct / Nemo)
   ↓
Final Response
```

---

## ✅ FINAL CORE PRINCIPLES

### 🔥 1. Structured DB = Numerical Truth
Used for:
- Calories
- Protein
- Nutrients
- Portions
- Filtering
- Calculations

**Rule:** LLM must NOT calculate these manually.

### 🔥 2. RAG = Semantic Knowledge
Used for:
- Conditions
- Allergies
- Nutrition rules
- Guidance
- Explanations

**Rule:** RAG is dynamic and updateable.

### 🔥 3. Planner = Decision Engine
Handles:
- Calorie distribution
- Food filtering
- Portion assignment
- Diet validation

**Rule:** This is the real intelligence layer.

### 🔥 4. LLM = Communication Layer
LLM only:
- Explains
- Formats
- Talks naturally

**Rule:** NOT: medical diagnosis, medicine prescription, or direct calorie math.

---

## ✅ YOUR FINAL SCHEMAS (DO NOT CHANGE)

### 🟩 STRUCTURED DB SCHEMA

#### Food Collection
```json
{
  "food_id": "F050",
  "food_name": "egg",
  "category": "protein",
  "energy_kcal_per_100g": 155,
  "protein_g": 13,
  "fat_g": 11,
  "carbs_g": 1.1,
  "iron_mg": 1.8,
  "portion_unit": "1 egg (~50g)",
  "portion_energy_kcal": 78,
  "portion_protein_g": 6,
  "digestibility_boiled": "high",
  "digestibility_fried": "medium",
  "fat_level_fried": "high",
  "glycemic_index": "low",
  "age_min": 1,
  "allergy_tags": ["egg_protein"],
  "meal_types": ["breakfast", "lunch", "snack"],
  "tags": ["high_protein", "nutrient_dense", "animal_based", "easy_digest_boiled"]
}
```

#### Condition Rules
```json
{
  "condition_name": "fever",
  "required_tags": ["easy_digest", "soft_food"],
  "avoid_tags": ["high_fat", "deep_fried"],
  "meal_pattern": "small_frequent"
}
```

#### Goal Rules
```json
{
  "goal_name": "weight_gain",
  "required_tags": ["high_calorie", "protein_rich"],
  "avoid_tags": ["low_calorie"],
  "meal_frequency": 5
}
```

#### Allergy Rules
```json
{
  "allergy": "egg_protein",
  "avoid_foods": ["egg"],
  "severity": "high"
}
```

### 🟦 RAG SCHEMA (DO NOT CHANGE)
```json
{
  "id": "unique_id",
  "text": "Natural language explanation of one concept",
  "metadata": {
    "type": "food | condition | goal | allergy",
    "food_name": "egg",
    "condition": "fever",
    "goal": "weight_gain",
    "tags": ["easy_digest", "protein_rich"]
  }
}
```

---

## ✅ DIET PLANNER ALGORITHM & SCORING

### Core Logic Structure
```python
def generate_diet(profile, query):
    foods = get_foods_from_db()
    rag_context = retrieve_rag(query)
    target = calculate_nutrition(profile)
    
    filtered = filter_foods(
        foods,
        allergies=profile.allergies,
        condition=profile.condition,
        age=profile.age
    )
    
    scored = score_foods(filtered, profile)
    selected = build_meal_plan(scored, target)
    validated = validate(selected, target)
    
    response = llm_generate(
        planner_output=validated,
        rag=rag_context,
        query=query
    )
    
    return response
```

### Best Scoring Formula
```
score = nutrition_match * 0.35 + \
        condition_match * 0.20 + \
        digestibility * 0.15 + \
        regional_preference * 0.10 + \
        meal_fit * 0.10 + \
        goal_alignment * 0.10
```

---

## ✅ PHASE 1 — ENVIRONMENT SETUP
- Tech Stack: FastAPI, PyTorch, FAISS, SentenceTransformers, MongoDB, Python 3.11+.
- Package installations specified in requirements.txt.

