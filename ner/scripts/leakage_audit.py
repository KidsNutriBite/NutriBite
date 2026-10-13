import json
import os
import re

def load_jsonl(path):
    with open(path, "r", encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]

def get_normalized_text(text):
    return re.sub(r'[^a-z0-9]', '', text.lower())

def main():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    dyn_dir = os.path.join(repo_root, "ner", "data", "dynamic_v1")
    fs_dir = os.path.join(repo_root, "ner", "data", "few_shot_v1")
    
    train = load_jsonl(os.path.join(dyn_dir, "train.jsonl"))
    val = load_jsonl(os.path.join(dyn_dir, "validation.jsonl"))
    test = load_jsonl(os.path.join(dyn_dir, "test.jsonl"))
    
    # In few shot, K=50 is the largest superset
    fs_k50 = load_jsonl(os.path.join(fs_dir, "train_k50.jsonl")) if os.path.exists(os.path.join(fs_dir, "train_k50.jsonl")) else []
    
    test_texts = {r["text"] for r in test}
    test_norm_texts = {get_normalized_text(r["text"]) for r in test}
    test_docs = {r.get("source_record_id") for r in test if r.get("source_record_id")}
    
    train_texts = {r["text"] for r in train}
    train_norm_texts = {get_normalized_text(r["text"]) for r in train}
    
    val_texts = {r["text"] for r in val}
    fs_texts = {r["text"] for r in fs_k50}
    
    train_test_exact = len(train_texts.intersection(test_texts))
    train_test_norm = len(train_norm_texts.intersection(test_norm_texts))
    val_test_exact = len(val_texts.intersection(test_texts))
    fs_test_exact = len(fs_texts.intersection(test_texts))
    
    print(f"Train/Test exact overlap = {train_test_exact}")
    print(f"Train/Test normalized overlap = {train_test_norm}")
    print(f"Validation/Test overlap = {val_test_exact}")
    print(f"Few-shot/Test overlap = {fs_test_exact}")

if __name__ == "__main__":
    main()
