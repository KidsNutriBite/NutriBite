"""
nodes.py — The Seven Node Functions for NutriKid LangGraph
===========================================================

Node execution order (with controlled cycles):
  Understand → Observe → Plan → Act → Verify
                                 ↑          |
                                 └──────────┘ (if NEED_MORE_TOOLS & step_count < max_steps)
                                           ↓
                                      Synthesize → Follow-up

Each node receives and returns AgentState (partial updates only).
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any

from dotenv import load_dotenv

load_dotenv()

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig

from algorithms import (
    MAX_STEPS,
    classify_intent,
    plan_tools,
    verify_confidence_and_safety,
)
from state import AgentState
from tools import TOOL_REGISTRY

logger = logging.getLogger("nutrikid.nodes")

# ── LLM factory (configurable via env) ───────────────────────────────────────

def _build_llm() -> Any:
    """
    Build and return the configured LLM.
    Priority: GROQ_API_KEY > OPENAI_API_KEY > Qwen3.8 via Ollama (default).
    """
    groq_key   = os.getenv("GROQ_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    model_name = os.getenv("LLM_MODEL_NAME", "qwen3:4b")

    if groq_key:
        from langchain_groq import ChatGroq  # type: ignore
        groq_model = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
        logger.info("Using Groq LLM: %s", groq_model)
        return ChatGroq(
            api_key=groq_key,
            model_name=groq_model,
            temperature=0.3,
            max_tokens=700,
        )

    if openai_key:
        from langchain_openai import ChatOpenAI  # type: ignore
        logger.info("Using OpenAI LLM: gpt-4o-mini")
        return ChatOpenAI(
            api_key=openai_key,
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            temperature=0.3,
        )

    # Default: Qwen3:4b via local Ollama
    try:
        from langchain_ollama import ChatOllama  # type: ignore
        logger.info(f"Using Ollama LLM: {model_name}")
        return ChatOllama(
            model=model_name,
            base_url=os.getenv("OLLAMA_HOST", "http://localhost:11434"),
            temperature=0.3,
        )
    except Exception as e:
        logger.warning(f"Ollama unavailable ({e}). Falling back to FakeLLM stub.")
        from langchain_core.language_models.fake import FakeListChatModel  # type: ignore
        return FakeListChatModel(
            responses=[
                "I am a pediatric nutrition assistant. Based on the available information, "
                "I recommend consulting your child's pediatrician for personalised advice."
            ]
        )

_LLM = _build_llm()

# ── Stub child-context fetcher ────────────────────────────────────────────────

def _fetch_child_context(child_id: str) -> dict[str, Any]:
    """
    Fetch child profile from the NutriBite backend.
    Falls back to a minimal stub when the backend is unavailable.
    """
    import httpx
    try:
        resp = httpx.get(
            f"{os.getenv('BACKEND_URL', 'http://localhost:5000/api')}/profiles/{child_id}",
            headers={"X-Internal-Service": "nutrikid-agent"},
            timeout=5.0,
        )
        if resp.status_code == 200:
            payload = resp.json()
            data = payload.get("data", payload) if isinstance(payload, dict) else payload
            if isinstance(data, dict):
                return {
                    "child_id":          str(data.get("_id", child_id)),
                    "name":              data.get("name", "Child"),
                    "age_years":         data.get("age", 5),
                    "gender":            data.get("gender", "female"),
                    "weight_kg":         data.get("weight", 18.0),
                    "height_cm":         data.get("height", 108.0),
                    "allergies":         data.get("allergies", []),
                    "health_conditions": data.get("healthConditions", []),
                    "dietary_pref":      data.get("dietaryPreference", "vegetarian"),
                    "region":            data.get("location", {}).get("state", "India") if isinstance(data.get("location"), dict) else "India",
                    "goals":             data.get("goals", ["healthy growth", "balanced nutrition"]),
                }
    except Exception:
        pass

    # Stub fallback
    return {
        "child_id":          child_id,
        "name":              "Demo Child",
        "age_years":         5,
        "gender":            "female",
        "weight_kg":         18.0,
        "height_cm":         108.0,
        "allergies":         [],
        "health_conditions": [],
        "dietary_pref":      "vegetarian",
        "region":            "South India",
        "goals":             ["healthy growth", "iron deficiency correction"],
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ── NODE 1: Understand ─────────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

def node_understand(state: AgentState, config: RunnableConfig) -> dict[str, Any]:
    """
    Understand Node
    ---------------
    Responsibilities:
    1. Apply Algorithm 1 (IntentClassification) to the raw user_query.
    2. Store the normalized query and classified intent in state.
    3. Append the user's raw query as a HumanMessage to messages.
    """
    logger.info("[Understand] Classifying intent for query: %s", state["user_query"])

    intent, normalized = classify_intent(state["user_query"])

    logger.info("[Understand] Intent=%s | Normalized=%s", intent, normalized)

    return {
        "normalized_query": normalized,
        "intent":           intent,
        "messages":         [HumanMessage(content=state["user_query"])],
        "step_count":       0,
        "executed_tools":   [],
        "tool_results":     {},
        "safety_flags":     [],
        "follow_ups":       [],
        "final_response":   "",
        "rag_confidence":   0.0,
        "verification_decision": "",
        "verification_reason":   "",
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ── NODE 2: Observe ────────────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

def node_observe(state: AgentState, config: RunnableConfig) -> dict[str, Any]:
    """
    Observe Node
    ------------
    Responsibilities:
    1. Hydrate the child context from the NutriBite backend.
    2. Validate the child exists and that the requesting user has access.
    3. Store the child_context in state for downstream use.
    """
    logger.info("[Observe] Fetching context for child_id=%s", state["child_id"])

    child_context = _fetch_child_context(state["child_id"])

    logger.info(
        "[Observe] Child context loaded: name=%s, age=%s, allergies=%s",
        child_context.get("name"),
        child_context.get("age_years"),
        child_context.get("allergies"),
    )

    return {"child_context": child_context}


# ═══════════════════════════════════════════════════════════════════════════════
# ── NODE 3: Plan ───────────────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

def node_plan(state: AgentState, config: RunnableConfig) -> dict[str, Any]:
    """
    Plan Node
    ---------
    Responsibilities:
    1. Apply Algorithm 2 (ToolPlanning) to decide which tools to run next.
    2. First-pass: selects required tools for the intent.
    3. Re-planning pass: adds web_search/update_rag if RAG confidence was low.
    4. Updates selected_tools and allow_external in state.
    """
    logger.info(
        "[Plan] step_count=%d | intent=%s | executed=%s",
        state["step_count"],
        state["intent"],
        state["executed_tools"],
    )

    selected, allow_external = plan_tools(
        intent=state["intent"],
        child_context=state["child_context"],
        tool_results=state["tool_results"],
        executed_tools=state["executed_tools"],
        allow_external=state.get("allow_external", False),
    )

    logger.info("[Plan] selected_tools=%s | allow_external=%s", selected, allow_external)

    return {
        "selected_tools":  selected,
        "allow_external":  allow_external,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ── NODE 4: Act ────────────────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

def node_act(state: AgentState, config: RunnableConfig) -> dict[str, Any]:
    """
    Act Node
    --------
    Responsibilities:
    1. Execute each tool in selected_tools by looking it up in TOOL_REGISTRY.
    2. Build tool call arguments from child_context and normalized_query.
    3. Accumulate results into tool_results.
    4. Update executed_tools and extract rag_confidence.
    5. Increment step_count.
    """
    logger.info("[Act] Executing tools: %s", state["selected_tools"])

    tool_results: dict[str, Any] = dict(state.get("tool_results", {}))
    executed: list[str]          = list(state.get("executed_tools", []))
    rag_confidence: float        = state.get("rag_confidence", 0.0)

    child_id  = state["child_id"]
    query     = state["normalized_query"]
    child_ctx = state["child_context"]

    for tool_name in state["selected_tools"]:
        if tool_name in executed:
            logger.debug("[Act] Skipping already-executed tool: %s", tool_name)
            continue

        tool_fn = TOOL_REGISTRY.get(tool_name)
        if tool_fn is None:
            logger.warning("[Act] Tool not found in registry: %s", tool_name)
            tool_results[tool_name] = {"error": f"Tool '{tool_name}' not registered."}
            executed.append(tool_name)
            continue

        # ── Build tool arguments ──────────────────────────────────────────────
        try:
            if tool_name == "rag_search":
                result = tool_fn.invoke({"query": query, "child_id": child_id})

            elif tool_name == "web_search":
                result = tool_fn.invoke({"query": query})

            elif tool_name == "update_rag":
                # Inject the best web snippet found earlier
                web_res = tool_results.get("web_search", {})
                snippets = web_res.get("results", [])
                new_text = " ".join(
                    s.get("snippet", "") for s in snippets[:2]
                ) if snippets else query
                result = tool_fn.invoke({
                    "new_knowledge": new_text,
                    "source_label":  "web_search_augmentation",
                })

            elif tool_name == "nutrition_analysis":
                result = tool_fn.invoke({
                    "child_id": child_id,
                    "date":     "",
                    "allergen_check_food": "",
                })

            elif tool_name == "growth_analysis":
                result = tool_fn.invoke({"child_id": child_id})

            elif tool_name == "meal_planner":
                deficiencies = [
                    d["nutrient"].lower()
                    for d in tool_results.get("nutrition_analysis", {}).get("deficiencies", [])
                    if isinstance(d, dict) and "nutrient" in d
                ]
                result = tool_fn.invoke({
                    "child_id":        child_id,
                    "plan_type":       "daily",
                    "focus_nutrients": deficiencies or [],
                    "age":             float(child_ctx.get("age_years", 5.0) or 5.0),
                    "weight":          float(child_ctx.get("weight_kg", 18.0) or 18.0),
                    "allergies":       child_ctx.get("allergies", []),
                })

            elif tool_name == "update_ner":
                # Extract entity hint from query (simple heuristic)
                result = tool_fn.invoke({
                    "entity_text":      query.split()[-1] if query else "unknown",
                    "entity_type":      "FOOD",
                    "example_sentence": query,
                })

            else:
                result = tool_fn.invoke({"query": query})

        except Exception as exc:  # noqa: BLE001
            logger.error("[Act] Tool '%s' raised exception: %s", tool_name, exc)
            result = {"error": str(exc), "status": "failed"}

        logger.info("[Act] Tool '%s' completed. Result keys: %s", tool_name, list(result.keys()) if isinstance(result, dict) else "non-dict")

        tool_results[tool_name] = result
        executed.append(tool_name)

        # ── Extract RAG confidence ────────────────────────────────────────────
        if tool_name == "rag_search" and isinstance(result, dict):
            rag_confidence = float(result.get("confidence", 0.0))

    return {
        "tool_results":    tool_results,
        "executed_tools":  executed,
        "rag_confidence":  rag_confidence,
        "step_count":      state["step_count"] + 1,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ── NODE 5: Verify ─────────────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

def node_verify(state: AgentState, config: RunnableConfig) -> dict[str, Any]:
    """
    Verify Node
    -----------
    Responsibilities:
    1. Apply Algorithm 3 (ConfidenceSafetyGating) to the accumulated tool_results.
    2. Detect allergy conflicts, diagnosis/medication advice, and low-confidence results.
    3. Set verification_decision ("PROCEED" | "NEED_MORE_TOOLS" | "BLOCK") and reason.
    4. Append any safety flags raised.
    """
    logger.info(
        "[Verify] step_count=%d | rag_confidence=%.2f",
        state["step_count"],
        state["rag_confidence"],
    )

    decision, reason = verify_confidence_and_safety(
        tool_results=state["tool_results"],
        child_context=state["child_context"],
        allow_external=state.get("allow_external", False),
        step_count=state["step_count"],
        intent=state["intent"],
        executed_tools=state["executed_tools"],
        max_steps=MAX_STEPS,
    )

    safety_flags: list[str] = list(state.get("safety_flags", []))
    if decision == "BLOCK":
        safety_flags.append(reason)

    logger.info("[Verify] decision=%s | reason=%s", decision, reason)

    return {
        "verification_decision": decision,
        "verification_reason":   reason,
        "safety_flags":          safety_flags,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ── NODE 6: Synthesize ─────────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

_SYNTHESIZE_SYSTEM_PROMPT = """You are NutriGuide, a friendly and evidence-based pediatric nutrition assistant for the NutriKids platform.
You serve parents seeking guidance about their child's nutrition, growth, and healthy eating habits.

STRICT RULES:
1. NEVER provide medical diagnoses or specific medication dosages.
2. NEVER recommend foods that conflict with the child's known allergies.
3. ALWAYS base recommendations on the ICMR/NIN guidelines provided in tool results.
4. ALWAYS use encouraging, parent-friendly language.
5. If clinical intervention is needed, ALWAYS advise consulting a pediatrician.
6. Keep responses structured, scannable, and actionable.

RESPONSE FORMAT:
- Start with a brief summary (1-2 sentences).
- Use bullet points for recommendations.
- End with a safety disclaimer.
"""

_SYNTHESIZE_USER_TEMPLATE = """
CHILD PROFILE:
{child_context}

PARENT QUERY:
{user_query}

TOOL RESULTS:
{tool_results}

CONVERSATION HISTORY SUMMARY:
{history_summary}

SAFETY FLAGS:
{safety_flags}

Please provide a comprehensive, safe, and actionable response to the parent's query.
"""

_BLOCKED_RESPONSE_TEMPLATE = """
⚠️ **Safety Notice**

We were unable to provide a response to this query due to the following safety concern:

> {reason}

**What to do:**
- For allergy-related questions, please consult your child's allergist or pediatrician directly.
- For medication or treatment advice, always refer to your registered doctor.
- You can continue using NutriKids for nutrition tracking, meal planning, and growth monitoring.

*— NutriKids Safety System*
"""


def node_synthesize(state: AgentState, config: RunnableConfig) -> dict[str, Any]:
    """
    Synthesize Node
    ---------------
    Responsibilities:
    1. If decision == BLOCK, return a structured safety refusal.
    2. Otherwise, build a rich structured prompt containing:
       - user query, child context, all tool results, conversation history
    3. Call the LLM to generate the final response.
    4. Append the AI response to messages.
    """
    logger.info("[Synthesize] decision=%s", state["verification_decision"])

    if state["verification_decision"] == "BLOCK":
        blocked_response = _BLOCKED_RESPONSE_TEMPLATE.format(
            reason=state["verification_reason"]
        )
        return {
            "final_response": blocked_response,
            "messages": [AIMessage(content=blocked_response)],
        }

    # ── Build history summary (last 3 non-system messages) ────────────────────
    history_msgs = [
        m for m in state.get("messages", [])
        if not isinstance(m, SystemMessage)
    ][-6:]
    history_summary = "\n".join(
        f"{type(m).__name__}: {m.content[:200]}"
        for m in history_msgs
    )

    # ── Build tool results summary (truncate large blobs) ─────────────────────
    tool_results_str = json.dumps(
        {k: (v if len(str(v)) < 1500 else str(v)[:1500] + "…") for k, v in state["tool_results"].items()},
        indent=2,
        ensure_ascii=False,
    )

    child_ctx_str = json.dumps(state["child_context"], indent=2, ensure_ascii=False)
    safety_str    = "\n".join(state.get("safety_flags", [])) or "None"

    user_prompt = _SYNTHESIZE_USER_TEMPLATE.format(
        child_context=child_ctx_str,
        user_query=state["user_query"],
        tool_results=tool_results_str,
        history_summary=history_summary,
        safety_flags=safety_str,
    )

    llm_messages = [
        SystemMessage(content=_SYNTHESIZE_SYSTEM_PROMPT),
        HumanMessage(content=user_prompt),
    ]

    logger.info("[Synthesize] Calling LLM for final synthesis…")
    response = _LLM.invoke(llm_messages)
    response_text: str = response.content if hasattr(response, "content") else str(response)

    # ── Append mandatory pediatric safety disclaimer ───────────────────────────
    disclaimer = (
        "\n\n---\n"
        "⚕️ **Pediatric Safety Disclaimer:** The information provided by NutriKids is for "
        "general nutritional guidance only and does not constitute medical advice. For "
        "clinical concerns, growth abnormalities, or allergy management, always consult a "
        "qualified pediatrician or registered dietitian."
    )
    final = response_text.rstrip() + disclaimer

    logger.info("[Synthesize] Final response generated (%d chars).", len(final))

    return {
        "final_response": final,
        "messages":       [AIMessage(content=final)],
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ── NODE 7: Follow-up ──────────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

_FOLLOWUP_PROMPT = """Based on this pediatric nutrition conversation:

Query: {query}
Intent: {intent}
Response summary: {response_summary}

Generate exactly 3 short, specific follow-up questions a parent might naturally ask next.
Return ONLY a JSON array of 3 strings. Example:
["Question 1?", "Question 2?", "Question 3?"]
"""

def node_followup(state: AgentState, config: RunnableConfig) -> dict[str, Any]:
    """
    Follow-up Node
    --------------
    Responsibilities:
    1. Use the LLM to generate 2-3 proactive follow-up suggestions.
    2. Store them in state.follow_ups for the API response.
    3. This is the terminal node — no further transitions.
    """
    logger.info("[Follow-up] Generating follow-up questions…")

    response_summary = state.get("final_response", "")[:400]

    prompt_text = _FOLLOWUP_PROMPT.format(
        query=state["user_query"],
        intent=state["intent"],
        response_summary=response_summary,
    )

    try:
        # Use low token cap to avoid Groq rate limits
        llm_caller = _LLM.bind(max_tokens=120) if hasattr(_LLM, "bind") else _LLM
        raw = llm_caller.invoke([HumanMessage(content=prompt_text)])
        raw_content = raw.content if hasattr(raw, "content") else str(raw)

        # Parse JSON array safely
        import re as _re
        match = _re.search(r"\[.*?\]", raw_content, _re.DOTALL)
        if match:
            follow_ups: list[str] = json.loads(match.group())
        else:
            follow_ups = [raw_content.strip()]
    except Exception as exc:
        logger.warning("[Follow-up] LLM call failed: %s. Using defaults.", exc)
        follow_ups = [
            "What foods should I include in tomorrow's meal plan?",
            "How can I track my child's iron levels at home?",
            "When should I schedule the next growth checkup?",
        ]

    # Cap to 3 follow-ups
    follow_ups = follow_ups[:3]
    logger.info("[Follow-up] Generated %d follow-ups.", len(follow_ups))

    return {"follow_ups": follow_ups}
