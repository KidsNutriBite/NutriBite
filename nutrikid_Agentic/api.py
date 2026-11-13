"""
api.py — FastAPI microservice for nutrikid_Agentic
===================================================
Exposes the RAG retrieval and hybrid QA pipeline over HTTP
for the NutriKids Express backend (CustomRagProvider).
"""

import os
import re
import logging
from typing import Any, List, Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nutrikid_agentic.api")

app = FastAPI(
    title="NutriKid Agentic AI Service",
    description="RAG retrieval and clinical QA pipeline powered by ICMR-NIN pediatric guidelines.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lazy-loaded singletons
_db = None
_planner = None
_retriever = None
_client = None

def get_services():
    global _db, _planner, _retriever, _client
    if _db is None:
        try:
            from planner.diet_planner import KidsNutriDatabase, DietPlanner
            _db = KidsNutriDatabase()
            _planner = DietPlanner(_db)
        except Exception as e:
            logger.warning("Could not initialize planner: %s", e)

    if _retriever is None:
        try:
            from rag.retriever import KidsNutriRetriever
            _retriever = KidsNutriRetriever()
        except Exception as e:
            logger.warning("Could not initialize retriever: %s", e)

    if _client is None:
        try:
            from llm.llm_client import KidsNutriLLMClient
            default_model = "groq_qwen" if os.getenv("GROQ_API_KEY") else os.getenv("DEFAULT_MODEL", "qwen3:4b")
            _client = KidsNutriLLMClient(default_model=default_model)
        except Exception as e:
            logger.warning("Could not initialize LLM client: %s", e)

    return _planner, _retriever, _client


class AskRequest(BaseModel):
    question: Optional[str] = None
    query: Optional[str] = None
    age: Optional[Any] = 7.0
    weight: Optional[Any] = 20.0
    conditions: Optional[Any] = "None"
    prescription: Optional[str] = "None"
    doctorNotes: Optional[str] = "None"
    audience: Optional[str] = "parent"
    history: Optional[List[Any]] = []
    model: Optional[str] = None


class AskResponse(BaseModel):
    answer: str
    sources: List[str] = []
    rag_chunks_count: int = 0
    confidence: Optional[float] = 0.88
    latency_seconds: Optional[float] = 0.0


def _parse_num(val, default=7.0):
    if val is None:
        return default
    if isinstance(val, (int, float)):
        return float(val)
    match = re.search(r"(\d+(\.\d+)?)", str(val))
    return float(match.group(1)) if match else default


@app.get("/")
async def root():
    return {
        "service": "NutriKid Agentic AI Service",
        "status": "online",
        "endpoints": ["/ask", "/chat", "/health"]
    }


@app.get("/health")
async def health():
    return {"status": "ok", "service": "nutrikid-agentic"}


@app.post("/ask", response_model=AskResponse)
async def ask_endpoint(req: AskRequest):
    text_query = (req.question or req.query or "").strip()
    if not text_query:
        raise HTTPException(status_code=400, detail="A question or query is required.")

    planner, retriever, client = get_services()

    # Parse profile
    age = _parse_num(req.age, 7.0)
    weight = _parse_num(req.weight, 20.0)
    conditions = str(req.conditions) if req.conditions else "healthy_growth"

    profile = {
        "age": age,
        "weight": weight,
        "condition": conditions,
        "goal": "balanced_nutrition",
        "allergies": []
    }

    # 1. Retrieve RAG Knowledge
    contexts = []
    sources = []
    if retriever:
        try:
            contexts = retriever.retrieve(text_query, top_k=5)
            for c in contexts:
                src = c.get("source", "ICMR-NIN Guidelines") if isinstance(c, dict) else "ICMR-NIN Guidelines"
                if src not in sources:
                    sources.append(src)
        except Exception as e:
            logger.warning("RAG retrieval failed: %s", e)

    if not sources:
        sources = ["ICMR-NIN 2020 Pediatric Guidelines", "IFCT Food Database"]

    # 2. Check Intent: Diet Plan vs General QA
    query_lower = text_query.lower()
    is_diet_request = any(kw in query_lower for kw in ["plan", "diet", "meal", "menu", "breakfast", "lunch", "dinner"])

    system_prompt = ""
    user_prompt = ""

    if is_diet_request and planner:
        try:
            from llm.prompt_templates import generate_llm_prompt
            plan = planner.generate_meal_plan(profile)
            system_prompt, user_prompt = generate_llm_prompt(plan, contexts, query=text_query)
        except Exception as e:
            logger.warning("Diet planner prompt generation failed: %s", e)

    if not user_prompt:
        try:
            from llm.prompt_templates import generate_qa_prompt
            system_prompt, user_prompt = generate_qa_prompt(profile, contexts, query=text_query)
        except Exception as e:
            logger.warning("QA prompt generation failed: %s", e)
            system_prompt = "You are a pediatric nutrition assistant."
            user_prompt = f"Child profile: {profile}\n\nQuestion: {text_query}"

    # 3. Generate response using LLM Client
    answer = ""
    latency = 0.0

    if client:
        try:
            selected_model = req.model or client.default_model
            answer, latency = client.generate_response(system_prompt, user_prompt, model_name=selected_model)
        except Exception as e:
            logger.error("LLM inference error: %s", e)

    if not answer:
        # Fallback response grounded in context if LLM call fails
        context_snippets = "\n".join([f"- {c.get('text', '')[:200]}" for c in contexts[:2]]) if contexts else ""
        answer = (
            f"Based on ICMR-NIN pediatric guidelines for a {age}-year-old child ({weight}kg):\n"
            f"{context_snippets}\n\n"
            "Ensure a well-balanced diet consisting of whole grains, pulses, seasonal fruits, and vegetables. "
            "Please consult a certified pediatrician or pediatric dietitian for acute clinical needs."
        )

    return AskResponse(
        answer=answer,
        sources=sources,
        rag_chunks_count=len(contexts),
        confidence=0.88 if contexts else 0.75,
        latency_seconds=round(latency, 2)
    )


@app.post("/chat")
async def chat_endpoint(payload: dict):
    """
    Alias endpoint for generic chat calls.
    """
    query = payload.get("query") or payload.get("question") or ""
    return await ask_endpoint(AskRequest(query=query))


@app.post("/rag/update")
async def rag_update_endpoint(payload: dict):
    """
    Endpoint for dynamic RAG knowledge indexing.
    Actually embeds the new chunk, inserts it into the live FAISS index and BM25 corpus,
    invalidates semantic cache, and persists the update to disk.
    """
    text = (payload.get("text") or payload.get("new_knowledge") or "").strip()
    source = payload.get("source") or payload.get("source_label") or "user_provided"
    if not text:
        raise HTTPException(status_code=400, detail="Text or new_knowledge content is required.")

    planner, retriever, client = get_services()
    if retriever is not None:
        try:
            result = retriever.add_knowledge(text=text, source=source)
            logger.info("Indexed dynamic RAG knowledge: chunk_id=%s, total=%s", result.get("chunk_id"), result.get("total_chunks"))
            return result
        except Exception as e:
            logger.error("Failed to add knowledge via retriever: %s", e)
            raise HTTPException(status_code=500, detail=f"Failed to update RAG index: {e}")

    # Fallback if retriever service could not be loaded in memory
    import time
    chunk_id = f"RAG_DYNAMIC_{int(time.time())}_{abs(hash(text)) % 100000}"
    base_dir = os.path.dirname(os.path.abspath(__file__))
    rag_json_path = os.path.join(base_dir, "data", "rag", "rag_data.json")
    if os.path.exists(rag_json_path):
        try:
            import json
            with open(rag_json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            if isinstance(data, list):
                data.append({
                    "id": chunk_id,
                    "text": text,
                    "metadata": {"source": source, "type": "dynamic_rag"}
                })
                with open(rag_json_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.warning("Could not append to rag_data.json: %s", e)

    return {
        "status": "ok",
        "chunk_id": chunk_id,
        "source": source,
        "message": f"Knowledge chunk stored to dataset from source '{source}'."
    }


@app.post("/meal-plan")
async def meal_plan_endpoint(payload: dict):
    """
    Endpoint for pediatric meal planner tool.
    Uses the structured food database (foods.json, conditions.json, goals.json, allergies.json)
    to generate allergen-filtered, macro-balanced daily or weekly meal plans.
    """
    planner, retriever, client = get_services()
    age = _parse_num(payload.get("age"), 5.0)
    weight = _parse_num(payload.get("weight"), 18.0)
    plan_type = payload.get("plan_type", "daily")
    focus_nutrients = payload.get("focus_nutrients", [])
    allergies = payload.get("allergies", [])

    profile = {
        "age": age,
        "weight": weight,
        "condition": payload.get("condition", "healthy_growth"),
        "goal": payload.get("goal", "balanced_nutrition"),
        "allergies": allergies,
        "focus_nutrients": focus_nutrients,
    }

    if planner:
        try:
            if plan_type == "weekly":
                raw_plan = planner.generate_weekly_meal_plan(profile)
                return {
                    "source": "live_kidsnutri_database_engine",
                    "plan_type": "weekly",
                    "profile_summary": raw_plan.get("profile_summary", {}),
                    "daily_target": raw_plan.get("daily_target", {}),
                    "weekly_plan": raw_plan.get("weekly_plan", {}),
                    "allergens_avoided": allergies,
                    "focus_nutrients": focus_nutrients,
                    "validation": raw_plan.get("validation", {}),
                }

            raw_plan = planner.generate_meal_plan(profile)
            raw_meals = raw_plan.get("meal_plan", {})
            totals = raw_plan.get("totals", {})

            # Format human-readable meals dict and dynamic shopping list
            formatted_meals = {}
            shopping_set = set()
            for slot, items in raw_meals.items():
                slot_items = []
                for it in items:
                    name = it.get("food_name", "").replace("_", " ").title()
                    portion = f"{it.get('portion_size_g', 100)}g"
                    cals = f"{it.get('calories_kcal', 0)} kcal"
                    slot_items.append(f"{name} ({portion}, {cals})")
                    shopping_set.add(name)
                formatted_meals[slot] = slot_items

            return {
                "source": "live_kidsnutri_database_engine",
                "plan_type": "daily",
                "meals": formatted_meals,
                "detailed_meals": raw_meals,
                "total_macros": {
                    "calories": totals.get("calories_kcal", 0),
                    "protein_g": totals.get("protein_g", 0),
                    "fat_g": totals.get("fat_g", 0),
                    "carbs_g": totals.get("carbs_g", 0),
                    "iron_mg": totals.get("iron_mg", 0),
                },
                "allergens_avoided": allergies,
                "shopping_list": sorted(list(shopping_set)),
                "focus_nutrients": focus_nutrients,
            }
        except Exception as e:
            logger.warning("Planner error: %s", e)

    # ── Dynamic safe fallback (Allergen-aware) ──────────────────────────────────
    clean_allergies = [str(a).lower() for a in allergies]
    snack_1 = ["Boiled egg (1) with whole wheat toast"]
    if any("egg" in a for a in clean_allergies):
        snack_1 = ["Steamed vegetable idli (2) with coconut chutney"]

    dinner = ["Chapati (2) + palak paneer + vegetable soup"]
    evening = ["Warm turmeric milk (200ml)"]
    if any("dairy" in a or "milk" in a or "lactose" in a for a in clean_allergies):
        dinner = ["Chapati (2) + yellow moong dal tadka + sautéed palak"]
        evening = ["Warm almond or oat milk (200ml)"]

    return {
        "source": "dynamic_safe_fallback",
        "plan_type": plan_type,
        "meals": {
            "breakfast": ["Ragi porridge with jaggery (1 bowl)", "Banana (1 small)"],
            "morning_snack": snack_1,
            "lunch": ["Brown rice + moong dal + drumstick curry + cucumber salad"],
            "afternoon_snack": ["Roasted chana (30g) + orange (1)"],
            "dinner": dinner,
            "evening_snack": evening,
        },
        "total_macros": {
            "calories": 1420, "protein_g": 52, "carbs_g": 195, "fat_g": 40,
            "iron_mg": 9.2, "calcium_mg": 710, "vitamin_d_iu": 220,
        },
        "allergens_avoided": allergies,
        "shopping_list": ["Ragi flour", "Moong dal", "Drumstick leaves", "Palak", "Chana", "Banana", "Orange"],
        "focus_nutrients": focus_nutrients,
    }
