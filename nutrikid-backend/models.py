from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class NutrientGoal(BaseModel):
    nutrient: str
    target: str
    current_estimated: str
    status: str  # "Low", "Good", "High"

class MealLogItem(BaseModel):
    name: str
    portion: str
    date: str
    meal_type: str  # "Breakfast", "Lunch", "Dinner", "Snack"
    nutrients: Optional[Dict[str, Any]] = {}

class ChildProfile(BaseModel):
    age: int
    weight: str
    gender: str
    conditions: List[str] = []
    allergies: List[str] = []
    preferences: List[str] = []  # "veg", "non-veg", "budget-low"
    activity_level: str = "moderate"

class DietPlanRequest(BaseModel):
    child_profile: ChildProfile
    meal_logs: List[MealLogItem]  # Last 14-30 days
    duration_days: int = 7
    doctor_notes: Optional[str] = ""

class DayPlan(BaseModel):
    breakfast: str
    lunch: str
    dinner: str
    snacks: str
    nutrient_focus: List[str]

class DietPlanResponse(BaseModel):
    status: str  # "GENERATED", "REQUIRES_DOCTOR_REVIEW"
    reason: Optional[str] = None
    risk_level: str
    priority_focus: List[str] = []
    weekly_summary: Optional[str] = None
    expected_improvements: Dict[str, str] = {}
    plan_score: Dict[str, int] = {}
    days: Dict[str, DayPlan] = {}
    doctor_summary: Dict[str, Any] = {}
