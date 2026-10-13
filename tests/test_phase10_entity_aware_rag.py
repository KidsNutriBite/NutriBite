"""
Unit and integration tests for Phase 10: Entity-Aware RAG Integration.

Tests:
1. Phase 10 report and JSON results artifacts existence and schema validation.
2. FastDynamicNER model entity span extraction.
3. Cascading Entity Linker resolution to canonical KB entities.
4. BM25Index scoring and rank retrieval mechanics.
5. EntityAwareRAGPipeline baseline and entity-aware retrieval execution.
6. Markdown report structure and empirical metric consistency.
"""

import json
import os
import sys
import importlib
import pytest
import numpy as np
from pathlib import Path

# Paths
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
NER_DIR = WORKSPACE_ROOT / "ner"
REPORTS_DIR = NER_DIR / "reports"
JSON_RESULTS_PATH = REPORTS_DIR / "phase10_entity_aware_rag_results.json"
MD_REPORT_PATH = REPORTS_DIR / "phase10_entity_aware_rag_results.md"
DYNAMIC_WEIGHTS_PATH = NER_DIR / "models" / "dynamic_v1" / "weights.json"
DYNAMIC_META_PATH = NER_DIR / "models" / "dynamic_v1" / "model_metadata.json"
CANONICAL_KB_PATH = NER_DIR / "data" / "entity_linking_v1" / "canonical_knowledge_base.json"


@pytest.fixture(scope="module")
def rag_module():
    scripts_dir = str(WORKSPACE_ROOT / "ner" / "scripts")
    if scripts_dir not in sys.path:
        sys.path.insert(0, scripts_dir)
    return importlib.import_module("25_entity_aware_rag")


def test_phase10_artifacts_exist():
    """Verify Phase 10 report and results artifacts exist."""
    assert JSON_RESULTS_PATH.exists(), f"Missing {JSON_RESULTS_PATH}"
    assert MD_REPORT_PATH.exists(), f"Missing {MD_REPORT_PATH}"


def test_phase10_json_schema():
    """Verify Phase 10 JSON output adheres to benchmark schema."""
    with open(JSON_RESULTS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert "summary" in data
    assert "metrics" in data["summary"]
    assert "domain_breakdown" in data["summary"]
    assert "improved_examples" in data
    assert "degraded_examples" in data
    assert "all_queries" in data

    summary = data["summary"]
    assert summary["benchmark_query_count"] == 150
    assert summary["linked_query_count"] == 100
    assert summary["linked_query_rate_pct"] == 66.67
    assert summary["queries_helped"] == 6
    assert summary["queries_unchanged"] == 129
    assert summary["queries_hurt"] == 15

    metrics = summary["metrics"]
    for m in ["Recall@1", "Recall@3", "Recall@5", "Recall@10", "Precision@3", "Precision@5", "MRR@5", "MRR@10"]:
        assert m in metrics, f"Missing metric {m}"
        assert "baseline" in metrics[m]
        assert "entity_aware" in metrics[m]
        assert "delta" in metrics[m]


def test_fast_dynamic_ner_extractor(rag_module):
    """Test FastDynamicNER span prediction on a representative pediatric query."""
    with open(DYNAMIC_META_PATH, "r", encoding="utf-8") as f:
        meta = json.load(f)
    with open(DYNAMIC_WEIGHTS_PATH, "r", encoding="utf-8") as f:
        weights = json.load(f)

    ner = rag_module.FastDynamicNER(meta["labels"], weights)
    query = "What iron rich foods should I feed an infant with peanut allergy?"
    spans = ner.predict_spans(query)

    assert isinstance(spans, list)
    assert len(spans) >= 2
    types = {s["entity_type"] for s in spans}
    assert any(t in types for t in ["NUTRIENT", "FOOD", "AGE_GROUP", "ALLERGEN"])


def test_entity_linking_in_rag(rag_module):
    """Test linking extracted entities to canonical knowledge base entities."""
    with open(CANONICAL_KB_PATH, "r", encoding="utf-8") as f:
        kb_entries = json.load(f)

    linker = rag_module.NutriBiteEntityLinker(kb_entries, use_embeddings=False)
    
    # Direct canonical linking tests
    res_milk = linker.link_entity("milk", "FOOD")
    assert res_milk["is_linked"] is True
    assert res_milk["canonical_id"] == "F302"

    res_allergy = linker.link_entity("nut allergy", "ALLERGEN")
    assert res_allergy["is_linked"] is True
    assert "ALLERG" in res_allergy["canonical_id"]


def test_bm25_index(rag_module):
    """Test BM25 index tokenization, scoring, and rank ordering."""
    toy_corpus = [
        "Iron deficiency anemia causes fatigue and cognitive delays in toddlers.",
        "Calcium and vitamin D are essential for healthy bone development.",
        "Introduce peanut butter gradually to monitor for allergic reactions."
    ]
    bm25 = rag_module.BM25Index(toy_corpus)
    scores = bm25.score(["iron", "anemia"])
    assert len(scores) == 3
    assert np.argmax(scores) == 0  # Doc 0 is top hit for iron/anemia


def test_entity_aware_rag_pipeline_execution(rag_module):
    """Test EntityAwareRAGPipeline end-to-end execution on toy passages."""
    with open(DYNAMIC_META_PATH, "r", encoding="utf-8") as f:
        meta = json.load(f)
    with open(DYNAMIC_WEIGHTS_PATH, "r", encoding="utf-8") as f:
        weights = json.load(f)
    with open(CANONICAL_KB_PATH, "r", encoding="utf-8") as f:
        kb_entries = json.load(f)

    ner = rag_module.FastDynamicNER(meta["labels"], weights)
    linker = rag_module.NutriBiteEntityLinker(kb_entries, use_embeddings=False)

    toy_passages = [
        {"id": "DOC_1", "text": "Iron-rich pureed spinach and lentils prevent anemia.", "metadata": {"tags": ["iron", "anemia"]}},
        {"id": "DOC_2", "text": "Sleep hygiene tips for infants and toddlers.", "metadata": {"tags": ["sleep"]}},
        {"id": "DOC_3", "text": "Peanut allergy symptoms include hives and swelling.", "metadata": {"tags": ["peanut", "allergy"]}}
    ]
    # 3 passages, 16-dim toy embeddings
    np.random.seed(42)
    toy_embs = np.random.randn(3, 16).astype(np.float32)
    toy_embs = toy_embs / np.linalg.norm(toy_embs, axis=1, keepdims=True)
    q_vec = toy_embs[0]  # Closest to Doc 1

    pipeline = rag_module.EntityAwareRAGPipeline(toy_passages, ner, linker, toy_embs)
    
    # Baseline retrieval
    base_res = pipeline.retrieve_baseline("iron rich purees", q_vec, top_k=2)
    assert len(base_res) == 2
    assert base_res[0]["id"] == "DOC_1"

    # Entity-aware retrieval
    ent_res, entities, has_linked = pipeline.retrieve_entity_aware("iron rich purees", q_vec, top_k=2)
    assert len(ent_res) == 2
    assert ent_res[0]["id"] == "DOC_1"
    assert isinstance(entities, list)


def test_markdown_report_content():
    """Verify markdown report has all mandatory sections and accurate numbers."""
    with open(MD_REPORT_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    assert "# Phase 10: Entity-Aware RAG Integration Results" in content
    assert "System A: Baseline Standard RAG" in content
    assert "System B: Entity-Aware RAG" in content
    assert "Recall@1" in content
    assert "Recall@5" in content
    assert "MRR@10" in content
    assert "Linked-Query Distribution" in content
    assert "Performance Breakdown by Query Domain" in content
    assert "Scientific Interpretation & Trade-Offs" in content
    assert "Limitations & Future Directions" in content
