import os
import sys
from dotenv import load_dotenv

load_dotenv()

def verify_qwen():
    print("[+] Running Qwen Diagnostics (Ollama qwen3:4b & Groq qwen/qwen3.8-27b)...")
    
    # 1. Test via KidsNutriLLMClient with Groq
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        print(f"[*] Found GROQ_API_KEY. Testing Groq Qwen (qwen/qwen3.8-27b)...")
        try:
            from llm.llm_client import KidsNutriLLMClient
            client = KidsNutriLLMClient(default_model="groq_qwen")
            res, latency = client.generate_response(
                "You are a helpful nutrition assistant.",
                "Why is iron essential for children? Answer in one sentence.",
                model_name="groq_qwen"
            )
            print(f"[*] Groq Qwen Response: {res.strip()}")
            print(f"[*] Latency: {latency:.2f}s")
            print("[+] Groq Qwen test PASSED!")
        except Exception as e:
            print(f"[-] Groq Qwen test error: {e}")

    # 2. Test via Ollama (qwen3:4b)
    ollama_model = os.getenv("OLLAMA_MODEL", "qwen3:4b")
    print(f"\n[*] Testing local Ollama model '{ollama_model}'...")
    try:
        from llm.llm_client import KidsNutriLLMClient
        client = KidsNutriLLMClient(default_model=ollama_model)
        res, latency = client.generate_response(
            "You are a helpful nutrition assistant.",
            "Why is iron essential for children? Answer in one sentence.",
            model_name=ollama_model
        )
        print(f"[*] Ollama {ollama_model} Response: {res.strip()}")
        print(f"[*] Latency: {latency:.2f}s")
        print(f"[+] Ollama {ollama_model} test PASSED!")
    except Exception as e:
        print(f"[-] Ollama test warning: {e} (Ensure Ollama is running if testing local inference)")

if __name__ == '__main__':
    verify_qwen()
