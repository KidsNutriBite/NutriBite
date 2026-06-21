import re
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.services.chat_orchestrator import get_chat_orchestrator
from app.db.connection import get_all_foods
from app.schemas.chat_response import ChatResponse

router = APIRouter()
orchestrator = get_chat_orchestrator()

# --- Pydantic Schema Definitions (Backwards Compatible) ---

class UserProfile(BaseModel):
    age: int = Field(..., description="Age of the child in years", ge=1)
    weight: float = Field(..., description="Weight of the child in kg", gt=0)
    goal: str = Field("healthy_maintain", description="Goal: weight_gain | healthy_maintain")
    condition: Optional[str] = Field(None, description="Current health condition: fever | cold | diarrhea")
    diet_type: str = Field("veg", description="Diet type: veg | non-veg | egg-veg")
    region: str = Field("south_india", description="Geographic preference: south_india | north_india")
    allergies: List[str] = Field(default_factory=list, description="List of allergy tags: ['egg_protein', 'peanut']")

class ChatQuery(BaseModel):
    query: str = Field(..., description="User's query")
    history: List[Dict[str, str]] = Field(default_factory=list, description="Conversation history")
    profile: Optional[UserProfile] = Field(None, description="Associated child profile")

class DietPlanRequest(BaseModel):
    profile: UserProfile = Field(..., description="Child profile for the diet plan")
    query: str = Field("", description="Additional instructions/query from parent")

class MealItem(BaseModel):
    name: str
    portion: str

class MealAnalysisRequest(BaseModel):
    age: int
    gender: str = "neutral"
    meals: List[MealItem]

class AskRequest(BaseModel):
    question: str
    history: List[Dict[str, str]] = []
    age: str = "5 years"
    weight: str = "18kg"
    conditions: str = "None"
    prescription: str = "None"
    audience: Optional[str] = None  # "kid" triggers kids mode
    equippedCompanion: Optional[str] = "Captain Milk"

# --- Parsing Helpers ---

def parse_int_from_string(val: str, default: int = 5) -> int:
    try:
        nums = re.findall(r'\d+', val)
        if nums:
            return int(nums[0])
    except:
        pass
    return default

def parse_float_from_string(val: str, default: float = 18.0) -> float:
    try:
        nums = re.findall(r'\d+\.?\d*', val)
        if nums:
            return float(nums[0])
    except:
        pass
    return default

def parse_conditions_and_allergies(cond_str: str) -> tuple:
    if not cond_str or cond_str.lower() in ["none", "null", "undefined"]:
        return None, []
        
    parts = [p.strip().lower() for p in cond_str.split(",")]
    known_conditions = ["fever", "cold", "diarrhea", "constipation"]
    active_condition = None
    allergies = []
    
    for part in parts:
        if part in known_conditions:
            active_condition = part
        else:
            allergies.append(part)
            
    return active_condition, allergies

# --- Endpoints ---

@router.post("/ask", response_model=ChatResponse)
async def ask_endpoint(payload: AskRequest):
    """
    Main unified endpoint supporting Parents Mode and Kids Mode.
    """
    parsed_age = parse_int_from_string(payload.age)
    parsed_weight = parse_float_from_string(payload.weight)
    parsed_condition, parsed_allergies = parse_conditions_and_allergies(payload.conditions)
    
    goal = "healthy_maintain"
    if "gain" in payload.question.lower() or "underweight" in payload.question.lower():
        goal = "weight_gain"
    elif "lose" in payload.question.lower() or "overweight" in payload.question.lower():
        goal = "weight_loss"
        
    profile = {
        "age": parsed_age,
        "weight": parsed_weight,
        "goal": goal,
        "condition": parsed_condition,
        "diet_type": "veg",
        "region": "south_india",
        "allergies": parsed_allergies,
        "equippedCompanion": payload.equippedCompanion or "Captain Milk"
    }
    
    is_kids = payload.audience == "kid"
    
    response = await orchestrator.handle_request(
        query=payload.question,
        profile=profile,
        history=payload.history,
        is_kids_mode=is_kids
    )
    return response

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(payload: ChatQuery):
    """
    Standard HTTP chat gateway.
    """
    profile_dict = payload.profile.dict() if payload.profile else {
        "age": 5, "weight": 18.0, "goal": "healthy_maintain", "condition": None, "diet_type": "veg", "region": "south_india", "allergies": []
    }
    
    response = await orchestrator.handle_request(
        query=payload.query,
        profile=profile_dict,
        history=payload.history,
        is_kids_mode=False
    )
    return response

@router.post("/generate-diet", response_model=Dict[str, Any])
async def generate_diet_endpoint(payload: DietPlanRequest):
    """
    Generates structured meal plan paired with LLM-orchestrated phrasing.
    """
    # Force call orchestrator to get rephrased and validated outputs
    profile_dict = payload.profile.dict()
    query = payload.query or f"Generate a diet plan for my {profile_dict.get('age')}-year-old child"
    
    response = await orchestrator.handle_request(
        query=query,
        profile=profile_dict,
        is_kids_mode=False
    )
    
    # Run the planner locally just to extract the raw plan keys for response backward compatibility
    from app.planner.engine import generate_personalized_diet_plan
    plan_out = generate_personalized_diet_plan(profile_dict, query)
    
    return {
        "diet_plan": plan_out.get("diet_plan"),
        "nutritional_validation": plan_out.get("nutritional_validation"),
        "rephrased_by_llm": response.answer
    }

@router.post("/analyze-meal", response_model=Dict[str, Any])
async def analyze_meal_endpoint(payload: MealAnalysisRequest):
    """
    Analyzes child meal intakes and runs orchestrated recommendations.
    """
    # 1. Math totals
    all_foods = get_all_foods()
    total_cal = 0.0
    total_prot = 0.0
    
    meal_names = [m.name.lower() for m in payload.meals]
    matched_foods = []
    
    for food in all_foods:
        f_name = food.get("food_name", "").lower()
        for m_name in meal_names:
            if f_name in m_name or m_name in f_name:
                matched_foods.append(food)
                break
                
    for f in matched_foods:
        c = f.get("portion_energy_kcal") or f.get("energy_kcal_per_100g") or 100.0
        p = f.get("portion_protein_g") or f.get("protein_g") or 3.0
        try:
            total_cal += float(c)
            total_prot += float(p)
        except:
            pass
            
    # Targets based on age
    targets = {
        1: {"cal": 1000, "prot": 15},
        2: {"cal": 1000, "prot": 15},
        3: {"cal": 1000, "prot": 15},
        4: {"cal": 1300, "prot": 20},
        5: {"cal": 1300, "prot": 20},
        6: {"cal": 1300, "prot": 20},
        7: {"cal": 1600, "prot": 30},
        8: {"cal": 1600, "prot": 30},
        9: {"cal": 1600, "prot": 30},
    }
    
    age_target = targets.get(payload.age, {"cal": 1600, "prot": 30})
    gaps = []
    recommendations = []
    
    if total_cal < age_target["cal"] * 0.8:
        gaps.append(f"Energy intake is below target for age ({round(total_cal, 1)} / {age_target['cal']} kcal).")
        recommendations.append("Incorporate healthy energy-dense snacks such as ragi porridge or ragi malt.")
    if total_prot < age_target["prot"] * 0.8:
        gaps.append(f"Protein intake is below optimal level ({round(total_prot, 1)} / {age_target['prot']} g).")
        recommendations.append("Consider adding steamed pulses or a boiled egg to their daily plan.")
        
    if not gaps:
        gaps.append("Nutrition levels are perfectly on track!")
        recommendations.append("Excellent meal balance! Continue serving diverse food groups daily.")
        
    # Rephrase recommendation via orchestrator
    query = f"The child ate: {', '.join(meal_names)}. Gaps: {'; '.join(gaps)}. Rephrase advice and encourage healthy choices."
    profile = {
        "age": payload.age,
        "weight": 18.0,
        "goal": "healthy_maintain",
        "condition": None,
        "diet_type": "veg",
        "region": "south_india",
        "allergies": []
    }
    
    orchestrated_res = await orchestrator.handle_request(
        query=query,
        profile=profile,
        is_kids_mode=False
    )
    
    return {
        "daily_totals": {
            "calories": round(total_cal, 1),
            "protein": round(total_prot, 1),
            "carbs": round(total_cal * 0.55 / 4.0, 1),
            "fat": round(total_cal * 0.25 / 9.0, 1)
        },
        "gaps_detected": gaps,
        "recommendations": [orchestrated_res.answer]
    }

# --- Debugging & Diagnostics Schemas ---

class DebugRetrieveRequest(BaseModel):
    query: str = Field(..., description="Query to perform RAG retrieval for")

class DebugRetrieveResponse(BaseModel):
    query: str
    retrieved_chunks: List[str]
    scores: List[float]
    sources: List[str]

@router.post("/debug/retrieve", response_model=DebugRetrieveResponse)
async def debug_retrieve_endpoint(payload: DebugRetrieveRequest):
    """
    Diagnostic endpoint to inspect RAG retrieval behavior, raw chunks, scores, and source attribution.
    """
    try:
        from app.rag.hybrid_retriever import get_hybrid_retriever
        retriever = get_hybrid_retriever()
        docs = retriever.query(payload.query, top_k=8)
        
        chunks = []
        scores = []
        sources = []
        
        for doc in docs:
            chunks.append(doc.get("text", ""))
            scores.append(doc.get("rerank_confidence", 0.0))
            meta = doc.get("metadata", {})
            sources.append(meta.get("source") or "ICMR Pediatric Nutrition Guidelines")
            
        return {
            "query": payload.query,
            "retrieved_chunks": chunks,
            "scores": scores,
            "sources": sources
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Retrieval trace failure: {str(e)}"
        )

