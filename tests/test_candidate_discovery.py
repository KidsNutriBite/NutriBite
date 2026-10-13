import os
import sys
import pytest

ai_service_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ai-service-v2")
if ai_service_dir not in sys.path:
    sys.path.insert(0, ai_service_dir)

from app.services.candidate_discovery_service import candidate_discovery_engine
from app.schemas.dynamic_entity import DiscoveryMethod


def test_exact_and_fuzzy_discovery_from_root():
    corpus = [
        {"source_document": "RAG_TEST_1", "context": "Sprouting pulses and steaming vegetables supports complementary feeding."}
    ]
    exact = candidate_discovery_engine.discover_exact_matches(
        "COOKING_METHOD", ["sprouting", "steaming"], [], corpus
    )
    fuzzy = candidate_discovery_engine.discover_fuzzy_matches(
        "COOKING_METHOD", ["sprouting"], [], corpus, threshold=0.80
    )
    assert any(m["candidate_text"].lower() == "sprouting" for m in exact)
    assert all(m["discovery_method"] == DiscoveryMethod.EXACT_MATCH.value for m in exact)
    combined, dup_count = candidate_discovery_engine.deduplicate_and_rank(exact + fuzzy)
    assert len(combined) >= 1
    assert dup_count >= 0
    assert combined[0].status.value == "DISCOVERED"
