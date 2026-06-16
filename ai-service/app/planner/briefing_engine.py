import json
from typing import Dict, Any, List
from app.models.llm import get_gemini_api_key, generate_gemini_response, GENAI_AVAILABLE

def run_clinical_briefing(
    profile: Dict[str, Any],
    meals: List[Dict[str, Any]],
    growth_records: List[Dict[str, Any]],
    prescriptions: List[Dict[str, Any]],
    escalations: List[Dict[str, Any]],
    risk_scores: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Generates a structured clinical briefing with five domain scores and insights.
    Attempts to query Gemini 2.5 Flash if available, otherwise falls back to
    deterministic rule-based informatics.
    """
    age = profile.get("age", 5)
    weight = profile.get("weight", 18.0)
    height = profile.get("height", 110.0)
    gender = profile.get("gender", "neutral")
    conditions = [c.lower() for c in profile.get("healthConditions", [])]
    health_notes = profile.get("healthNotes", "")

    # Calculate BMI
    bmi = 15.0
    if height > 0:
        bmi = round(weight / ((height / 100.0) ** 2), 1)

    # 1. Calculate target targets
    target_calories = 1400
    target_protein = 20
    if age <= 3:
        target_calories = 1000
        target_protein = 13
    elif age <= 8:
        target_calories = 1400
        target_protein = 19
    elif age <= 13:
        target_calories = 1800 if gender == "male" else 1600
        target_protein = 34

    # 2. Nutrient Averages
    total_days = len(meals) if len(meals) > 0 else 1
    total_protein = 0
    total_calories = 0
    total_water = 0
    skipped_breakfasts = 0

    for m in meals:
        day_protein = 0
        day_calories = 0
        day_water = 0
        
        # breakfast check
        bf = m.get("breakfast", [])
        if not bf:
            skipped_breakfasts += 1
            
        for mt in ["breakfast", "morningSnack", "lunch", "afternoonSnack", "dinner", "eveningSnack"]:
            items = m.get(mt, [])
            for item in items:
                day_protein += item.get("protein", 0)
                day_calories += item.get("calories", 0)
                day_water += item.get("water", 0)
        
        total_protein += day_protein
        total_calories += day_calories
        total_water += day_water

    avg_protein = total_protein / total_days
    avg_calories = total_calories / total_days
    avg_water = total_water / total_days

    # 3. Calculate Domain Scores (Fallback deterministic values)
    # A. Nutrition Score (based on protein & calorie deviation)
    prot_dev = abs(avg_protein - target_protein) / target_protein if avg_protein > 0 else 1.0
    cal_dev = abs(avg_calories - target_calories) / target_calories if avg_calories > 0 else 1.0
    
    prot_score = max(30, int((1.0 - prot_dev) * 100))
    cal_score = max(30, int((1.0 - cal_dev) * 100))
    nutrition_score = int((prot_score + cal_score) / 2) if len(meals) > 0 else 72

    # B. Growth Score (based on BMI status)
    growth_score = 90
    if bmi < 13.0 or bmi > 21.0:
        growth_score = 40
    elif bmi < 14.2 or bmi > 18.5:
        growth_score = 65

    # C. Adherence Score (based on food diary consistency)
    if len(meals) >= 15:
        adherence_score = 95
    elif len(meals) >= 7:
        adherence_score = 78
    elif len(meals) > 0:
        adherence_score = 52
    else:
        adherence_score = 25

    # D. Risk Score (composite from previous risks)
    severity_map = {"Critical": 90, "High": 75, "Medium": 45, "Low": 15}
    if risk_scores:
        risk_score = min(100, int(sum(severity_map.get(r.get("severity"), 15) for r in risk_scores) / len(risk_scores)))
    else:
        risk_score = 15

    # E. Attention Score
    active_escalations = [e for e in escalations if not e.get("resolved", False)]
    attention_score = risk_score
    if active_escalations:
        attention_score += len(active_escalations) * 35
    if growth_score < 50:
        attention_score += 20
    if adherence_score < 60:
        attention_score += 15
    attention_score = min(100, max(10, attention_score))

    # Determine Overall Status Label
    overall_status = "Healthy Growth"
    risk_level = "Low"
    if attention_score >= 75:
        overall_status = "Critical Risk Alert"
        risk_level = "Critical"
    elif attention_score >= 50:
        overall_status = "Moderate Risk"
        risk_level = "High"
    elif attention_score >= 30:
        overall_status = "Borderline Progress"
        risk_level = "Medium"

    # Deterministic fallback text
    fallback_summary = (
        f"Nutritional intake is currently tracking at {nutrition_score}% of target recommendations. "
        f"Average daily protein is {avg_protein:.1f}g against RDA target of {target_protein}g. "
        f"Growth indicators place BMI at {bmi} ({'underweight' if bmi < 14.0 else ('normal' if bmi <= 18.5 else 'overweight')}). "
        f"Logging compliance over the past month is consistent."
    )

    fallback_concerns = []
    if avg_protein < target_protein * 0.8:
        fallback_concerns.append("Protein intake is below RDA recommendation for growth support.")
    if bmi < 14.0:
        fallback_concerns.append("Growth velocity is sluggish, indicating low caloric reserve.")
    if active_escalations:
        fallback_concerns.append("Active medical triage escalations are pending clinical review.")
    if not fallback_concerns:
        fallback_concerns.append("No critical clinical concerns identified at present.")

    fallback_positives = ["Meal journal logs are maintained consistently by parent."]
    if avg_water >= 1200:
        fallback_positives.append("Hydration compliance is healthy, supporting metabolism.")
    if nutrition_score >= 80:
        fallback_positives.append("Excellent calorie target alignment observed in logs.")

    fallback_negatives = []
    if skipped_breakfasts / total_days > 0.25:
        fallback_negatives.append("Skipping breakfasts is causing energy troughs in morning periods.")
    if bmi < 13.5:
        fallback_negatives.append("Weight progress has dropped below normal percentile boundaries.")
    if not fallback_negatives:
        fallback_negatives.append("No significant regression patterns flagged in diaries.")

    fallback_actions = []
    if bmi < 14.0:
        fallback_actions.append("Counsel parent on increasing caloric density (ghee, butter, nut powder).")
    if avg_protein < target_protein * 0.8:
        fallback_actions.append("Encourage high protein snacks: whole milk raita, paneer cubes, or sprouts.")
    if active_escalations:
        fallback_actions.append("Review recent escalation keywords with the family.")
    if not fallback_actions:
        fallback_actions.append("Continue current pediatric diet tracking plan.")

    result = {
        "overallStatus": overall_status,
        "riskLevel": risk_level,
        "scores": {
            "nutritionScore": nutrition_score,
            "growthScore": growth_score,
            "adherenceScore": adherence_score,
            "riskScore": risk_score,
            "attentionScore": attention_score
        },
        "summary": fallback_summary,
        "risks": fallback_concerns,
        "insights": {
            "positive": fallback_positives,
            "negative": fallback_negatives
        },
        "recommendations": fallback_actions,
        "suggestedFollowUp": "Schedule physical review checkup in 30 days to re-verify height/weight curves."
    }

    # Gemini Advanced Generator
    api_key = get_gemini_api_key()
    if api_key and GENAI_AVAILABLE:
        # Prepare context summaries
        meal_summary = []
        for m in meals[:15]:
            day_meals = {}
            for mt in ["breakfast", "lunch", "dinner"]:
                items = m.get(mt, [])
                day_meals[mt] = [i.get("name") for i in items if i.get("name")]
            meal_summary.append({"date": m.get("date"), "meals": day_meals})

        growth_summary = [{"date": str(g.get("timestamp"))[:10], "height": g.get("height"), "weight": g.get("weight")} for g in growth_records[:5]]
        esc_summary = [{"message": e.get("ai_message"), "severity": e.get("risk_level")} for e in active_escalations]
        presc_summary = [{"title": p.get("title"), "instructions": p.get("instructions")} for p in prescriptions[:3]]

        prompt = (
            f"You are a Staff Pediatric Informatics Specialist and Senior Clinical AI Engineer. "
            f"Generate a comprehensive AI clinical briefing summary for this child profile based on logs, notes, and metrics.\n\n"
            f"Child Profile:\n"
            f"- Age: {age} years\n"
            f"- Current Weight: {weight} kg\n"
            f"- Current Height: {height} cm\n"
            f"- Gender: {gender}\n"
            f"- Health Conditions: {profile.get('healthConditions', [])}\n"
            f"- Doctor Notes: {health_notes}\n\n"
            f"Recent Meal Logs (last 15 days of records):\n"
            f"{json.dumps(meal_summary)}\n\n"
            f"RDA targets for reference:\n"
            f"- Calories: {target_calories} kcal, Protein: {target_protein}g\n"
            f"- Child average intake: Calories: {avg_calories:.1f} kcal, Protein: {avg_protein:.1f}g\n\n"
            f"Growth Records history:\n"
            f"{json.dumps(growth_summary)}\n\n"
            f"Active Escalation Alerts:\n"
            f"{json.dumps(esc_summary)}\n\n"
            f"Prescription history:\n"
            f"{json.dumps(presc_summary)}\n\n"
            f"Previous Risk Assessments:\n"
            f"{json.dumps(risk_scores[:4])}\n\n"
            f"You must generate a structured JSON response matching this schema precisely:\n"
            f"{{\n"
            f"  \"overallStatus\": \"Short diagnostic phrase (e.g. 'Moderate Risk' or 'Healthy Progression')\",\n"
            f"  \"riskLevel\": \"Risk Level string ('Low', 'Medium', 'High', 'Critical')\",\n"
            f"  \"scores\": {{\n"
            f"    \"nutritionScore\": 0-100 integer,\n"
            f"    \"growthScore\": 0-100 integer,\n"
            f"    \"adherenceScore\": 0-100 integer,\n"
            f"    \"riskScore\": 0-100 integer,\n"
            f"    \"attentionScore\": 0-100 integer (higher risk/alerts -> higher attention score)\n"
            f"  }},\n"
            f"  \"summary\": \"Clinical summary paragraph of recent trends (mention numeric % changes if visible, eg. 'Protein intake improved 18% over last 30 days')\",\n"
            f"  \"risks\": [\"top concern string 1\", \"top concern string 2\"],\n"
            f"  \"insights\": {{\n"
            f"    \"positive\": [\"positive improvement 1\", \"positive improvement 2\"],\n"
            f"    \"negative\": [\"negative change or regression 1\", \"negative change or regression 2\"]\n"
            f"  }},\n"
            f"  \"recommendations\": [\"action 1\", \"action 2\"],\n"
            f"  \"suggestedFollowUp\": \"Recommended follow-up details (e.g. 'Schedule follow-up checkup in 30 days')\"\n"
            f"}}\n\n"
            f"Do not include markdown tags. Output only valid JSON."
        )
        try:
            raw_res = generate_gemini_response(prompt, api_key, is_json=True)
            cleaned = raw_res.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
            res_json = json.loads(cleaned)
            if "overallStatus" in res_json and "scores" in res_json and "summary" in res_json:
                return res_json
        except Exception as e:
            print(f"[Gemini Briefing Engine Error] Fallback triggered: {e}")

    return result
