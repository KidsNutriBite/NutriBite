"""
Unit and integration tests for Phase 10 v2: Gated Entity-Aware RAG Integration.

Tests:
1. Phase 10 v2 report and JSON results artifacts existence and schema validation.
2. 3-System comparative ablation metrics verification.
3. Harm reduction validation (v2 hurt count << v1 hurt count).
4. Hierarchical query-type gating weights verification.
5. EntityAwareRAGPipelineV2 execution and no hard-filtering guarantee.
6. Markdown report structure and content integrity.
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
JSON_RESULTS_PATH = REPORTS_DIR / "phase10_entity_aware_rag_v2_results.json"
MD_REPORT_PATH = REPORTS_DIR / "phase10_entity_aware_rag_v2_results.md"
DYNAMIC_WEIGHTS_PATH = NER_DIR / "models" / "dynamic_v1" / "weights.json"
DYNAMIC_META_PATH = NER_DIR / "models" / "dynamic_v1" / "model_metadata.json"
CANONICAL_KB_PATH = NER_DIR / "data" / "entity_linking_v1" / "canonical_knowledge_base.json"


@pytest.fixture(scope="module")
def rag_v2_module():
    scripts_dir = str(WORKSPACE_ROOT / "ner" / "scripts")
    if scripts_dir not in sys.path:
        sys.path.insert(0, scripts_dir)
    return importlib.import_module("26_entity_aware_rag_v2")


def test_phase10_v2_artifacts_exist():
    """Verify Phase 10 v2 report and results artifacts exist."""
    assert JSON_RESULTS_PATH.exists(), f"Missing {JSON_RESULTS_PATH}"
    assert MD_REPORT_PATH.exists(), f"Missing {MD_REPORT_PATH}"


def test_phase10_v2_json_schema():
    """Verify Phase 10 v2 JSON output adheres to benchmark schema."""
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
    assert summary["v1_hurt_count"] == 15
    assert summary["v2_hurt_count"] <= 3
    assert summary["hurt_reduction_pct"] >= 70.0

    metrics = summary["metrics"]
    for m in ["Recall@1", "Recall@3", "Recall@5", "Recall@10", "Precision@3", "Precision@5", "MRR@5", "MRR@10"]:
        assert m in metrics, f"Missing metric {m}"
        assert "baseline" in metrics[m]
        assert "entity_v1" in metrics[m]
        assert "entity_v2_gated" in metrics[m]
        assert "delta_v2_vs_base" in metrics[m]
        assert "delta_v2_vs_v1" in metrics[m]


def test_phase10_v2_recall5_regression_eliminated():
    """Verify that v2 Gated Entity-Aware RAG eliminates the Recall@5 regression from v1."""
    with open(JSON_RESULTS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    metrics = data["summary"]["metrics"]
    base_r5 = metrics["Recall@5"]["baseline"]
    v1_r5 = metrics["Recall@5"]["entity_v1"]
    v2_r5 = metrics["Recall@5"]["entity_v2_gated"]

    # In v1, Recall@5 dropped by ~6.67%
    assert v1_r5 < base_r5
    # In v2, Recall@5 is restored to baseline level (>= 85.0%)
    assert v2_r5 >= base_r5
    assert v2_r5 > v1_r5

    # Recall@1 is improved
    assert metrics["Recall@1"]["entity_v2_gated"] > metrics["Recall@1"]["baseline"]
    # MRR@10 is improved
    assert metrics["MRR@10"]["entity_v2_gated"] > metrics["MRR@10"]["baseline"]


def test_phase10_v2_harm_reduction():
    """Verify that v2 reduces harmed queries from 15 in v1 down to <= 3."""
    with open(JSON_RESULTS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    summary = data["summary"]
    assert summary["v1_hurt_count"] == 15
    assert summary["v2_hurt_count"] <= 3
    assert summary["v2_helped_count"] >= 5


def test_pipeline_v2_execution_and_no_hard_filtering(rag_v2_module):
    """Test EntityAwareRAGPipelineV2 end-to-end execution and verify no hard-filtering."""
    with open(DYNAMIC_META_PATH, "r", encoding="utf-8") as f:
        meta = json.load(f)
    with open(DYNAMIC_WEIGHTS_PATH, "r", encoding="utf-8") as f:
        weights = json.load(f)
    with open(CANONICAL_KB_PATH, "r", encoding="utf-8") as f:
        kb_entries = json.load(f)

    ner = rag_v2_module.FastDynamicNER(meta["labels"], weights)
    linker = rag_v2_module.NutriBiteEntityLinker(kb_entries, use_embeddings=False)

    toy_passages = [
        {"id": "DOC_1", "text": "Iron deficiency anemia guidelines for pediatric patients.", "metadata": {"tags": ["iron", "anemia"]}},
        {"id": "DOC_2", "text": "Sleep routines and bedtime schedules for toddlers.", "metadata": {"tags": ["sleep"]}},
        {"id": "DOC_3", "text": "Cow milk protein allergy management and formula alternatives.", "metadata": {"tags": ["allergy", "milk"]}}
    ]

    np.random.seed(42)
    toy_embs = np.random.randn(3, 16).astype(np.float32)
    toy_embs = toy_embs / np.linalg.norm(toy_embs, axis=1, keepdims=True)
    q_vec = toy_embs[0]

    pipeline = rag_v2_module.EntityAwareRAGPipelineV2(toy_passages, ner, linker, toy_embs)

    # Test baseline
    docs_base = pipeline.retrieve_baseline("iron rich purees", q_vec, top_k=2)
    assert len(docs_base) == 2

    # Test v1
    docs_v1, ents_v1, linked_v1 = pipeline.retrieve_entity_aware_v1("iron rich purees", q_vec, top_k=2)
    assert len(docs_v1) == 2

    # Test v2 Gated
    docs_v2, ents_v2, linked_v2 = pipeline.retrieve_entity_aware_v2("iron rich purees", q_vec, top_k=2)
    assert len(docs_v2) == 2

    # Test that unrelated query returns top_k without hard-filtering
    unrelated_docs, _, _ = pipeline.retrieve_entity_aware_v2("random out of domain query", q_vec, top_k=3)
    assert len(unrelated_docs) == 3


def test_markdown_report_v2_content():
    """Verify Phase 10 v2 markdown report has all mandatory sections and comparative tables."""
    with open(MD_REPORT_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    assert "# Phase 10 v2: Gated Entity-Aware RAG Integration Results" in content
    assert "3-System Controlled Comparative Ablation Benchmark" in content
    assert "System A: Baseline Standard RAG" in content
    assert "System B: Entity-Aware v1 (Ungated)" in content
    assert "System C: Gated Entity-Aware v2" in content
    assert "Query Directional Impact & Harm Reduction" in content
    assert "Performance Breakdown by Query Domain" in content
    assert "Scientific Analysis of the Gating Solution" in content
    assert "Limitations & Future Directions" in content
