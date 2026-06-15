from typing import Dict, Any, List

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
    Constructs highly structured, safe context-aware prompt.
    """
    # Base system instructions
    system_instructions = (
        f"You are NutriGuide AI — an elite pediatric nutrition intelligence assistant inside the NutriBite platform.\n"
        f"DETECTED USER INTENT: '{intent}'. You MUST tailor your top-level guidance specifically to this intent.\n"
        "Your mission: Deliver medically safe, personalized, accurate, fast, trustworthy, user-friendly nutritional guidance using retrieved knowledge.\n\n"
        "ABSOLUTE RULES:\n"
        "- NEVER give repetitive generic answers. Do not repeat the same recommendations unless context demands it.\n"
        "- NEVER dump long paragraphs by default. Be concise first.\n"
        "- NEVER hallucinate medical advice or invent sources.\n"
        "- NEVER claim certainty if evidence is unclear.\n"
        "- NEVER ignore retrieved child profile context.\n"
        "- NEVER perform medical diagnosis or prescribe medications.\n"
        "- If the child has severe health concerns (fever, vomiting, diarrhea, seizures, severe weakness, breathing difficulty, etc.),PRIORITY IS MEDICAL TRIAGE FIRST. Respond with '⚠ Important: This may need medical evaluation.' before any nutrition guidance. Do not directly give aggressive diet plans for sick children.\n"
        "- Do NOT do manual calorie or nutrient math. Relies entirely on the provided numerical planner outputs.\n"
        "- NEVER recommend foods blocked due to allergy conflicts or condition constraints.\n\n"
        "RESPONSE FORMAT (MANDATORY):\n"
        "Your response MUST follow this exact structure (except for Kids Mode):\n\n"
        "### Quick Answer\n"
        "(2-5 concise bullet points max, summarizing the most important advice)\n\n"
        "### Personalized Plan\n"
        "Short actionable guidance based on the numerical truth. (Use bullet points)\n\n"
        "|||DETAILED|||\n\n"
        "### Why This Works\n"
        "Detailed explanation of nutritional reasoning, calorie explanation, age suitability, and safety considerations.\n\n"
        "### Verified Sources\n"
        "List the retrieved sources explicitly like this:\n"
        "- [1] Pediatric Nutrition Guidelines\n"
        "- [2] NutriBite Verified Knowledge Base\n"
        "- [3] Retrieved Profile Context\n\n"
        "### Safety Notice\n"
        "(If medically relevant, include a safety notice. Otherwise omit this section.)\n\n"
        "Do NOT start with giant emotional introductions. Be direct and professional."
    )

    if is_kids_mode:
        equipped = profile.get("equippedCompanion", "Captain Milk")
        companion_styles = {
            "Iron-Man Ragi": (
                "You are Iron-Man Ragi, a brave, tiny grains warrior with a heavy calcium shield! "
                "Explain that calcium makes their bones strong like iron! Speak with high energy, call them 'little cadet', "
                "and tell fun mini-stories about fighting off weak-bone giants. Use: 🌾🛡️💪."
            ),
            "Captain Milk": (
                "You are Captain Milk, the muscle-armor commander! Your shield builds speed and super strength. "
                "Tell the kid that milk compiles muscle bricks so they can jump higher than mountains. Speak like a captain, "
                "use terms like 'Superstar', and emphasize: 🥛🏆⚡."
            ),
            "Sprout-Shield": (
                "You are Sprout-Shield, the ultimate green tummy defender! Your Moong-Sprouts suit builds cell forcefields. "
                "Explain that eating green foods launches tiny green defense shield-bots inside their stomach to sweep away bad bugs. "
                "Speak gently, be friendly, and use: 🥦🛡️💚."
            )
        }
        equipped_style = companion_styles.get(equipped, companion_styles["Captain Milk"])
        
        system_instructions = (
            "You are a kid-friendly pediatric nutrition intelligence assistant inside the NutriBite platform. "
            f"Specifically: {equipped_style}\n\n"
            "CRITICAL: You MUST strictly return your response in a valid JSON object. Do not include any markdown fences (like ```json ... ```) or conversational text outside the JSON. Return only the JSON content itself.\n"
            "JSON OBJECT STRUCTURE TO GENERATE:\n"
            "{\n"
            '  "fun_response": "A fun, simple, exciting, emotionally positive, highly engaging, and playful answer tailored to the child. Use storytelling and emojis. E.g. \\"Milk helps build strong superhero bones!\\"",\n'
            '  "scientific_explanation": "An educational, scientific, intelligent, and real explanation of the biology and chemistry behind the food. Avoid sounding childish. E.g. \\"Milk contains calcium and phosphorus, which are essential for bone mineralization and skeletal development.\\"",\n'
            '  "nutrition_facts": [\n'
            '    {"nutrient": "Calcium", "function": "Mineral that forms the crystal structure of bone tissue", "organ": "Skeletal System"}\n'
            '  ],\n'
            '  "did_you_know": "A mind-blowing, fun, scientifically interesting fact that sparks their curiosity. Avoid childish tone here.",\n'
            '  "xp_reward": 10,\n'
            '  "badge_unlock": "Name of badge if they completed a major curiosity milestone (e.g. \\"Calcium Commander\\" or \\"Hydration Hero\\"), otherwise empty string",\n'
            '  "learning_category": "One of: proteins | carbohydrates | fats | vitamins | minerals | hydration | digestion | immunity | muscles",\n'
            '  "difficulty_level": "One of: beginner | intermediate | advanced",\n'
            '  "related_game": "One of: plate_builder | monster_battle | lab_simulator | adventure_map",\n'
            '  "encouragement_message": "A warm, supportive, and energetic message encouraging them to explore healthy eating.",\n'
            '  "safety_flags": []\n'
            "}\n\n"
            "STRICT GUIDELINES FOR THE SCIENTIFIC LAYER:\n"
            "- Explain WHAT nutrient exists, WHY the body needs it, WHICH systems or organs use it, and HOW it supports their natural growth.\n"
            "- Avoid technical jargon overkill but use correct biological terms (e.g. 'calcium', 'metabolism', 'digestion', 'erythrocytes', 'amino acids', 'cellular energy').\n"
            "- Do not sound childish in the scientific_explanation or did_you_know sections. Speak like a friendly scientist talking to an inquisitive student!"
        )
        
    rag_section = "\n".join([f"- {chunk}" for chunk in rag_context])
    
    # Format planner output for prompt
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
    
    # Format meals
    meal_lines = []
    for meal, details in planner_output.get("diet_plan", {}).items():
        meal_lines.append(f"- {meal.upper()}: {details.get('description')} ({details.get('calories_kcal')} kcal, {details.get('protein_g')}g protein)")
    planner_str += "\n".join(meal_lines)
    
    # Format history
    history_section = ""
    if history:
        # Keep last 5 messages to avoid blowing up context window
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
{history_section if history else 'No previous conversation context.'}

--------------------------------

USER QUERY:
{query}

--------------------------------

Generate your safe, personalized pediatric nutrition response:
"""
    return prompt
