"""
test_semantic_intent.py — Verification of Algorithm 1: Semantic Intent Classification
=====================================================================================
Tests conversational, paraphrased, and clinical queries that fail under pure lexical
matching to prove that the hybrid semantic classifier accurately categorizes them.
"""

from algorithms import classify_intent_semantic, classify_intent

TEST_CASES = [
    # ── MEAL_PLANNING ──────────────────────────────────────────────────────────
    (
        "Could you suggest a balanced food schedule and timetable for my toddler?",
        "MEAL_PLANNING",
        "Uses 'schedule', 'timetable', 'suggest' without exact 'meal plan' keyword"
    ),
    (
        "What should I cook for dinner tonight for a 3-year-old?",
        "MEAL_PLANNING",
        "Conversational recipe/dinner preparation query"
    ),

    # ── GROWTH_ANALYSIS ────────────────────────────────────────────────────────
    (
        "My daughter is looking very frail and underweight compared to her classmates.",
        "GROWTH_ANALYSIS",
        "Clinical anthropometric concern using 'frail', 'underweight' instead of 'growth'"
    ),
    (
        "Her height seems to be lagging behind on the developmental curve.",
        "GROWTH_ANALYSIS",
        "Growth curve and stature monitoring query"
    ),

    # ── ALLERGY_CHECK ──────────────────────────────────────────────────────────
    (
        "My son broke out in red hives and swelling after eating eggs.",
        "ALLERGY_CHECK",
        "Symptoms of allergic reaction ('hives', 'swelling') without the word 'allergy'"
    ),
    (
        "Is it safe to give almond milk if she has eczema reactions?",
        "ALLERGY_CHECK",
        "Safety screening query for allergic reaction / eczema"
    ),

    # ── NUTRITION_ANALYSIS ─────────────────────────────────────────────────────
    (
        "How can I boost my toddler's hemoglobin count and iron levels?",
        "NUTRITION_ANALYSIS",
        "Micronutrient / deficiency question"
    ),
    (
        "My child is deficient in iron and calcium, how much should I give?",
        "NUTRITION_ANALYSIS",
        "Nutrient deficiency evaluation"
    ),

    # ── KNOWLEDGE_QUERY ────────────────────────────────────────────────────────
    (
        "Explain the ICMR guidelines on nutritional science for toddlers.",
        "KNOWLEDGE_QUERY",
        "Authoritative guideline query"
    ),

    # ── NER_UPDATE ─────────────────────────────────────────────────────────────
    (
        "Register a new local dish ragi kanji into dynamic ner dictionary.",
        "NER_UPDATE",
        "Vocabulary expansion query"
    ),

    # ── GENERAL_NUTRITION_CHAT ─────────────────────────────────────────────────
    (
        "Hello, good morning doctor!",
        "GENERAL_NUTRITION_CHAT",
        "Conversational greeting"
    ),
]


def run_tests():
    print("=" * 85)
    print("  NUTRIKID ALGORITHM 1 — HYBRID SEMANTIC INTENT CLASSIFICATION AUDIT")
    print("=" * 85)

    passed = 0
    failed = 0

    for query, expected_intent, notes in TEST_CASES:
        intent, normalized, score = classify_intent_semantic(query)
        is_pass = (intent == expected_intent)

        status_icon = "✅ PASS" if is_pass else "❌ FAIL"
        if is_pass:
            passed += 1
        else:
            failed += 1

        print(f"\n[{status_icon}] Query: \"{query}\"")
        print(f"       Expected: {expected_intent}")
        print(f"       Resolved: {intent} (Semantic Confidence: {score:.3f})")
        print(f"       Notes   : {notes}")

    print("\n" + "=" * 85)
    print(f"  SUMMARY: {passed} / {len(TEST_CASES)} PASSED ({(passed/len(TEST_CASES))*100:.1f}%)")
    print("=" * 85)


if __name__ == "__main__":
    run_tests()
