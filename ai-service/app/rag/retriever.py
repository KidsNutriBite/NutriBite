import os
import re
import math
from typing import List, Dict, Any
from app.db.connection import load_json_file, save_json_file

def tokenize(text: str) -> List[str]:
    # Lowercase and extract alphanumeric words
    return re.findall(r'\b\w+\b', text.lower())

class PurePythonTFIDF:
    def __init__(self, documents: List[Dict[str, Any]]):
        self.documents = documents
        self.doc_tokens = [tokenize(doc.get("text", "")) for doc in documents]
        self.vocab = set(word for tokens in self.doc_tokens for word in tokens)
        self.vocab = list(self.vocab)
        self.vocab_index = {word: i for i, word in enumerate(self.vocab)}
        
        # Calculate IDF
        self.num_docs = len(documents)
        self.df = {word: 0 for word in self.vocab}
        for tokens in self.doc_tokens:
            unique_words = set(tokens)
            for word in unique_words:
                self.df[word] += 1
                
        self.idf = {}
        for word, count in self.df.items():
            # Standard smooth IDF formula
            self.idf[word] = math.log((1 + self.num_docs) / (1 + count)) + 1
            
        # Calculate TF-IDF vectors for all documents
        self.doc_vectors = []
        for tokens in self.doc_tokens:
            vector = {}
            total_words = len(tokens)
            if total_words == 0:
                self.doc_vectors.append(vector)
                continue
                
            tf = {}
            for word in tokens:
                tf[word] = tf.get(word, 0) + 1
                
            for word, count in tf.items():
                word_tf = count / total_words
                vector[word] = word_tf * self.idf[word]
            self.doc_vectors.append(vector)

    def cosine_similarity(self, vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
        # Dot product
        dot_product = 0.0
        for word, val in vec1.items():
            if word in vec2:
                dot_product += val * vec2[word]
                
        # Magnitudes
        mag1 = math.sqrt(sum(val ** 2 for val in vec1.values()))
        mag2 = math.sqrt(sum(val ** 2 for val in vec2.values()))
        
        if mag1 == 0.0 or mag2 == 0.0:
            return 0.0
            
        return dot_product / (mag1 * mag2)

    def query(self, query_text: str, top_k: int = 5) -> List[Dict[str, Any]]:
        query_tokens = tokenize(query_text)
        if not query_tokens:
            return []
            
        # Compute TF-IDF for query
        query_tf = {}
        total_query_words = len(query_tokens)
        for word in query_tokens:
            if word in self.vocab_index:
                query_tf[word] = query_tf.get(word, 0) + 1
                
        query_vec = {}
        for word, count in query_tf.items():
            tf_val = count / total_query_words
            query_vec[word] = tf_val * self.idf[word]
            
        scores = []
        for i, doc_vec in enumerate(self.doc_vectors):
            sim = self.cosine_similarity(query_vec, doc_vec)
            # Add small bonus if query matches metadata tags
            doc = self.documents[i]
            metadata = doc.get("metadata", {})
            tags = metadata.get("tags", [])
            for token in query_tokens:
                if token in tags:
                    sim += 0.1  # Metadata match bonus
                if metadata.get("food_name", "").lower() == token:
                    sim += 0.15
                if metadata.get("condition", "").lower() == token:
                    sim += 0.15
                    
            if sim > 0:
                scores.append((sim, doc))
                
        # Sort by similarity score descending
        scores.sort(key=lambda x: x[0], reverse=True)
        return [doc for score, doc in scores[:top_k]]

_tfidf_instance = None

def get_retriever():
    global _tfidf_instance
    if _tfidf_instance is None:
        rag_data = load_json_file("rag_data.json")
        if not rag_data:
            # Fallback if empty
            rag_data = [
                {
                    "id": "fallback_1",
                    "text": "During fever, children should consume soft, easily digestible foods and avoid oily or spicy meals.",
                    "metadata": {"type": "condition", "condition": "fever"}
                }
            ]
        _tfidf_instance = PurePythonTFIDF(rag_data)
    return _tfidf_instance

def retrieve_rag_chunks(query: str, top_k: int = 5) -> List[str]:
    retriever = get_retriever()
    # Dynamic top_k based on query length (more context for longer queries)
    dynamic_k = max(4, min(top_k, len(query.split()) + 2))
    
    results = retriever.query(query, top_k=dynamic_k * 2) # Fetch extra for deduplication
    
    # Deduplication and reranking heuristic
    unique_chunks = []
    seen_texts = set()
    
    for doc in results:
        text = doc.get("text", "").strip()
        # Simple exact match or subset deduplication
        is_duplicate = False
        for seen in seen_texts:
            if text in seen or seen in text:
                is_duplicate = True
                break
                
        if not is_duplicate and text:
            unique_chunks.append(text)
            seen_texts.add(text)
            
        if len(unique_chunks) >= dynamic_k:
            break
            
    return unique_chunks

def add_rag_chunk(text: str, metadata: Dict[str, Any]) -> str:
    global _tfidf_instance
    rag_data = load_json_file("rag_data.json")
    
    new_id = f"RAG_DYNAMIC_{len(rag_data) + 1}"
    new_chunk = {
        "id": new_id,
        "text": text,
        "metadata": metadata
    }
    
    rag_data.append(new_chunk)
    save_json_file("rag_data.json", rag_data)
    
    # Invalidate TF-IDF cache to rebuild with new data
    _tfidf_instance = None
    
    return new_id
