from typing import Dict, Any, List
from huggingface_hub import InferenceClient
from models import DayPlan, DietPlanResponse
import json
import re

async def generate_diet_plan(
    hf_client: InferenceClient,
    gemini_client: Any,
    profile: dict,
    deficiencies: List[Any],
    risk_level: str,
    duration: int,
    doctor_notes: str
) -> DietPlanResponse:
    
    # 1. Structure Prompt
    # Inject context, restrictions (veg/non), and deficiencies
    
    meals_prompt = f"""
    You are an Expert Pediatric Clinical Dietitian (AI Assistant).
    
    Your TASK: Generating a personalized {duration}-Day Meal Plan.
    Patient Profile:
    - Age: {profile.get('age', 5)}
    - Weight: {profile.get('weight', 'Unknown')}
    - Conditions: {', '.join(profile.get('conditions', []))}
    - Allergies: {', '.join(profile.get('allergies', []))}
    - Diet Pref: {', '.join(profile.get('preferences', ['Balanced']))}
    
    Clinically Identified Deficiencies (PRIORITY):
    {', '.join([f"{d.nutrient} ({d.gap})" for d in deficiencies])}

    Doctor Notes: {doctor_notes}

    RULES:
    1. STRICTLY follow dietary preferences (Veg/Non-Veg).
    2. Suggest Indian home-cooked meals (simple, nutritious).
    3. Incorporate specific foods to fix deficiencies (e.g. Ragi for Calcium).
    4. Provide calorie distribution: Breakfast (heavy), Lunch (balanced), Dinner (light).
    5. Output JSON ONLY.
    
    JSON SCHEMA:
    {{
      "weekly_summary": "Short clinical summary of the plan strategy.",
      "expected_improvements": {{ "Iron": "High", "Calcium": "Moderate" }},
      "plan_score": {{ "nutrition_score": 85, "diversity_score": 90, "overall_score": 88 }},
      "days": {{
        "day_1": {{
          "breakfast": "Description",
          "lunch": "Description",
          "dinner": "Description",
          "snacks": "Description",
          "nutrient_focus": ["Iron", "Fiber"]
        }},
        ... (repeat for {duration} days)
      }}
    }}
    """

    try:
        if hf_client:
            response = hf_client.chat_completion(
                messages=[{"role": "user", "content": meals_prompt}],
                max_tokens=1500,  # Increased for multi-day plan
                temperature=0.2,  # Low temp for deterministic structure
                response_format={"type": "json_object"} # If supported model
            )
            content = response.choices[0].message.content
        else:
            raise Exception("HF Client not properly defined.")
            
    except Exception as e:
        print(f"HF Error in generate_diet_plan: {e}. Falling back to Gemini...")
        if gemini_client:
             try:
                 response = gemini_client.models.generate_content(
                     model='gemini-2.5-flash',
                     contents=meals_prompt,
                 )
                 content = response.text
             except Exception as gemini_e:
                 print(f"Gemini fallback failed in generate_diet_plan: {gemini_e}")
                 return DietPlanResponse(
                     status="FAILED",
                     risk_level="ERROR",
                     reason=f"AI Generation Failed (Both Services): HF({str(e)}), Gemini({str(gemini_e)})"
                 )
        else:
             print("No Gemini Client available for fallback.")
             return DietPlanResponse(
                 status="FAILED",
                 risk_level="ERROR",
                 reason=f"AI Generation Failed: HF({str(e)}) and Gemini unavailable"
             )
        
        # 2. Extract JSON
        # Robust parsing
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            plan_data = json.loads(json_match.group(0))
        else:
             # Fallback structure if LLM fails format
             plan_data = {"weekly_summary": "Error parsing plan.", "days": {}}
             
        # 3. Transform to Pydantic Response
        # (Assuming DayPlan model matches or map it)
        
        # calculate dummy scores if missing
        scores = plan_data.get("plan_score", {"nutrition_score": 80, "diversity_score": 80, "overall_score": 80})

        # Generate summary for doctor using separate function or extraction
        doc_summary = {
            "clinical_overview": f"Plan targets {len(deficiencies)} deficiencies with calorie balanced Indian meals.",
            "risk_flags": [risk_level],
            "recommendation": "Approve for 2-week trial."
        }

        return DietPlanResponse(
            status="GENERATED",
            risk_level=risk_level,
            priority_focus=[d.nutrient for d in deficiencies],
            weekly_summary=plan_data.get("weekly_summary", "Plan generated."),
            expected_improvements=plan_data.get("expected_improvements", {}),
            plan_score=scores,
            days=plan_data.get("days", {}),
            doctor_summary=doc_summary
        )

    except Exception as e:
        print(f"JSON Parsing Error: {e}")
        return DietPlanResponse(
            status="FAILED",
            risk_level="ERROR",
            reason=f"Plan Generation Failed during JSON processing: {str(e)}"
        )
