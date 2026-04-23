from pydantic import BaseModel
from typing import List, Optional

class NutrientRisk(BaseModel):
    nutrient: str
    status: str
    gap: str

class RiskAssessment(BaseModel):
    risk_level: str  # "LOW", "MODERATE", "HIGH"
    flags: List[str]
    can_generate_plan: bool
    reason: Optional[str] = None

def assess_risk(profile: dict, deficiencies: List[NutrientRisk], doctor_notes: str) -> RiskAssessment:
    """
    Hybrid Risk Engine:
    1. Deterministic Rules (BMI, Severe Deficiencies)
    2. LLM Context Analysis (Medical history in notes)
    """
    flags = []
    
    # 1. BMI Check (Simplified)
    # in production, calculate BMI z-score properly
    try:
        age = profile.get("age", 5)
        weight = float(profile.get("weight", "0").split()[0]) # "20 kg" -> 20.0
        
        # Very rough underweight check for demo purpose
        # active severe malnutrition check
        if age > 1 and weight < (age * 2 + 5): 
             flags.append("Potential Underweight (red flag)")
             
    except:
        pass

    # 2. Medical Condition Keywords
    critical_conditions = ["diabetes", "celiac", "renal", "kidney", "severe allergy", "anaphylaxis"]
    profile_conditions = [c.lower() for c in profile.get("conditions", [])]
    
    for cond in critical_conditions:
        if any(cond in c for c in profile_conditions):
             flags.append(f"Critical Condition: {cond}")

    if "severe" in doctor_notes.lower() or "hospital" in doctor_notes.lower():
        flags.append("Recent medical attention noted in doctor notes")

    # 3. Decision Logic
    if any("Critical" in f for f in flags) or len(flags) > 2:
        return RiskAssessment(
            risk_level="HIGH",
            flags=flags,
            can_generate_plan=False,
            reason="High clinical risk detected. Direct doctor consultation required before AI planning."
        )
        
    if flags:
        return RiskAssessment(
            risk_level="MODERATE",
            flags=flags,
            can_generate_plan=True,
            reason=" Moderate risk. Plan generated with strict supervision flags."
        )

    return RiskAssessment(
        risk_level="LOW",
        flags=[],
        can_generate_plan=True,
        reason="Safe for AI generation."
    )
