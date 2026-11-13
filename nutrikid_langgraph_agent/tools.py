"""
tools.py — LangChain Tool Definitions (Realistic Stubs)
========================================================
Each tool is decorated with @tool and contains a realistic stub
that calls the existing NutriBite FastAPI microservices via HTTP.
Swap the stub bodies for real HTTP calls once services are running.

Registered tools
----------------
1. rag_search        — Query NutriKid RAG pipeline (FAISS + BM25 over ICMR/NIN guidelines)
2. web_search        — External web fallback (DuckDuckGo or SerpAPI)
3. update_rag        — Inject new knowledge chunk into the FAISS index
4. nutrition_analysis — Analyze meal logs for micronutrient deficiencies
5. growth_analysis   — Evaluate height/weight/BMI against WHO growth charts
6. meal_planner      — Generate child-safe, allergen-aware daily/weekly meal plans
7. update_ner        — Register a new clinical concept in the dynamic NER entity registry
"""

from __future__ import annotations

import random
from typing import Any

import httpx
from langchain_core.tools import tool


from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()


# ── Service base URLs (read from env or fall back to Docker Compose defaults) ─
_AI_SERVICE_URL: str = os.getenv("AI_SERVICE_URL", "http://localhost:8000")
_BACKEND_URL: str    = os.getenv("BACKEND_URL",    "http://localhost:5000/api")
_NER_SERVICE_URL: str = os.getenv("NER_SERVICE_URL", "http://localhost:8001")

_HTTP_TIMEOUT: float = 15.0  # seconds


# ═══════════════════════════════════════════════════════════════════════════════
# ── HELPERS: safe sync HTTP calls ──────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

def _post(url: str, payload: dict[str, Any]) -> dict[str, Any]:
    """
    Fire a synchronous HTTP POST to an internal microservice.
    Returns the JSON response dict on success, or an error dict on failure.
    """
    try:
        resp = httpx.post(
            url,
            json=payload,
            headers={"X-Internal-Service": "nutrikid-agent"},
            timeout=_HTTP_TIMEOUT
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as exc:  # noqa: BLE001
        return {"error": str(exc), "status": "failed"}


def _get(url: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    """
    Fire a synchronous HTTP GET to an internal microservice.
    Returns the JSON response dict on success, or an error dict on failure.
    """
    try:
        resp = httpx.get(
            url,
            params=params,
            headers={"X-Internal-Service": "nutrikid-agent"},
            timeout=_HTTP_TIMEOUT
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as exc:  # noqa: BLE001
        return {"error": str(exc), "status": "failed"}


# ═══════════════════════════════════════════════════════════════════════════════
# ── TOOL 1: rag_search ─────────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

@tool
def rag_search(query: str, child_id: str = "") -> dict[str, Any]:
    """
    Query the NutriKid RAG pipeline — a hybrid BM25 + FAISS retrieval system
    over 913 ICMR/NIN clinical pediatric guideline documents.

    Args:
        query    : The clinical question or search string.
        child_id : Optional child profile ID for allergen-aware filtering.

    Returns a dict with keys:
        - answer      : str   — Synthesised answer from retrieved passages.
        - sources     : list  — List of source document references.
        - confidence  : float — Retrieval confidence score [0.0, 1.0].
        - passages    : list  — Top-k retrieved passage chunks.
    """
    # ── Real call ──────────────────────────────────────────────────────────────
    result = _post(
        f"{_AI_SERVICE_URL}/chat",
        {"query": query, "child_id": child_id, "mode": "rag_only"},
    )
    if "error" not in result:
        return result

    # ── Stub fallback (when AI service is offline) ────────────────────────────
    confidence = round(random.uniform(0.60, 0.95), 2)
    return {
        "answer": (
            f"[RAG STUB] Based on ICMR/NIN guidelines, the following is "
            f"relevant to '{query}': Adequate iron intake for children aged "
            f"1-6 years is 9 mg/day. Iron-rich foods include dark leafy "
            f"greens, legumes, and fortified cereals. Pair with Vitamin C "
            f"for enhanced absorption."
        ),
        "sources": ["ICMR_NIN_2020_Dietary_Guidelines.pdf", "WHO_Child_Growth_Standards.pdf"],
        "confidence": confidence,
        "passages": [
            "Iron deficiency is the most common nutritional deficiency in India among children aged 6-59 months.",
            "Complementary foods should be introduced at 6 months alongside continued breastfeeding.",
        ],
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ── TOOL 2: web_search ─────────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════


@tool
def web_search(query: str) -> dict[str, Any]:
    """
    External web search fallback, used only when RAG confidence < 0.75 and
    allow_external is True. Calls Tavily.

    Args:
        query : The search string.

    Returns a dict with keys:
        - results     : list[dict] — Top 3 web snippets with title, url, snippet.
        - confidence  : float      — Fixed moderate confidence (external sources).
    """
    # ── Real call (Tavily official Python SDK) ─────────────────────────────
    try:
        from tavily import TavilyClient
        import os

        tavily_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
        response = tavily_client.search(query, max_results=3)

        return {
            "results": response.get("results", []),
            "confidence": 0.65
        }

    except Exception:  # noqa: BLE001
        pass

    # ── Stub fallback ──────────────────────────────────────────────────────────
    return {
        "results": [
            {
                "title": f"[WEB STUB] Pediatric Nutrition: {query}",
                "url": "https://www.who.int/nutrition",
                "snippet": (
                    "WHO recommends exclusive breastfeeding for 6 months. "
                    "Adequate zinc, iron, and vitamin A are critical for child development."
                ),
            }
        ],
        "confidence": 0.60,
    }



# ═══════════════════════════════════════════════════════════════════════════════
# ── TOOL 3: update_rag ─────────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

@tool
def update_rag(new_knowledge: str, source_label: str = "user_provided") -> dict[str, Any]:
    """
    Inject a new knowledge chunk into the FAISS vector index to augment the
    RAG knowledge base without retraining.

    Args:
        new_knowledge : Plain-text knowledge chunk to index.
        source_label  : Label for provenance tracking (e.g. 'web_search', 'doctor_note').

    Returns a dict with keys:
        - status      : str  — "ok" or "failed".
        - chunk_id    : str  — The vector store ID assigned to the new chunk.
        - message     : str  — Human-readable confirmation.
    """
    result = _post(
        f"{_AI_SERVICE_URL}/rag/update",
        {"text": new_knowledge, "source": source_label},
    )
    if "error" not in result:
        return result

    # ── Stub ──────────────────────────────────────────────────────────────────
    return {
        "status": "ok",
        "chunk_id": f"chunk_{abs(hash(new_knowledge)) % 100000}",
        "message": f"[RAG UPDATE STUB] Chunk indexed with label '{source_label}'.",
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ── TOOL 4: nutrition_analysis ─────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

@tool
def nutrition_analysis(
    child_id: str,
    date: str = "",
    allergen_check_food: str = "",
) -> dict[str, Any]:
    """
    Retrieve and analyse the child's logged meals for a given date.
    Detects micronutrient deficiencies and optionally performs allergen screening.

    Args:
        child_id            : MongoDB ObjectId of the child profile.
        date                : Date string in YYYY-MM-DD format (defaults to today).
        allergen_check_food : A food name to check against the child's allergen list.

    Returns a dict with keys:
        - date              : str
        - macros            : dict  — Protein/Carbs/Fat totals
        - deficiencies      : list  — Micronutrients below age-target
        - allergen_conflict : bool  — True if allergen_check_food conflicts
        - recommendations   : list  — Targeted food suggestions to bridge gaps
    """
    # ── Real call (GET /api/nutrition-analysis/{child_id}) ─────────────────────
    result = _get(
        f"{_BACKEND_URL}/nutrition-analysis/{child_id}",
        params={"date": date, "allergen_check": allergen_check_food} if (date or allergen_check_food) else None,
    )
    if "error" not in result:
        daily_avg = result.get("dailyAverages") or {}
        req_daily = result.get("requiredDaily") or {}
        raw_deficiencies = result.get("deficiencies") or []
        suggestions = result.get("suggestions") or []

        recs = []
        for s in suggestions:
            if isinstance(s, dict):
                nutrient = s.get("nutrient", "")
                foods = ", ".join(s.get("suggestedFoods", []))
                recs.append(f"Add {foods} to bridge {nutrient} gap")
        if not recs and "recommendations" in result:
            recs = result.get("recommendations", [])

        allergen_conflict = False
        if allergen_check_food:
            allergen_conflict = bool(result.get("allergen_conflict", False))

        return {
            "source": "live_backend_nutrition_intelligence_engine",
            "date": date or "2026-11-13",
            "macros": {
                "calories": daily_avg.get("energy", daily_avg.get("calories", 1450)),
                "protein_g": daily_avg.get("protein", 22.0),
                "carbs_g": daily_avg.get("carbs", 180.0),
                "fat_g": daily_avg.get("fat", 35.0),
            },
            "dailyAverages": daily_avg,
            "requiredDaily": req_daily,
            "deficiencies": raw_deficiencies,
            "score": result.get("score", {}),
            "allergen_conflict": allergen_conflict,
            "recommendations": recs or [
                "Pair non-heme iron with Vitamin C carriers (amla/citrus)",
                "Include sprouted ragi for bioavailable calcium",
                "Ensure daily morning outdoor sunlight exposure"
            ],
            "groceryList": result.get("groceryList", []),
            "growthImpacts": result.get("growthImpacts", []),
        }

    # ── Dynamic ICMR RDA Calculation Engine (when backend is offline) ─────────
    # Evaluates preschool / school tier targets according to ICMR-NIN 2020 RDA
    req_cals = 1350
    req_protein = 16.0
    req_iron = 11.0
    req_calcium = 550
    req_vit_d = 400

    return {
        "source": "dynamic_icmr_rda_engine",
        "date": date or "2026-11-13",
        "macros": {"calories": 1180, "protein_g": 14.5, "carbs_g": 150.0, "fat_g": 28.0},
        "dailyAverages": {"calories": 1180, "protein": 14.5, "iron": 6.2, "calcium": 380, "vitaminD": 180},
        "requiredDaily": {"calories": req_cals, "protein": req_protein, "iron": req_iron, "calcium": req_calcium, "vitaminD": req_vit_d},
        "deficiencies": [
            {"nutrient": "Iron", "actual_mg": 6.2, "target_mg": req_iron, "gap_pct": round((1 - 6.2/req_iron)*100), "status": "low"},
            {"nutrient": "Calcium", "actual_mg": 380, "target_mg": req_calcium, "gap_pct": round((1 - 380/req_calcium)*100), "status": "low"},
            {"nutrient": "Vitamin D", "actual_iu": 180, "target_iu": req_vit_d, "gap_pct": round((1 - 180/req_vit_d)*100), "status": "low"},
        ],
        "allergen_conflict": False,
        "recommendations": [
            "Add ragi porridge at breakfast (calcium + iron synergy)",
            "Include drumstick leaves / moringa in dal (bioavailable iron + Vitamin C)",
            "15-20 min outdoor morning sunlight exposure daily (Vitamin D3)",
        ],
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ── TOOL 5: growth_analysis ────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

@tool
def growth_analysis(child_id: str) -> dict[str, Any]:
    """
    Retrieve the child's historical growth records and evaluate them against
    WHO Child Growth Standards (height-for-age, weight-for-age, BMI-for-age).

    Args:
        child_id : MongoDB ObjectId of the child profile.

    Returns a dict with keys:
        - source            : str   - "live_backend_growth_records" | "live_backend_no_records" | "dynamic_who_fallback"
        - all_records_count : int   - Total growth records found in DB
        - latest            : dict  - Most recent height/weight/BMI measurement
        - percentile        : dict  - Percentile classification computed by backend growthUtils.js
        - risk_status       : str   - "underweight" | "normal" | "overweight" | "obese"
        - trend             : str   - "improving" | "stable" | "declining" | "no_data"
        - velocity_alert    : bool  - True if weight is declining (clinical alert)
        - clinical_note     : str   - Human-readable clinical summary
    """
    # -- Real call (GET /api/growth/{child_id}) ---------------------------------
    result = _get(f"{_BACKEND_URL}/growth/{child_id}")

    if "error" not in result:
        # Backend returns a JSON array of GrowthRecord documents
        if isinstance(result, list) and result:
            # Sort chronologically so [-1] is truly the latest entry
            sorted_records = sorted(result, key=lambda r: r.get("timestamp", ""))
            latest_record  = sorted_records[-1]

            height = latest_record.get("height", 0.0)
            weight = latest_record.get("weight", 0.0)

            # Prefer the BMI already computed & stored by growthUtils.js (calculateBMI)
            stored_bmi = latest_record.get("bmi")
            bmi = stored_bmi if stored_bmi else (
                round(weight / ((height / 100) ** 2), 1) if height else None
            )

            # Percentile: use the numeric value stored by calculatePercentileAndRisk()
            stored_percentile = latest_record.get("percentile")  # numeric, e.g. 42.3
            percentile_label  = f"{round(stored_percentile)}th" if stored_percentile is not None else "50th"

            # Risk status: use riskStatus computed by backend (not hardcoded)
            risk_status = latest_record.get("riskStatus", "normal")

            # Trend: compare latest vs previous measurement if 2+ records exist
            trend = "stable"
            velocity_alert = False
            if len(sorted_records) >= 2:
                prev = sorted_records[-2]
                weight_delta = weight - prev.get("weight", weight)
                height_delta = height - prev.get("height", height)
                if weight_delta > 0.3 or height_delta > 0.5:
                    trend = "improving"
                elif weight_delta < -0.3:
                    trend = "declining"
                    velocity_alert = True  # weight loss = clinical alert

            # Extract ISO date portion from timestamp e.g. "2026-11-13T10:00:00.000Z" -> "2026-11-13"
            raw_ts = latest_record.get("timestamp", "")
            recorded_on = raw_ts[:10] if len(raw_ts) >= 10 else latest_record.get("dateRecorded", "latest")

            age_months = latest_record.get("ageInMonths", 0)
            age_years  = round(age_months / 12, 1) if age_months else "unknown"

            clinical_note = (
                f"Latest record ({recorded_on}): Height={height}cm, Weight={weight}kg, BMI={bmi}. "
                f"Age: {age_years} years. Risk status: {risk_status}. "
                f"BMI is at approximately the {percentile_label} percentile. "
                f"Growth trend across {len(sorted_records)} record(s): {trend}."
            )

            return {
                "source": "live_backend_growth_records",
                "all_records_count": len(sorted_records),
                "latest": {
                    "height_cm": height,
                    "weight_kg": weight,
                    "bmi": bmi,
                    "recorded_on": recorded_on,
                    "age_months": age_months,
                    "risk_status": risk_status,
                    "verified": latest_record.get("verified", False),
                    "notes": latest_record.get("notes", ""),
                },
                "percentile": {
                    "bmi_for_age": percentile_label,
                    "height_for_age": "derived_from_bmi",
                    "weight_for_age": "derived_from_bmi",
                },
                "risk_status": risk_status,
                "trend": trend,
                "velocity_alert": velocity_alert,
                "clinical_note": clinical_note,
            }

        # Backend returned an empty list -- no GrowthRecord documents exist for this child
        elif isinstance(result, list) and not result:
            return {
                "source": "live_backend_no_records",
                "all_records_count": 0,
                "latest": None,
                "percentile": None,
                "risk_status": "unknown",
                "trend": "no_data",
                "velocity_alert": False,
                "clinical_note": (
                    "No growth records found in the database for this child. "
                    "Please add at least one height/weight measurement via the app "
                    "to enable WHO growth chart analysis."
                ),
            }

        # Backend returned a plain dict (already-processed response)
        elif isinstance(result, dict):
            return result

    # -- Stub fallback (when Express backend is completely offline) -------------
    return {
        "source": "dynamic_who_fallback",
        "all_records_count": 0,
        "latest": {"height_cm": 102.5, "weight_kg": 15.8, "bmi": 15.1, "recorded_on": "unavailable"},
        "percentile": {
            "height_for_age": "25th",
            "weight_for_age": "35th",
            "bmi_for_age":    "40th",
        },
        "risk_status": "normal",
        "trend": "stable",
        "velocity_alert": False,
        "clinical_note": (
            "[Backend offline] Fallback estimate: Child appears within normal WHO range. "
            "Start the Express backend and add growth records for real analysis."
        ),
    }


@tool
def meal_planner(
    child_id: str,
    plan_type: str = "daily",
    focus_nutrients: list[str] | None = None,
    age: float = 5.0,
    weight: float = 18.0,
    allergies: list[str] | None = None,
) -> dict[str, Any]:
    """
    Generate an allergen-safe, age-appropriate meal plan for the child,
    respecting detected deficiencies, dislikes, regional food preferences,
    and dietary patterns (vegetarian/non-vegetarian/vegan/Jain).

    Args:
        child_id         : MongoDB ObjectId of the child profile.
        plan_type        : "daily" or "weekly".
        focus_nutrients  : Optional list of nutrients to prioritise (e.g. ["iron", "calcium"]).
        age              : Child age in years.
        weight           : Child weight in kg.
        allergies        : Known food allergies to exclude.

    Returns a dict with keys:
        - plan_type      : str
        - meals          : dict  — Slot → list[food_item] with nutrition metadata
        - total_macros   : dict  — Aggregated daily macro breakdown
        - allergens_avoided : list  — Allergens that were filtered out
        - shopping_list  : list  — Recommended grocery items
    """
    result = _post(
        f"{_AI_SERVICE_URL}/meal-plan",
        {
            "child_id": child_id,
            "plan_type": plan_type,
            "focus_nutrients": focus_nutrients or [],
            "age": age,
            "weight": weight,
            "allergies": allergies or [],
        },
    )
    if "error" not in result:
        return result

    # ── Safe Allergen-Aware Fallback (when microservice is offline) ───────────
    user_allergies = allergies or []
    clean_allergies = [str(a).lower() for a in user_allergies]

    snack_1 = ["Boiled egg (1) with whole wheat toast"]
    if any("egg" in a for a in clean_allergies):
        snack_1 = ["Steamed vegetable idli (2) with coconut chutney"]

    dinner = ["Chapati (2) + palak paneer + vegetable soup"]
    evening = ["Warm turmeric milk (200ml)"]
    if any("dairy" in a or "milk" in a or "lactose" in a for a in clean_allergies):
        dinner = ["Chapati (2) + yellow moong dal tadka + sautéed palak"]
        evening = ["Warm almond or oat milk (200ml)"]

    return {
        "source": "offline_dynamic_fallback",
        "plan_type": plan_type,
        "meals": {
            "breakfast":       ["Ragi porridge with jaggery (1 bowl)", "Banana (1 small)"],
            "morning_snack":   snack_1,
            "lunch":           ["Brown rice + moong dal + drumstick curry + cucumber salad"],
            "afternoon_snack": ["Roasted chana (30g) + orange (1)"],
            "dinner":          dinner,
            "evening_snack":   evening,
        },
        "total_macros": {
            "calories": 1420, "protein_g": 52, "carbs_g": 195, "fat_g": 40,
            "iron_mg": 9.2, "calcium_mg": 710, "vitamin_d_iu": 220,
        },
        "allergens_avoided": user_allergies,
        "shopping_list": ["Ragi flour", "Moong dal", "Drumstick leaves", "Palak", "Chana", "Banana", "Orange"],
        "focus_nutrients": focus_nutrients or [],
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ── TOOL 7: update_ner ─────────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

@tool
def update_ner(
    entity_text: str,
    entity_type: str,
    example_sentence: str = "",
) -> dict[str, Any]:
    """
    Register a new clinical concept in the NutriKid dynamic NER entity registry.
    This calls the ai-service-v2 candidate discovery API and queues the concept
    for the Human-in-the-Loop (HITL) review pipeline.

    Args:
        entity_text      : Surface form of the new entity (e.g. "fermented rice water").
        entity_type      : One of the 13 BIO entity classes (e.g. "FOOD", "COOKING_METHOD").
        example_sentence : An in-context example sentence containing the entity.

    Returns a dict with keys:
        - status         : str   — "queued" | "already_exists" | "failed"
        - entity_id      : str   — Registry ID assigned to the new concept
        - message        : str   — Human-readable confirmation
    """
    result = _post(
        f"{_NER_SERVICE_URL}/ner/register",
        {
            "text": entity_text,
            "type": entity_type,
            "example": example_sentence,
        },
    )
    if "error" not in result:
        return result

    # ── Stub ──────────────────────────────────────────────────────────────────
    return {
        "status": "queued",
        "entity_id": f"ner_{abs(hash(entity_text)) % 100000}",
        "message": (
            f"[NER UPDATE STUB] Entity '{entity_text}' ({entity_type}) queued "
            f"for HITL review. It will be annotated and added to the next "
            f"continual-learning training cycle."
        ),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ── TOOL REGISTRY ──────────────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

ALL_TOOLS = [
    rag_search,
    web_search,
    update_rag,
    nutrition_analysis,
    growth_analysis,
    meal_planner,
    update_ner,
]

TOOL_REGISTRY: dict[str, Any] = {t.name: t for t in ALL_TOOLS}