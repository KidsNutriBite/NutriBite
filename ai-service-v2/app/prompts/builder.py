from typing import Dict, Any, List
from app.prompts.master_system_prompt import MASTER_SYSTEM_PROMPT
from app.prompts.nutrition_prompt import NUTRITION_PROMPT
from app.prompts.safety_prompt import SAFETY_PROMPT, KIDS_COMPANIONS, KIDS_RESPONSE_JSON_TEMPLATE
from app.prompts.planner_prompt import PLANNER_PROMPT

def build_chatbot_prompt(
    query: str,
    profile: Dict[str, Any],
    rag_context: List[str],
    planner_output: Dict[str, Any],
    is_kids_mode: bool = False,
    history: List[Dict[str, str]] = None,
    intent: str = "general_question"
) -> str:
    """
    Assembles static prompts and dynamic inputs cleanly for the LLM.
    """
    # 1. Base System Instructions
    if is_kids_mode:
        equipped = profile.get("equippedCompanion", "Captain Milk")
        companion_style = KIDS_COMPANIONS.get(equipped, KIDS_COMPANIONS["Captain Milk"])
        
        system_instructions = (
            "You are a kid-friendly pediatric nutrition intelligence assistant inside the NutriBite platform.\n"
            f"Specifically: {companion_style}\n\n"
            f"{KIDS_RESPONSE_JSON_TEMPLATE}"
        )
    else:
        system_instructions = (
            f"{MASTER_SYSTEM_PROMPT}\n"
            f"DETECTED USER INTENT: '{intent}'. You MUST tailor your guidance to this intent.\n\n"
            f"{NUTRITION_PROMPT}\n\n"
            f"{PLANNER_PROMPT}\n\n"
            f"{SAFETY_PROMPT}"
        )

    # 2. Format Planner Data
    planner_cal = planner_output.get("nutritional_validation", {}).get("planned_calories_kcal", 0)
    target_cal = planner_output.get("nutritional_validation", {}).get("target_calories_kcal", 0)
    planner_prot = planner_output.get("nutritional_validation", {}).get("planned_protein_g", 0)
    target_prot = planner_output.get("nutritional_validation", {}).get("target_protein_g", 0)
    
    planner_str = (
        f"Calorie Target: {target_cal} kcal | Planned: {planner_cal} kcal\n"
        f"Protein Target: {target_prot} g | Planned: {planner_prot} g\n"
        f"Blocked Allergenic Foods: {', '.join(planner_output.get('blocked_foods_allergy', []))}\n"
        f"Condition Filtered Out Tags: {', '.join(planner_output.get('planner_filtered_out', []))}\n"
    )
    
    meal_lines = []
    for meal, details in planner_output.get("diet_plan", {}).items():
        meal_lines.append(f"- {meal.upper()}: {details.get('description')} ({details.get('calories_kcal')} kcal, {details.get('protein_g')}g protein)")
    planner_str += "\n".join(meal_lines)

    # 3. Format RAG Context
    rag_section = "\n".join([f"- {chunk}" for chunk in rag_context])

    # 4. Format Conversation History
    history_section = ""
    if history:
        recent_history = history[-5:]
        history_lines = []
        for msg in recent_history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            history_lines.append(f"{role.upper()}: {content}")
        history_section = "\n".join(history_lines)

    prompt = f"""SYSTEM:
{system_instructions}

--------------------------------

CHILD PROFILE:
Age: {profile.get('age', 'N/A')} years
Goal: {profile.get('goal', 'healthy_maintain')}
Condition: {profile.get('condition', 'None')}
Diet Type: {profile.get('diet_type', 'veg')}
Region: {profile.get('region', 'south_india')}
Allergies: {', '.join(profile.get('allergies', [])) if profile.get('allergies') else 'None'}

--------------------------------

STRUCTURED NUMERICAL TRUTH (PLANNER OUTPUT):
{planner_str}

--------------------------------

SEMANTIC KNOWLEDGE CONTEXT (RAG GUIDELINES):
{rag_section if rag_section else 'No specific RAG guidelines retrieved.'}

--------------------------------

CONVERSATION HISTORY:
{history_section if history_section else 'No previous conversation context.'}

--------------------------------

USER QUERY:
{query}

--------------------------------

Generate your safe, personalized pediatric nutrition response:
"""
    return prompt
