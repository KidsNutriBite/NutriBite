"""
Candidate Selection Script for Human Gold Dataset
==================================================
Extracts 150 diverse, stratified candidate sentences from the NutriBite corpus.
"""

import json
import os
import re
from collections import defaultdict

def select_candidates():
    weak_path = 'ner/data/weak_annotations.jsonl'
    rag_path = 'ai-service-v2/datasets/rag_data.json'
    
    with open(weak_path, 'r', encoding='utf-8') as f:
        weak_records = [json.loads(line) for line in f if line.strip()]
        
    candidates = []
    seen_texts = set()
    
    # Priority buckets for stratification
    buckets = {
        'NUTRIENT_SINGLE': [],
        'NUTRIENT_MULTIWORD': [],
        'FOOD': [],
        'HEALTH_CONDITION': [],
        'ALLERGEN': [],
        'AGE_GROUP': [],
        'MEAL_TYPE': [],
        'GROWTH_METRIC': [],
        'AMBIGUOUS_POLYSEMY': [],
        'NUMERICAL_QUANTITY': [],
        'NEGATIVE_NO_ENTITY': []
    }
    
    # Keywords for polysemy / edge cases
    ambig_words = ['iron', 'energy', 'growth', 'salt', 'formula', 'milk', 'normal', 'fat', 'supplement', 'development']
    qty_pattern = re.compile(r'\b\d+(\.\d+)?\s*(mg|mcg|g|iu|kcal|cm|kg|months|years|days|%)\b', re.IGNORECASE)
    
    for r in weak_records:
        text = r['text'].strip()
        if text in seen_texts or len(text) < 15:
            continue
            
        labels_present = set(e['label'] for e in r.get('entities', []))
        entities_text = [e.get('text', '') for e in r.get('entities', [])]
        
        # Categorize into stratification buckets
        assigned = False
        
        if 'ALLERGEN' in labels_present and len(buckets['ALLERGEN']) < 15:
            buckets['ALLERGEN'].append((r, 'ALLERGEN'))
            assigned = True
        elif 'GROWTH_METRIC' in labels_present and len(buckets['GROWTH_METRIC']) < 15:
            buckets['GROWTH_METRIC'].append((r, 'GROWTH_METRIC'))
            assigned = True
        elif 'MEAL_TYPE' in labels_present and len(buckets['MEAL_TYPE']) < 15:
            buckets['MEAL_TYPE'].append((r, 'MEAL_TYPE'))
            assigned = True
        elif 'HEALTH_CONDITION' in labels_present and len(buckets['HEALTH_CONDITION']) < 20:
            buckets['HEALTH_CONDITION'].append((r, 'HEALTH_CONDITION'))
            assigned = True
        elif 'NUTRIENT' in labels_present:
            multiword_nutrients = [e for e in entities_text if ' ' in e or '-' in e]
            if multiword_nutrients and len(buckets['NUTRIENT_MULTIWORD']) < 20:
                buckets['NUTRIENT_MULTIWORD'].append((r, 'NUTRIENT_MULTIWORD'))
                assigned = True
            elif len(buckets['NUTRIENT_SINGLE']) < 25:
                buckets['NUTRIENT_SINGLE'].append((r, 'NUTRIENT_SINGLE'))
                assigned = True
        elif 'FOOD' in labels_present and len(buckets['FOOD']) < 20:
            buckets['FOOD'].append((r, 'FOOD'))
            assigned = True
        elif 'AGE_GROUP' in labels_present and len(buckets['AGE_GROUP']) < 15:
            buckets['AGE_GROUP'].append((r, 'AGE_GROUP'))
            assigned = True
        elif any(w in text.lower().split() for w in ambig_words) and len(buckets['AMBIGUOUS_POLYSEMY']) < 15:
            buckets['AMBIGUOUS_POLYSEMY'].append((r, 'AMBIGUOUS_POLYSEMY'))
            assigned = True
        elif qty_pattern.search(text) and len(buckets['NUMERICAL_QUANTITY']) < 15:
            buckets['NUMERICAL_QUANTITY'].append((r, 'NUMERICAL_QUANTITY'))
            assigned = True
        elif len(r.get('entities', [])) == 0 and len(buckets['NEGATIVE_NO_ENTITY']) < 10:
            buckets['NEGATIVE_NO_ENTITY'].append((r, 'NEGATIVE_NO_ENTITY'))
            assigned = True
            
        if assigned:
            seen_texts.add(text)
            
    # Combine selected candidates up to 150 sentences
    final_candidates = []
    idx = 1
    for bucket_name, items in buckets.items():
        for r, cat in items:
            final_candidates.append({
                "candidate_id": f"GOLD_CAND_{idx:03d}",
                "source_record_id": r.get("source_record_id", "RAG_CORPUS"),
                "stratification_category": cat,
                "text": r["text"].strip(),
                "sentence_length": len(r["text"].split())
            })
            idx += 1
            if len(final_candidates) >= 150:
                break
        if len(final_candidates) >= 150:
            break
            
    os.makedirs('ner/data/human_gold', exist_ok=True)
    
    # Save candidates
    with open('ner/data/human_gold/human_gold_candidates.jsonl', 'w', encoding='utf-8') as f:
        for c in final_candidates:
            f.write(json.dumps(c, ensure_ascii=False) + '\n')
            
    # Save unannotated human gold template
    template_records = []
    for c in final_candidates:
        template_records.append({
            "sentence_id": c["candidate_id"],
            "source_id": c["source_record_id"],
            "text": c["text"],
            "entities": [],
            "annotator": "",
            "notes": ""
        })
        
    with open('ner/data/human_gold/human_gold_template.jsonl', 'w', encoding='utf-8') as f:
        for t in template_records:
            f.write(json.dumps(t, ensure_ascii=False) + '\n')
            
    # Save human_gold.jsonl (initial blank template file awaiting human annotation)
    with open('ner/data/human_gold/human_gold.jsonl', 'w', encoding='utf-8') as f:
        for t in template_records:
            f.write(json.dumps(t, ensure_ascii=False) + '\n')
            
    print(f"Successfully generated {len(final_candidates)} candidates across {len(buckets)} stratification buckets.")
    for b, items in buckets.items():
        print(f"  - {b:<25}: {len(items)} sentences")

if __name__ == '__main__':
    select_candidates()
