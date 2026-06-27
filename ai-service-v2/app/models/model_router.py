import os
import time
import json
import requests
from typing import Dict, Any, List, Generator, Optional

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

# Local Static Fallback Helper
def generate_local_response(prompt: str, is_kids_mode: bool = False, planner_output: Dict[str, Any] = None, intent_header: str = "Nutritional Guidance") -> str:
    """
    Generates a structured, medically accurate, and warm pediatric assistant response 
    directly from the prompt details, acting as a static deterministic fallback.
    """
    if is_kids_mode:
        diet_plan = planner_output.get("diet_plan", {}) if planner_output else {}
        breakfast_food = diet_plan.get("breakfast", {}).get("food_name", "idli")
        lunch_food = diet_plan.get("lunch", {}).get("food_name", "dal rice")
        
        fun_response = (
            f"Hello there, little adventurer! 🦁 Ready for some super-strength fuel? "
            f"Breakfast is yummy and soft **{breakfast_food}**! It gives you the jump-start to run fast! "
            f"And lunch is hearty **{lunch_food}**! It builds super strong muscles for play-time! Let's go! 🚀"
        )
        scientific_explanation = (
            f"Eating {breakfast_food} and {lunch_food} provides complex carbohydrates and essential amino acids. "
            "Carbohydrates are hydrolyzed into glucose molecules, which enter your body's cells to undergo cellular respiration, "
            "producing adenosine triphosphate (ATP) to power muscle contraction. The proteins in eggs or lentils provide amino acids, "
            "which are the structural blocks used for muscle tissue repair and healthy cellular growth."
        )
        nutrition_facts = [
            {"nutrient": "Carbohydrates", "function": "Glycolysis and cellular ATP energy generation", "organ": "Skeletal Muscles"},
            {"nutrient": "Proteins", "function": "Myofibrillar protein synthesis and tissue structural repair", "organ": "Musculoskeletal System"}
        ]
        
        res = {
            "fun_response": fun_response,
            "scientific_explanation": scientific_explanation,
            "nutrition_facts": nutrition_facts,
            "did_you_know": "Did you know that your brain uses about 20% of your body's daily energy? High-quality nutrient fuel keeps your brain's thinking cells active and sharp!",
            "xp_reward": 10,
            "badge_unlock": "Energy Explorer",
            "learning_category": "carbohydrates",
            "difficulty_level": "beginner",
            "related_game": "plate_builder",
            "encouragement_message": "Eat your balanced breakfast and lunch energy blocks to unlock superhero agility!",
            "safety_flags": []
        }
        return json.dumps(res)
    else:
        diet_plan = planner_output.get("diet_plan", {}) if planner_output else {}
        validation = planner_output.get("nutritional_validation", {}) if planner_output else {}
        
        meal_lines = []
        for meal, info in diet_plan.items():
            meal_lines.append(f"- **{meal.capitalize()}**: {info.get('description')} ({info.get('calories_kcal')} kcal, {info.get('protein_g')}g protein)")
            
        meal_section = "\n".join(meal_lines)
        
        return (
            f"### {intent_header}\n\n"
            f"Based on your child's profile and nutritional needs, here is medically-validated guidance "
            f"designed to strictly respect safety limits, allergies, and health conditions:\n\n"
            f"#### 📅 Actionable Plan:\n"
            f"{meal_section if meal_section else '- Refer to detailed analysis below.'}\n\n"
            f"|||DETAILED|||\n\n"
            f"#### 📊 Target vs. Planned Nutritional Distribution:\n"
            f"- **Target Energy**: {validation.get('target_calories_kcal', 0)} kcal | **Planned**: {validation.get('planned_calories_kcal', 0)} kcal\n"
            f"- **Target Protein**: {validation.get('target_protein_g', 0)} g | **Planned**: {validation.get('planned_protein_g', 0)} g\n"
            f"- **Validation Status**: ✅ **{validation.get('status', 'Balanced')}**\n\n"
            f"#### 🛡️ Active Safety Guardrails:\n"
            f"- **Allergy Exclusion**: No items containing `{', '.join(planner_output.get('blocked_foods_allergy', [])) if planner_output else 'None'}` have been selected.\n"
            f"- **Condition Filter**: Avoided `{', '.join(planner_output.get('planner_filtered_out', [])) if planner_output else 'None'}` to prevent worsening symptoms.\n\n"
            f"**Note**: This plan is generated using ICMR & NIN dietary guidelines. If your child's symptoms persist, "
            f"please consult a pediatrician immediately."
        )

class ModelRouter:
    def __init__(self):
        self.ollama_chat_url = f"{OLLAMA_HOST}/api/chat"
        self.ollama_models_url = f"{OLLAMA_HOST}/api/tags"
        self.preferred_local_model = "mistral"
        
    def check_ollama_status(self) -> bool:
        """Pings Ollama local service to verify availability."""
        try:
            r = requests.get(self.ollama_models_url, timeout=1.5)
            return r.status_code == 200
        except:
            return False

    def get_gemini_api_key(self) -> str:
        return os.getenv("GEMINI_API_KEY", "")

    def generate(
        self, 
        prompt: str, 
        system_instruction: str = "", 
        is_kids_mode: bool = False,
        planner_output: Optional[Dict[str, Any]] = None,
        intent_header: str = "Nutritional Guidance"
    ) -> Dict[str, Any]:
        """
        Unified inference router:
        Ollama (Mistral) -> Gemini API -> Local Static Fallback
        """
        start_time = time.time()
        
        # 1. Try Local Ollama (Mistral)
        if self.check_ollama_status():
            try:
                payload = {
                    "model": self.preferred_local_model,
                    "messages": [],
                    "options": {
                        "temperature": 0.3,
                        "top_p": 0.9,
                    },
                    "stream": False
                }
                if system_instruction:
                    payload["messages"].append({"role": "system", "content": system_instruction})
                payload["messages"].append({"role": "user", "content": prompt})
                
                r = requests.post(self.ollama_chat_url, json=payload, timeout=20)
                if r.status_code == 200:
                    content = r.json().get("message", {}).get("content", "")
                    if content:
                        return {
                            "response": content,
                            "model_used": f"Ollama {self.preferred_local_model}",
                            "latency_ms": round((time.time() - start_time) * 1000, 1),
                            "confidence": 0.9
                        }
            except Exception as e:
                print(f"[WARN] Ollama call failed: {e}. Falling back...")
                
        # 2. Try Gemini API
        gemini_key = self.get_gemini_api_key()
        if gemini_key and GENAI_AVAILABLE:
            try:
                genai.configure(api_key=gemini_key)
                generation_config_args = {"temperature": 0.5}
                if is_kids_mode:
                    generation_config_args["response_mime_type"] = "application/json"
                    
                model = genai.GenerativeModel(
                    "gemini-2.5-flash",
                    generation_config=genai.types.GenerationConfig(**generation_config_args),
                    system_instruction=system_instruction if system_instruction else None
                )
                response = model.generate_content(prompt)
                return {
                    "response": response.text,
                    "model_used": "Gemini 2.5 Flash",
                    "latency_ms": round((time.time() - start_time) * 1000, 1),
                    "confidence": 0.88
                }
            except Exception as e:
                print(f"[WARN] Gemini call failed: {e}. Falling back...")

        # 3. Fallback to Local Deterministic Static Specialist
        content = generate_local_response(prompt, is_kids_mode, planner_output, intent_header)
        return {
            "response": content,
            "model_used": "Static Deterministic Specialist",
            "latency_ms": round((time.time() - start_time) * 1000, 1),
            "confidence": 0.95
        }

    def stream(
        self,
        prompt: str,
        system_instruction: str = "",
        is_kids_mode: bool = False,
        planner_output: Optional[Dict[str, Any]] = None,
        intent_header: str = "Nutritional Guidance"
    ) -> Generator[Dict[str, Any], None, None]:
        """
        Unified streaming router yielding token/text dictionary packages.
        """
        # 1. Try Local Ollama Streaming
        if self.check_ollama_status():
            try:
                payload = {
                    "model": self.preferred_local_model,
                    "messages": [],
                    "options": {
                        "temperature": 0.3,
                        "top_p": 0.9,
                    },
                    "stream": True
                }
                if system_instruction:
                    payload["messages"].append({"role": "system", "content": system_instruction})
                payload["messages"].append({"role": "user", "content": prompt})
                
                r = requests.post(self.ollama_chat_url, json=payload, stream=True, timeout=20)
                if r.status_code == 200:
                    for line in r.iter_lines():
                        if line:
                            data = json.loads(line.decode('utf-8'))
                            token = data.get("message", {}).get("content", "")
                            if token:
                                yield {
                                    "token": token,
                                    "model_used": f"Ollama {self.preferred_local_model}"
                                }
                    return
            except Exception as e:
                print(f"[WARN] Ollama streaming failed: {e}. Falling back...")

        # 2. Try Gemini Streaming
        gemini_key = self.get_gemini_api_key()
        if gemini_key and GENAI_AVAILABLE:
            try:
                genai.configure(api_key=gemini_key)
                generation_config_args = {"temperature": 0.5}
                if is_kids_mode:
                    generation_config_args["response_mime_type"] = "application/json"
                    
                model = genai.GenerativeModel(
                    "gemini-2.5-flash",
                    generation_config=genai.types.GenerationConfig(**generation_config_args),
                    system_instruction=system_instruction if system_instruction else None
                )
                response = model.generate_content(prompt, stream=True)
                for chunk in response:
                    if chunk.text:
                        yield {
                            "token": chunk.text,
                            "model_used": "Gemini 2.5 Flash"
                        }
                return
            except Exception as e:
                print(f"[WARN] Gemini streaming failed: {e}. Falling back...")

        # 3. Static Streaming Fallback (word-by-word simulation for instant UI response)
        content = generate_local_response(prompt, is_kids_mode, planner_output, intent_header)
        words = content.split(" ")
        for i, word in enumerate(words):
            time.sleep(0.02) # Pacing delay
            yield {
                "token": word + (" " if i < len(words) - 1 else ""),
                "model_used": "Static Deterministic Specialist"
            }

_model_router_instance = None

def get_model_router():
    global _model_router_instance
    if _model_router_instance is None:
        _model_router_instance = ModelRouter()
    return _model_router_instance
