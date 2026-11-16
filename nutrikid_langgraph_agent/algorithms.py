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
# ── ALGORITHM 1: Semantic Intent Classification ──────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

# Rich semantic prototypes for each of the 7 clinical pediatric intents
SEMANTIC_INTENT_PROTOTYPES: dict[str, dict[str, Any]] = {
    "MEAL_PLANNING": {
        "description": "Formulating daily or weekly meal schedules, recipes, complementary feeding, balanced menus, and dietary routines for children.",
        "anchors": {
            "plan", "meal plan", "diet plan", "weekly plan", "daily plan", "food timetable",
            "menu", "recipe", "recipes", "what should i feed", "what to cook", "suggest meals",
            "breakfast", "lunch", "dinner", "snack", "feeding routine", "food schedule",
            "meal ideas", "dish recommendations", "complementary feeding", "weaning diet",
            "toddler meals", "eating timetable", "portion size", "balanced diet", "schedule",
        },
        "weight": 1.25,
    },
    "GROWTH_ANALYSIS": {
        "description": "Evaluating pediatric anthropometrics, height, weight, WHO growth percentiles, stunting, wasting, failure to thrive, and developmental curves.",
        "anchors": {
            "growth", "height", "weight", "percentile", "who chart", "growth chart", "z score",
            "is my child growing", "stunted", "stunting", "wasted", "wasting", "underweight",
            "failure to thrive", "short stature", "not gaining weight", "weight loss",
            "growth curve", "lagging in height", "body mass", "bmi", "milestone",
            "too thin", "too small", "skinny", "developmental delay", "frail",
        },
        "weight": 1.25,
    },
    "ALLERGY_CHECK": {
        "description": "Screening for adverse food reactions, allergen exclusion, anaphylaxis risks, food safety, and allergen-free ingredient alternatives.",
        "anchors": {
            "allergy", "allergic", "intolerant", "intolerance", "reaction", "can he eat",
            "safe to give", "safe to eat", "rash", "hives", "urticaria", "swelling", "itching",
            "eczema", "peanut allergy", "lactose intolerant", "dairy free", "egg allergy",
            "gluten sensitivity", "celiac", "anaphylaxis", "adverse reaction", "vomiting after food",
            "hypersensitivity", "wheezing", "food safety", "is it safe", "can i give",
        },
        "weight": 1.30,
    },
    "NUTRITION_ANALYSIS": {
        "description": "Analyzing micronutrient and macronutrient adequacy, dietary deficiencies, RDA targets, vitamin/mineral requirements, and caloric metrics.",
        "anchors": {
            "nutrient", "nutrition", "vitamin", "vitamins", "iron", "calcium", "protein",
            "zinc", "fiber", "mineral", "minerals", "deficient", "deficiency", "how much",
            "hemoglobin", "anemia", "anemic", "rickets", "scurvy", "rda", "daily allowance",
            "macronutrients", "micronutrients", "calories", "nutritional value", "omega 3",
        },
        "weight": 1.15,
    },
    "KNOWLEDGE_QUERY": {
        "description": "Answering evidence-based pediatric clinical guidelines, ICMR-NIN recommendations, food science, and general nutritional inquiries.",
        "anchors": {
            "what is", "explain", "tell me about", "benefits of", "is good for",
            "icmr", "nin guideline", "why does a child need", "nutritional science",
            "health benefits", "evidence", "clinical guideline", "superfood", "facts about",
            "is it healthy", "scientific reason", "recommended age", "guideline",
        },
        "weight": 1.00,
    },
    "NER_UPDATE": {
        "description": "Registering new food entities, expanding dynamic domain vocabularies, updating local/regional dishes in the clinical ontology.",
        "anchors": {
            "update", "new concept", "add entity", "learn this", "dynamic ner",
            "add food item", "register dish", "update dictionary", "expand vocabulary",
            "new ingredient", "save entity", "teach",
        },
        "weight": 1.35,
    },
    "GENERAL_NUTRITION_CHAT": {
        "description": "Conversational dialogue, general greetings, empathetic parental reassurance, and open-ended pediatric wellness guidance.",
        "anchors": {
            "hello", "hi", "hey", "help", "advice", "talk", "chat", "general tips",
            "parenting tips", "healthy habits", "good habits", "picky eater", "fussy eater",
        },
        "weight": 0.80,
    },
}


class DenseVectorIntentClassifier:
    """
    Dense Vector Embedding Semantic Intent Classifier
    --------------------------------------------------
    1. Converts each of the 7 clinical tools/intents into dense vector embeddings (R^384)
       using an embedding model (e.g. BAAI/bge-small-en-v1.5 or all-MiniLM-L6-v2).
    2. Encodes incoming user query q into a dense vector q_vec.
    3. Computes cosine similarity (dot product of L2-normalized vectors) between q_vec
       and all 7 tool vectors.
    4. Routes the query to the tool/intent with highest semantic vector alignment.
    """
    _instance = None
    _model = None
    _tool_vectors = None
    _intent_keys = list(SEMANTIC_INTENT_PROTOTYPES.keys())

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self._initialized = False

    def _lazy_init(self):
        if self._initialized:
            return
        try:
            # Try loading SentenceTransformer model from nutrikid_Agentic or system
            from sentence_transformers import SentenceTransformer
            import numpy as np

            model_name = "BAAI/bge-small-en-v1.5"
            self._model = SentenceTransformer(model_name)

            # Pre-compute and L2-normalize vectors for all 7 tools/intents
            texts = [
                f"{k}: {SEMANTIC_INTENT_PROTOTYPES[k]['description']} Keywords: {', '.join(list(SEMANTIC_INTENT_PROTOTYPES[k]['anchors'])[:10])}"
                for k in self._intent_keys
            ]
            raw_vecs = self._model.encode(texts, convert_to_numpy=True)
            # Normalize vectors (L2 norm = 1.0) so dot product equals cosine similarity
            norms = np.linalg.norm(raw_vecs, axis=1, keepdims=True)
            self._tool_vectors = raw_vecs / np.maximum(norms, 1e-12)
            self._initialized = True
        except Exception:
            # Fallback if sentence_transformers is not loaded in current process
            self._model = None
            self._tool_vectors = None

    def match(self, query: str) -> tuple[str, float] | None:
        """Encode query into a vector and find highest cosine similarity tool vector."""
        self._lazy_init()
        if self._model is None or self._tool_vectors is None:
            return None

        try:
            import numpy as np
            q_vec = self._model.encode([query], convert_to_numpy=True)
            q_norm = np.linalg.norm(q_vec, axis=1, keepdims=True)
            q_vec = q_vec / np.maximum(q_norm, 1e-12)

            # Cosine similarity is the dot product of normalized vectors
            scores = np.dot(self._tool_vectors, q_vec.T).flatten()
            best_idx = int(np.argmax(scores))
            return self._intent_keys[best_idx], float(scores[best_idx])
        except Exception:
            return None


def _extract_ngrams(text: str) -> set[str]:
    """Extract unigrams and bigrams from normalized text for semantic matching."""
    cleaned = re.sub(r"[^\w\s]", " ", text)
    tokens = [w for w in cleaned.split() if len(w) > 1]
    ngrams = set(tokens)
    for i in range(len(tokens) - 1):
        ngrams.add(f"{tokens[i]} {tokens[i+1]}")
    return ngrams


def _cosine_similarity(query_ngrams: set[str], anchor_set: set[str]) -> float:
    """Compute normalized cosine similarity between query n-grams and intent semantic anchors."""
    if not query_ngrams or not anchor_set:
        return 0.0
    intersection = query_ngrams.intersection(anchor_set)
    if not intersection:
        # Partial stem/substring fallback for compound clinical terms
        partial_matches = 0
        for q in query_ngrams:
            for a in anchor_set:
                if len(q) >= 4 and (q in a or a in q):
                    partial_matches += 0.5
                    break
        if partial_matches > 0:
            return partial_matches / ((len(query_ngrams) ** 0.5) * (len(anchor_set) ** 0.5))
        return 0.0

    return len(intersection) / ((len(query_ngrams) ** 0.5) * (len(anchor_set) ** 0.5))


def classify_intent_llm(raw_query: str, llm: Any) -> str | None:
    """
    Zero-shot LLM Semantic Router for ambiguous or conversational queries.
    Returns the exact intent enum if recognized, or None on failure.
    """
    if llm is None:
        return None

    try:
        from langchain_core.messages import SystemMessage, HumanMessage

        prompt = (
            "You are a clinical pediatric intent classifier for NutriKid.\n"
            "Classify the query into exactly ONE of these 7 intent labels:\n"
            "- MEAL_PLANNING: Daily/weekly food schedules, menus, recipes, meal ideas, complementary feeding.\n"
            "- GROWTH_ANALYSIS: Child height, weight, WHO percentiles, stunting, wasting, growth tracking.\n"
            "- ALLERGY_CHECK: Food allergies, hives, rash, itching, adverse reactions, dietary safety.\n"
            "- NUTRITION_ANALYSIS: Nutrients, vitamins, iron, calcium, protein, deficiency, RDA metrics.\n"
            "- KNOWLEDGE_QUERY: Evidence-based pediatric guidelines, ICMR-NIN nutritional science.\n"
            "- NER_UPDATE: Registering new food entities, expanding pediatric clinical vocabulary.\n"
            "- GENERAL_NUTRITION_CHAT: General greetings, casual dialogue, open-ended nutrition advice.\n\n"
            "Rules:\n"
            "Return ONLY the exact intent label (e.g. MEAL_PLANNING). No punctuation, no explanation."
        )

        response = llm.invoke([
            SystemMessage(content=prompt),
            HumanMessage(content=f"Query: {raw_query}")
        ])

        output = response.content.strip().upper() if hasattr(response, "content") else str(response).strip().upper()
        # Clean any extra characters
        for intent_key in SEMANTIC_INTENT_PROTOTYPES:
            if intent_key in output:
                return intent_key
    except Exception:
        pass

    return None


def classify_intent_semantic(
    raw_query: str,
    llm: Any = None,
    threshold: float = 0.12,
) -> tuple[str, str, float]:
    """
    Semantic Intent Classification with 3 Tiers:
    1. Lexical Fast-Path (0ms exact anchor match)
    2. Semantic Vector Cosine Similarity (evaluates against clinical prototypes)
    3. Zero-Shot LLM Semantic Router (for subtle or compound conversational queries)
    """
    normalized: str = re.sub(r"\s+", " ", raw_query.lower().strip())
    query_ngrams = _extract_ngrams(normalized)

    # ── Tier 1: Lexical Fast-Path (Immediate match for unambiguous triggers) ──
    fast_path_rules = [
        ("MEAL_PLANNING", {"meal plan", "diet plan", "food timetable", "weekly plan", "daily plan", "what to cook", "suggest meals"}),
        ("GROWTH_ANALYSIS", {"who chart", "growth chart", "percentile", "z score", "is my child growing", "stunted", "wasted"}),
        ("ALLERGY_CHECK", {"allergic", "allergy", "intolerant", "hives", "anaphylaxis", "safe to give", "safe to eat"}),
        ("NUTRITION_ANALYSIS", {"deficient", "deficiency", "rda", "hemoglobin", "how much iron", "calcium deficiency"}),
        ("NER_UPDATE", {"update ner", "add entity", "register dish", "dynamic ner", "new concept"}),
        ("KNOWLEDGE_QUERY", {"icmr", "nin guideline", "clinical guideline", "nutritional science"}),
    ]

    for intent_name, anchor_triggers in fast_path_rules:
        if any(trigger in normalized for trigger in anchor_triggers):
            return intent_name, normalized, 1.0

    # ── Tier 2: Dense Embedding Vector Cosine Similarity ─────────────────────
    dense_classifier = DenseVectorIntentClassifier.get_instance()
    dense_match = dense_classifier.match(raw_query)
    if dense_match is not None:
        matched_intent, vector_sim = dense_match
        if vector_sim >= 0.55:
            return matched_intent, normalized, vector_sim

    # ── Tier 2B: Semantic Prototype Cosine Similarity (Lightweight Fallback) ──
    best_intent = "GENERAL_NUTRITION_CHAT"
    best_score = 0.0

    for intent_name, proto in SEMANTIC_INTENT_PROTOTYPES.items():
        anchors = proto["anchors"]
        weight = proto.get("weight", 1.0)
        sim = _cosine_similarity(query_ngrams, anchors) * weight
        if sim > best_score:
            best_score = sim
            best_intent = intent_name

    # If semantic similarity has high confidence, return immediately
    if best_score >= threshold and best_intent != "GENERAL_NUTRITION_CHAT":
        return best_intent, normalized, best_score

    # ── Tier 3: Zero-Shot LLM Semantic Router ─────────────────────────────────
    if llm is not None:
        llm_intent = classify_intent_llm(raw_query, llm)
        if llm_intent:
            return llm_intent, normalized, 0.95

    # Fallback to top scored semantic intent or default general chat
    final_intent = best_intent if best_score > 0.05 else "GENERAL_NUTRITION_CHAT"
    return final_intent, normalized, best_score


def classify_intent(raw_query: str, llm: Any = None) -> tuple[str, str]:
    """
    Algorithm 1 — IntentClassification (Paper-Faithful Hybrid Semantic Version)
    --------------------------------------------------------------------------
    Input  : raw query q (str), optional LLM instance
    Output : (intent: str, normalized_query: str)

    Upgraded from pure lexical keyword matching to Hybrid Semantic Intent
    Classification. Preserves full backward-compatibility with existing nodes,
    APIs, and evaluation scripts while recognizing clinical synonyms and paraphrases.
    """
    intent, normalized, _ = classify_intent_semantic(raw_query, llm=llm)
    return intent, normalized


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
