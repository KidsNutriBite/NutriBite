import os
import sys
import json

# Ensure parent directory is in sys.path to resolve app imports cleanly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.rag.hybrid_retriever import get_hybrid_retriever

QUERIES = [
    "foods rich in iron",
    "child low calcium",
    "vitamin d deficiency",
    "protein rich foods",
    "healthy breakfast for kids"
]

def run_debug_test():
    print("--- STARTING RAG DEBUG RETRIEVAL TESTS ---")
    retriever = get_hybrid_retriever()
    
    results = {}
    for q in QUERIES:
        print(f"\nQuery: '{q}'")
        docs = retriever.query(q, top_k=3)
        
        results[q] = []
        for rank, doc in enumerate(docs):
            txt = doc.get("text", "")
            score = doc.get("rerank_confidence", 0.0)
            meta = doc.get("metadata", {})
            src = meta.get("source") or "ICMR Pediatric Nutrition Guidelines"
            
            print(f"  [{rank+1}] Score: {score:.2f} | Source: {src}")
            print(f"      Text: {txt[:120]}...")
            
            results[q].append({
                "rank": rank + 1,
                "score": round(score, 2),
                "source": src,
                "text": txt
            })
            
    # Save test outcomes
    out_path = os.path.join("evaluation", "debug_retrieval_results.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nDebug RAG results written to {out_path}")

if __name__ == "__main__":
    run_debug_test()
