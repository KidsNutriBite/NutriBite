import os
import hashlib
import numpy as np
from fastapi.testclient import TestClient
from app.main import app
from app.services.candidate_discovery_service import (
    candidate_discovery_engine,
    default_discovery_thresholds,
)
from app.schemas.dynamic_entity import DiscoveryThresholds, DiscoveryMethod
from app.core.config import settings

client = TestClient(app)

NER_GOLD_FILES = [
    os.path.join("ner", "data", "weak_annotations.jsonl"),
    os.path.join("ner", "data", "train.jsonl"),
    os.path.join("ner", "data", "test.jsonl"),
    os.path.join("ner", "data", "validation.jsonl"),
    os.path.join("ner", "data", "human_gold", "human_gold.jsonl"),
]


def _repo_root() -> str:
    return os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))


def _file_fingerprint(path: str) -> str:
    hasher = hashlib.sha256()
    with open(path, "rb") as f:
        hasher.update(f.read())
    return hasher.hexdigest()


class FakeE5Encoder:
    """Deterministic stand-in for intfloat/e5-small-v2 used in unit tests."""

    def encode(self, texts, convert_to_numpy=True, normalize_embeddings=True):
        vectors = []
        for raw in texts:
            text = raw.lower()
            vec = np.array([0.05, 0.05, 0.05, 0.05], dtype=np.float32)
            if "steam" in text or "cook" in text:
                vec = np.array([1.0, 0.0, 0.0, 0.0], dtype=np.float32)
            elif "iron" in text or "supplement" in text:
                vec = np.array([0.0, 1.0, 0.0, 0.0], dtype=np.float32)
            elif "diet" in text or "diversity" in text:
                vec = np.array([0.0, 0.0, 1.0, 0.0], dtype=np.float32)
            else:
                vec = np.array([0.0, 0.0, 0.0, 1.0], dtype=np.float32)
            if normalize_embeddings:
                vec = vec / np.linalg.norm(vec)
            vectors.append(vec)
        return np.stack(vectors)


def test_exact_alias_matching():
    test_corpus = [
        {"source_document": "DOC_1", "context": "Steaming vegetables and boiling pulses helps infant digestion."},
        {"source_document": "DOC_2", "context": "Infants with anemia need iron drops daily."},
    ]
    matches = candidate_discovery_engine.discover_exact_matches(
        entity_name="COOKING_METHOD",
        aliases=["steaming", "boiling", "roasting"],
        seed_spans=["steamed"],
        corpus=test_corpus,
    )
    assert len(matches) == 2
    spans = [m["candidate_text"].lower() for m in matches]
    assert "steaming" in spans
    assert "boiling" in spans
    for m in matches:
        assert m["similarity_score"] == 1.0
        assert m["discovery_method"] == "exact_match"
        assert m["status"] == "DISCOVERED"
        assert "entity_id" in m and "context" in m and "source_document" in m


def test_fuzzy_matching():
    test_corpus = [
        {"source_document": "DOC_1", "context": "Provide steaming pureed vegetables."}
    ]
    matches = candidate_discovery_engine.discover_fuzzy_matches(
        entity_name="COOKING_METHOD",
        aliases=["steaming", "roasted"],
        seed_spans=[],
        corpus=test_corpus,
        threshold=0.50,
        min_n=1,
        max_n=3,
    )
    assert len(matches) > 0
    top_match = max(matches, key=lambda m: m["similarity_score"])
    assert top_match["similarity_score"] >= 0.50
    assert top_match["discovery_method"] == "fuzzy_match"


def test_embedding_similarity_reuses_e5_prefixes():
    engine = candidate_discovery_engine
    original = engine._embedding_model
    engine._embedding_model = FakeE5Encoder()
    try:
        corpus = [
            {"source_document": "RAG_COOK_1", "context": "Steaming vegetables preserves heat-sensitive vitamins for infants."},
            {"source_document": "RAG_OTHER", "context": "Children should wash hands before meals every day."},
        ]
        matches = engine.discover_embedding_matches(
            entity_name="COOKING_METHOD",
            aliases=["steaming"],
            seed_examples=[{"surface_span": "steaming", "text": "Steaming vegetables is recommended."}],
            corpus=corpus,
            threshold=0.70,
            sentence_threshold=0.50,
        )
        assert any(m["candidate_text"].lower().find("steam") >= 0 for m in matches)
        for m in matches:
            assert m["discovery_method"] == "embedding_similarity"
            assert m["similarity_score"] >= 0.70
            assert m["metadata"]["match_type"] == "dense_embedding_e5"
    finally:
        engine._embedding_model = original


def test_deduplication_and_ranking():
    raw_candidates = [
        {
            "entity_id": "SUPPLEMENT",
            "candidate_text": "iron drops",
            "start_char": 10,
            "end_char": 20,
            "context": "Administer iron drops to infants with mild anemia.",
            "source_document": "DOC_10",
            "discovery_method": "fuzzy_match",
            "similarity_score": 0.85,
            "status": "DISCOVERED",
        },
        {
            "entity_id": "SUPPLEMENT",
            "candidate_text": "iron drops",
            "start_char": 10,
            "end_char": 20,
            "context": "Administer iron drops to infants with mild anemia.",
            "source_document": "DOC_10",
            "discovery_method": "exact_match",
            "similarity_score": 1.0,
            "status": "DISCOVERED",
        },
    ]
    deduped, dup_count = candidate_discovery_engine.deduplicate_and_rank(raw_candidates)
    assert len(deduped) == 1
    assert dup_count == 1
    assert deduped[0].similarity_score == 1.0
    assert deduped[0].discovery_method == DiscoveryMethod.EXACT_MATCH
    assert "exact_match" in deduped[0].discovered_by_methods
    assert "fuzzy_match" in deduped[0].discovered_by_methods


def test_configurable_thresholds_from_settings():
    cfg = default_discovery_thresholds()
    assert cfg.exact_threshold == settings.DISCOVERY_EXACT_THRESHOLD
    assert cfg.fuzzy_threshold == settings.DISCOVERY_FUZZY_THRESHOLD
    assert cfg.embedding_threshold == settings.DISCOVERY_EMBEDDING_THRESHOLD
    custom = DiscoveryThresholds(fuzzy_threshold=0.92, embedding_threshold=0.81)
    assert custom.fuzzy_threshold == 0.92
    assert custom.embedding_threshold == 0.81


def test_discovery_api_endpoint(monkeypatch):
    tiny_corpus = [
        {"source_document": "RAG_API_1", "context": "Steaming vegetables and boiling pulses helps infant digestion."},
        {"source_document": "RAG_API_2", "context": "Infants with anemia need iron drops and zinc supplementation."},
        {"source_document": "RAG_API_3", "context": "A balanced diet and dietary diversity prevent hidden hunger."},
    ]
    monkeypatch.setattr(candidate_discovery_engine, "load_corpus_sentences", lambda: tiny_corpus)
    monkeypatch.setattr(candidate_discovery_engine, "_get_embedding_model", lambda: FakeE5Encoder())
    monkeypatch.setattr(candidate_discovery_engine, "_embedding_model", FakeE5Encoder())

    payload = {
        "exact_threshold": 1.0,
        "fuzzy_threshold": 0.85,
        "embedding_threshold": 0.75,
        "sentence_threshold": 0.50,
        "max_candidates_per_entity": 10,
        "min_ngram": 1,
        "max_ngram": 3,
    }
    response = client.post("/api/v1/entities/discover?persist=false", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "total_raw_mentions" in data
    assert "total_unique_candidates" in data
    assert "duplicate_count" in data
    assert "counts_by_entity" in data
    assert "counts_by_method" in data
    assert "confidence_distribution" in data
    assert data["embedding_model"] == settings.EMBEDDING_MODEL_NAME
    required_fields = {
        "entity_id",
        "candidate_text",
        "context",
        "source_document",
        "discovery_method",
        "similarity_score",
        "status",
    }
    for cand in data["candidates"]:
        assert required_fields.issubset(cand.keys())


def test_ner_gold_data_isolation():
    root = _repo_root()
    fingerprints = {}
    for rel in NER_GOLD_FILES:
        path = os.path.join(root, rel)
        assert os.path.exists(path), f"Missing frozen NER file: {rel}"
        fingerprints[rel] = _file_fingerprint(path)

    tiny_corpus = [
        {"source_document": "ISO_1", "context": "Steaming and boiling lentils improves digestibility."}
    ]
    candidate_discovery_engine.discover_exact_matches(
        "COOKING_METHOD", ["steaming", "boiling"], [], tiny_corpus
    )
    candidate_discovery_engine.discover_fuzzy_matches(
        "COOKING_METHOD", ["steaming"], [], tiny_corpus, threshold=0.85
    )

    for rel, before in fingerprints.items():
        after = _file_fingerprint(os.path.join(root, rel))
        assert after == before, f"Phase 3 discovery modified frozen NER file: {rel}"
    assert not os.path.exists(os.path.join(root, "ner", "data", "dynamic_candidates.json"))
