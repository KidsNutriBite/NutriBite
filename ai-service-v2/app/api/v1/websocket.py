import json
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict, Any

from app.utils.logger import logger
from app.guardrails.security_guardrails import audit_security_gate
from app.guardrails.safety import apply_guardrails
from app.rag.hybrid_retriever import retrieve_hybrid_chunks
from app.planner.engine import generate_personalized_diet_plan
from app.prompts.builder import build_chatbot_prompt
from app.models.model_router import get_model_router
from app.services.tracing_service import get_tracing_service

router = APIRouter()
model_router = get_model_router()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Total: {len(self.active_connections)}")

    async def send_json(self, data: Dict[str, Any], websocket: WebSocket):
        await websocket.send_json(data)

manager = ConnectionManager()

# Parsing Helpers duplicated for WebSocket payload processing compatibility
def parse_int_from_string(val: str, default: int = 5) -> int:
    try:
        import re
        nums = re.findall(r'\d+', val)
        if nums:
            return int(nums[0])
    except:
        pass
    return default

def parse_float_from_string(val: str, default: float = 18.0) -> float:
    try:
        import re
        nums = re.findall(r'\d+\.?\d*', val)
        if nums:
            return float(nums[0])
    except:
        pass
    return default

def parse_conditions_and_allergies(cond_str: str) -> tuple:
    if not cond_str or cond_str.lower() in ["none", "null", "undefined"]:
        return None, []
        
    parts = [p.strip().lower() for p in cond_str.split(",")]
    known_conditions = ["fever", "cold", "diarrhea", "constipation"]
    active_condition = None
    allergies = []
    
    for part in parts:
        if part in known_conditions:
            active_condition = part
        else:
            allergies.append(part)
            
    return active_condition, allergies

@router.websocket("/ws/chat")
async def websocket_chat_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time token-by-token orchestrated RAG streaming.
    """
    await manager.connect(websocket)
    tracer = get_tracing_service()
    
    try:
        while True:
            # 1. Receive query payload
            data = await websocket.receive_json()
            query = data.get("question", "")
            if not query:
                await manager.send_json({"error": "Empty question payload"}, websocket)
                continue
                
            logger.info(f"[WS] Received query: {query}")
            
            # 2. Check Security Injection Shield
            security_check = audit_security_gate(query)
            if security_check.get("compromised"):
                await manager.send_json({
                    "type": "error",
                    "content": security_check["message"]
                }, websocket)
                await manager.send_json({"type": "done", "content": ""}, websocket)
                continue

            # 3. Parse child variables
            parsed_age = parse_int_from_string(data.get("age", "5"))
            parsed_weight = parse_float_from_string(data.get("weight", "18"))
            parsed_condition, parsed_allergies = parse_conditions_and_allergies(data.get("conditions", "None"))
            
            goal = "healthy_maintain"
            if "gain" in query.lower() or "underweight" in query.lower():
                goal = "weight_gain"
            elif "lose" in query.lower() or "overweight" in query.lower():
                goal = "weight_loss"
                
            profile = {
                "age": parsed_age,
                "weight": parsed_weight,
                "goal": goal,
                "condition": parsed_condition,
                "diet_type": "veg",
                "region": "south_india",
                "allergies": parsed_allergies,
                "equippedCompanion": data.get("equippedCompanion", "Captain Milk")
            }
            
            is_kids = data.get("audience") == "kid"

            # 4. Check Safety Guardrails
            safety_check = apply_guardrails(query, profile, is_kids_mode=is_kids)
            if not safety_check["safe"]:
                await manager.send_json({
                    "type": "error",
                    "content": safety_check["response"]
                }, websocket)
                await manager.send_json({"type": "done", "content": ""}, websocket)
                continue

            # 5. Fetch Hybrid Chunks & Citations
            await manager.send_json({"type": "status", "content": "RAG chunks retrieving..."}, websocket)
            rag_context, citations = retrieve_hybrid_chunks(query, top_k=8)
            await manager.send_json({"type": "citations", "content": citations}, websocket)

            # 6. Fetch Deterministic Planner Targets
            planner_output = generate_personalized_diet_plan(profile, instructions=query)

            # 7. Dynamic Prompt Builder
            prompt = build_chatbot_prompt(
                query=query,
                profile=profile,
                rag_context=rag_context,
                planner_output=planner_output,
                is_kids_mode=is_kids,
                history=data.get("history", [])
            )

            # 8. Start streaming tokens from ModelRouter
            logger.info(f"[WS] Starting stream resolution...")
            for block in model_router.stream(
                prompt=prompt,
                system_instruction="You are a medical-grade pediatric nutrition assistant." if not is_kids_mode else "",
                is_kids_mode=is_kids,
                planner_output=planner_output,
                intent_header="Personalized Pediatric Plan"
            ):
                await manager.send_json({
                    "type": "token",
                    "content": block["token"]
                }, websocket)
                
            await manager.send_json({"type": "done", "content": ""}, websocket)
            logger.info(f"[WS] Streaming complete.")

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"[WS ERROR] {e}")
        try:
            await manager.send_json({"type": "error", "content": f"WebSocket error: {str(e)}"}, websocket)
            await websocket.close()
        except:
            pass
        manager.disconnect(websocket)
