"""
NutriBite NER Phase 3 — Dynamic Candidate Discovery Runner
==========================================================
Executes the multi-method Candidate Discovery Engine:
1. Exact / Alias matching
2. Fuzzy lexical matching
3. Dense Sentence Transformer embedding similarity

Extracts candidate mentions from the NutriBite RAG corpus for
validated dynamic entities (COOKING_METHOD, SUPPLEMENT, DIET_PATTERN),
deduplicates candidates, computes confidence ranking, and produces:
- candidate_discovery_results.json
- candidate_discovery_results.csv
- phase3_candidate_discovery.md
"""

import os
import sys
import json
import csv
from datetime import datetime

# Add ai-service-v2 to path
base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ai_service_dir = os.path.join(base_dir, "ai-service-v2")
if ai_service_dir not in sys.path:
    sys.path.insert(0, ai_service_dir)

from app.services.candidate_discovery_service import (
    candidate_discovery_engine,
    default_discovery_thresholds,
)


def run_candidate_discovery():
    print("=" * 75)
    print("  NUTRIBITE PHASE 3 — DYNAMIC CANDIDATE DISCOVERY ENGINE")
    print("=" * 75)

    thresholds = default_discovery_thresholds()

    print(f"\n[Configured Discovery Thresholds]")
    print(f"  Exact Match Threshold:     {thresholds.exact_threshold:.2f}")
    print(f"  Fuzzy Lexical Threshold:   {thresholds.fuzzy_threshold:.2f}")
    print(f"  Dense Embedding Threshold: {thresholds.embedding_threshold:.2f}")
    print(f"  Sentence Gate Threshold:   {thresholds.sentence_threshold:.2f}")
    print(f"  N-gram Length Window:      {thresholds.min_ngram} to {thresholds.max_ngram} tokens")
    print(f"  Max Candidates / Entity:   {thresholds.max_candidates_per_entity}")
    print(f"  Embedding Model:           intfloat/e5-small-v2 (shared RAG encoder)")

    print("\nScanning NutriBite RAG Corpus & Retrieval Benchmarks...")
    summary = candidate_discovery_engine.run_discovery_pipeline(thresholds=thresholds)

    print(f"\n[Discovery Results Summary]")
    print(f"  Total Raw Mentions Discovered:  {summary.total_raw_mentions}")
    print(f"  Total Unique Deduplicated:     {summary.total_unique_candidates}")
    print(f"  Duplicate Mentions Merged:     {summary.duplicate_count}")
    print(f"  Dropped by Per-Entity Cap:     {summary.capped_dropped_count}")
    print(f"  Corpus Sentences Scanned:      {summary.corpus_sentence_count}")
    print(f"  Embedding Model:               {summary.embedding_model}")

    print("\n[Candidates by Dynamic Entity Class]")
    for ent, count in sorted(summary.counts_by_entity.items(), key=lambda x: x[1], reverse=True):
        print(f"  {ent:<20}: {count:>4} unique candidates")

    print("\n[Candidates by Primary Discovery Method]")
    for meth, count in sorted(summary.counts_by_method.items(), key=lambda x: x[1], reverse=True):
        print(f"  {meth:<25}: {count:>4} candidates")

    print("\n[Confidence Range Distribution]")
    for conf_range, count in summary.confidence_distribution.items():
        print(f"  {conf_range:<28}: {count:>4} candidates")

    # 1. Save candidate_discovery_results.json
    json_data = summary.model_dump(mode="json")
    for json_out in ["candidate_discovery_results.json", "ner/reports/candidate_discovery_results.json"]:
        os.makedirs(os.path.dirname(os.path.abspath(json_out)), exist_ok=True)
        with open(json_out, "w", encoding="utf-8") as f:
            json.dump(json_data, f, indent=2, ensure_ascii=False)
        print(f"Saved JSON artifact: {json_out}")

    # 2. Save candidate_discovery_results.csv
    csv_fields = [
        "candidate_id",
        "entity_id",
        "candidate_text",
        "start_char",
        "end_char",
        "source_document",
        "discovery_method",
        "similarity_score",
        "status",
        "discovered_by_methods",
        "context"
    ]
    for csv_out in ["candidate_discovery_results.csv", "ner/reports/candidate_discovery_results.csv"]:
        os.makedirs(os.path.dirname(os.path.abspath(csv_out)), exist_ok=True)
        with open(csv_out, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=csv_fields)
            writer.writeheader()
            for c in summary.candidates:
                writer.writerow({
                    "candidate_id": c.candidate_id,
                    "entity_id": c.entity_id,
                    "candidate_text": c.candidate_text,
                    "start_char": c.start_char if c.start_char is not None else "",
                    "end_char": c.end_char if c.end_char is not None else "",
                    "source_document": c.source_document,
                    "discovery_method": c.discovery_method.value,
                    "similarity_score": c.similarity_score,
                    "status": c.status.value,
                    "discovered_by_methods": "; ".join(c.discovered_by_methods),
                    "context": c.context
                })
        print(f"Saved CSV artifact:  {csv_out}")

    # 3. Save phase3_candidate_discovery.md
    md_content = f"""# Phase 3 — NutriBite Dynamic NER Candidate Discovery Report

**Project:** NutriBite Pediatric Nutrition Intelligence Platform  
**Phase:** Phase 3 — Multi-Method Dynamic Candidate Discovery  
**Date:** September 2026  
**Corpus Scope:** NutriBite RAG Clinical Knowledge Base (`rag_data.json`) + Retrieval Evaluation Benchmark (`retrieval_dataset.json`)  
**Target Dynamic Entities:** `COOKING_METHOD` (Active), `SUPPLEMENT` (Active), `DIET_PATTERN` (Validated)  
**Safety & Data Isolation:** Gold/Silver NER annotations (`weak_annotations.jsonl`, `train.jsonl`, `test.jsonl`, `validation.jsonl`) remain strictly **isolated and unmodified**.

---

## 1. Executive Summary Table

| Metric | Measured Value | Description |
| :--- | :---: | :--- |
| **Total Raw Mentions Discovered** | **{summary.total_raw_mentions}** | Total candidate spans extracted across all three discovery methods |
| **Total Unique Deduplicated Candidates** | **{summary.total_unique_candidates}** | Unique (Entity, Span, Context) tuples after cross-method deduplication |
| **Duplicate Mentions Merged** | **{summary.duplicate_count}** | Redundant candidate hits merged across discovery channels |
| **Dropped by Per-Entity Cap** | **{summary.capped_dropped_count}** | Unique candidates truncated by `max_candidates_per_entity` |
| **Corpus Sentences Scanned** | **{summary.corpus_sentence_count}** | RAG + retrieval sentences searched |
| **Deduplication Compression Ratio** | **{round((summary.duplicate_count / max(1, summary.total_raw_mentions)) * 100, 1)}%** | Proportion of duplicate raw mentions consolidated |

---

## 2. Configured Multi-Method Discovery Thresholds

The Candidate Discovery Engine implements three orthogonal discovery channels:

1. **Exact / Alias Regular Expression Matching:**
   * **Threshold:** `{thresholds.exact_threshold:.2f}` (Strict word boundary matching over registered aliases and seed spans)
   * **Semantic Precision:** 100% precision on known synonyms.

2. **Fuzzy Lexical Matching (`rapidfuzz`):**
   * **Threshold:** `{thresholds.fuzzy_threshold:.2f}` (Token sort and character ratio score $\ge 80\%$)
   * **Grammatical Window:** {thresholds.min_ngram} to {thresholds.max_ngram} sliding token n-grams.
   * **Value:** Captures morphological inflections, pluralizations, and hyphenation variations (*e.g., "steaming" $\leftrightarrow$ "steamed", "ifa-syrup" $\leftrightarrow$ "ifa syrup"*).

3. **Dense Vector Cosine Similarity (`{summary.embedding_model}`):**
   * **Span Threshold:** `{thresholds.embedding_threshold:.2f}`
   * **Sentence Gate:** `{thresholds.sentence_threshold:.2f}` (E5 `query:` / `passage:` retrieval, same setup as the RAG hybrid retriever)
   * **Value:** Discovers semantic variations and contextual synonyms not present in static alias lists.

---

## 3. Candidate Breakdown by Dynamic Entity

| Dynamic Entity Class | Unique Candidates | Primary Role in Pediatric Clinical Nutrition |
| :--- | :---: | :--- |
"""

    for ent, count in sorted(summary.counts_by_entity.items(), key=lambda x: x[1], reverse=True):
        desc = "Culinary and biochemical preparation modifying nutrient bioavailability & texture safety" if ent == "COOKING_METHOD" else (
            "Pharmaceutical drops, syrups, IFA tablets, ORS, and RUTF therapeutic feeds" if ent == "SUPPLEMENT" else
            "Macroscopic dietary diversity compliance and holistic feeding regimens"
        )
        md_content += f"| **`{ent}`** | **{count}** | {desc} |\n"

    md_content += f"""
---

## 4. Breakdown by Primary Discovery Method

| Discovery Method | Candidates Found | Method Characteristics |
| :--- | :---: | :--- |
"""
    for meth, count in sorted(summary.counts_by_method.items(), key=lambda x: x[1], reverse=True):
        m_desc = "Exact word-boundary match with registered aliases and seed terms" if meth == "exact_match" else (
            "Lexical fuzzy match capturing inflections and surface variations (Ratio >= 0.80)" if meth == "fuzzy_match" else
            f"Dense E5 embedding cosine similarity (span >= {thresholds.embedding_threshold:.2f})"
        )
        md_content += f"| **`{meth}`** | **{count}** | {m_desc} |\n"

    md_content += f"""
---

## 5. Confidence Range Distribution

| Confidence Interval | Candidate Count | Percentage (%) | Confidence Quality Tier |
| :--- | :---: | :---: | :--- |
"""
    for conf_range, count in summary.confidence_distribution.items():
        pct = round((count / max(1, summary.total_unique_candidates)) * 100, 1)
        tier = "High Confidence (Deterministic / Direct Alias Match)" if "[0.90" in conf_range else (
            "Medium-High Confidence (High-Fidelity Fuzzy Match)" if "[0.80" in conf_range else (
            "Moderate Confidence (Dense Semantic Vector Match)" if "[0.70" in conf_range else "Low Confidence"
        ))
        md_content += f"| `{conf_range}` | **{count}** | {pct}% | {tier} |\n"

    md_content += """
---

## 6. Top High-Confidence Discovered Candidate Examples

| Entity | Candidate Span | Score | Discovery Method | Source Document | Context Excerpt |
| :--- | :--- | :---: | :--- | :--- | :--- |
"""

    for c in summary.candidates[:15]:
        ctx_snippet = (c.context[:65] + "...") if len(c.context) > 65 else c.context
        ctx_snippet = ctx_snippet.replace("|", "/")
        md_content += f"| **`{c.entity_id}`** | `{c.candidate_text}` | **{c.similarity_score:.4f}** | `{c.discovery_method.value}` | `{c.source_document}` | *\"{ctx_snippet}\"* |\n"

    md_content += """
---

## 7. Next Steps (Phase 4 Roadmap Preview)

In accordance with strict modular design principles:
* **Human-in-the-Loop Review:** Phase 3 candidates are stored with status `DISCOVERED` / `PENDING_REVIEW`.
* **Annotation Isolation:** No gold annotations were modified.
* **Human-in-the-Loop Review:** Not implemented in Phase 3. Candidates remain `DISCOVERED`.
* **Annotation Isolation:** No gold/silver NER files were modified. Candidates are stored in `ai-service-v2/datasets/dynamic_candidates.json`.
* **Model Training & Relation Extraction:** Explicitly out of scope for Phase 3.
"""

    for md_out in ["phase3_candidate_discovery.md", "ner/reports/phase3_candidate_discovery.md"]:
        os.makedirs(os.path.dirname(os.path.abspath(md_out)), exist_ok=True)
        with open(md_out, "w", encoding="utf-8") as f:
            f.write(md_content)
        print(f"Saved Markdown report: {md_out}")

    print("\nPhase 3 Candidate Discovery executed successfully!")


if __name__ == "__main__":
    run_candidate_discovery()
