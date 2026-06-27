import os
import re
import math
import pickle
import numpy as np
from typing import List, Dict, Any, Tuple

# Try to import heavy libraries, fallback gracefully if not installed
try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False

try:
    from sentence_transformers import SentenceTransformer, CrossEncoder
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False

try:
    from rank_bm25 import BM25Okapi
    RANK_BM25_AVAILABLE = True
except ImportError:
    RANK_BM25_AVAILABLE = False

from app.db.connection import load_json_file, save_json_file

# --- Query Normalization ---
def normalize_query(text: str) -> str:
    """
    Cleans, lowercases, and normalizes queries for high-recall matching.
    """
    text = text.lower()
    # Remove punctuation
    text = re.sub(r'[^\w\s]', ' ', text)
    # Remove extra spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def tokenize(text: str) -> List[str]:
    return normalize_query(text).split()

# --- Pure Python BM25 Fallback ---
class PurePythonBM25:
    def __init__(self, corpus: List[str], k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.corpus_size = len(corpus)
        self.doc_tokens = [tokenize(doc) for doc in corpus]
        self.doc_lens = [len(tokens) for tokens in self.doc_tokens]
        self.avg_doc_len = sum(self.doc_lens) / max(1, self.corpus_size)
        
        # Vocab & Document Frequencies
        self.df = {}
        for tokens in self.doc_tokens:
            unique_words = set(tokens)
            for word in unique_words:
                self.df[word] = self.df.get(word, 0) + 1
                
        # Inverse Document Frequency (smooth)
        self.idf = {}
        for word, freq in self.df.items():
            self.idf[word] = math.log((self.corpus_size - freq + 0.5) / (freq + 0.5) + 1.0)
            
    def get_scores(self, query_tokens: List[str]) -> np.ndarray:
        scores = np.zeros(self.corpus_size)
        for i, doc in enumerate(self.doc_tokens):
            doc_len = self.doc_lens[i]
            # TF for terms in doc
            tf = {}
            for word in doc:
                tf[word] = tf.get(word, 0) + 1
                
            doc_score = 0.0
            for word in query_tokens:
                if word in tf:
                    word_tf = tf[word]
                    denom = word_tf + self.k1 * (1.0 - self.b + self.b * (doc_len / self.avg_doc_len))
                    doc_score += self.idf.get(word, 0.0) * (word_tf * (self.k1 + 1.0)) / denom
            scores[i] = doc_score
        return scores

# --- Hybrid Retriever Engine ---
class ProductionHybridRetriever:
    def __init__(self):
        self.vector_store_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "vector_store")
        os.makedirs(self.vector_store_dir, exist_ok=True)
        self.index_path = os.path.join(self.vector_store_dir, "faiss_index.bin")
        self.metadata_path = os.path.join(self.vector_store_dir, "metadata.pkl")
        
        # Models Init placeholders
        self.embedding_model = None
        self.reranker_model = None
        self.documents = []
        self.faiss_index = None
        
        self.load_corpus()
        self.init_models()
        self.build_or_load_indices()
        
    def load_corpus(self):
        self.documents = load_json_file("rag_data.json")
        if not self.documents:
            # Fallback corpus
            self.documents = [
                {
                    "id": "RAG_FALLBACK_1",
                    "text": "During fever, children should consume soft, easily digestible foods like moong dal khichdi, ragi porridge, and warm clear soups.",
                    "metadata": {"type": "condition", "condition": "fever", "source": "ICMR Guidelines"}
                },
                {
                    "id": "RAG_FALLBACK_2",
                    "text": "For children with a peanut allergy, strict avoidance of peanuts, peanut butter, and products processed in facilities with peanuts is required.",
                    "metadata": {"type": "allergy", "allergy": "peanut", "source": "Allergy Safety Board"}
                }
            ]
            
    def init_models(self):
        if TRANSFORMERS_AVAILABLE:
            try:
                # Use intfloat/e5-small-v2 as preferred embedding model
                self.embedding_model = SentenceTransformer("intfloat/e5-small-v2")
                # Use ms-marco reranker for highly specialized ranking
                self.reranker_model = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
            except Exception as e:
                print(f"[WARN] Failed to load transformers models: {str(e)}. Falling back to lexical-only mode.")
                
    def build_or_load_indices(self):
        # 1. Initialize BM25
        doc_texts = [doc.get("text", "") for doc in self.documents]
        if RANK_BM25_AVAILABLE:
            tokenized_corpus = [tokenize(txt) for txt in doc_texts]
            self.bm25 = BM25Okapi(tokenized_corpus)
        else:
            self.bm25 = PurePythonBM25(doc_texts)
            
        # 2. Build or Load FAISS Vector Index
        if FAISS_AVAILABLE and self.embedding_model is not None:
            try:
                if os.path.exists(self.index_path) and os.path.exists(self.metadata_path):
                    self.faiss_index = faiss.read_index(self.index_path)
                    with open(self.metadata_path, 'rb') as f:
                        saved_docs = pickle.load(f)
                    # Verify sync
                    if len(saved_docs) == len(self.documents):
                        print("[INFO] FAISS vector index loaded successfully.")
                        return
                        
                # Rebuild Index
                print("[INFO] Building FAISS Vector Index...")
                # Prefix queries with "passage: " for E5 model standard structure
                formatted_texts = [f"passage: {txt}" for txt in doc_texts]
                embeddings = self.embedding_model.encode(formatted_texts, convert_to_numpy=True)
                
                # Check dimension
                dim = embeddings.shape[1]
                # IndexFlatIP uses inner product (Cosine similarity if normalized)
                faiss.normalize_L2(embeddings)
                self.faiss_index = faiss.IndexFlatIP(dim)
                self.faiss_index.add(embeddings.astype('float32'))
                
                # Persist
                faiss.write_index(self.faiss_index, self.index_path)
                with open(self.metadata_path, 'wb') as f:
                    pickle.dump(self.documents, f)
                print("[INFO] FAISS vector index compiled and saved.")
            except Exception as e:
                print(f"[ERROR] FAISS compilation failed: {str(e)}. Vector retrieval disabled.")
                self.faiss_index = None

    def retrieve_bm25(self, query: str, top_k: int = 10) -> List[Tuple[float, Dict[str, Any]]]:
        query_tokens = tokenize(query)
        if not query_tokens:
            return []
            
        scores = self.bm25.get_scores(query_tokens)
            
        top_indices = np.argsort(scores)[::-1][:top_k]
        results = []
        for idx in top_indices:
            score = scores[idx]
            if score > 0:
                results.append((float(score), self.documents[idx]))
        return results

    def retrieve_vector(self, query: str, top_k: int = 10) -> List[Tuple[float, Dict[str, Any]]]:
        if not FAISS_AVAILABLE or self.faiss_index is None or self.embedding_model is None:
            return []
            
        # Prefix query with "query: " for E5 models standard
        query_formatted = f"query: {query}"
        query_vector = self.embedding_model.encode([query_formatted], convert_to_numpy=True)
        faiss.normalize_L2(query_vector)
        
        scores, indices = self.faiss_index.search(query_vector.astype('float32'), top_k)
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx != -1:
                # FAISS inner product score
                results.append((float(score), self.documents[idx]))
        return results

    def query(self, query_text: str, top_k: int = 5) -> List[Dict[str, Any]]:
        # Phase 1.1: BM25 Lexical
        bm25_res = self.retrieve_bm25(query_text, top_k=10)
        
        # Phase 1.2: FAISS Vector dense
        vec_res = self.retrieve_vector(query_text, top_k=10)
        
        # Phase 1.3: Reciprocal Rank Fusion (RRF) for merging
        rrf_scores = {} # Doc ID -> Score
        doc_map = {}
        
        def apply_rrf(results, weight=1.0):
            for rank, (score, doc) in enumerate(results):
                doc_id = doc.get("id")
                doc_map[doc_id] = doc
                # RRF Formula: 1 / (60 + rank)
                rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + weight * (1.0 / (60.0 + rank))
                
        apply_rrf(bm25_res, weight=1.0)
        apply_rrf(vec_res, weight=1.0)
        
        # Sort candidates
        merged_candidates = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)[:10]
        candidate_docs = [doc_map[doc_id] for doc_id, _ in merged_candidates]
        
        if not candidate_docs:
            return []
            
        # Phase 1.4: Cross-Encoder Reranking
        if TRANSFORMERS_AVAILABLE and self.reranker_model is not None:
            pairs = [[query_text, doc.get("text", "")] for doc in candidate_docs]
            rerank_scores = self.reranker_model.predict(pairs)
            
            # Sort candidate chunks based on CrossEncoder prediction
            ranked_indices = np.argsort(rerank_scores)[::-1][:top_k]
            final_docs = []
            for rank_idx in ranked_indices:
                doc = candidate_docs[rank_idx]
                score = float(rerank_scores[rank_idx])
                # Convert logits to a confidence rating range [0, 1] via sigmoid
                confidence = 1.0 / (1.0 + math.exp(-score))
                doc["rerank_confidence"] = round(confidence, 2)
                final_docs.append(doc)
            return final_docs
        else:
            # Fallback to RRF rank order
            for i, doc in enumerate(candidate_docs[:top_k]):
                doc["rerank_confidence"] = round(1.0 - (i * 0.1), 2)
            return candidate_docs[:top_k]

# Singleton engine instance
_hybrid_retriever_instance = None

def get_hybrid_retriever():
    global _hybrid_retriever_instance
    if _hybrid_retriever_instance is None:
        _hybrid_retriever_instance = ProductionHybridRetriever()
    return _hybrid_retriever_instance

def retrieve_hybrid_chunks(query: str, top_k: int = 5) -> Tuple[List[str], List[Dict[str, Any]]]:
    """
    Unified entry point returning:
    - List of raw string chunks (for backward compatibility in prompt builder)
    - List of full metadata dictionaries (for structured citations rendering)
    """
    retriever = get_hybrid_retriever()
    docs = retriever.query(query, top_k=top_k)
    
    raw_texts = []
    citations = []
    seen = set()
    
    for doc in docs:
        txt = doc.get("text", "").strip()
        if txt not in seen:
            raw_texts.append(txt)
            seen.add(txt)
            
            meta = doc.get("metadata", {})
            citations.append({
                "source": meta.get("source") or "ICMR Pediatric Nutrition Guidelines",
                "section": meta.get("condition") or meta.get("type") or meta.get("tags", ["General"])[0],
                "confidence": doc.get("rerank_confidence", 0.85)
            })
            
    return raw_texts, citations
