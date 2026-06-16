# 🔍 Retrieval Pipeline Audit: NutriBite AI

This document details the configuration parameters, mathematical setups, and retrieval mechanics of the RAG pipeline in `ai-service-v2`.

---

## 1. Pipeline Audit Matrix

| Parameter | Configuration Value / Strategy | Technical Detail |
| :--- | :--- | :--- |
| **Embedding Model** | `intfloat/e5-small-v2` | E5-small embedding fine-tuned for retrieval tasks (384 dimensions). |
| **Vector Database** | `FAISS` (CPU Version) | IndexFlatIP (Inner Product) binary persistence on local disk. |
| **Chunking Strategy** | Semantic Pre-Chunked Lists | Chunks mapped directly from raw guidelines in `rag_data.json` rather than character split. |
| **Chunk Size** | Dynamic | Averages 150-250 characters (approximately 30-50 words). |
| **Chunk Overlap** | `0` characters | Excluded, as records are discrete semantic statements. |
| **Top-K Value** | `top_k=8` (HTTP) / `top_k=5` (Orchestrator) | Unified configuration mapped inside endpoints. |
| **Similarity Metric** | Cosine Similarity | FAISS Inner Product Flat index paired with explicit L2 normalization (`faiss.normalize_L2`). |
| **Retrieval Thresholds** | None | No score filters are applied; candidates are returned based on pure ordinal index rank. |
| **Context Assembly** | Bulleted Concatenation | Joins unique retrieved texts using newlines: `"\n".join([f"- {chunk}" for chunk in rag_context])`. |
| **Source Attribution** | Metadata Attribution | Pulls `source` (defaulting to NIN/ICMR) and `condition` / `type` paired with Cross-Encoder rerank sigmoid confidence. |

---

## 2. In-Depth Flow Explanations

### Embedding Processing (E5 Standard)
The embedding model (`intfloat/e5-small-v2`) requires strict formatting inputs. Chunks stored in the vector database are prefixed with `passage: ` (e.g. `passage: During fever, serve soft warm khichdi`). During user query matching, the search string is prefixed with `query: ` (e.g. `query: what to feed during fever`). This prefixing is required to align E5 asymmetric retrieval parameters.

### Similarity Calculation (IndexFlatIP)
Vectors are normalized to unit length ($L_2$ normalized) using:
$$\vec{u}_{norm} = \frac{\vec{u}}{\|\vec{u}\|_2}$$
The inner product search executed by FAISS `IndexFlatIP` on these unit vectors directly computes Cosine Similarity:
$$\text{Sim}(\vec{q}, \vec{d}) = \vec{q}_{norm} \cdot \vec{d}_{norm} = \cos(\theta)$$
This yields matching values strictly bound to the range $[-1.0, 1.0]$.

### Merging & Reranking Flow
1. **RRF Merge**: The pipeline merges lexical BM25 and semantic FAISS lists using Reciprocal Rank Fusion (RRF):
   $$\text{RRF\_Score}(d) = \sum_{m \in M} \frac{1}{60 + r_m(d)}$$
   where $r_m(d)$ is the ordinal rank of document $d$ inside retrieval list $m$.
2. **Cross-Encoder Reranking**: Merged chunks are processed by `cross-encoder/ms-marco-MiniLM-L-6-v2` to predict grounding relevance. Raw logits are mapped to a $[0, 1]$ confidence interval via sigmoid:
   $$\text{Confidence} = \frac{1}{1 + e^{-\text{logit}}}$$
