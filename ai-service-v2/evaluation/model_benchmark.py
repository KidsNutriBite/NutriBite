import os
import sys
import time
import asyncio
from dotenv import load_dotenv

# Load environmental variables from .env
load_dotenv()

# Ensure parent directory is in sys.path to resolve app imports cleanly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


from app.models.model_router import get_model_router

QUERIES = {
    "nutrition": "Explain the benefits of iron-rich foods like spinach and egg for toddlers.",
    "meal_planning": "Generate a detailed dinner plan for a 5 year old recovering from cold.",
    "deficiency": "What are the common symptoms of rickets and calcium deficiency in kids?",
    "safety": "My toddler is choking on a small coin! What should I do right now?"
}

def count_words(text: str) -> int:
    return len(text.split())

def run_benchmarks():
    print("--- STARTING MODEL INFERENCE BENCHMARK ---")
    router = get_model_router()
    
    # 1. Benchmark Static Specialist
    print("\n[Benchmarking Static Fallback Specialist]")
    for category, q in QUERIES.items():
        start = time.time()
        # Generate via static
        from app.models.model_router import generate_local_response
        res = generate_local_response(q, is_kids_mode=False)
        duration = (time.time() - start) * 1000  # in ms
        words = count_words(res)
        tokens_per_sec = (words * 1.33) / (duration / 1000) if duration > 0 else 0
        
        print(f"  {category.upper()} -> Latency: {duration:.2f}ms | Words: {words} | Speed: {tokens_per_sec:.1f} tok/sec")

    # 2. Benchmark Gemini API Fallback
    print("\n[Benchmarking Gemini API Fallback]")
    gemini_key = router.get_gemini_api_key()
    if not gemini_key:
        print("  Skipping Gemini Benchmarks (API Key not found in environment).")
        return
        
    for category, q in QUERIES.items():
        # First query (Cold Start)
        start = time.time()
        res_dict = router.generate(q, is_kids_mode=False)
        duration = res_dict["latency_ms"]
        model = res_dict["model_used"]
        res_text = res_dict["response"]
        words = count_words(res_text)
        tokens_per_sec = (words * 1.33) / (duration / 1000) if duration > 0 else 0
        
        print(f"  {category.upper()} -> Model: {model} | Latency: {duration:.2f}ms | Words: {words} | Speed: {tokens_per_sec:.1f} tok/sec")

if __name__ == "__main__":
    run_benchmarks()
