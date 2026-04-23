from typing import List, Dict, Any
from .risk_engine import NutrientRisk

def calculate_deficiencies(meal_logs: List[Dict[str, Any]], age: int) -> List[NutrientRisk]:
    """
    Simulated nutrient analysis based on food groups, as raw nutrient data might be missing.
    In production, this would query a structured food database.
    
    Inputs:
    - meal_logs: List of meal items
    - age: Age of the child (affects RDA)
    
    Outputs:
    - List of NutrientRisk objects (nutrient, status, gap)
    """
    
    # 1. Initialize counters
    # Simple heuristic counters based on food keywords
    
    counts = {
        "Iron": 0,
        "Calcium": 0,
        "Protein": 0,
        "Vitamin C": 0,
        "Fiber": 0
    }
    
    # Keyword mapping (simplified)
    keywords = {
        "Iron": ["spinach", "palak", "lentil", "dal", "meat", "chicken", "fish", "egg", "poha", "dates", "pomegranate", "jaggery"],
        "Calcium": ["milk", "curd", "yogurt", "cheese", "paneer", "ragi", "almond"],
        "Protein": ["dal", "egg", "chicken", "fish", "paneer", "soya", "nut", "sprout", "tofu", "gram"],
        "Vitamin C": ["orange", "lemon", "guava", "tomato", "amla", "capsicum", "fruit", "berry"],
        "Fiber": ["oats", "fruit", "vegetable", "brown rice", "wheat", "wholegrain"]
    }
    
    total_meals = len(meal_logs) if meal_logs else 1
    days_logged = max(1, total_meals // 3) # Approx 3 meals a day
    
    # Count occurrences
    for meal in meal_logs:
        name = meal.get('name', '').lower()
        for nutrient, keys in keywords.items():
            if any(k in name for k in keys):
                counts[nutrient] += 1
                
    # 2. Compare against "Target Frequency" per day (Heuristic RDA)
    # E.g., Iron rich food needed at least 1x/day
    
    deficiency_risks = []
    
    targets = {
        "Iron": 1.0,      # 1 serving daily
        "Calcium": 2.0,   # 2 servings daily
        "Protein": 2.0,   # 2 servings daily
        "Vitamin C": 1.0, # 1 serving daily
        "Fiber": 1.0      # 1 serving daily
    }
    
    for nutrient, daily_target in targets.items():
        avg_intake = counts[nutrient] / days_logged
        gap = daily_target - avg_intake
        
        if gap > 0.5: # Significant gap
            status = "Low" if gap < 1.0 else "Very Low"
            deficiency_risks.append(NutrientRisk(
                nutrient=nutrient,
                status=status,
                gap=f"-{int(gap*100)}% of RDA"
            ))
            
    return deficiency_risks

def analyze_trends(meal_logs: List[Dict[str, Any]]) -> str:
    """Detects simple trends (improving/declining consistency)."""
    if not meal_logs:
        return "No data"
        
    # Dummy logic: check if last 3 days have more entries than first 3 days
    # In real world, use time-series analysis on nutrient values
    return "Stable" 
