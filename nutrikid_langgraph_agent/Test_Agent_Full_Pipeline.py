"""
Test_Agent_Full_Pipeline.py
===========================
End-to-end automated test for the NutriKid LangGraph 7-Node Agentic System.
Tests a complex multi-intent pediatric clinical scenario:
- Deficiency symptoms (fatigue, paleness) -> triggers Nutrition Analysis + RAG Search
- Growth delay concerns -> triggers Growth Analysis
- Dietary planning with allergen restrictions -> triggers Meal Planner (Allergen-filtered)
- Algorithm 3 Safety & Hallucination verification
- Final pediatric synthesis + Follow-up proactive suggestions
"""

import sys
import json
import uuid
from dotenv import load_dotenv

load_dotenv()

from graph import nutrikid_graph
from state import AgentState

def run_agent_test():
    print("=" * 80)
    print("🚀 NUTRIKID AGENTIC AI — FULL PIPELINE VERIFICATION TEST")
    print("=" * 80)

    # Complex multi-layered parent query
    complex_query = (
        "My 6-year-old daughter is feeling unusually tired, looks pale, and her weight "
        "has been below average on WHO charts. She has an allergy to eggs and peanuts. "
        "Can you analyze what deficiencies she might have, check her growth trajectory, "
        "and suggest an allergen-safe Indian meal plan rich in bioavailable iron and calcium?"
    )

    conv_id = f"test-agentic-{uuid.uuid4().hex[:8]}"
    child_id = "demo_123"

    print(f"\n[1] 📋 INPUT QUERY:")
    print(f"    \"{complex_query}\"")
    print(f"    Child ID        : {child_id}")
    print(f"    Conversation ID : {conv_id}")

    initial_state: AgentState = {
        "messages":               [],
        "user_query":             complex_query,
        "normalized_query":       "",
        "intent":                 "",
        "child_id":               child_id,
        "child_context":          {
            "child_id": child_id,
            "name": "Aanya",
            "age_years": 6.0,
            "weight_kg": 17.5,
            "height_cm": 110.0,
            "allergies": ["egg", "peanut"],
            "conditions": ["mild_fatigue"],
            "dietary_preference": "Vegetarian",
            "growth_risk": "normal"
        },
        "selected_tools":         [],
        "executed_tools":         [],
        "allow_external":         False,
        "tool_results":           {},
        "rag_confidence":         0.0,
        "verification_decision":  "",
        "verification_reason":    "",
        "step_count":             0,
        "final_response":         "",
        "follow_ups":             [],
        "safety_flags":           [],
        "conversation_id":        conv_id,
    }

    config = {
        "configurable": {
            "thread_id": conv_id
        }
    }

    print("\n[2] ⚙️  EXECUTING LANGGRAPH 7-NODE WORKFLOW...")
    print("    Understand ➔ Observe ➔ Plan ➔ Act ➔ Verify ➔ Synthesize ➔ Followup")
    
    try:
        final_state = nutrikid_graph.invoke(initial_state, config=config)
    except Exception as e:
        print(f"\n❌ Error invoking LangGraph: {e}")
        import traceback
        traceback.print_exc()
        return

    print("\n" + "=" * 80)
    print("🎯 AGENT EXECUTION INSPECTION")
    print("=" * 80)

    # 1. Understand Node Output
    print(f"\n📌 NODE 1: UNDERSTAND (Algorithm 1 Intent & Entity Classifier)")
    print(f"   • Detected Intent  : {final_state.get('intent')}")
    print(f"   • Normalized Query : {final_state.get('normalized_query')[:100]}...")

    # 2. Observe Node Output
    print(f"\n📌 NODE 2: OBSERVE (Child Context Loader)")
    ctx = final_state.get("child_context", {})
    print(f"   • Child Name       : {ctx.get('name', 'N/A')} (Age {ctx.get('age_years')}, {ctx.get('weight_kg')} kg)")
    print(f"   • Active Allergies : {ctx.get('allergies')}")

    # 3. Plan Node Output
    print(f"\n📌 NODE 3: PLAN (Algorithm 2 Dynamic Tool Selection)")
    print(f"   • Selected Tools   : {final_state.get('selected_tools')}")
    print(f"   • Executed Tools   : {final_state.get('executed_tools')}")

    # 4. Act Node Output
    print(f"\n📌 NODE 4: ACT (Tool Execution Results)")
    tool_results = final_state.get("tool_results", {})
    for tool_name, data in tool_results.items():
        if isinstance(data, dict):
            src = data.get("source", "tool_output")
            keys = list(data.keys())
            print(f"   • Tool '{tool_name}' ➔ Source: {src} | Output Keys: {keys[:5]}")
        else:
            print(f"   • Tool '{tool_name}' ➔ Output: {str(data)[:80]}")

    # 5. Verify Node Output
    print(f"\n📌 NODE 5: VERIFY (Algorithm 3 Safety & Hallucination Gate)")
    decision = final_state.get("verification_decision")
    status_icon = "✅" if decision == "PASS" else "⚠️" if decision == "PROCEED" else "🛑"
    print(f"   • Decision         : {status_icon} {decision}")
    print(f"   • Reason           : {final_state.get('verification_reason')}")
    print(f"   • RAG Confidence   : {final_state.get('rag_confidence')}")
    print(f"   • Safety Flags     : {final_state.get('safety_flags') or 'None (Clean)'}")

    # 6. Synthesize Node Output
    print(f"\n📌 NODE 6: SYNTHESIZE (LLM Grounded Pediatric Consultation)")
    response_text = final_state.get("final_response", "")
    print("-" * 80)
    print(response_text)
    print("-" * 80)

    # 7. Follow-up Node Output
    print(f"\n📌 NODE 7: FOLLOW-UP (Proactive Pediatric Suggestions)")
    follow_ups = final_state.get("follow_ups", [])
    for idx, f in enumerate(follow_ups, 1):
        print(f"   {idx}. {f}")

    print("\n" + "=" * 80)
    print("✅ AGENTIC INTEGRITY CHECK SUMMARY")
    print(f"   1. Multi-Tool Planning : {'PASS' if len(final_state.get('executed_tools', [])) >= 2 else 'CHECK'}")
    print(f"   2. Safety Gate Passed  : {'PASS' if decision in ('PASS', 'PROCEED') else 'BLOCKED'}")
    # Allergen Safety check: verifies clinical allergen awareness and zero prohibited foods recommended
    prohibited = ["boiled egg", "fried egg", "omelette", "peanut butter", "roasted peanuts", "peanut chutney"]
    contains_prohibited = any(p in response_text.lower() for p in prohibited)
    acknowledges_allergens = any(phrase in response_text.lower() for phrase in ["allergy", "allergies", "exclude", "without any allergens"])
    allergen_safe = acknowledges_allergens and not contains_prohibited
    print(f"   3. Allergen Safety     : {'PASS' if allergen_safe else 'FLAG'}")
    print(f"   4. Response Generated  : {'PASS' if len(response_text) > 100 else 'FAIL'}")
    print(f"   5. Follow-ups Present  : {'PASS' if len(follow_ups) > 0 else 'FAIL'}")
    print("=" * 80)

if __name__ == "__main__":
    run_agent_test()
