import os
from typing import List, Dict, Any, Optional

from rag.services.config_service import ConfigurationService, RAGConfig
from rag.services.retrieval_service import RetrievalService

class KidsNutriRetriever:
    """
    Facade class wrapping RetrievalService for 100% backward compatibility.
    Guarantees seamless integration with CLI main.py, Evaluator, Comparator, and Notebooks.
    """
    def __init__(self, index_dir: Optional[str] = None, model_name: str = "BAAI/bge-small-en-v1.5", config: Optional[RAGConfig] = None):
        if config is None:
            config = RAGConfig(embedding_model=model_name)
        if index_dir is not None:
            config.index_dir = index_dir

        config_service = ConfigurationService(config=config)
        self.service = RetrievalService(config_service=config_service)
        self.config = config

    @property
    def model(self):
        """Exposes embedding model instance for backward compatibility (e.g. evaluator.py)."""
        self.service.embedding_service._lazy_load()
        return self.service.embedding_service.model

    @property
    def metadata(self):
        """Exposes metadata items list for backward compatibility."""
        return self.service.child_chunks

    @property
    def cache(self):
        """Exposes cache service for stats and debugging."""
        return self.service.cache_service

    def retrieve(
        self,
        query: str,
        top_k: Optional[int] = None,
        metadata_filters: Optional[Dict[str, Any]] = None,
        mode: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        return self.service.retrieve(query=query, top_k=top_k, metadata_filters=metadata_filters, mode=mode)

    def add_knowledge(
        self,
        text: str,
        source: str = "user_provided",
        metadata: Optional[Dict[str, Any]] = None,
        persist: bool = True,
    ) -> Dict[str, Any]:
        """
        Dynamically adds and indexes a new knowledge chunk into FAISS and BM25.
        Persists the updated index, metadata, and raw dataset to disk.
        """
        import time
        import pickle
        import json
        import faiss

        cleaned_text = text.strip()
        if not cleaned_text:
            raise ValueError("Knowledge text cannot be empty.")

        chunk_id = f"RAG_DYNAMIC_{int(time.time())}_{abs(hash(cleaned_text)) % 100000}"
        chunk_meta = metadata.copy() if metadata else {}
        chunk_meta["source"] = source
        chunk_meta["type"] = "dynamic_rag"

        new_chunk = {
            "id": chunk_id,
            "text": cleaned_text,
            "source": source,
            "metadata": chunk_meta,
        }

        # 1. Encode text and add to FAISS
        vectors = self.service.embedding_service.encode_texts([cleaned_text])
        self.service.faiss_index.add(vectors)

        # 2. Append to in-memory metadata
        self.service.child_chunks.append(new_chunk)
        self.service.parent_chunks.append(new_chunk)
        self.service.parent_map[chunk_id] = new_chunk

        # 3. Rebuild BM25 index with the new chunk included
        if hasattr(self.service, "bm25_service") and self.service.bm25_service:
            self.service.bm25_service.build_index(self.service.child_chunks)

        # 4. Invalidate semantic cache so queries immediately see new knowledge
        if hasattr(self.service, "cache_service") and self.service.cache_service:
            if hasattr(self.service.cache_service, "cache"):
                self.service.cache_service.cache.clear()

        # 5. Persist artifacts to disk
        if persist:
            # 5a. Save FAISS index
            index_path = os.path.join(self.config.index_dir, "faiss.index")
            faiss.write_index(self.service.faiss_index, index_path)

            # 5b. Save metadata.pkl
            metadata_path = os.path.join(self.config.index_dir, "metadata.pkl")
            with open(metadata_path, 'wb') as f:
                pickle.dump({
                    "child_chunks": self.service.child_chunks,
                    "parent_chunks": self.service.parent_chunks,
                    "parent_map": self.service.parent_map,
                    "dataset_hash": getattr(self.service, "current_dataset_hash", ""),
                }, f)

            # 5c. Append to raw dataset file (data/rag/rag_data.json)
            rag_data_path = os.path.join(self.config.data_dir, "rag", "rag_data.json")
            if os.path.exists(rag_data_path):
                try:
                    with open(rag_data_path, 'r', encoding='utf-8') as f:
                        raw_data = json.load(f)
                    if isinstance(raw_data, list):
                        raw_data.append(new_chunk)
                        with open(rag_data_path, 'w', encoding='utf-8') as f:
                            json.dump(raw_data, f, indent=2, ensure_ascii=False)
                except Exception as exc:
                    print(f"Warning: could not update {rag_data_path}: {exc}")

        return {
            "status": "ok",
            "chunk_id": chunk_id,
            "source": source,
            "total_chunks": len(self.service.child_chunks),
            "message": f"Successfully indexed new knowledge chunk '{chunk_id}' into FAISS & BM25.",
        }

    def debug_retrieve(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        results = self.retrieve(query, top_k=top_k)
        print(f"\n--- RAG Retrieval Debug for Query: '{query}' ---")
        stats = self.cache.get_stats()
        print(f"Cache Stats: Hits={stats['hits']} | Misses={stats['misses']} | Hit Ratio={stats['hit_ratio']}")
        for i, res in enumerate(results, 1):
            print(f"\n[{i}] Score: {res['score']:.4f} | ID: {res['id']}")
            print(f"Text: {res['text']}")
            print(f"Metadata: {res['metadata']}")
        return results

if __name__ == '__main__':
    try:
        retriever = KidsNutriRetriever()
        retriever.debug_retrieve("Can my child eat egg during fever?", top_k=3)
    except Exception as e:
        print(f"Retriever test error: {e}")
