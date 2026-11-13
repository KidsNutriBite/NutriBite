"""
algorithms.py — The Three Formal Algorithms for NutriKid LangGraph Agent
=========================================================================

Algorithm 1 : IntentClassification
Algorithm 2 : ToolPlanning          (supports multi-tool + re-planning)
Algorithm 3 : ConfidenceSafetyGating

All implementations are paper-faithful as specified.
"""

from __future__ import annotations

import re
from typing import Any

# ═══════════════════════════════════════════════════════════════════════════════
# ── CONSTANTS ──────────────────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

MAX_STEPS: int = 4

# Intent → required tool sets (first-pass planning)
_INTENT_TOOL_MAP: dict[str, dict[str, Any]] = {
    "MEAL_PLANNING": {
        "tools": ["nutrition_analysis", "meal_planner", "rag_search"],
        "allow_external": False,
    },
    "GROWTH_ANALYSIS": {
        "tools": ["growth_analysis", "rag_search"],
        "allow_external": False,
    },
    "ALLERGY_CHECK": {
        "tools": ["nutrition_analysis", "rag_search"],
        "allow_external": False,
    },
    "NUTRITION_ANALYSIS": {
        "tools": ["nutrition_analysis", "rag_search"],
        "allow_external": False,
    },
    "KNOWLEDGE_QUERY": {
        "tools": ["rag_search"],
        "allow_external": True,
    },
    "NER_UPDATE": {
        "tools": ["update_ner"],
        "allow_external": False,
    },
    "GENERAL_NUTRITION_CHAT": {
        "tools": ["rag_search"],
        "allow_external": True,
    },
}

# ── Algorithm 3 affirmative-only patterns (never match disclaimers / dietary nutrition) ──
# These only fire on actual pharmaceutical drug prescribing or clinical diagnosis,
# NOT on dietary nutrients (iron, calcium, vitamins) or standard safety notices.
_AFFIRMATIVE_SAFETY_PATTERNS: list[str] = [
    # Explicit clinical diagnosis statements
    r"\bi\s+(?:diagnose|am\s+diagnosing)\b",
    r"\bclinical\s+diagnosis\s+(?:is|confirms|shows)\b",
    r"\bofficial\s+diagnosis\b",
    r"\bdiagnosed\s+with\s+(?:a\s+disease|pneumonia|rickets|diabetes|sepsis|infection|asthma)\b",

    # Explicit pharmaceutical drug prescribing / dosage (NOT dietary vitamins/minerals)
    r"\bi\s+(?:prescribe|am\s+prescribing)\b",
    r"\bprescribe\s+(?:an?\s+)?(?:antibiotic|steroid|penicillin|amoxicillin|paracetamol|ibuprofen|sedative|pharmaceutical)\b",
    r"\btake\s+(?:\d+\s*(?:mg|ml)\s+of\s+)?(?:antibiotic|steroid|penicillin|amoxicillin|paracetamol|ibuprofen|sedative|pharmaceutical)\b",
    r"\bdosage\s+of\s+(?:antibiotic|steroid|penicillin|amoxicillin|paracetamol|ibuprofen|sedative|pharmaceutical|drug)\b",
    r"\badminister\s+(?:an?\s+)?(?:injection|antibiotic|steroid|penicillin|amoxicillin|sedative)\b",
]


# ═══════════════════════════════════════════════════════════════════════════════
# ── ALGORITHM 1: IntentClassification ─────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

def classify_intent(raw_query: str) -> tuple[str, str]:
    """
    Algorithm 1 — IntentClassification
    ------------------------------------
    Input  : raw query q  (str)
    Output : (intent: str, normalized_query: str)

    Steps
    -----
    1. Normalize q  (lowercase, strip, collapse whitespace).
    2. Keyword-rule matching in priority order (MEAL_PLANNING first → GENERAL last).
    3. Return the matched intent label and the normalized query.
    """
    # Step 1 — Normalize
    normalized: str = re.sub(r"\s+", " ", raw_query.lower().strip())

    # Step 2 — Keyword matching (priority order)
    if any(kw in normalized for kw in {
        "plan", "meal plan", "diet plan", "weekly plan", "daily plan",
        "what should", "suggest meals",
    }):
        return "MEAL_PLANNING", normalized

    if any(kw in normalized for kw in {
        "growth", "height", "weight", "percentile", "who chart",
        "is my child growing",
    }):
        return "GROWTH_ANALYSIS", normalized

    if any(kw in normalized for kw in {
        "allergy", "allergic", "intolerant", "reaction",
        "can he eat", "safe to give",
    }):
        return "ALLERGY_CHECK", normalized

    if any(kw in normalized for kw in {
        "nutrient", "vitamin", "iron", "calcium", "protein",
        "deficient", "how much",
    }):
        return "NUTRITION_ANALYSIS", normalized

    if any(kw in normalized for kw in {
        "what is", "explain", "tell me about", "benefits of", "is good for",
    }):
        return "KNOWLEDGE_QUERY", normalized

    if any(kw in normalized for kw in {
        "update", "new concept", "add entity", "learn this",
    }):
        return "NER_UPDATE", normalized

    # Step 3 — Default fallback
    return "GENERAL_NUTRITION_CHAT", normalized


# ═══════════════════════════════════════════════════════════════════════════════
# ── ALGORITHM 2: ToolPlanning ──────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

def plan_tools(
    intent: str,
    child_context: dict[str, Any],
    tool_results: dict[str, Any],
    executed_tools: list[str],
    allow_external: bool,
) -> tuple[list[str], bool]:
    """
    Algorithm 2 — ToolPlanning
    ---------------------------
    Input  : intent i, child_context C, previous tool_results R,
             executed_tools E, current allow_external flag
    Output : (selected_tools: list[str], allow_external: bool)

    Steps
    -----
    1. T = []
    2. allow_external = False (reset each planning cycle)
    3. if R is empty → first planning pass using _INTENT_TOOL_MAP
    4. else          → re-planning pass (supplement missing tools, add web_search if low-confidence)
    5. Remove tools already in E
    6. return T, allow_external
    """
    T: list[str] = []
    new_allow_external: bool = False

    if not tool_results:
        # ── Step 3: First planning pass ───────────────────────────────────────
        mapping = _INTENT_TOOL_MAP.get(
            intent, {"tools": ["rag_search"], "allow_external": True}
        )
        T = list(mapping["tools"])
        new_allow_external = mapping["allow_external"]

    else:
        # ── Step 4: Re-planning pass ──────────────────────────────────────────
        new_allow_external = allow_external  # carry forward existing permission

        # 4a. Check RAG confidence and conditionally add web + update_rag
        rag_conf: float = (
            tool_results.get("rag_search", {}).get("confidence", 1.0)
            if isinstance(tool_results.get("rag_search"), dict)
            else 1.0
        )
        if rag_conf < 0.75 and new_allow_external:
            if "web_search" not in executed_tools:
                T.append("web_search")
            if "update_rag" not in executed_tools:
                T.append("update_rag")

        # 4b. Add any required tools for this intent that are still missing
        required_tools: list[str] = _INTENT_TOOL_MAP.get(
            intent, {"tools": []}
        )["tools"]
        for tool in required_tools:
            if tool not in executed_tools and tool not in T:
                T.append(tool)

    # ── Step 5: Remove already-executed tools ─────────────────────────────────
    T = [t for t in T if t not in executed_tools]

    return T, new_allow_external


# ═══════════════════════════════════════════════════════════════════════════════
# ── ALGORITHM 3: ConfidenceSafetyGating ───────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

def _has_allergy_conflict(
    tool_results: dict[str, Any],
    allergies: list[str],
) -> bool:
    """
    Check whether any tool result mentions a food that conflicts with the
    child's registered allergens.  Comparison is case-insensitive substring.
    """
    if not allergies:
        return False
    allergen_set = {a.lower() for a in allergies}
    # Flatten all string content from tool results for scanning
    result_text = " ".join(
        str(v) for v in tool_results.values()
    ).lower()
    return any(allergen in result_text for allergen in allergen_set)


def _clean_safety_disclaimers(text: str) -> str:
    """
    Remove standard refusal, advice, and allergen disclaimers so they never trigger false positives.
    """
    patterns = [
        r"(?:cannot|can't|do\s+not|does\s+not|not\s+authorized\s+to|unable\s+to)\s+(?:diagnose|prescribe|treat|provide\s+medical)[^.\n]*",
        r"(?:not\s+a\s+substitute\s+for|does\s+not\s+replace)\s+(?:medical|clinical|pediatric|doctor)[^.\n]*",
        r"(?:consult|refer\s+to|visit)\s+(?:a|your)?\s*(?:qualified\s+)?(?:pediatrician|doctor|physician|dietitian)[^.\n]*",
        r"(?:for\s+medical\s+advice|for\s+acute\s+clinical|for\s+clinical\s+concerns)[^.\n]*",
        r"since\s+your\s+child\s+has\s+no\s+(?:listed\s+)?allergies[^.\n]*",
    ]
    cleaned = text
    for p in patterns:
        cleaned = re.sub(p, " ", cleaned, flags=re.IGNORECASE)
    return cleaned


def _contains_diagnosis_or_medication(tool_results: dict[str, Any]) -> bool:
    """
    Check whether tool results contain actual clinical diagnosis or prescribing.
    Uses affirmative-pattern-only matching on cleaned text so safety disclaimers
    and normal dietary intake guidance never trigger a false-positive BLOCK.
    """
    raw_text = " ".join(str(v) for v in tool_results.values()).lower()
    cleaned_text = _clean_safety_disclaimers(raw_text)

    for pat in _AFFIRMATIVE_SAFETY_PATTERNS:
        if re.search(pat, cleaned_text):
            return True

    return False


def verify_confidence_and_safety(
    tool_results: dict[str, Any],
    child_context: dict[str, Any],
    allow_external: bool,
    step_count: int,
    intent: str,
    executed_tools: list[str],
    max_steps: int = MAX_STEPS,
) -> tuple[str, str]:
    """
    Algorithm 3 — ConfidenceSafetyGating
    ---------------------------------------
    Input  : tool_results R, child_context C, allow_external, step_count s,
             intent, executed_tools E, max_steps (default 4)
    Output : (decision: str, reason: str)
             decision ∈ {"PROCEED", "NEED_MORE_TOOLS", "BLOCK"}

    Steps
    -----
    1. if HasAllergyConflict(R, C.allergies)              → BLOCK
    2. if ContainsDiagnosisOrMedication(R)                → BLOCK
    3. if s >= max_steps                                   → PROCEED (hard cap)
    4. conf = R["rag_search"].get("confidence", 0.0)
    5. if conf >= 0.75 and all required tools executed     → PROCEED
    6. if conf < 0.75 and allow_external                   → NEED_MORE_TOOLS
    7. if required tools still missing                     → NEED_MORE_TOOLS
    8. else                                                → PROCEED
    """
    allergies: list[str] = child_context.get("allergies", [])

    # ── Step 1: Allergy conflict ───────────────────────────────────────────────
    if _has_allergy_conflict(tool_results, allergies):
        return "BLOCK", "Allergy conflict detected in tool results."

    # ── Step 2: Diagnosis or medication advice ────────────────────────────────
    if _contains_diagnosis_or_medication(tool_results):
        return "BLOCK", "Diagnosis or medication advice not allowed."

    # ── Step 3: Max steps hard cap ────────────────────────────────────────────
    if step_count >= max_steps:
        return "PROCEED", f"Maximum steps ({max_steps}) reached — proceeding."

    # ── Step 4: Extract RAG confidence ───────────────────────────────────────
    rag_result = tool_results.get("rag_search", {})
    conf: float = (
        rag_result.get("confidence", 0.0)
        if isinstance(rag_result, dict) else 0.0
    )

    # ── Step 5: High confidence + all required tools executed ─────────────────
    required_tools: list[str] = _INTENT_TOOL_MAP.get(
        intent, {"tools": []}
    )["tools"]
    all_required_done = all(t in executed_tools for t in required_tools)

    if conf >= 0.75 and all_required_done:
        return "PROCEED", f"High confidence ({conf:.2f}) and all required tools executed."

    # ── Step 6: Low confidence + external allowed ─────────────────────────────
    if conf < 0.75 and allow_external:
        return (
            "NEED_MORE_TOOLS",
            f"Low RAG confidence ({conf:.2f}) — external search needed.",
        )

    # ── Step 7: Missing required tools ───────────────────────────────────────
    missing = [t for t in required_tools if t not in executed_tools]
    if missing:
        return (
            "NEED_MORE_TOOLS",
            f"Required tools not yet executed: {missing}.",
        )

    # ── Step 8: Default proceed ───────────────────────────────────────────────
    return "PROCEED", "Proceeding with available information."
