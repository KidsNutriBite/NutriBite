import os
import json

def verify_setup():
    print("==================================================")
    print("[INFO] KidsNutriBite AI Service Structure Verification")
    print("==================================================")
    
    # Define expected directory structure
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    print(f"Project root directory: {root_dir}")
    
    expected_subdirs = [
        "app/api",
        "app/rag",
        "app/planner",
        "app/prompts",
        "app/db",
        "app/guardrails",
        "app/models",
        "app/embeddings",
        "app/utils",
        "datasets",
        "vector_store",
        "scripts"
    ]
    
    errors = 0
    
    # 1. Check directories
    print("\n--- Checking Directories ---")
    for subdir in expected_subdirs:
        path = os.path.join(root_dir, subdir)
        if os.path.isdir(path):
            print(f"[OK] Directory exists: {subdir}")
        else:
            print(f"[FAIL] Directory missing: {subdir}")
            errors += 1
            
    # 2. Check essential files
    expected_files = {
        "PLAN.md": "Project Roadmap & Planner scoring specification",
        "requirements.txt": "Python dependencies configuration",
        "main.py": "FastAPI skeleton server",
        "datasets/rag_dataset.json": "Strict RAG schema dataset",
        "datasets/food_db.json": "Strict Structured DB dataset",
    }
    
    print("\n--- Checking Essential Files ---")
    for file_rel, desc in expected_files.items():
        path = os.path.join(root_dir, file_rel)
        if os.path.isfile(path):
            print(f"[OK] File exists: {file_rel} ({desc})")
            
            # Syntax validation for JSON files
            if file_rel.endswith(".json"):
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    print(f"   +- [OK] Valid JSON syntax verified!")
                except Exception as e:
                    print(f"   +- [FAIL] Invalid JSON syntax: {e}")
                    errors += 1
        else:
            print(f"[FAIL] File missing: {file_rel}")
            errors += 1
            
    print("\n==================================================")
    if errors == 0:
        print("[SUCCESS] All folders, schemas, and configurations are perfectly set up.")
    else:
        print(f"[WARN] Verification FAILED with {errors} error(s). Please review the logs above.")
    print("==================================================")

if __name__ == "__main__":
    verify_setup()
