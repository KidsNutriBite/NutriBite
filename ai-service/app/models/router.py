import os
import time
import requests
from typing import Dict, Any, List, Optional
from app.models.llm import get_gemini_api_key, generate_gemini_response

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

class ModelRouter:
    def __init__(self):
        self.ollama_chat_url = f"{OLLAMA_HOST}/api/chat"
        self.ollama_models_url = f"{OLLAMA_HOST}/api/tags"
        
    def check_ollama_status(self) -> bool:
        """
        Pings Ollama local service to verify availability.
        """
        try:
            r = requests.get(self.ollama_models_url, timeout=2)
            return r.status_code == 200
        except:
            return False
            
    def list_available_ollama_models(self) -> List[str]:
        """
        Fetches installed Ollama models on local environment.
        """
        try:
            r = requests.get(self.ollama_models_url, timeout=2)
            if r.status_code == 200:
                models_data = r.json()
                return [m.get("name") for m in models_data.get("models", [])]
        except:
            pass
        return []

    def generate_ollama_response(self, model: str, prompt: str, system_instruction: str = "") -> str:
        """
        Dispatches request straight to local Ollama chat endpoints.
        """
        payload = {
            "model": model,
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
        
        try:
            r = requests.post(self.ollama_chat_url, json=payload, timeout=30)
            if r.status_code == 200:
                data = r.json()
                return data.get("message", {}).get("content", "")
            else:
                return f"Ollama HTTP Error {r.status_code}: {r.text}"
        except Exception as e:
            return f"Ollama Connection Error: {str(e)}"

    def route_request(
        self, 
        prompt: str, 
        privacy_mode: bool = False, 
        preferred_local_model: str = "llama3", 
        system_instruction: str = ""
    ) -> Dict[str, Any]:
        """
        Central router:
        - If privacy_mode is True: Route to local Ollama model.
        - If privacy_mode is False: Route to Google Gemini API (with local fallback if api key is missing).
        """
        start_time = time.time()
        
        # Format preferred_local_model
        model_name = preferred_local_model.lower()
        if model_name not in ["llama3", "mistral", "phi3"]:
            model_name = "llama3" # safe default
            
        api_key = get_gemini_api_key()
        gemini_available = len(api_key) > 0
        
        # Router choice path
        if privacy_mode:
            print(f"[INFO] Privacy Mode Enabled. Routing query to local Ollama: {model_name}")
            # Verify Ollama is running
            if not self.check_ollama_status():
                print("[WARN] Ollama service is unavailable. Triggering degradation fallback.")
                # Fallback scenario (Phase 7): If privacy mode is requested but local LLM is down,
                # we fallback to Gemini with a warning if available, or a localized static specialist.
                if gemini_available:
                    resp = generate_gemini_response(prompt, api_key)
                    latency = round((time.time() - start_time) * 1000, 1)
                    return {
                        "response": f"⚠️ **Privacy Fallback**: Local Ollama was offline. Routed securely via Gemini.\n\n{resp}",
                        "model_used": "Gemini (Fallback)",
                        "privacy_mode_active": False,
                        "latency_ms": latency
                    }
                else:
                    latency = round((time.time() - start_time) * 1000, 1)
                    return {
                        "response": "⚠️ **Service Outage**: Both local Ollama and Google Gemini APIs are currently offline. Please check connection.",
                        "model_used": "None (Static Fallback)",
                        "privacy_mode_active": True,
                        "latency_ms": latency
                    }
            
            # Ollama available, execute local inference
            ollama_response = self.generate_ollama_response(model_name, prompt, system_instruction)
            latency = round((time.time() - start_time) * 1000, 1)
            return {
                "response": ollama_response,
                "model_used": f"Ollama {model_name}",
                "privacy_mode_active": True,
                "latency_ms": latency
            }
        else:
            # Route to Gemini API
            if gemini_available:
                resp = generate_gemini_response(prompt, api_key)
                latency = round((time.time() - start_time) * 1000, 1)
                return {
                    "response": resp,
                    "model_used": "Gemini 2.5 Flash",
                    "privacy_mode_active": False,
                    "latency_ms": latency
                }
            else:
                # Fallback to local Ollama if Gemini key missing but local model is running!
                if self.check_ollama_status():
                    print("[INFO] Gemini key missing. Auto-routing to local Ollama fallback.")
                    ollama_response = self.generate_ollama_response(model_name, prompt, system_instruction)
                    latency = round((time.time() - start_time) * 1000, 1)
                    return {
                        "response": f"ℹ️ **Network Router Redirect**: Gemini API key was missing. Routed to local model.\n\n{ollama_response}",
                        "model_used": f"Ollama {model_name} (Auto-Fallback)",
                        "privacy_mode_active": True,
                        "latency_ms": latency
                    }
                else:
                    # Static rule-based fallback (highly safe)
                    from app.models.llm import generate_local_response
                    resp = generate_local_response(prompt, is_kids_mode=False)
                    latency = round((time.time() - start_time) * 1000, 1)
                    return {
                        "response": resp,
                        "model_used": "Static Deterministic Specialist",
                        "privacy_mode_active": False,
                        "latency_ms": latency
                    }

# Singleton instance
_router_instance = None

def get_model_router():
    global _router_instance
    if _router_instance is None:
        _router_instance = ModelRouter()
    return _router_instance
