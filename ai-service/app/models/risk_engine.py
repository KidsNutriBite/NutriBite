import json
import math
from typing import Dict, Any, List, Optional
from app.models.llm import get_gemini_api_key, generate_gemini_response, GENAI_AVAILABLE

def run_disease_risk_analysis(
    profile: Dict[str, Any],
    meals: List[Dict[str, Any]],
    growth_records: List[Dict[str, Any]],
    deficiencies: Optional[List[str]] = None,
    twin_metrics: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Analyzes child logs and profile data to identify future disease risks.
    Attempts to use Gemini 2.5 Flash if available, otherwise falls back to
    a comprehensive rule-based clinical logic.
    """
    age = profile.get("age", 5)
    weight = profile.get("weight", 18.0)
    height = profile.get("height", 110.0)
    gender = profile.get("gender", "neutral")
    allergies = profile.get("allergies", [])
    conditions = [c.lower() for c in profile.get("healthConditions", [])]
    health_notes = profile.get("healthNotes", "")

    # Calculate BMI
    bmi = 15.0
    if height > 0:
        bmi = round(weight / ((height / 100.0) ** 2), 1)

    # Deterministic Local Analysis Setup
    iron_foods = ["spinach", "palak", "beetroot", "lentil", "pomegranate", "liver", "egg", "chicken", "meat", "fish", "chole", "rajma"]
    calcium_foods = ["milk", "curd", "paneer", "yogurt", "cheese", "ragi", "soy", "almond", "tofu"]
    junk_foods = ["sugar", "sweet", "chocolate", "soda", "cake", "ice cream", "cookie", "candy", "burger", "pizza", "fries", "donut", "biscuit", "naan"]

    iron_count = 0
    calcium_count = 0
    junk_count = 0
    skipped_breakfasts = 0
    total_days = len(meals) if len(meals) > 0 else 1

    for meal in meals:
        # Check skipped breakfast
        bf = meal.get("breakfast", [])
        if not bf:
            skipped_breakfasts += 1
        
        # Scan all meals for food items
        all_items = []
        for mt in ["breakfast", "morningSnack", "lunch", "afternoonSnack", "dinner", "eveningSnack"]:
            all_items.extend(meal.get(mt, []))
        
        for item in all_items:
            name = item.get("name", "").lower()
            if any(f in name for f in iron_foods):
                iron_count += 1
            if any(f in name for f in calcium_foods):
                calcium_count += 1
            if any(f in name for f in junk_foods):
                junk_count += 1

    # Frequency per week
    iron_freq_weekly = (iron_count / total_days) * 7
    calcium_freq_weekly = (calcium_count / total_days) * 7
    junk_freq_weekly = (junk_count / total_days) * 7

    # Evaluate Risks
    risks = []

    # 1. Iron Deficiency Risk
    iron_severity = "Low"
    iron_factors = []
    has_anemia_history = any("iron" in c or "anemia" in c for c in conditions)
    if has_anemia_history:
        iron_factors.append("History of Iron Deficiency")
    if iron_freq_weekly < 3:
        iron_factors.append("Low Iron Foods")
    if skipped_breakfasts / total_days > 0.3:
        iron_factors.append("Skipped Breakfasts")
    
    if len(meals) > 0:
        if iron_freq_weekly < 2 or (has_anemia_history and iron_freq_weekly < 3.5):
            iron_severity = "Critical" if has_anemia_history else "High"
        elif iron_freq_weekly < 4:
            iron_severity = "Medium"
    else:
        # Fallback if no logs
        if has_anemia_history:
            iron_severity = "High"
            iron_factors.append("History of Iron Deficiency (No meal logs)")

    if iron_severity != "Low" or has_anemia_history:
        if not iron_factors:
            iron_factors.append("Low Iron Foods Intake")
        risks.append({
            "riskType": "Iron Deficiency Risk",
            "severity": iron_severity,
            "confidence": 85 if total_days > 10 else 70,
            "predictionWindow": "Within 30 Days" if iron_severity == "Critical" else ("Within 60 Days" if iron_severity == "High" else "Within 90 Days"),
            "factors": iron_factors,
            "recommendedIntervention": "Introduce iron-rich foods such as spinach, beetroot, lentils, and pomegranate. Supplement with Vitamin C (citrus juice) to enhance absorption, and avoid milk within 1 hour of iron intake."
        })

    # 2. Bone Development Risk
    calcium_severity = "Low"
    calcium_factors = []
    if calcium_freq_weekly < 4:
        calcium_factors.append("Low Calcium Intake")
    if "vegetarian" in allergies or "vegan" in allergies:
        calcium_factors.append("Strict Dietary Restrictions")
    
    if len(meals) > 0:
        if calcium_freq_weekly < 3:
            calcium_severity = "High"
        elif calcium_freq_weekly < 6:
            calcium_severity = "Medium"
    else:
        if age > 8:
            calcium_severity = "Medium"
            calcium_factors.append("Increased Calcium RDA for Age Group (No meal logs)")

    if calcium_severity != "Low":
        if not calcium_factors:
            calcium_factors.append("Sub-optimal Dairy Intake")
        risks.append({
            "riskType": "Bone Development Risk",
            "severity": calcium_severity,
            "confidence": 80 if total_days > 10 else 65,
            "predictionWindow": "Within 90 Days" if calcium_severity == "High" else "Within 120 Days",
            "factors": calcium_factors,
            "recommendedIntervention": "Incorporate ragi porridge, yogurt, paneer, and calcium-fortified beverages. Ensure 15-20 minutes of daily morning sun exposure for optimal Vitamin D synthesis."
        })

    # 3. Growth Delay Risk
    growth_severity = "Low"
    growth_factors = []
    # Check protein target (e.g., target 20g)
    avg_protein = 0.0
    if len(meals) > 0:
        total_protein = 0
        for meal in meals:
            for mt in ["breakfast", "morningSnack", "lunch", "afternoonSnack", "dinner", "eveningSnack"]:
                for item in meal.get(mt, []):
                    total_protein += item.get("protein", 0)
        avg_protein = total_protein / total_days
        
    if avg_protein > 0 and avg_protein < 15:
        growth_factors.append("Low Protein Intake")
    if bmi < 14.0:
        growth_factors.append("Low BMI for Age")
    if total_days < 5:
        growth_factors.append("Poor Log Consistency")

    if bmi < 13.0:
        growth_severity = "Critical"
    elif bmi < 14.0 or (avg_protein > 0 and avg_protein < 12):
        growth_severity = "High"
    elif avg_protein > 0 and avg_protein < 17:
        growth_severity = "Medium"

    if growth_severity != "Low":
        if not growth_factors:
            growth_factors.append("Sub-optimal Macro Balance")
        risks.append({
            "riskType": "Growth Delay Risk",
            "severity": growth_severity,
            "confidence": 88 if total_days > 15 else 75,
            "predictionWindow": "Within 45 Days" if growth_severity in ["Critical", "High"] else "Within 90 Days",
            "factors": growth_factors,
            "recommendedIntervention": "Add protein-dense ingredients like sprouted pulses, whole eggs, tofu, or peanut butter to meals. Focus on structured, consistent snack times to maintain energy levels."
        })

    # 4. Obesity / Metabolic Risk
    obesity_severity = "Low"
    obesity_factors = []
    if junk_freq_weekly > 5:
        obesity_factors.append("High Sugar/Junk Food Frequency")
    if bmi > 18.0:
        obesity_factors.append("Elevated BMI")
    
    if bmi > 21.0:
        obesity_severity = "Critical"
    elif bmi > 18.5 or junk_freq_weekly > 7:
        obesity_severity = "High"
    elif junk_freq_weekly > 4:
        obesity_severity = "Medium"

    if obesity_severity != "Low":
        if not obesity_factors:
            obesity_factors.append("High Calorie Snack Patterns")
        risks.append({
            "riskType": "Obesity Risk",
            "severity": obesity_severity,
            "confidence": 82 if total_days > 10 else 68,
            "predictionWindow": "Within 60 Days" if obesity_severity in ["Critical", "High"] else "Within 120 Days",
            "factors": obesity_factors,
            "recommendedIntervention": "Limit refined sugars and processed snacks. Replace biscuits/sweets with fresh berries or carrot sticks, and encourage at least 60 minutes of active play daily."
        })

    # Default fallback result
    result = {
        "risks": risks,
        "overallRiskScore": 15 # default
    }

    # Calculate local overallRiskScore
    if risks:
        score_map = {"Critical": 90, "High": 75, "Medium": 45, "Low": 15}
        total_score = sum(score_map[r["severity"]] for r in risks)
        result["overallRiskScore"] = min(100, int(total_score / len(risks)))
    else:
        # If no risks identified, add a default Low risk to avoid empty UI
        result["risks"].append({
            "riskType": "General Nutritional Risk",
            "severity": "Low",
            "confidence": 95,
            "predictionWindow": "Within 180 Days",
            "factors": ["Stable Food Diary"],
            "recommendedIntervention": "Maintain current balanced diet patterns. Excellent work on food diversity!"
        })
        result["overallRiskScore"] = 10

    # Gemini Advanced Analysis
    api_key = get_gemini_api_key()
    if api_key and GENAI_AVAILABLE:
        # Format logs and growth records for LLM context
        meal_summary = []
        for m in meals[:10]:
            day_meals = {}
            for mt in ["breakfast", "lunch", "dinner"]:
                items = m.get(mt, [])
                day_meals[mt] = [i.get("name") for i in items if i.get("name")]
            meal_summary.append({"date": m.get("date"), "meals": day_meals})

        growth_summary = [{"date": str(g.get("timestamp"))[:10], "height": g.get("height"), "weight": g.get("weight")} for g in growth_records[:5]]

        prompt = (
            f"You are a Principal Pediatric Health Architect and Senior Clinical AI Engineer. "
            f"Analyze this child's medical profile, meal logs, and growth history to identify future clinical disease risks.\n\n"
            f"Child Profile:\n"
            f"- Age: {age} years\n"
            f"- Current Weight: {weight} kg\n"
            f"- Current Height: {height} cm\n"
            f"- Gender: {gender}\n"
            f"- Allergies: {allergies}\n"
            f"- Health Conditions: {profile.get('healthConditions', [])}\n"
            f"- Health Notes: {health_notes}\n\n"
            f"Recent Meal Logs (last 10 days):\n"
            f"{json.dumps(meal_summary)}\n\n"
            f"Recent Growth Records:\n"
            f"{json.dumps(growth_summary)}\n\n"
            f"You must perform a detailed clinical risk assessment. Focus on identifying early warnings for: "
            f"1. Iron Deficiency Risk\n"
            f"2. Bone Development Risk\n"
            f"3. Growth Delay Risk\n"
            f"4. Obesity Risk\n\n"
            f"You must return a raw JSON response matching this schema precisely:\n"
            f"{{\n"
            f"  \"risks\": [\n"
            f"    {{\n"
            f"      \"riskType\": \"Risk Name (e.g. 'Iron Deficiency Risk')\",\n"
            f"      \"severity\": \"Severity ('Low', 'Medium', 'High', 'Critical')\",\n"
            f"      \"confidence\": 0-100 integer,\n"
            f"      \"predictionWindow\": \"Window (e.g. 'Within 60 Days')\",\n"
            f"      \"factors\": [\"factor 1\", \"factor 2\"],\n"
            f"      \"recommendedIntervention\": \"Actionable medical intervention suggestion\"\n"
            f"    }}\n"
            f"  ],\n"
            f"  \"overallRiskScore\": 0-100 integer representing composite severity\n"
            f"}}\n\n"
            f"Do not include any markdown comments or enclosing backticks. Return ONLY valid JSON."
        )
        try:
            raw_res = generate_gemini_response(prompt, api_key, is_json=True)
            # Clean response if LLM didn't respect raw JSON instruction
            cleaned = raw_res.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
            res_json = json.loads(cleaned)
            if "risks" in res_json and len(res_json["risks"]) > 0:
                # Add recommended interventions fallback checks
                for r in res_json["risks"]:
                    if not r.get("recommendedIntervention"):
                        r["recommendedIntervention"] = "Monitor dietary intakes and keep meals balanced."
                return res_json
        except Exception as e:
            print(f"[Gemini Risk Engine Error] Fallback triggered: {e}")

    return result
