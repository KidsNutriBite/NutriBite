import os
import json
from typing import List, Dict, Any

DATASETS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "datasets")

def load_json_file(filename: str) -> List[Any]:
    path = os.path.join(DATASETS_DIR, filename)
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {filename}: {e}")
        return []

def save_json_file(filename: str, data: Any) -> bool:
    path = os.path.join(DATASETS_DIR, filename)
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving {filename}: {e}")
        return False

def get_all_foods() -> List[Dict[str, Any]]:
    return load_json_file("foods.json")

def get_food_by_name(food_name: str) -> Dict[str, Any]:
    foods = get_all_foods()
    for f in foods:
        if f.get("food_name", "").lower() == food_name.lower():
            return f
    return {}

def get_all_conditions() -> List[Dict[str, Any]]:
    return load_json_file("conditions.json")

def get_condition_rules(condition_name: str) -> Dict[str, Any]:
    conditions = get_all_conditions()
    for c in conditions:
        if c.get("condition_name", "").lower() == condition_name.lower():
            return c
    return {}

def get_all_goals() -> List[Dict[str, Any]]:
    return load_json_file("goals.json")

def get_goal_rules(goal_name: str) -> Dict[str, Any]:
    goals = get_all_goals()
    for g in goals:
        if g.get("goal_name", "").lower() == goal_name.lower():
            return g
    return {}

def get_all_allergies() -> List[Dict[str, Any]]:
    return load_json_file("allergies.json")

def get_allergy_rules(allergy_name: str) -> Dict[str, Any]:
    allergies = get_all_allergies()
    for a in allergies:
        if a.get("allergy", "").lower() == allergy_name.lower():
            return a
    return {}
