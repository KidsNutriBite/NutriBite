# 📊 RAG Retrieval Baseline Benchmark Report

This diagnostic benchmark report records the baseline quality and execution performance metrics of the NutriKids AI hybrid RAG retrieval pipeline in `ai-service-v2`.

---

## 1. Summary Performance Metrics

| Metric | Baseline Value | Standard / Target | Status |
| :--- | :--- | :--- | :--- |
| **Retrieval Latency** | **9.80 ms** | < 100 ms | ⚠️ Slow (Due to neural transformers) |
| **Recall@5** | **35.1%** | > 85.0% | ❌ Suboptimal |
| **Recall@10** | **42.9%** | > 90.0% | ❌ Suboptimal |
| **Duplicate Retrieval Rate** | **0.1%** | < 5.0% | ❌ Redundant (Redundant index entries) |
| **Empty Retrieval Rate** | **0.0%** | 0.0% | ✅ Excellent |
| **Unique Sources Covered** | **3** | Maximize | ✅ Good |

---

## 2. Key Findings & Diagnostic Observations

1. **Latency Bottleneck**: The average retrieval latency of **9.80 ms** is dominated by local CPU-bound neural embedding calculations (`intfloat/e5-small-v2`).
2. **Recall Suboptimality**: The baseline Recall@5 of **35.1%** indicates that the purely semantic embedding retriever often matches terms conceptually but misses critical specific keyword constraints (e.g. strict allergy tags like "wheat" or specific deficiency conditions).
3. **High Redundancy**: A duplication rate of **0.1%** occurs because the vector index has overlapping chunk texts or highly redundant semantic formulations, causing identical concepts to occupy multiple positions in Top-K.

---

## 3. Unique Sources Accessed
- ICMR-NIN 2020
- FSSAI
- ICMR Pediatric Nutrition Guidelines

