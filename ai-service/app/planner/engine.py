from typing import List, Dict, Any
from app.db.connection import get_all_foods, get_condition_rules, get_goal_rules, get_all_allergies

def calculate_nutritional_targets(age: int, goal: str) -> Dict[str, float]:
    """
    1. Calorie & Protein Target Calculation
    """
    # Base rates by age
    if age <= 3:
        calories = 1000.0
        protein = 15.0
    elif age <= 6:
        calories = 1300.0
        protein = 20.0
    elif age <= 9:
        calories = 1600.0
        protein = 30.0
    else:
        calories = 2000.0
        protein = 40.0
        
    # Adjustments based on goal
    if goal.lower() == "weight_gain":
        calories += 250.0
        protein += 7.0
    elif goal.lower() == "weight_loss":
        calories -= 200.0
        protein -= 3.0
        
    return {
        "calories_kcal": calories,
        "protein_g": protein
    }

def get_blocked_foods_by_allergies(child_allergies: List[str]) -> List[str]:
    """
    Finds foods that must be blocked due to child allergies.
    """
    blocked_food_names = []
    all_allergy_rules = get_all_allergies()
    
    for allergy_name in child_allergies:
        allergy_name_lower = allergy_name.lower()
        for rule in all_allergy_rules:
            if rule.get("allergy", "").lower() == allergy_name_lower:
                avoid_foods = rule.get("avoid_foods", [])
                for f in avoid_foods:
                    blocked_food_names.append(f.lower())
                    
    return blocked_food_names

def generate_personalized_diet_plan(profile: Dict[str, Any], instructions: str = "") -> Dict[str, Any]:
    """
    Core Planner Engine.
    Follows:
      1. Calorie/Protein target calculation.
      2. Meal calorie distribution.
      3. Constraint filtering (Allergies + Conditions).
      4. Food selection & dynamic scoring.
      5. Portion assignment & plan validation.
    """
    age = profile.get("age", 5)
    goal = profile.get("goal", "healthy_maintain")
    condition = profile.get("condition", "")
    allergies = profile.get("allergies", [])
    region = profile.get("region", "south_india")
    diet_type = profile.get("diet_type", "veg")
    
    # 1. Calorie Calculation
    targets = calculate_nutritional_targets(age, goal)
    target_cal = targets["calories_kcal"]
    target_prot = targets["protein_g"]
    
    # 2. Meal Distribution
    # Breakfast (25%), Snack 1 (10%), Lunch (35%), Snack 2 (10%), Dinner (20%)
    meal_dist = {
        "breakfast": 0.25,
        "snack_1": 0.10,
        "lunch": 0.35,
        "snack_2": 0.10,
        "dinner": 0.20
    }
    
    # 3. Constraint Filtering
    blocked_by_allergies = get_blocked_foods_by_allergies(allergies)
    
    # Condition rules
    condition_req_tags = []
    condition_avoid_tags = []
    if condition:
        cond_rules = get_condition_rules(condition)
        if cond_rules:
            condition_req_tags = [t.lower() for t in cond_rules.get("required_tags", [])]
            condition_avoid_tags = [t.lower() for t in cond_rules.get("avoid_tags", [])]
            
    # Load all foods
    all_foods = get_all_foods()
    valid_foods = []
    
    for food in all_foods:
        food_name = food.get("food_name", "").lower()
        food_tags = [t.lower() for t in food.get("tags", [])]
        food_allergies = [a.lower() for a in food.get("allergy_tags", [])]
        
        # A. Allergy check (Strict blockout)
        has_allergy_conflict = False
        if food_name in blocked_by_allergies:
            has_allergy_conflict = True
        for a in allergies:
            if a.lower() in food_allergies:
                has_allergy_conflict = True
                
        if has_allergy_conflict:
            continue
            
        # B. Condition check (Avoid tags filtering)
        has_avoid_tag = False
        for av_tag in condition_avoid_tags:
            if av_tag in food_tags:
                has_avoid_tag = True
                
        if has_avoid_tag:
            continue
            
        # C. Age suitability
        try:
            food_age_min = int(food.get("age_min") or 0)
        except:
            food_age_min = 0
            
        if age < food_age_min:
            continue
            
        # D. Diet type suitability
        food_cat = food.get("category", "").lower()
        if diet_type == "veg" and food_cat in ["non-veg", "meat", "fish", "chicken"]:
            continue
        if diet_type == "egg-veg" and food_cat in ["non-veg", "meat", "fish", "chicken"] and food_name != "egg":
            continue
            
        valid_foods.append(food)
        
    # 4. Food Selection & Portion Assignment
    plan = {}
    planned_cal = 0.0
    planned_prot = 0.0
    
    # Define placeholder meals in case of low data matching, using localized, high-suitability options
    for meal, pct in meal_dist.items():
        meal_target_cal = target_cal * pct
        
        # Filter valid foods by meal type fit
        meal_foods = []
        for f in valid_foods:
            if meal in [mt.lower() for mt in f.get("meal_types", [])] or "all" in [mt.lower() for mt in f.get("meal_types", [])]:
                meal_foods.append(f)
                
        if not meal_foods:
            # Fallback to valid foods
            meal_foods = valid_foods if valid_foods else all_foods
            
        # Score each food based on formula
        scored_foods = []
        for f in meal_foods:
            score = 0.0
            
            # Nutrition match (35%)
            # Does it have energy per 100g? Let's check how close it is to target per portion
            f_cal = f.get("portion_energy_kcal") or f.get("energy_kcal_per_100g") or 0.0
            if f_cal:
                try:
                    f_cal = float(f_cal)
                    nut_diff = abs(f_cal - meal_target_cal)
                    score += max(0, 0.35 * (1.0 - (nut_diff / meal_target_cal)))
                except:
                    pass
                    
            # Condition match (20%)
            # Does it contain required tags for condition?
            f_tags = [t.lower() for t in f.get("tags", [])]
            cond_matches = sum(1 for t in condition_req_tags if t in f_tags)
            if condition_req_tags:
                score += 0.20 * (cond_matches / len(condition_req_tags))
                
            # Digestibility (15%)
            digest_val = f.get("digestibility_boiled", "").lower()
            if digest_val == "high":
                score += 0.15
            elif digest_val == "medium":
                score += 0.08
                
            # Regional preference (10%)
            # If region is south_india and food fits south Indian dishes
            # (Just a basic tag or name matching)
            is_regional = False
            for r_keyword in ["idli", "dosa", "rice", "curd", "sambar", "ragi"]:
                if r_keyword in f.get("food_name", "").lower():
                    is_regional = True
            if is_regional and region == "south_india":
                score += 0.10
                
            # Meal fit (10%)
            if meal in [mt.lower() for mt in f.get("meal_types", [])]:
                score += 0.10
                
            # Goal alignment (10%)
            if goal == "weight_gain" and "energy_dense" in f_tags:
                score += 0.10
            elif goal == "weight_loss" and "low_calorie" in f_tags:
                score += 0.10
            else:
                score += 0.05
                
            scored_foods.append((score, f))
            
        # Sort and select best food
        scored_foods.sort(key=lambda x: x[0], reverse=True)
        best_food = scored_foods[0][1] if scored_foods else {"food_name": "steamed khichdi", "portion_unit": "1 bowl (~200g)", "portion_energy_kcal": 180, "portion_protein_g": 6}
        
        # Assign portions
        p_unit = best_food.get("portion_unit", "1 portion")
        p_cal = best_food.get("portion_energy_kcal") or best_food.get("energy_kcal_per_100g") or 100.0
        p_prot = best_food.get("portion_protein_g") or best_food.get("protein_g") or 3.0
        
        try:
            p_cal = float(p_cal)
            p_prot = float(p_prot)
        except:
            p_cal = 100.0
            p_prot = 3.0
            
        # Adjust portion count to meet target calories for this meal
        portions_needed = max(0.5, round(meal_target_cal / p_cal, 1))
        assigned_name = f"{portions_needed} x {p_unit} of {best_food.get('food_name')}"
        
        plan[meal] = {
            "food_name": best_food.get("food_name"),
            "description": assigned_name,
            "calories_kcal": round(p_cal * portions_needed, 1),
            "protein_g": round(p_prot * portions_needed, 1)
        }
        
        planned_cal += p_cal * portions_needed
        planned_prot += p_prot * portions_needed
        
    # 5. Validation
    is_validated = (planned_cal >= target_cal * 0.85) and (planned_cal <= target_cal * 1.15)
    status_msg = "validated_and_balanced" if is_validated else "approx_balanced"
    
    return {
        "diet_plan": plan,
        "nutritional_validation": {
            "target_calories_kcal": round(target_cal, 1),
            "planned_calories_kcal": round(planned_cal, 1),
            "target_protein_g": round(target_prot, 1),
            "planned_protein_g": round(planned_prot, 1),
            "status": status_msg
        },
        "blocked_foods_allergy": blocked_by_allergies,
        "planner_filtered_out": condition_avoid_tags
    }
