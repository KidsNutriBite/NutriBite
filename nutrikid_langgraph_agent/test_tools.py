"""
test_tools.py — Standalone Unit Verification for All 7 NutriKid Tools
======================================================================
Tests each LangChain tool in isolation directly without running the
entire graph. Checks response shapes, fallback stubs, and live connectivity.

Usage:
    python test_tools.py
"""

from __future__ import annotations

import json
import sys
import time
from typing import Any

from tools import (
    growth_analysis,
    meal_planner,
    nutrition_analysis,
    rag_search,
    update_ner,
    update_rag,
    web_search,
)


def _print_separator(title: str):
    print("\n" + "=" * 70)
    print(f"  TESTING TOOL: {title}")
    print("=" * 70)


def _display_result(tool_name: str, result: dict[str, Any], expected_keys: list[str]) -> bool:
    print(f"Result keys: {list(result.keys())}")
    
    # Check if result is an error dict
    if "error" in result and len(result) == 2:
        print(f"❌ [{tool_name}] Returned unexpected error: {result['error']}")
        return False
        
    has_expected = any(k in result for k in expected_keys)
    if not has_expected:
        print(f"⚠️ [{tool_name}] Missing expected keys from {expected_keys}")
        return False

    # Check whether it contacted a live server or used fallback stub
    res_str = str(result)
    is_stub = "STUB" in res_str
    mode_badge = "[FALLBACK STUB]" if is_stub else "[LIVE MICROSERVICE]"

    print(f"Status     : ✅ SUCCESS {mode_badge}")
    print("Sample output:")
    for k, v in list(result.items())[:3]:
        val_str = str(v)
        if len(val_str) > 120:
            val_str = val_str[:120] + "..."
        print(f"  • {k}: {val_str}")
        
    return True


def run_all_tool_tests():
    print("=" * 70)
    print("  NUTRIKID AGENTIC TOOLS ISOLATION TEST SUITE")
    print("=" * 70)
    print("Verifying all 7 @tool functions defined in tools.py...\n")

    results: dict[str, bool] = {}

    # -------------------------------------------------------------------------
    # Tool 1: rag_search
    # -------------------------------------------------------------------------
    _print_separator("1. rag_search (FAISS / BM25 / RAG Pipeline)")
    try:
        t0 = time.time()
        res1 = rag_search.invoke({
            "query": "What are good iron-rich complementary foods for toddlers?",
            "child_id": "test_child_01",
        })
        elapsed = round(time.time() - t0, 2)
        print(f"Latency    : {elapsed}s")
        results["rag_search"] = _display_result("rag_search", res1, ["answer", "confidence", "sources"])
    except Exception as e:
        print(f"❌ Exception running rag_search: {e}")
        results["rag_search"] = False

    # -------------------------------------------------------------------------
    # Tool 2: meal_planner
    # -------------------------------------------------------------------------
    _print_separator("2. meal_planner (Pediatric Diet Generator)")
    try:
        t0 = time.time()
        res2 = meal_planner.invoke({
            "child_id": "64a1f3e2b8c9d12e45f67890",
            "plan_type": "daily",
            "focus_nutrients": ["iron", "calcium"],
            "age": 5.0,
            "weight": 18.0,
            "allergies": [],
        })
        elapsed = round(time.time() - t0, 2)
        print(f"Latency    : {elapsed}s")
        results["meal_planner"] = _display_result("meal_planner", res2, ["meals", "meal_plan", "total_macros", "totals"])
    except Exception as e:
        print(f"❌ Exception running meal_planner: {e}")
        results["meal_planner"] = False

    # -------------------------------------------------------------------------
    # Tool 3: growth_analysis
    # -------------------------------------------------------------------------
    _print_separator("3. growth_analysis (WHO Growth Percentiles)")
    try:
        t0 = time.time()
        res3 = growth_analysis.invoke({
            "child_id": "64a1f3e2b8c9d12e45f67890",
        })
        elapsed = round(time.time() - t0, 2)
        print(f"Latency    : {elapsed}s")
        results["growth_analysis"] = _display_result("growth_analysis", res3, ["latest", "percentile", "risk_status", "deficiencies"])
    except Exception as e:
        print(f"❌ Exception running growth_analysis: {e}")
        results["growth_analysis"] = False

    # -------------------------------------------------------------------------
    # Tool 4: nutrition_analysis
    # -------------------------------------------------------------------------
    _print_separator("4. nutrition_analysis (Diet Deficiencies & Screening)")
    try:
        t0 = time.time()
        res4 = nutrition_analysis.invoke({
            "child_id": "64a1f3e2b8c9d12e45f67890",
            "date": "2026-11-13",
            "allergen_check_food": "peanuts",
        })
        elapsed = round(time.time() - t0, 2)
        print(f"Latency    : {elapsed}s")
        results["nutrition_analysis"] = _display_result("nutrition_analysis", res4, ["macros", "deficiencies", "dailyAverages"])
    except Exception as e:
        print(f"❌ Exception running nutrition_analysis: {e}")
        results["nutrition_analysis"] = False

    # -------------------------------------------------------------------------
    # Tool 5: web_search
    # -------------------------------------------------------------------------
    _print_separator("5. web_search (DuckDuckGo / External Fallback)")
    try:
        t0 = time.time()
        res5 = web_search.invoke({
            "query": "ICMR pediatric dietary guidelines protein requirement 5 year old",
        })
        elapsed = round(time.time() - t0, 2)
        print(f"Latency    : {elapsed}s")
        results["web_search"] = _display_result("web_search", res5, ["results", "confidence"])
    except Exception as e:
        print(f"❌ Exception running web_search: {e}")
        results["web_search"] = False

    # -------------------------------------------------------------------------
    # Tool 6: update_rag
    # -------------------------------------------------------------------------
    _print_separator("6. update_rag (Dynamic Knowledge Indexing)")
    try:
        t0 = time.time()
        res6 = update_rag.invoke({
            "new_knowledge": "Ragi is Eleusine coracana, an exceptionally rich source of dietary calcium (344mg/100g).",
            "source_label": "icmr_nutrition_update",
        })
        elapsed = round(time.time() - t0, 2)
        print(f"Latency    : {elapsed}s")
        results["update_rag"] = _display_result("update_rag", res6, ["status", "chunk_id", "message"])
    except Exception as e:
        print(f"❌ Exception running update_rag: {e}")
        results["update_rag"] = False

    # -------------------------------------------------------------------------
    # Tool 7: update_ner
    # -------------------------------------------------------------------------
    _print_separator("7. update_ner (Clinical Concept Registration)")
    try:
        t0 = time.time()
        res7 = update_ner.invoke({
            "entity_text": "drumstick leaves soup",
            "entity_type": "FOOD",
            "example_sentence": "Drumstick leaves soup is given to treat iron deficiency in young children.",
        })
        elapsed = round(time.time() - t0, 2)
        print(f"Latency    : {elapsed}s")
        results["update_ner"] = _display_result("update_ner", res7, ["status", "entity_id", "message"])
    except Exception as e:
        print(f"❌ Exception running update_ner: {e}")
        results["update_ner"] = False

    # -------------------------------------------------------------------------
    # Summary
    # -------------------------------------------------------------------------
    print("\n" + "=" * 70)
    print("  TOOL TEST SUMMARY")
    print("=" * 70)
    all_passed = True
    for name, ok in results.items():
        status_icon = "✅ PASSED" if ok else "❌ FAILED"
        if not ok:
            all_passed = False
        print(f"  {name:<24} : {status_icon}")

    print("=" * 70)
    if all_passed:
        print("🎉 ALL 7 TOOLS FUNCTIONING PROPERLY!")
    else:
        print("⚠️ Some tools had errors. Check the logs above.")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    run_all_tool_tests()
