from tools import meal_planner
res = meal_planner.invoke({
    "child_id": "demo_123",
    "plan_type": "daily",
    "focus_nutrients": ["iron", "calcium"],
    "age": 7.0,
    "weight": 22.0,
    "allergies": ["egg_protein", "peanuts"]
})
import json
print(json.dumps(res, indent=2))
