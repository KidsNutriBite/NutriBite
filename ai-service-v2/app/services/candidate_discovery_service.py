import os
import re
import uuid
import json
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from collections import defaultdict, Counter

import numpy as np

from app.core.config import settings
from app.schemas.dynamic_entity import (
    DynamicCandidate,
    DiscoveryMethod,
    CandidateStatus,
    DiscoveryThresholds,
    DiscoverySummaryResponse,
    EntityLifecycleStatus,
)
from app.services.dynamic_entity_service import dynamic_entity_service
from app.db.connection import load_json_file, save_json_file, DATASETS_DIR
from app.utils.logger import logger

try:
    from rapidfuzz import fuzz
    RAPIDFUZZ_AVAILABLE = True
except ImportError:
    RAPIDFUZZ_AVAILABLE = False

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False

DISCOVERABLE_STATUSES = {
    EntityLifecycleStatus.VALIDATED,
    EntityLifecycleStatus.TRAINING,
    EntityLifecycleStatus.EVALUATED,
    EntityLifecycleStatus.ACTIVE,
}

STOPWORDS = {
    "a", "an", "the", "and", "or", "of", "to", "in", "on", "for", "with", "by",
    "from", "as", "at", "is", "are", "be", "was", "were", "it", "its", "this",
    "that", "these", "those", "into", "than", "then", "also", "not", "no",
}

CANDIDATE_STORE_FILE = "dynamic_candidates.json"


def default_discovery_thresholds() -> DiscoveryThresholds:
    return DiscoveryThresholds(
        exact_threshold=settings.DISCOVERY_EXACT_THRESHOLD,
        fuzzy_threshold=settings.DISCOVERY_FUZZY_THRESHOLD,
        embedding_threshold=settings.DISCOVERY_EMBEDDING_THRESHOLD,
        sentence_threshold=settings.DISCOVERY_SENTENCE_THRESHOLD,
        max_candidates_per_entity=settings.DISCOVERY_MAX_CANDIDATES_PER_ENTITY,
        min_ngram=settings.DISCOVERY_MIN_NGRAM,
        max_ngram=settings.DISCOVERY_MAX_NGRAM,
    )


class CandidateDiscoveryEngine:
    """
    Phase 3 Dynamic NER Candidate Discovery Engine.

    Reads validated/active registry entities and scans the RAG corpus using:
    1. exact / alias matching
    2. fuzzy lexical matching
    3. Sentence Transformer cosine similarity with the existing RAG encoder
       (intfloat/e5-small-v2, query:/passage: prefixes).
    """

    def __init__(self):
        self._embedding_model = None
        self._model_name = settings.EMBEDDING_MODEL_NAME

    def _get_embedding_model(self):
        if self._embedding_model is not None:
            return self._embedding_model

        # Reuse the already-initialized RAG encoder if the hybrid retriever is live.
        try:
            from app.rag import hybrid_retriever as hr
            instance = getattr(hr, "_hybrid_retriever_instance", None)
            if instance is not None and getattr(instance, "embedding_model", None) is not None:
                self._embedding_model = instance.embedding_model
                logger.info("Reusing ProductionHybridRetriever embedding model for candidate discovery.")
                return self._embedding_model
        except Exception as e:
            logger.debug(f"Could not reuse hybrid retriever encoder: {e}")

        if SENTENCE_TRANSFORMERS_AVAILABLE:
            try:
                logger.info(f"Loading SentenceTransformer '{self._model_name}' (RAG embedding setup)...")
                self._embedding_model = SentenceTransformer(self._model_name)
            except Exception as e:
                logger.warning(f"Failed to load SentenceTransformer ({e}). Embedding discovery will be skipped.")
                self._embedding_model = None
        return self._embedding_model

    def _encode(self, texts: List[str], prefix: str) -> Optional[np.ndarray]:
        model = self._get_embedding_model()
        if model is None or not texts:
            return None
        formatted = [f"{prefix} {t}" for t in texts]
        try:
            vectors = model.encode(formatted, convert_to_numpy=True, normalize_embeddings=True)
        except TypeError:
            vectors = model.encode(formatted, convert_to_numpy=True)
            norms = np.linalg.norm(vectors, axis=1, keepdims=True)
            vectors = vectors / np.clip(norms, 1e-12, None)
        return np.asarray(vectors, dtype=np.float32)

    def load_corpus_sentences(self) -> List[Dict[str, str]]:
        """Load natural-language sentences from the NutriBite RAG corpus (and retrieval queries)."""
        rag_data = load_json_file("rag_data.json")
        corpus: List[Dict[str, str]] = []

        if isinstance(rag_data, list):
            for doc in rag_data:
                if not isinstance(doc, dict):
                    continue
                doc_id = str(doc.get("id") or doc.get("doc_id") or "RAG_DOC")
                text = doc.get("text") or doc.get("content") or ""
                if not text:
                    continue
                sentences = re.split(r"(?<=[.?!])\s+", text)
                for s in sentences:
                    s_clean = s.strip()
                    if len(s_clean) > 5:
                        corpus.append({"source_document": doc_id, "context": s_clean})

        retrieval_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "evaluation",
            "retrieval_dataset.json",
        )
        if os.path.exists(retrieval_path):
            try:
                with open(retrieval_path, "r", encoding="utf-8") as f:
                    retrieval_data = json.load(f)
            except Exception as e:
                logger.warning(f"Could not load retrieval_dataset.json: {e}")
                retrieval_data = []
            if isinstance(retrieval_data, list):
                for idx, q in enumerate(retrieval_data):
                    query_text = q.get("query", "") if isinstance(q, dict) else ""
                    if query_text:
                        corpus.append({
                            "source_document": f"RETRIEVAL_QUERY_{idx + 1}",
                            "context": query_text.strip(),
                        })

        return corpus

    def _extract_ngrams(self, text: str, min_n: int = 1, max_n: int = 4) -> List[Tuple[str, int, int]]:
        tokens = []
        for match in re.finditer(r"\b[a-zA-Z0-9_\-']+\b", text):
            tokens.append((match.group(), match.start(), match.end()))

        ngrams = []
        num_tokens = len(tokens)
        for n in range(min_n, min(max_n + 1, num_tokens + 1)):
            for i in range(num_tokens - n + 1):
                span_tokens = tokens[i:i + n]
                start_c = span_tokens[0][1]
                end_c = span_tokens[-1][2]
                span_text = text[start_c:end_c]
                ngrams.append((span_text, start_c, end_c))
        return ngrams

    def _reference_terms(self, aliases: List[str], seed_spans: List[str]) -> List[str]:
        return list(dict.fromkeys([t.strip().lower() for t in (aliases + seed_spans) if t and t.strip()]))

    def discover_exact_matches(
        self,
        entity_name: str,
        aliases: List[str],
        seed_spans: List[str],
        corpus: List[Dict[str, str]],
        threshold: float = 1.0,
    ) -> List[Dict[str, Any]]:
        candidates = []
        target_terms = self._reference_terms(aliases, seed_spans)
        if not target_terms:
            return candidates

        patterns = []
        for term in target_terms:
            escaped = re.escape(term)
            patterns.append((term, re.compile(rf"\b{escaped}\b", re.IGNORECASE)))

        score = 1.0 if threshold <= 1.0 else float(threshold)
        for item in corpus:
            context = item["context"]
            doc_id = item["source_document"]
            for term, pattern in patterns:
                for m in pattern.finditer(context):
                    candidates.append({
                        "entity_id": entity_name,
                        "candidate_text": m.group(),
                        "start_char": m.start(),
                        "end_char": m.end(),
                        "context": context,
                        "source_document": doc_id,
                        "discovery_method": DiscoveryMethod.EXACT_MATCH.value,
                        "similarity_score": round(float(score), 4),
                        "status": CandidateStatus.DISCOVERED.value,
                        "metadata": {
                            "matched_alias": term,
                            "match_type": "exact_boundary",
                        },
                    })
        return candidates

    def discover_fuzzy_matches(
        self,
        entity_name: str,
        aliases: List[str],
        seed_spans: List[str],
        corpus: List[Dict[str, str]],
        threshold: float = 0.80,
        min_n: int = 1,
        max_n: int = 4,
    ) -> List[Dict[str, Any]]:
        candidates = []
        target_terms = self._reference_terms(aliases, seed_spans)
        if not target_terms:
            return candidates

        thresh_pct = threshold * 100.0
        for item in corpus:
            context = item["context"]
            doc_id = item["source_document"]
            ngrams = self._extract_ngrams(context, min_n=min_n, max_n=max_n)

            for span_text, start_c, end_c in ngrams:
                span_lower = span_text.lower()
                if len(span_lower) < 3:
                    continue
                span_tokens = span_lower.split()
                if all(tok in STOPWORDS for tok in span_tokens):
                    continue

                best_score = 0.0
                best_alias = ""
                for term in target_terms:
                    if span_lower == term:
                        continue
                    if abs(len(span_lower) - len(term)) > max(6, int(0.6 * max(len(span_lower), len(term)))):
                        continue

                    if RAPIDFUZZ_AVAILABLE:
                        s1 = fuzz.token_sort_ratio(span_lower, term)
                        s2 = fuzz.ratio(span_lower, term)
                        score = max(s1, s2)
                        if min(len(span_tokens), len(term.split())) >= 2:
                            score = max(score, fuzz.partial_ratio(span_lower, term))
                    else:
                        from difflib import SequenceMatcher
                        score = SequenceMatcher(None, span_lower, term).ratio() * 100.0

                    if score > best_score:
                        best_score = score
                        best_alias = term

                if best_score >= thresh_pct:
                    candidates.append({
                        "entity_id": entity_name,
                        "candidate_text": span_text,
                        "start_char": start_c,
                        "end_char": end_c,
                        "context": context,
                        "source_document": doc_id,
                        "discovery_method": DiscoveryMethod.FUZZY_MATCH.value,
                        "similarity_score": round(best_score / 100.0, 4),
                        "status": CandidateStatus.DISCOVERED.value,
                        "metadata": {
                            "matched_alias": best_alias,
                            "fuzzy_ratio": best_score,
                            "match_type": "lexical_fuzzy",
                        },
                    })
        return candidates

    def discover_embedding_matches(
        self,
        entity_name: str,
        aliases: List[str],
        seed_examples: List[Dict[str, Any]],
        corpus: List[Dict[str, str]],
        threshold: float = 0.70,
        sentence_threshold: float = 0.55,
        min_n: int = 1,
        max_n: int = 4,
        passage_embeddings: Optional[np.ndarray] = None,
    ) -> List[Dict[str, Any]]:
        """
        Dense cosine similarity using the RAG E5 encoder.
        Sentence-level query/passage retrieval gates which documents receive span extraction.
        """
        candidates = []
        model = self._get_embedding_model()
        if model is None:
            logger.warning("SentenceTransformer not available. Skipping dense embedding pass.")
            return candidates

        reference_phrases = []
        for a in aliases:
            if a.strip():
                reference_phrases.append(a.strip())
        for s in seed_examples:
            sp = (s.get("surface_span") or "").strip()
            if sp:
                reference_phrases.append(sp)
            txt = (s.get("text") or "").strip()
            if txt:
                reference_phrases.append(txt)
        if not reference_phrases:
            reference_phrases = [entity_name.replace("_", " ").lower()]
        reference_phrases = list(dict.fromkeys(reference_phrases))

        query_embeddings = self._encode(reference_phrases, "query:")
        if query_embeddings is None:
            return candidates

        if passage_embeddings is None:
            passage_embeddings = self._encode([item["context"] for item in corpus], "passage:")
            if passage_embeddings is None:
                return candidates

        if passage_embeddings.shape[0] != len(corpus):
            logger.warning("Passage embedding count does not match corpus; re-encoding sentences.")
            passage_embeddings = self._encode([item["context"] for item in corpus], "passage:")
            if passage_embeddings is None:
                return candidates

        sentence_sims = np.dot(passage_embeddings, query_embeddings.T)
        sentence_max = np.max(sentence_sims, axis=1)
        gated_indices = [i for i, sim in enumerate(sentence_max) if sim >= sentence_threshold]

        for i in gated_indices:
            item = corpus[i]
            context = item["context"]
            doc_id = item["source_document"]
            ngrams = self._extract_ngrams(context, min_n=min_n, max_n=max_n)

            span_candidates = []
            for span_text, start_c, end_c in ngrams:
                span_lower = span_text.lower()
                tokens = span_lower.split()
                if len(span_lower) < 4 or span_lower.isdigit():
                    continue
                if all(tok in STOPWORDS for tok in tokens):
                    continue
                span_candidates.append((span_text, start_c, end_c))
            if not span_candidates:
                continue

            span_embeddings = self._encode([sc[0] for sc in span_candidates], "query:")
            if span_embeddings is None:
                continue

            sim_matrix = np.dot(span_embeddings, query_embeddings.T)
            max_sims = np.max(sim_matrix, axis=1)
            for idx, max_sim in enumerate(max_sims):
                if max_sim >= threshold:
                    span_text, start_c, end_c = span_candidates[idx]
                    best_ref_idx = int(np.argmax(sim_matrix[idx]))
                    candidates.append({
                        "entity_id": entity_name,
                        "candidate_text": span_text,
                        "start_char": start_c,
                        "end_char": end_c,
                        "context": context,
                        "source_document": doc_id,
                        "discovery_method": DiscoveryMethod.EMBEDDING_SIMILARITY.value,
                        "similarity_score": round(float(max_sim), 4),
                        "status": CandidateStatus.DISCOVERED.value,
                        "metadata": {
                            "matched_prototype": reference_phrases[best_ref_idx],
                            "cosine_similarity": round(float(max_sim), 4),
                            "sentence_similarity": round(float(sentence_max[i]), 4),
                            "match_type": "dense_embedding_e5",
                            "embedding_model": self._model_name,
                        },
                    })
        return candidates

    def deduplicate_and_rank(
        self,
        raw_candidates: List[Dict[str, Any]],
    ) -> Tuple[List[DynamicCandidate], int]:
        grouped = defaultdict(list)
        for c in raw_candidates:
            key = (
                c["entity_id"],
                c["candidate_text"].strip().lower(),
                c["context"].strip(),
                c["source_document"],
            )
            grouped[key].append(c)

        method_priority = {
            DiscoveryMethod.EXACT_MATCH.value: 3,
            DiscoveryMethod.FUZZY_MATCH.value: 2,
            DiscoveryMethod.EMBEDDING_SIMILARITY.value: 1,
        }

        deduped = []
        for matches in grouped.values():
            matches.sort(
                key=lambda x: (x["similarity_score"], method_priority.get(x["discovery_method"], 0)),
                reverse=True,
            )
            top_match = matches[0]
            methods_seen = list(dict.fromkeys([m["discovery_method"] for m in matches]))
            merged_meta = dict(top_match.get("metadata") or {})
            merged_meta["all_method_scores"] = {
                m["discovery_method"]: m["similarity_score"] for m in matches
            }
            deduped.append(DynamicCandidate(
                candidate_id=f"CAND_{top_match['entity_id']}_{uuid.uuid4().hex[:8].upper()}",
                entity_id=top_match["entity_id"],
                candidate_text=top_match["candidate_text"],
                start_char=top_match.get("start_char"),
                end_char=top_match.get("end_char"),
                context=top_match["context"],
                source_document=top_match["source_document"],
                discovery_method=DiscoveryMethod(top_match["discovery_method"]),
                similarity_score=top_match["similarity_score"],
                status=CandidateStatus.DISCOVERED,
                discovered_by_methods=methods_seen,
                metadata=merged_meta,
            ))

        deduped.sort(key=lambda x: (x.similarity_score, len(x.discovered_by_methods)), reverse=True)
        duplicate_count = len(raw_candidates) - len(deduped)
        return deduped, duplicate_count

    def persist_candidates(self, summary: DiscoverySummaryResponse) -> str:
        """Persist candidates to datasets/dynamic_candidates.json (not NER gold/silver files)."""
        payload = {
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "store": "dynamic_candidates",
            "isolated_from_ner_gold": True,
            "total_raw_mentions": summary.total_raw_mentions,
            "total_unique_candidates": summary.total_unique_candidates,
            "duplicate_count": summary.duplicate_count,
            "capped_dropped_count": summary.capped_dropped_count,
            "corpus_sentence_count": summary.corpus_sentence_count,
            "counts_by_entity": summary.counts_by_entity,
            "counts_by_method": summary.counts_by_method,
            "confidence_distribution": summary.confidence_distribution,
            "thresholds_used": summary.thresholds_used.model_dump(),
            "embedding_model": summary.embedding_model,
            "candidates": [c.model_dump() for c in summary.candidates],
        }
        save_json_file(CANDIDATE_STORE_FILE, payload)
        return os.path.join(DATASETS_DIR, CANDIDATE_STORE_FILE)

    def run_discovery_pipeline(
        self,
        entity_names: Optional[List[str]] = None,
        thresholds: Optional[DiscoveryThresholds] = None,
        persist: bool = True,
    ) -> DiscoverySummaryResponse:
        cfg = thresholds or default_discovery_thresholds()

        dynamic_entity_service.seed_phase1_defaults()

        all_entities = dynamic_entity_service.list_entities().entities
        if entity_names:
            target_entities = [e for e in all_entities if e.name in entity_names]
        else:
            target_entities = [e for e in all_entities if e.status in DISCOVERABLE_STATUSES]

        corpus = self.load_corpus_sentences()
        logger.info(f"Loaded {len(corpus)} RAG corpus sentences for candidate discovery.")

        passage_embeddings = None
        if self._get_embedding_model() is not None and corpus:
            passage_embeddings = self._encode([item["context"] for item in corpus], "passage:")

        all_raw_candidates: List[Dict[str, Any]] = []
        for entity in target_entities:
            aliases = entity.aliases or []
            seed_spans = [s.surface_span for s in entity.seed_examples if s.surface_span]
            seed_dicts = [s.model_dump() for s in entity.seed_examples]
            logger.info(f"Discovering candidates for '{entity.name}' (aliases={len(aliases)}, seeds={len(seed_spans)})")

            all_raw_candidates.extend(self.discover_exact_matches(
                entity.name, aliases, seed_spans, corpus, threshold=cfg.exact_threshold
            ))
            all_raw_candidates.extend(self.discover_fuzzy_matches(
                entity.name, aliases, seed_spans, corpus,
                threshold=cfg.fuzzy_threshold,
                min_n=cfg.min_ngram,
                max_n=cfg.max_ngram,
            ))
            all_raw_candidates.extend(self.discover_embedding_matches(
                entity.name, aliases, seed_dicts, corpus,
                threshold=cfg.embedding_threshold,
                sentence_threshold=cfg.sentence_threshold,
                min_n=cfg.min_ngram,
                max_n=cfg.max_ngram,
                passage_embeddings=passage_embeddings,
            ))

        deduped_candidates, duplicate_count = self.deduplicate_and_rank(all_raw_candidates)

        by_entity_candidates = defaultdict(list)
        for c in deduped_candidates:
            if len(by_entity_candidates[c.entity_id]) < cfg.max_candidates_per_entity:
                by_entity_candidates[c.entity_id].append(c)

        final_candidates = []
        for ents in by_entity_candidates.values():
            final_candidates.extend(ents)
        final_candidates.sort(key=lambda x: x.similarity_score, reverse=True)
        capped_dropped_count = len(deduped_candidates) - len(final_candidates)

        counts_by_entity = dict(Counter([c.entity_id for c in final_candidates]))
        counts_by_method = dict(Counter([c.discovery_method.value for c in final_candidates]))
        confidence_dist = {
            "[0.90 - 1.00] (High)": 0,
            "[0.80 - 0.89] (Medium-High)": 0,
            "[0.70 - 0.79] (Moderate)": 0,
            "< 0.70 (Low)": 0,
        }
        for c in final_candidates:
            if c.similarity_score >= 0.90:
                confidence_dist["[0.90 - 1.00] (High)"] += 1
            elif c.similarity_score >= 0.80:
                confidence_dist["[0.80 - 0.89] (Medium-High)"] += 1
            elif c.similarity_score >= 0.70:
                confidence_dist["[0.70 - 0.79] (Moderate)"] += 1
            else:
                confidence_dist["< 0.70 (Low)"] += 1

        summary = DiscoverySummaryResponse(
            total_raw_mentions=len(all_raw_candidates),
            total_unique_candidates=len(final_candidates),
            duplicate_count=duplicate_count,
            capped_dropped_count=capped_dropped_count,
            corpus_sentence_count=len(corpus),
            counts_by_entity=counts_by_entity,
            counts_by_method=counts_by_method,
            confidence_distribution=confidence_dist,
            thresholds_used=cfg,
            embedding_model=self._model_name,
            candidates=final_candidates,
        )
        if persist:
            self.persist_candidates(summary)
        return summary


candidate_discovery_engine = CandidateDiscoveryEngine()
