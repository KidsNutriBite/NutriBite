import json
from typing import Dict, Any, List, Optional
from app.guardrails.security_guardrails import audit_security_gate
from app.guardrails.safety import apply_guardrails
from app.rag.hybrid_retriever import retrieve_hybrid_chunks
from app.planner.engine import generate_personalized_diet_plan
from app.prompts.builder import build_chatbot_prompt
from app.models.model_router import get_model_router
from app.services.tracing_service import get_tracing_service
from app.schemas.chat_response import ChatResponse

class ChatOrchestrator:
    def __init__(self):
        self.model_router = get_model_router()

    async def handle_request(
        self,
        query: str,
        profile: Dict[str, Any],
        history: List[Dict[str, str]] = None,
        is_kids_mode: bool = False,
        request_id: Optional[str] = None
    ) -> ChatResponse:
        """
        Main orchestrated execution flow:
        Security Gate -> Safety Guardrails -> RAG Retrieval -> Planner Engine -> Prompt Building -> Model Router -> Response Schema.
        """
        # 1. Start Trace Span
        tracer = get_tracing_service(request_id)
        
        try:
            # 2. Security Injection Shield Gate
            security_check = audit_security_gate(query)
            if security_check.get("compromised"):
                tracer.log_complete(query, status="security_blocked")
                return ChatResponse(
                    answer=security_check["message"],
                    sources=[],
                    confidence=0.0,
                    model_used="Active Shield Gate",
                    request_id=tracer.request_id
                )

            # 3. Medical Emergency & Bedtime Guardrails Gate
            safety_check = apply_guardrails(query, profile, is_kids_mode=is_kids_mode)
            if not safety_check["safe"]:
                tracer.log_complete(query, status="safety_blocked")
                return ChatResponse(
                    answer=safety_check["response"],
                    sources=[],
                    confidence=0.0,
                    model_used="Active Guardrail Gate",
                    request_id=tracer.request_id
                )

            # 4. Hybrid RAG Retrieval Span
            retrieval_start = tracer.start_span()
            rag_context, citations = retrieve_hybrid_chunks(query, top_k=8)
            retrieval_duration = tracer.end_span(retrieval_start)
            tracer.log_retrieval(retrieval_duration, len(rag_context))

            # 5. Deterministic Diet Planner Span
            planner_output = generate_personalized_diet_plan(profile, instructions=query)

            # 6. Dynamic Prompt Compilation
            prompt = build_chatbot_prompt(
                query=query,
                profile=profile,
                rag_context=rag_context,
                planner_output=planner_output,
                is_kids_mode=is_kids_mode,
                history=history or []
            )

            # 7. Model Router Inference Span
            generation_start = tracer.start_span()
            inference_result = self.model_router.generate(
                prompt=prompt,
                system_instruction="You are a medical-grade pediatric nutrition assistant." if not is_kids_mode else "",
                is_kids_mode=is_kids_mode,
                planner_output=planner_output,
                intent_header="Personalized Pediatric Plan"
            )
            generation_duration = tracer.end_span(generation_start)
            
            raw_answer = inference_result["response"]
            model_used = inference_result["model_used"]
            confidence = inference_result["confidence"]
            
            tracer.log_generation(generation_duration, model_used, confidence)

            # 8. Post-Processing & Standard Formatting
            final_answer = raw_answer
            if is_kids_mode:
                # Attempt to parse json for kids mode
                try:
                    cleaned_str = raw_answer.strip()
                    if cleaned_str.startswith("```json"):
                        cleaned_str = cleaned_str[7:]
                    if cleaned_str.endswith("```"):
                        cleaned_str = cleaned_str[:-3]
                    cleaned_str = cleaned_str.strip()
                    final_answer = json.loads(cleaned_str)
                except Exception as e:
                    print(f"[JSON Decode Error] Fallback kids mode triggered: {e}")
                    # Local fallback kid schema
                    final_answer = {
                        "fun_response": raw_answer,
                        "scientific_explanation": "A balanced intake of vitamins and minerals supports cellular energy metabolism.",
                        "nutrition_facts": [{"nutrient": "Vitamins", "function": "Coenzymes for cellular metabolism", "organ": "Whole Body"}],
                        "did_you_know": "Did you know that drinking enough water helps every single cell in your body work faster?",
                        "xp_reward": 5,
                        "badge_unlock": "",
                        "learning_category": "hydration",
                        "difficulty_level": "beginner",
                        "related_game": "adventure_map",
                        "encouragement_message": "Eat fresh and stay active!",
                        "safety_flags": []
                    }
            else:
                # For Parents Mode, keep |||DETAILED||| formatting
                if "|||DETAILED|||" not in raw_answer:
                    short_verdict = (
                        f"For your {profile.get('age')}-year-old child, here is a tailored recommendation:\n"
                        f"- **Dietary focus**: {planner_output.get('diet_plan', {}).get('breakfast', {}).get('food_name', 'Soft food')} for breakfast and {planner_output.get('diet_plan', {}).get('lunch', {}).get('food_name', 'dal rice')} for lunch.\n"
                        f"- **Nutrition**: Total planned is {planner_output.get('nutritional_validation', {}).get('planned_calories_kcal')} kcal, meeting energy guidelines.\n"
                        f"- **Safety**: Excluded `{', '.join(profile.get('allergies', [])) if profile.get('allergies') else 'None'}` due to allergen tags."
                    )
                    final_answer = f"{short_verdict}\n\n|||DETAILED|||\n\n{raw_answer}"

            tracer.log_complete(query, status="success")

            return ChatResponse(
                answer=final_answer,
                sources=citations,
                confidence=confidence,
                model_used=model_used,
                request_id=tracer.request_id
            )

        except Exception as e:
            tracer.log_complete(query, status=f"failed: {str(e)}")
            return ChatResponse(
                answer="An internal orchestration error occurred while processing your request. Please try again.",
                sources=[],
                confidence=0.0,
                model_used="Orchestrator Error",
                request_id=tracer.request_id
            )

_chat_orchestrator_instance = None

def get_chat_orchestrator():
    global _chat_orchestrator_instance
    if _chat_orchestrator_instance is None:
        _chat_orchestrator_instance = ChatOrchestrator()
    return _chat_orchestrator_instance
