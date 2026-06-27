import os
import json

DATASETS_DIR = "datasets"

def audit_datasets():
    print("--- NUTRIBITE DATASET AUDIT ---")
    files = [f for f in os.listdir(DATASETS_DIR) if f.endswith(".json")]
    
    for f in files:
        path = os.path.join(DATASETS_DIR, f)
        try:
            with open(path, "r", encoding="utf-8") as file:
                data = json.load(file)
            
            count = len(data)
            print(f"\nFile: {f}")
            print(f"Record Count: {count}")
            
            if count > 0:
                # Print schema keys
                sample = data[0]
                if isinstance(sample, dict):
                    print(f"Schema Keys: {list(sample.keys())}")
                    
                    # Check duplicates in text / food_name
                    seen = set()
                    dups = 0
                    missing_meta = 0
                    for item in data:
                        # RAG Data Duplicates
                        txt = item.get("text", "") or item.get("food_name", "") or item.get("allergy", "") or item.get("condition_name", "")
                        if txt in seen:
                            dups += 1
                        seen.add(txt)
                        
                        # RAG Metadata checks
                        if f == "rag_data.json":
                            meta = item.get("metadata", {})
                            if not meta or not isinstance(meta, dict):
                                missing_meta += 1
                            else:
                                if "type" not in meta:
                                    missing_meta += 1
                                    
                    print(f"Duplicate Entries: {dups}")
                    if f == "rag_data.json":
                        print(f"Missing Metadata Keys: {missing_meta}")
                else:
                    print("Data is not a list of dictionaries.")
        except Exception as e:
            print(f"Error auditing {f}: {e}")

if __name__ == "__main__":
    audit_datasets()
