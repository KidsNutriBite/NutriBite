import json
import os
import re
import hashlib

def main():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    schema_v2_dir = os.path.join(repo_root, "ner", "data", "schema_v2")
    validated_path = os.path.join(repo_root, "ai-service-v2", "datasets", "validated_candidates.json")
    
    with open(validated_path, "r", encoding="utf-8") as f:
        val_data = json.load(f)
        
    candidates = val_data.get("validated_candidates", [])
    # Strip any previously recovered that lack status/decision
    candidates = [c for c in candidates if c.get("status") == "ACCEPTED" and c.get("decision") == "ACCEPTED"]
    existing_texts = {c["candidate_text"].lower() for c in candidates}
    
    # Simple regex for Diet Patterns and Supplements
    diet_patterns = [r"\b(?:vegan|vegetarian|gluten-free|keto|paleo|mediterranean|dash|dairy-free) diets?\b", r"\bplant-based diets?\b"]
    supplements = [r"\b(?:vitamin [a-z]|calcium|iron|zinc|magnesium) supplement(?:s|ation)?\b", r"\bmultivitamin(?:s)?\b", r"\bprobiotic(?:s)?\b"]
    
    added_diets = 0
    added_supplements = 0
    
    for split in ["train", "validation", "test"]:
        path = os.path.join(schema_v2_dir, f"{split}.jsonl")
        if not os.path.exists(path): continue
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip(): continue
                r = json.loads(line)
                txt = r["text"]
                
                # Check for diets
                for p in diet_patterns:
                    for m in re.finditer(p, txt, re.IGNORECASE):
                        match_txt = m.group(0)
                        if match_txt.lower() not in existing_texts:
                            cid = f"CAND_DIET_PATTERN_{hashlib.md5(match_txt.encode()).hexdigest()[:8].upper()}"
                            candidates.append({
                                "candidate_id": cid,
                                "candidate_text": match_txt,
                                "entity_id": "DIET_PATTERN",
                                "context": txt,
                                "source_document": r.get("source_record_id"),
                                "status": "ACCEPTED",
                                "decision": "ACCEPTED"
                            })
                            existing_texts.add(match_txt.lower())
                            added_diets += 1
                            
                # Check for supplements
                for p in supplements:
                    for m in re.finditer(p, txt, re.IGNORECASE):
                        match_txt = m.group(0)
                        if match_txt.lower() not in existing_texts:
                            cid = f"CAND_SUPPLEMENT_{hashlib.md5(match_txt.encode()).hexdigest()[:8].upper()}"
                            candidates.append({
                                "candidate_id": cid,
                                "candidate_text": match_txt,
                                "entity_id": "SUPPLEMENT",
                                "context": txt,
                                "source_document": r.get("source_record_id"),
                                "status": "ACCEPTED",
                                "decision": "ACCEPTED"
                            })
                            existing_texts.add(match_txt.lower())
                            added_supplements += 1

    print(f"Added {added_diets} DIET_PATTERN and {added_supplements} SUPPLEMENT candidates.")
    val_data["validated_candidates"] = candidates
    with open(validated_path, "w", encoding="utf-8") as f:
        json.dump(val_data, f, indent=4)
        
if __name__ == "__main__":
    main()
