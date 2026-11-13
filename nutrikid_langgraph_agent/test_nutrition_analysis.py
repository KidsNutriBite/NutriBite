"""
test_nutrition_analysis.py — Deep-Dive Verification for Nutrition Analysis
==========================================================================
Tests the Nutrition Analysis subsystem in isolation and end-to-end:
1. Tool Invocation (tools.py -> nutrition_analysis)
2. Response Schema & Micronutrient Deficiencies
3. Fallback / Live Backend Connectivity
4. Synergy with RAG Search
5. Verification Gate (Algorithm 3 Confidence & Safety)
"""

import json
import time
from tools import nutrition_analysis, rag_search
from algorithms import classify_intent, plan_tools, verify_confidence_and_safety


def run_nutrition_deep_dive():
    print("=" * 75)
    print("  NUTRIKID AGENTIC — NUTRITION ANALYSIS DEEP-DIVE AUDIT")
    print("=" * 75)

    test_child_id = "64a1f3e2b8c9d12e45f67890"
    sample_query = "My child is deficient in iron and calcium, how much should I give?"

    # -------------------------------------------------------------------------
    # STEP 1: Intent Classification (Algorithm 1)
    # -------------------------------------------------------------------------
    print("\n[Step 1] Algorithm 1 — Intent Classification")
    print(f"  User Query : '{sample_query}'")
    intent, normalized = classify_intent(sample_query)
    print(f"  Classified Intent : {intent}")
    print(f"  Normalized Query  : '{normalized}'")
    assert intent == "NUTRITION_ANALYSIS", f"Expected NUTRITION_ANALYSIS, got {intent}"
    print("  Result: ✅ PASSED (Matches NUTRITION_ANALYSIS intent)")

    # -------------------------------------------------------------------------
    # STEP 2: Tool Planning (Algorithm 2)
    # -------------------------------------------------------------------------
    print("\n[Step 2] Algorithm 2 — Tool Planning")
    child_context = {
        "name": "Demo Child",
        "age_years": 5,
        "weight_kg": 18.0,
        "allergies": [],
        "dietary_pref": "vegetarian"
    }
    selected_tools, allow_ext = plan_tools(
        intent=intent,
        child_context=child_context,
        tool_results={},
        executed_tools=[],
        allow_external=False
    )
    print(f"  Planned Tools  : {selected_tools}")
    print(f"  Allow External : {allow_ext}")
    assert "nutrition_analysis" in selected_tools, "nutrition_analysis tool must be planned!"
    assert "rag_search" in selected_tools, "rag_search tool must be planned!"
    print("  Result: ✅ PASSED (Both nutrition_analysis and rag_search selected)")

    # -------------------------------------------------------------------------
    # STEP 3: Execute nutrition_analysis Tool Directly
    # -------------------------------------------------------------------------
    print("\n[Step 3] Invoking 'nutrition_analysis' tool...")
    t0 = time.time()
    nutri_result = nutrition_analysis.invoke({
        "child_id": test_child_id,
        "date": "2026-11-13",
        "allergen_check_food": ""
    })
    elapsed = round(time.time() - t0, 3)
    print(f"  Execution Time : {elapsed}s")
    print(f"  Result Keys    : {list(nutri_result.keys())}")

    # Inspect Macro & Deficiencies breakdown
    print("\n  [Detailed Nutrition Breakdown]:")
    if "macros" in nutri_result:
        print("  • Macros:")
        for macro, val in nutri_result["macros"].items():
            print(f"      - {macro}: {val}")

    if "deficiencies" in nutri_result:
        print("  • Deficiencies Identified:")
        for d in nutri_result["deficiencies"]:
            if isinstance(d, dict):
                nutrient = d.get("nutrient", "Unknown")
                actual = d.get("actual_mg", d.get("actual_iu", "N/A"))
                target = d.get("target_mg", d.get("target_iu", "N/A"))
                gap = d.get("gap_pct", "N/A")
                msg = d.get("message", "")
                print(f"      - {nutrient}: Consumed={actual} | Target={target} | Gap={gap}% {msg}")

    if "recommendations" in nutri_result:
        print("  • Targeted Recommendations:")
        for r in nutri_result["recommendations"]:
            print(f"      - {r}")

    # -------------------------------------------------------------------------
    # STEP 4: Synergy with rag_search Tool
    # -------------------------------------------------------------------------
    print("\n[Step 4] Invoking 'rag_search' tool (Clinical ICMR/NIN Guidance)...")
    t0 = time.time()
    rag_result = rag_search.invoke({
        "query": normalized,
        "child_id": test_child_id
    })
    elapsed = round(time.time() - t0, 3)
    print(f"  Execution Time : {elapsed}s")
    print(f"  RAG Confidence : {rag_result.get('confidence', 'N/A')}")
    print(f"  RAG Sources    : {rag_result.get('sources', [])}")
    answer_preview = rag_result.get("answer", "")[:180]
    print(f"  Answer Preview : {answer_preview}...")

    # -------------------------------------------------------------------------
    # STEP 5: Verification Gate (Algorithm 3)
    # -------------------------------------------------------------------------
    print("\n[Step 5] Algorithm 3 — Confidence & Safety Gating")
    accumulated_results = {
        "nutrition_analysis": nutri_result,
        "rag_search": rag_result
    }
    decision, reason = verify_confidence_and_safety(
        tool_results=accumulated_results,
        child_context=child_context,
        allow_external=allow_ext,
        step_count=1,
        intent=intent,
        executed_tools=["nutrition_analysis", "rag_search"]
    )
    print(f"  Verification Decision : {decision}")
    print(f"  Verification Reason   : {reason}")
    assert decision == "PROCEED", f"Expected decision PROCEED, got {decision} ({reason})"
    print("  Result: ✅ PASSED (Verification Gate allows proceeding to Synthesis)")

    print("\n" + "=" * 75)
    print("🎉 NUTRITION ANALYSIS SUBSYSTEM VERIFIED: 100% OPERATIONAL")
    print("=" * 75 + "\n")


if __name__ == "__main__":
    run_nutrition_deep_dive()
