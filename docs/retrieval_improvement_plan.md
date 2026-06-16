# 💡 RAG Retrieval Improvement Plan (Stage 2B Design)

This document details the targeted diagnostic improvement strategy for the RAG retrieval pipeline inside `ai-service-v2`, resolving keyword blindness, semantic noise, and low recall failures.

---

## 1. Core Strategies

### A. Lexical BM25 Integration Strategy
* **Goal**: Guarantee 100% recall for specific keyword boundaries (such as local foods like "ragi", "idli", "moong dal", and distinct conditions like "constipation", "scurvy").
* **Implementation Plan**:
  - Build a persistent BM25 index over `rag_data.json` texts.
  - On incoming queries, tokenize and retrieve top 15 BM25 candidate chunks.
  - Ensure that highly unique vocabulary terms are matched lexically rather than relying purely on dense representations.

### B. Query Normalization & Pre-processing Strategy
* **Goal**: Standardize inputs to prevent spelling variations or punctuation differences from degrading embedding vectors quality.
* **Implementation Plan**:
  - Implement a cleaner removing special characters and excessive whitespace.
  - Implement a basic synonyms lookup map:
    - `"fever"` $\rightarrow$ `"temperature", "pyrexia"`
    - `"loose motions" / "watery stool"` $\rightarrow$ `"diarrhea"`
    - `"constipated"` $\rightarrow$ `"constipation"`
  - Prefix queries dynamically based on E5 model parameter standards (`query: `).

### C. Hybrid Retrieval Fusion Strategy (Reciprocal Rank Fusion)
* **Goal**: Cleanly combine lexical BM25 and dense FAISS candidates.
* **Implementation Plan**:
  - Map retrieval outputs to equal counts ($K=15$ each).
  - Apply Reciprocal Rank Fusion (RRF) with a standard smoothing constant ($k=60$):
    $$\text{RRF\_Score}(d) = \frac{1}{60 + r_{\text{BM25}}(d)} + \frac{1}{60 + r_{\text{FAISS}}(d)}$$
  - Sort combined candidates based on RRF scores and pass top 12 chunks to the reranking engine.

### D. Cross-Encoder Reranking & Sigmoid Thresholding
* **Goal**: Filter out semantic noise (e.g., geriatric references or developmental tests) before LLM prompt injection.
* **Implementation Plan**:
  - Load a lightweight Cross-Encoder (`cross-encoder/ms-marco-MiniLM-L-6-v2`) locally.
  - Compute relevance scores over the top 12 RRF-fused documents.
  - Apply a strict sigmoid confidence threshold of **$\ge 0.65$** to filter out low-relevance chunks. Only high-confidence chunks pass to the context builder.

### E. Context Builder & Deduplication Strategy
* **Goal**: Maximize context space quality and prevent redundant tokens.
* **Implementation Plan**:
  - Filter out duplicates by performing exact string hashing.
  - Order chunks based on Cross-Encoder scores (highest to lowest).
  - Truncate output to fit within a strict limit of 5 chunks to keep the LLM context clean and prevent "lost in the middle" retrieval degradation.
