import json

with open('ner/data/human_gold/human_gold_candidates.jsonl', 'r', encoding='utf-8') as f:
    cands = [json.loads(line) for line in f if line.strip()]

with open('ner/data/human_gold/human_gold.jsonl', 'r', encoding='utf-8') as f:
    gold = [json.loads(line) for line in f if line.strip()]

gold_by_id = {r['sentence_id']: r for r in gold}

print(f"Total candidates: {len(cands)}")
for c in cands:
    cid = c['candidate_id']
    text = c['text']
    g = gold_by_id.get(cid, {})
    ents = g.get('entities', [])
    notes = g.get('notes', '')
    is_zero = g.get('is_zero_entity_verified', False)
    
    ent_strs = [f"{e['text']} [{e['label']} at {e['start']}:{e['end']}]" for e in ents]
    print(f"\n--- {cid} ---")
    print(f"Text: {text}")
    print(f"Ents ({len(ents)}): {', '.join(ent_strs) if ents else ('(VERIFIED ZERO ENTITY)' if is_zero else '(UNANNOTATED)')}")
    if notes:
        print(f"Notes: {notes}")
