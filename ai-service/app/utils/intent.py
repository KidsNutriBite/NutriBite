import re

INTENTS = {
    "meal_plan": ["meal plan", "diet plan", "what to eat", "food chart", "menu"],
    "snacks": ["snack", "healthy snacks", "evening snack", "munch", "bites"],
    "weight_gain": ["weight gain", "underweight", "gain weight", "increase weight", "too skinny"],
    "fever_nutrition": ["fever", "temperature", "sick", "viral"],
    "hydration": ["hydration", "water", "fluid", "drink", "juice", "dehydrated"],
    "immunity": ["immunity", "immune", "sick often", "frequent cold", "prevent"],
    "picky_eating": ["picky", "fussy", "won't eat", "refuses", "doesn't like vegetables", "selective"],
    "allergy_safe": ["allergy", "allergic", "rash", "reaction", "safe from", "without egg", "without peanut"],
    "illness_food": ["cold", "cough", "diarrhea", "loose motion", "constipation", "vomiting", "stomach ache"],
    "general_question": [] # fallback
}

def classify_intent(query: str) -> str:
    """
    Classifies the user query into a predefined intent using keyword heuristics.
    """
    query_lower = query.lower()
    
    # Simple regex/keyword matching
    for intent, keywords in INTENTS.items():
        if intent == "general_question":
            continue
        for kw in keywords:
            if re.search(r'\b' + re.escape(kw) + r'\b', query_lower):
                return intent
                
    return "general_question"

def get_intent_header(intent: str) -> str:
    """
    Returns a dynamic header based on the intent for the response formatter.
    """
    headers = {
        "meal_plan": "Personalized Meal Plan",
        "snacks": "Healthy Snack Recommendations",
        "weight_gain": "Caloric Enrichment Plan",
        "fever_nutrition": "Immediate Recovery Guidance",
        "hydration": "Hydration Guidance",
        "immunity": "Immunity Support Strategy",
        "picky_eating": "Picky Eater Solutions",
        "allergy_safe": "Allergy-Safe Recommendations",
        "illness_food": "Symptom Relief Nutrition",
        "general_question": "Nutritional Guidance"
    }
    return headers.get(intent, "Nutritional Guidance")
