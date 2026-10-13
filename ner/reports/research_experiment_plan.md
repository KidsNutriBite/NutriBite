# Research Experiment Plan: Pediatric Nutrition Information Extraction

**Project:** NutriBite Pediatric Nutrition NLP System  
**Phase:** Phase 7 — Research-Level Schema Expansion Audit  
**Scope:** Formal experimental protocol defining 9 rigorous benchmark experiments for academic defense and journal publication  

---

## 1. Experimental Suite Overview

| Experiment ID | Experiment Name | Benchmark Target | Current Status | Scientific Objective |
| :--- | :--- | :--- | :---: | :--- |
| **EXP-1** | **Silver Test Evaluation** | `test.jsonl` (263 sents) | **COMPLETED** (95.10% F1) | Measures distant-supervision test set consistency. |
| **EXP-2** | **Independent Human-Gold Eval**| `human_gold.jsonl` (150 sents) | **PENDING** (0/150 Annotated) | Genuine, non-circular manual evaluation. |
| **EXP-3** | **Seen vs Unseen Generalization**| Silver Test Partition | **COMPLETED** (99.40% vs 60.00%) | Quantifies surface-form memorization vs generalization. |
| **EXP-4** | **Gazetteer Baseline Audit** | Silver Test Partition | **COMPLETED** (98.86% F1) | Demonstrates circularity of dictionary matching on silver data. |
| **EXP-5** | **General NER Coverage Audit** | Pretrained BERT / SpaCy | **COMPLETED** (0.00% Coverage) | Confirms general NER schemas omit nutrition categories. |
| **EXP-6** | **Feature Ablation Study** | Silver & Gold Test Sets | **PLANNED** (Phase 8) | Measures contribution of n-grams, shapes, and BIO transitions. |
| **EXP-7** | **Adversarial Challenge Testing**| `nutrient_challenge.jsonl` | **COMPLETED** (45.71% F1) | Diagnostic stress test across 7 linguistic failure modes. |
| **EXP-8** | **Downstream RAG Impact** | Retrieval Benchmark | **PLANNED** (Phase 8) | Compares RAG retrieval precision with vs without NER filters. |
| **EXP-9** | **Targeted Relation Extraction** | Natural Language Text | **PLANNED** (Phase 8) | Benchmarks binary RE on `FOOD->NUTRIENT` and `FOOD->AGE`. |

---

## 2. Detailed Protocols for Planned Experiments (EXP-6, EXP-8, EXP-9)

### 2.1 EXP-6: Feature Ablation Study Protocol
* **Objective:** Determine the mathematical impact of each feature family in the sequence perceptron.
* **Ablation Configurations:**
  1. *Full Model:* Current feature vector (word, bigrams, prefixes, suffixes, shape flags, previous tag).
  2. *Ablation 1 (No Context Window):* Remove $w_{i-1}, w_{i+1}$ and bigram features ($w_{i-1}\_w_i, w_i\_w_{i+1}$).
  3. *Ablation 2 (No Subword Affixes):* Remove prefix (len 2, 3) and suffix (len 2, 3) features.
  4. *Ablation 3 (No Orthographic Shapes):* Remove TitleCase, UPPERCASE, digit, and hyphen flags.
  5. *Ablation 4 (No Transition State):* Remove $y_{i-1}$ history (evaluates independent token classification vs sequence modeling).
* **Expected Finding:** Transition states and bigrams will show the largest drop on multi-word entities (`vitamin B12`, `omega-3 fatty acids`).

---

### 2.2 EXP-8: Downstream RAG Retrieval Impact Protocol
* **Objective:** Quantitatively prove that extracting domain entities improves clinical retrieval precision and recall over naive dense/sparse RAG.
* **Benchmark Dataset:** 150 parental queries from `ai-service-v2/evaluation/retrieval_dataset.json`.
* **Evaluation Metrics:** Mean Reciprocal Rank (MRR@5), Normalized Discounted Cumulative Gain (NDCG@5), and Clinical Relevance Precision (Precision@3).
* **Comparative Settings:**
  * Setting A: Standard Dense Semantic Retrieval (Vector search on raw query embedding).
  * Setting B: Standard BM25 Keyword Search.
  * Setting C: **NutriBite Hybrid RAG with NER Filtering** (Entities extracted $\rightarrow$ metadata structured filter $\rightarrow$ hybrid reranking).

---

### 2.3 EXP-9: Targeted Relation Extraction Protocol
* **Objective:** Train and evaluate binary relation extractors for the two empirically supported relation types:
  1. $R_1: \text{FOOD} \times \text{NUTRIENT} \rightarrow \{\text{CONTAINS}, \text{NONE}\}$ (70 positive text pairs)
  2. $R_2: \text{FOOD} \times \text{AGE\_GROUP} \rightarrow \{\text{SUITABLE\_FOR}, \text{NONE}\}$ (335 positive text pairs)
* **Classifier Model:** Logistic Regression / Lightweight Neural Classifier on pooled span embeddings and dependency path features.
* **Evaluation:** 5-Fold Cross-Validation calculating Precision, Recall, and F1 per relation type.

---

## 3. Methodological Integrity Commitment

* No experimental scores will be fabricated or projected.
* Every metric reported in future phases will be derived from executed scripts running over raw JSONL data files with fixed random seeds (`seed=42`).
