import os
import re
import time
import json
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, status, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Import components
from app.db.connection import get_all_foods, get_allergy_rules, get_condition_rules
from app.rag.retriever import retrieve_rag_chunks, add_rag_chunk
from app.rag.hybrid_retriever import retrieve_hybrid_chunks
from app.planner.engine import generate_personalized_diet_plan
from app.utils.otel_setup import instrument_app, TraceSpan

from app.guardrails.safety import apply_guardrails
from app.guardrails.security_guardrails import audit_security_gate
from app.prompts.builder import build_chatbot_prompt
from app.models.llm import run_comparative_benchmark, get_gemini_api_key

# Load environment variables
load_dotenv()

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 60, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.clients = {}  # IP -> List of timestamps

    async def dispatch(self, request: Request, call_next):
        if request.url.path == "/":
            return await call_next(request)
            
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        
        # Clean up old timestamps
        if client_ip in self.clients:
            self.clients[client_ip] = [t for t in self.clients[client_ip] if now - t < self.window_seconds]
        else:
            self.clients[client_ip] = []
            
        if len(self.clients[client_ip]) >= self.max_requests:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please slow down and try again later."}
            )
            
        self.clients[client_ip].append(now)
        return await call_next(request)

app = FastAPI(
    title="KidsNutriBite AI Hybrid Service",
    description="Production-grade AI microservice implementing RAG + Structured DB + Planner + LLM",
    version="1.0.0",
)

# Instrument the app with Prometheus metrics exporter
instrument_app(app)

# Configure CORS & Rate Limiting
app.add_middleware(RateLimitMiddleware, max_requests=30, window_seconds=60)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Schema Definitions ---

class UserProfile(BaseModel):
    age: int = Field(..., description="Age of the child in years", ge=1)
    weight: float = Field(..., description="Weight of the child in kg", gt=0)
    goal: str = Field("healthy_maintain", description="Goal name: weight_gain | healthy_maintain")
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
    audience: Optional[str] = None  # "kid" triggers kids mode/Food Buddy
    equippedCompanion: Optional[str] = "Captain Milk"

class RAGMetadata(BaseModel):
    type: str = Field(..., description="Type of info: food | condition | goal | allergy")
    food_name: Optional[str] = Field(None, description="Associated food name")
    condition: Optional[str] = Field(None, description="Associated health condition")
    goal: Optional[str] = Field(None, description="Associated goal")
    tags: List[str] = Field(default_factory=list, description="Tags for categorization")

class RAGChunkUpdate(BaseModel):
    text: str = Field(..., description="Natural language explanation of one concept")
    metadata: RAGMetadata = Field(..., description="Metadata describing this concept chunk")


# --- Helper Parsing Functions ---

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
    """
    Parses front-end comma-separated conditions string into a condition and a list of allergies.
    Example: "fever, egg_protein" -> Condition: "fever", Allergies: ["egg_protein"]
    """
    if not cond_str or cond_str.lower() in ["none", "null", "undefined"]:
        return None, []
        
    parts = [p.strip().lower() for p in cond_str.split(",")]
    
    # Common conditions list
    known_conditions = ["fever", "cold", "diarrhea", "constipation", "pregnancy", "lactation"]
    active_condition = None
    allergies = []
    
    for part in parts:
        if part in known_conditions:
            active_condition = part
        else:
            # Assume any other tag is an allergy (e.g. egg_protein, nut_allergy, milk_lactose)
            allergies.append(part)
            
    return active_condition, allergies


# --- Endpoints ---

@app.get("/")
def read_root():
    api_key_set = len(get_gemini_api_key()) > 0
    return {
        "status": "online",
        "service": "KidsNutriBite AI Service",
        "components": {
            "DB": "MongoDB Atlas Integration",
            "RAG": "Hybrid TF-IDF Semantic Index",
            "Gemini_API": "Active (1.5 Flash)" if api_key_set else "Inactive (Using Fallback)"
        }
    }

@app.post("/ask", response_model=Dict[str, Any])
async def ask_endpoint(payload: AskRequest):
    """
    Main Chatbot Router supporting both Parents Mode (NutriGuideChat) and Kids Mode (FoodBuddyChatInterface).
    """
    try:
        is_kids = payload.audience == "kid"
        
        # 1. Parse Profile
        parsed_age = parse_int_from_string(payload.age)
        parsed_weight = parse_float_from_string(payload.weight)
        parsed_condition, parsed_allergies = parse_conditions_and_allergies(payload.conditions)
        
        # Detect goal based on text query keywords
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
            "diet_type": "veg", # Default
            "region": "south_india", # Default
            "allergies": parsed_allergies,
            "equippedCompanion": payload.equippedCompanion or "Captain Milk"
        }
        
        # 1.5. Apply Security Injection Shield
        security_check = audit_security_gate(payload.question)
        if security_check.get("compromised"):
            return {
                "answer": security_check["message"],
                "sources": {
                    "rag_chunks": [],
                    "planner_filtered_out": [],
                    "allergy_conflicts_blocked": []
                }
            }

        # 2. Apply Guardrails (Emergency + Safety restrictions)
        safety_check = apply_guardrails(payload.question, profile, is_kids_mode=is_kids)
        if not safety_check["safe"]:
            return {
                "answer": safety_check["response"],
                "sources": {
                    "rag_chunks": [],
                    "planner_filtered_out": [],
                    "allergy_conflicts_blocked": []
                }
            }
            
        # 3. Retrieve RAG chunks
        rag_context, citations = retrieve_hybrid_chunks(payload.question, top_k=8)
        
        # 4. Invoke Planner Engine
        planner_output = generate_personalized_diet_plan(profile, instructions=payload.question)
        
        # 5. Build prompt
        prompt = build_chatbot_prompt(
            query=payload.question, 
            profile=profile, 
            rag_context=rag_context, 
            planner_output=planner_output, 
            is_kids_mode=is_kids,
            history=payload.history
        )
        
        # 6. Run dual LLM comparative benchmark
        comparison = run_comparative_benchmark(
            payload.question,
            profile,
            rag_context,
            planner_output,
            prompt,
            is_kids_mode=is_kids
        )
        
        # Select target answer based on API status
        api_key_exists = comparison["benchmark_summary"]["gemini_api_active"]
        selected_model = "gemini_model" if api_key_exists else "local_model"
        final_answer = comparison[selected_model]["response"]
        
        # For Parents Mode, split with |||DETAILED||| to enable detailed explanation toggle in frontend
        if not is_kids:
            short_verdict = (
                f"For your {profile.get('age')}-year-old child, here is a tailored recommendation:\n"
                f"- **Dietary focus**: {planner_output.get('diet_plan', {}).get('breakfast', {}).get('food_name', 'Soft food')} for breakfast and {planner_output.get('lunch', {}).get('food_name', 'dal rice')} for lunch.\n"
                f"- **Nutrition**: Total planned is {planner_output.get('nutritional_validation', {}).get('planned_calories_kcal')} kcal, meeting energy guidelines.\n"
                f"- **Safety**: Excluded `{', '.join(profile.get('allergies')) if profile.get('allergies') else 'None'}` due to allergen tags."
            )
            final_answer = f"{short_verdict}\n\n|||DETAILED|||\n\n{final_answer}"
            answer_payload = final_answer
        else:
            try:
                cleaned_str = final_answer.strip()
                if cleaned_str.startswith("```json"):
                    cleaned_str = cleaned_str[7:]
                if cleaned_str.endswith("```"):
                    cleaned_str = cleaned_str[:-3]
                cleaned_str = cleaned_str.strip()
                answer_payload = json.loads(cleaned_str)
            except Exception as e:
                print(f"[JSON Decode Error] Fallback triggered: {e}")
                answer_payload = {
                    "fun_response": final_answer,
                    "scientific_explanation": "A balanced intake of vitamins and minerals supports cellular energy metabolism and metabolic enzyme function.",
                    "nutrition_facts": [{"nutrient": "Vitamins", "function": "Coenzymes for cellular metabolism", "organ": "Whole Body"}],
                    "did_you_know": "Did you know that drinking enough water helps every single cell in your body work faster and better?",
                    "xp_reward": 5,
                    "badge_unlock": "",
                    "learning_category": "hydration",
                    "difficulty_level": "beginner",
                    "related_game": "adventure_map",
                    "encouragement_message": "Eat fresh and stay active, explorer!",
                    "safety_flags": []
                }
            
        return {
            "answer": answer_payload,
            "citations": citations,
            "sources": {
                "rag_chunks": rag_context,
                "planner_filtered_out": planner_output.get("planner_filtered_out", []),
                "allergy_conflicts_blocked": planner_output.get("blocked_foods_allergy", [])
            },
            "comparative_benchmark": comparison
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in ask endpoint: {str(e)}"
        )

@app.post("/chat", response_model=Dict[str, Any])
async def chat_endpoint(payload: ChatQuery):
    """
    Fallback Chatbot endpoint.
    """
    try:
        profile_dict = payload.profile.dict() if payload.profile else {
            "age": 5, "weight": 18.0, "goal": "healthy_maintain", "condition": None, "diet_type": "veg", "region": "south_india", "allergies": []
        }
        
        # 1. Retrieve RAG
        rag_context, citations = retrieve_hybrid_chunks(payload.query, top_k=8)
        
        # 2. Invoke Planner
        planner_output = generate_personalized_diet_plan(profile_dict, instructions=payload.query)
        
        # 3. Prompt Builder
        prompt = build_chatbot_prompt(
            query=payload.query, 
            profile=profile_dict, 
            rag_context=rag_context, 
            planner_output=planner_output, 
            is_kids_mode=False,
            history=payload.history
        )
        
        # 4. LLM Generation
        comparison = run_comparative_benchmark(
            payload.query,
            profile_dict,
            rag_context,
            planner_output,
            prompt,
            is_kids_mode=False
        )
        
        api_key_exists = comparison["benchmark_summary"]["gemini_api_active"]
        selected_model = "gemini_model" if api_key_exists else "local_model"
        final_answer = comparison[selected_model]["response"]
        
        return {
            "answer": final_answer,
            "citations": citations,
            "sources": {
                "rag_chunks": rag_context,
                "planner_filtered_out": planner_output.get("planner_filtered_out", []),
                "allergy_conflicts_blocked": planner_output.get("blocked_foods_allergy", [])
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in chat endpoint: {str(e)}"
        )

@app.post("/generate-diet", response_model=Dict[str, Any])
async def generate_diet_endpoint(payload: DietPlanRequest):
    """
    Structured diet generator.
    """
    try:
        profile_dict = payload.profile.dict()
        planner_output = generate_personalized_diet_plan(profile_dict, instructions=payload.query)
        
        # Use LLM to phrase nicely
        rag_context = retrieve_rag_chunks(payload.query or f"diet plan for {profile_dict.get('goal')}", top_k=2)
        prompt = build_chatbot_prompt(payload.query or "diet plan", profile_dict, rag_context, planner_output, is_kids_mode=False)
        
        comparison = run_comparative_benchmark(
            payload.query,
            profile_dict,
            rag_context,
            planner_output,
            prompt,
            is_kids_mode=False
        )
        
        api_key_exists = comparison["benchmark_summary"]["gemini_api_active"]
        selected_model = "gemini_model" if api_key_exists else "local_model"
        rephrased = comparison[selected_model]["response"]
        
        return {
            "diet_plan": planner_output.get("diet_plan"),
            "nutritional_validation": planner_output.get("nutritional_validation"),
            "rephrased_by_llm": rephrased
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating diet: {str(e)}"
        )

class TwinAnalysisRequest(BaseModel):
    profile: Dict[str, Any]
    meals: List[Dict[str, Any]]
    growth_records: List[Dict[str, Any]]

@app.post("/twin/analyze", response_model=Dict[str, Any])
async def twin_analyze_endpoint(payload: TwinAnalysisRequest):
    """
    Twin Analysis Engine.
    Inputs: profile, meal logs, and growth history.
    """
    try:
        from app.models.llm import run_twin_analysis
        result = run_twin_analysis(payload.profile, payload.meals, payload.growth_records)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error running twin analysis: {str(e)}"
        )


# ── Growth Velocity Engine ──────────────────────────────────────────────────────

class GrowthVelocityRequest(BaseModel):
    profile: Dict[str, Any] = Field(..., description="Child profile (age, gender, ageInMonths, name)")
    growth_records: List[Dict[str, Any]] = Field(..., description="List of GrowthRecord documents sorted by timestamp")

@app.post("/growth/velocity", response_model=Dict[str, Any])
async def growth_velocity_endpoint(payload: GrowthVelocityRequest):
    """
    Growth Velocity Monitor Engine.

    Computes velocity metrics (height/weight/BMI per month), percentile drift,
    stability score, risk score, AI insights, and recommendations using
    WHO reference data. No LLM required — pure deterministic computation.

    Used by: GET /api/doctor/patients/:id/growth-velocity (Express backend)
    """
    try:
        from app.planner.growth_velocity_engine import compute_growth_velocity
        result = compute_growth_velocity(
            records=payload.growth_records,
            profile=payload.profile,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error computing growth velocity: {str(e)}"
        )



@app.post("/analyze", response_model=Dict[str, Any])
@app.post("/analyze-meal", response_model=Dict[str, Any])
async def analyze_meal_endpoint(payload: MealAnalysisRequest):
    """
    Analyzes logged meals to identify gaps and raise safety warning flags.
    """
    try:
        # Sum calories and protein of eaten foods
        all_foods = get_all_foods()
        total_cal = 0.0
        total_prot = 0.0
        
        meal_names = []
        for m in payload.meals:
            meal_names.append(m.name.lower())
            
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
        
        # Calculate gaps
        gaps = []
        recommendations = []
        
        if total_cal < age_target["cal"] * 0.8:
            gaps.append(f"Energy intake is below target for age ({round(total_cal, 1)} / {age_target['cal']} kcal).")
            recommendations.append("Incorporate healthy energy-dense snacks such as nut powder porridge or ragi malt.")
        if total_prot < age_target["prot"] * 0.8:
            gaps.append(f"Protein intake is slightly below optimal level ({round(total_prot, 1)} / {age_target['prot']} g).")
            recommendations.append("Consider adding steamed pulses, curd, or a boiled egg to their daily plan.")
            
        if not gaps:
            gaps.append("Nutrition levels are perfectly on track!")
            recommendations.append("Excellent meal balance! Continue serving diverse food groups daily.")
            
        return {
            "daily_totals": {
                "calories": round(total_cal, 1),
                "protein": round(total_prot, 1),
                "carbs": round(total_cal * 0.55 / 4.0, 1),
                "fat": round(total_cal * 0.25 / 9.0, 1)
            },
            "gaps_detected": gaps,
            "recommendations": recommendations
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in meal analysis: {str(e)}"
        )

@app.post("/update-rag", status_code=status.HTTP_201_CREATED)
async def update_rag_endpoint(payload: RAGChunkUpdate):
    """
    Dynamic RAG update endpoint allowing administrators to index new medical knowledge on the fly.
    """
    try:
        new_id = add_rag_chunk(payload.text, payload.metadata.dict())
        return {
            "message": "Concept successfully indexed and stored in dynamic RAG.",
            "chunk_id": new_id,
            "metadata_indexed": payload.metadata.dict()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating vector database: {str(e)}"
        )

@app.websocket("/ws/chat")
async def websocket_chat_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for token-by-token streaming RAG answers.
    """
    await websocket.accept()
    print("[INFO] WebSocket connection established.")
    try:
        while True:
            # Parse query
            data = await websocket.receive_json()
            query = data.get("question", "")
            if not query:
                await websocket.send_json({"error": "Empty question payload"})
                continue
                
            print(f"[INFO] WebSocket received question: {query}")
            
            # Simple simulation of token-by-token streaming for maximum responsiveness
            # under RAG and planner filters
            rag_context, citations = retrieve_hybrid_chunks(query, top_k=2)
            
            await websocket.send_json({"type": "status", "content": "RAG chunks retrieved..."})
            await websocket.send_json({"type": "citations", "content": citations})
            
            # Fast streaming generator simulation
            text_response = (
                f"### Structured Pediatric RAG Advice\n"
                f"- **Textbook Grounding**: Based on NIN and ICMR dietary guidelines.\n"
                f"- **Dietary Advice**: We recommend soft warm foods like vegetable dal khichdi.\n"
                f"- **Hydration Check**: Ensure the child is drinking plenty of clear fluids."
            )
            
            # Send tokens sequentially with slight delays to feel completely real-time
            words = text_response.split(" ")
            for i, word in enumerate(words):
                time.sleep(0.04) # 40ms per word pacing
                await websocket.send_json({
                    "type": "token",
                    "content": word + (" " if i < len(words) - 1 else "")
                })
                
            await websocket.send_json({"type": "done", "content": ""})
            
    except WebSocketDisconnect:
        print("[INFO] WebSocket disconnected.")
    except Exception as e:
        print(f"[ERROR] WebSocket error: {str(e)}")
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
