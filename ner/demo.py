import sys
import json
import os
import importlib.util

# Dynamic import for module starting with numbers
spec = importlib.util.spec_from_file_location("trainer_module", os.path.join(os.path.dirname(__file__), "scripts", "05_train_and_evaluate.py"))
trainer_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(trainer_module)

FastAveragedSequencePerceptron = trainer_module.FastAveragedSequencePerceptron
labels = trainer_module.labels
load_jsonl = trainer_module.load_jsonl

# Quick tokenizer
def simple_tokenize(text):
    import re
    tokens = []
    for m in re.finditer(r'\w+|[^\w\s]', text):
        tokens.append(m.group(0))
    return tokens

def run_demo(query_text=None):
    if not query_text:
        query_text = "What iron rich food can I give my 2yo toddler who has diarrhea?"

    print("\n========================================================")
    print("   NUTRIBITE PEDIATRIC DOMAIN-SPECIFIC NER DEMO")
    print("========================================================")
    print(f"Input Query: \"{query_text}\"")

    # Load training data and train / load model
    train_data = load_jsonl('ner/data/train.jsonl')
    model = FastAveragedSequencePerceptron(labels=labels, epochs=8)
    model.fit(train_data)

    tokens = simple_tokenize(query_text)
    preds = model.predict(tokens)

    # Extract spans
    entities = []
    curr_label = None
    curr_tokens = []
    
    for tok, tag in zip(tokens, preds):
        if tag.startswith("B-"):
            if curr_label:
                entities.append({"text": " ".join(curr_tokens), "label": curr_label})
            curr_label = tag[2:]
            curr_tokens = [tok]
        elif tag.startswith("I-"):
            if curr_label == tag[2:]:
                curr_tokens.append(tok)
            else:
                if curr_label:
                    entities.append({"text": " ".join(curr_tokens), "label": curr_label})
                curr_label = tag[2:]
                curr_tokens = [tok]
        else:
            if curr_label:
                entities.append({"text": " ".join(curr_tokens), "label": curr_label})
                curr_label = None
                curr_tokens = []

    if curr_label:
        entities.append({"text": " ".join(curr_tokens), "label": curr_label})

    print("\n--- EXTRACTED DOMAIN ENTITIES ---")
    for e in entities:
        print(f"  {e['text'].ljust(20)} -> {e['label']}")

    # Formatted Structured Output
    output_payload = {
        "query": query_text,
        "token_count": len(tokens),
        "entities": entities,
        "primary_flagship_entity": [e['text'] for e in entities if e['label'] == 'NUTRIENT'],
        "status": "success"
    }

    print("\n--- STRUCTURED METADATA PAYLOAD ---")
    print(json.dumps(output_payload, indent=2))

if __name__ == "__main__":
    query = sys.argv[1] if len(sys.argv) > 1 else None
    run_demo(query)
