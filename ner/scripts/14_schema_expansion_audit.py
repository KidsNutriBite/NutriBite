"""
NutriBite NER — Phase 7 Schema Expansion Audit Engine
=====================================================
Calculates exact empirical corpus statistics for:
1. Current 7-entity schema support in natural language text.
2. Candidate entity concept occurrences, uniqueness, document frequency, and multi-word ratio.
3. Natural-language vs structured-data separation.
4. Relation extraction pattern co-occurrence in natural language sentences.

Run: python ner/scripts/14_schema_expansion_audit.py
"""

import os
import sys
import json
import re
from collections import Counter, defaultdict

sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)

# 1. Load Datasets
def load_json(path):
    if not os.path.exists(path):
        return []
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_jsonl(path):
    if not os.path.exists(path):
        return []
    with open(path, 'r', encoding='utf-8') as f:
        return [json.loads(line) for line in f if line.strip()]

rag_data = load_json('ai-service-v2/datasets/rag_data.json')
retrieval_data = load_json('ai-service-v2/evaluation/retrieval_dataset.json')
retrieval_failures = load_json('ai-service-v2/evaluation/retrieval_failures.json')
weak_annotations = load_jsonl('ner/data/weak_annotations.jsonl')

foods_db = load_json('ai-service-v2/datasets/foods.json')
conditions_db = load_json('ai-service-v2/datasets/conditions.json')
allergies_db = load_json('ai-service-v2/datasets/allergies.json')
goals_db = load_json('ai-service-v2/datasets/goals.json')

# Aggregate natural language sentences
all_natural_sentences = []
passage_to_sentences = defaultdict(list)

for r in weak_annotations:
    text = r['text'].strip()
    pid = r.get('source_record_id', 'UNKNOWN')
    all_natural_sentences.append({'text': text, 'source_passage': pid, 'entities': r.get('entities', [])})
    passage_to_sentences[pid].append(text)

# Also collect raw passage texts from rag_data
raw_passages = []
if isinstance(rag_data, list):
    for item in rag_data:
        t = item.get('text') or item.get('content') or item.get('passage') or ''
        if t:
            raw_passages.append({'id': item.get('id', 'RAG'), 'text': t})
elif isinstance(rag_data, dict):
    for k, v in rag_data.items():
        if isinstance(v, dict):
            t = v.get('text') or v.get('content') or ''
            raw_passages.append({'id': k, 'text': t})

# 2. Audit Current Entity Schema Support
current_labels = ["FOOD", "NUTRIENT", "HEALTH_CONDITION", "ALLERGEN", "AGE_GROUP", "MEAL_TYPE", "GROWTH_METRIC"]
current_stats = {}

for lbl in current_labels:
    mentions = []
    unique_forms = set()
    passages_seen = set()
    sentences_seen = set()
    multiword_count = 0
    
    for r in weak_annotations:
        s_id = r['id']
        pid = r.get('source_record_id', '')
        for e in r.get('entities', []):
            if e['label'] == lbl:
                txt = e['text'].strip()
                mentions.append(txt)
                unique_forms.add(txt.lower())
                passages_seen.add(pid)
                sentences_seen.add(s_id)
                if ' ' in txt or '-' in txt:
                    multiword_count += 1
                    
    counts = Counter([m.lower() for m in mentions])
    top_examples = counts.most_common(8)
    
    current_stats[lbl] = {
        "total_mentions": len(mentions),
        "unique_forms": len(unique_forms),
        "passages": len(passages_seen),
        "sentences": len(sentences_seen),
        "multiword_count": multiword_count,
        "multiword_pct": round((multiword_count / len(mentions) * 100), 1) if mentions else 0,
        "top_examples": top_examples
    }

# 3. Audit Candidate Entities Across Natural Language Text
candidate_vocabularies = {
    "FOOD_GROUP": [
        "pulses", "whole grains", "cereals", "millets", "green leafy vegetables",
        "legumes", "dairy products", "dairy", "fruits", "nuts and seeds", "nuts",
        "seeds", "animal source foods", "fats and oils", "vegetables", "flesh foods",
        "eggs and poultry", "tuber vegetables", "roots and tubers"
    ],
    "FEEDING_METHOD": [
        "exclusive breastfeeding", "breastfeeding", "complementary feeding",
        "cup feeding", "spoon feeding", "responsive feeding", "finger foods",
        "bottle feeding", "baby-led weaning", "tube feeding", "nasogastric feeding",
        "hand feeding", "active feeding", "demand feeding"
    ],
    "DIETARY_PROPERTY": [
        "energy-dense", "energy dense", "nutrient-rich", "nutrient rich",
        "easily digestible", "digestible", "fortified", "bioavailable", "bio-available",
        "semi-solid", "semi solid", "mashed", "pureed", "soft textured",
        "ultra-processed", "processed foods", "high protein", "low sodium",
        "iron-rich", "calcium-rich", "viscous", "calorically dense"
    ],
    "DEFICIENCY": [
        "iron deficiency", "vitamin a deficiency", "zinc deficiency",
        "iodine deficiency", "calcium deficiency", "folate deficiency",
        "vitamin d deficiency", "micronutrient deficiency", "subclinical deficiency",
        "protein deficiency", "b12 deficiency", "riboflavin deficiency"
    ],
    "NUTRITION_GOAL": [
        "prevent stunting", "prevent wasting", "catch-up growth", "immune support",
        "brain development", "cognitive development", "anemia prevention",
        "prevent anemia", "healthy weight gain", "linear growth", "bone mineralization",
        "muscle accretion", "optimal development", "rapid growth"
    ],
    "RECOMMENDATION": [
        "recommended dietary allowance", "daily allowance", "dietary guideline",
        "minimum dietary diversity", "meal frequency", "feeding frequency",
        "minimum meal frequency", "acceptable diet", "rda", "safe intake",
        "energy requirement", "recommended intake"
    ],
    "SUPPLEMENT": [
        "iron drops", "iron syrup", "vitamin d drops", "zinc supplementation",
        "zinc tablets", "ifa tablet", "ifa syrup", "multivitamin syrup",
        "ors", "oral rehydration salts", "therapeutic food", "rutf",
        "micronutrient powder", "vitamin a syrup", "calcium supplement"
    ],
    "DIETARY_RESTRICTION": [
        "gluten-free", "lactose-free", "egg-free", "vegetarian", "non-dairy",
        "sugar-free", "salt-free", "dairy-free", "peanut-free", "vegan"
    ],
    "PORTION": [
        "small bowl", "tablespoon", "teaspoon", "half cup", "1 katori",
        "katori", "fistful", "quarter plate", "100g", "200ml", "one cup",
        "two tablespoons", "three teaspoons"
    ],
    "COOKING_METHOD": [
        "steaming", "boiling", "roasting", "pressure cooking", "shallow frying",
        "fermentation", "sprouting", "germination", "mashing", "blanching", "sauteing"
    ],
    "ANTHROPOMETRIC_MEASURE": [
        "weight-for-age", "height-for-age", "length-for-age", "weight-for-height",
        "mid-upper arm circumference", "muac", "head circumference", "bmi-for-age",
        "z-score", "growth velocity", "stunting index", "wasting index"
    ],
    "BODY_MEASURE": [
        "birth weight", "head circumference", "recumbent length", "mid-arm circumference",
        "crown-heel length", "triceps skinfold"
    ],
    "FOOD_PREPARATION": [
        "pureed", "mashed", "boiled", "steamed", "sprouted", "fermented",
        "cooked", "roasted", "porridge", "soup", "mash", "paste"
    ],
    "AGE_RANGE": [
        "6 to 12 months", "6-12 months", "0 to 6 months", "0-6 months",
        "1 to 2 years", "1-2 years", "first 1000 days", "2 to 5 years",
        "2-5 years", "6 to 8 months", "9 to 11 months", "under five"
    ],
    "DIET_PATTERN": [
        "balanced diet", "traditional diet", "diversified diet", "complementary diet",
        "plant-based diet", "vegetarian diet", "monotonous diet"
    ]
}

def scan_candidate_occurrences(vocab_dict, sentences_list):
    candidate_results = {}
    for cand_name, terms in vocab_dict.items():
        matched_mentions = []
        unique_forms = set()
        doc_ids = set()
        sent_indices = set()
        multiword_count = 0
        term_counts = Counter()
        
        # Compile regex
        patterns = []
        for t in terms:
            escaped = re.escape(t)
            patterns.append((t, re.compile(rf'\b{escaped}\b', re.IGNORECASE)))
            
        for s_idx, s in enumerate(sentences_list):
            text = s['text']
            doc_id = s.get('source_passage', 'DOC')
            for term_str, reg in patterns:
                matches = reg.findall(text)
                if matches:
                    for m in matches:
                        matched_mentions.append(m)
                        unique_forms.add(m.lower())
                        doc_ids.add(doc_id)
                        sent_indices.add(s_idx)
                        term_counts[m.lower()] += 1
                        if ' ' in m or '-' in m:
                            multiword_count += 1
                            
        candidate_results[cand_name] = {
            "total_occurrences": len(matched_mentions),
            "unique_forms": len(unique_forms),
            "doc_count": len(doc_ids),
            "sentence_count": len(sent_indices),
            "multiword_count": multiword_count,
            "multiword_pct": round((multiword_count / len(matched_mentions) * 100), 1) if matched_mentions else 0,
            "top_mentions": term_counts.most_common(6)
        }
    return candidate_results

candidate_stats = scan_candidate_occurrences(candidate_vocabularies, all_natural_sentences)

# 4. Search for Relation Statements in Natural Language Corpus
# Candidate relations to investigate
relation_patterns = [
    {
        "relation": "FOOD -> CONTAINS -> NUTRIENT",
        "pattern": re.compile(r'\b([A-Za-z\s]+)\s+(?:is rich in|is a rich source of|provides|contains|supplies|delivers)\s+([A-Za-z\s]+)\b', re.IGNORECASE),
        "description": "Food rich in or providing specific nutrient"
    },
    {
        "relation": "FOOD -> SUITABLE_FOR -> AGE_GROUP",
        "pattern": re.compile(r'\b([A-Za-z\s]+)\s+(?:is suitable for|is recommended for|can be given to|for|introduced to)\s+([A-Za-z\s]+)\b', re.IGNORECASE),
        "description": "Food suitability for age cohort"
    },
    {
        "relation": "FOOD -> TRIGGERS -> ALLERGEN",
        "pattern": re.compile(r'\b([A-Za-z\s]+)\s+(?:causes|triggers|induces|provokes|associated with)\s+([A-Za-z\s]+(?:allergy|intolerance|reaction))\b', re.IGNORECASE),
        "description": "Food causing allergic reaction or intolerance"
    },
    {
        "relation": "HEALTH_CONDITION -> ASSOCIATED_WITH -> NUTRIENT",
        "pattern": re.compile(r'\b([A-Za-z\s]+(?:deficiency|anemia|rickets|stunting))\s+(?:caused by|due to|resulting from|linked to|associated with)\s+(?:lack of|inadequate|low)\s+([A-Za-z\s]+)\b', re.IGNORECASE),
        "description": "Clinical condition linked to nutrient deficit"
    },
    {
        "relation": "NUTRITION_GOAL -> SUPPORTED_BY -> FOOD",
        "pattern": re.compile(r'\b(?:to prevent|for|promotes|supports)\s+([A-Za-z\s]+(?:growth|development|stunting|anemia))\s+(?:feed|give|consume|provide|use)\s+([A-Za-z\s]+)\b', re.IGNORECASE),
        "description": "Nutritional goal achieved via specific dietary intervention"
    },
    {
        "relation": "MEAL_TYPE -> INCLUDES -> FOOD",
        "pattern": re.compile(r'\b([A-Za-z\s]+(?:breakfast|lunch|dinner|snack))\s+(?:consisting of|including|includes|with|can include)\s+([A-Za-z\s]+)\b', re.IGNORECASE),
        "description": "Meal slot comprising specific foods"
    },
    {
        "relation": "FEEDING_METHOD -> SUITABLE_FOR -> AGE_GROUP",
        "pattern": re.compile(r'\b([A-Za-z\s]+(?:breastfeeding|complementary feeding|weaning))\s+(?:is recommended for|during|at|up to|from)\s+([A-Za-z\s]+(?:months|years|infants|toddlers|first 1000 days))\b', re.IGNORECASE),
        "description": "Feeding practice aligned with developmental stage"
    }
]

relation_stats = []
for rel in relation_patterns:
    rel_name = rel["relation"]
    desc = rel["description"]
    reg = rel["pattern"]
    
    matches_found = []
    for s in all_natural_sentences:
        text = s['text']
        m = reg.search(text)
        if m:
            matches_found.append({"sentence": text, "match_groups": m.groups()})
            
    relation_stats.append({
        "relation": rel_name,
        "description": desc,
        "count": len(matches_found),
        "examples": matches_found[:4]
    })

# Output raw results summary for inspection
print("=" * 75)
print("  PHASE 7 SCHEMA EXPANSION AUDIT DATA EXTRACTOR")
print("=" * 75)

print("\n[CURRENT SCHEMA EMPIRICAL SUPPORT]")
for lbl, st in current_stats.items():
    print(f"  {lbl:<18} | Mentions: {st['total_mentions']:>5} | Unique: {st['unique_forms']:>4} | Docs: {st['passages']:>4} | Sents: {st['sentences']:>4} | Multiword: {st['multiword_pct']:>5.1f}%")

print("\n[CANDIDATE SCHEMA EMPIRICAL SUPPORT (Natural Language Text)]")
for cand, st in candidate_stats.items():
    print(f"  {cand:<25} | Occurrences: {st['total_occurrences']:>4} | Unique: {st['unique_forms']:>3} | Docs: {st['doc_count']:>3} | Sents: {st['sentence_count']:>4} | Multiword: {st['multiword_pct']:>5.1f}%")

print("\n[RELATION EXTRACTION NATURAL LANGUAGE FEASIBILITY]")
for r in relation_stats:
    print(f"  {r['relation']:<45} | Explicit Matches: {r['count']:>3}")

# Save JSON dump of audit data
os.makedirs('ner/reports', exist_ok=True)
with open('ner/reports/schema_expansion_audit_raw.json', 'w', encoding='utf-8') as f:
    json.dump({
        "current_schema": current_stats,
        "candidate_schema": candidate_stats,
        "relation_stats": relation_stats,
        "structured_db_counts": {
            "foods_json_records": len(foods_db) if isinstance(foods_db, list) else len(foods_db.keys()),
            "conditions_json_records": len(conditions_db) if isinstance(conditions_db, list) else len(conditions_db.keys()),
            "allergies_json_records": len(allergies_db) if isinstance(allergies_db, list) else len(allergies_db.keys()),
            "goals_json_records": len(goals_db) if isinstance(goals_db, list) else len(goals_db.keys())
        }
    }, f, indent=2, ensure_ascii=False)

print("\nAudit complete. Raw data saved to ner/reports/schema_expansion_audit_raw.json")
