# NutriBite: Human-in-the-Loop Dynamic NER & Clinical Knowledge Pipeline (`ner.md`)

**Repository:** `KidsNutriBite/NutriBite`  
**Domain:** Pediatric Clinical Nutrition & Child Wellness  
**Author / Contributor:** Abhiram & NutriBite Engineering Team  
**Scope:** Complete End-to-End Implementation of Phases 0 through 12  
**Status:** Validated, Tested (100% Pass Rate), Integrated into Production & Main Branch  

---

## 📑 Table of Contents
1. [Executive Summary & Motivation](#1-executive-summary--motivation)
2. [Clinical Schema Specification (13 Entities)](#2-clinical-schema-specification-13-entities)
3. [The Human-in-the-Loop (HITL) Dynamic Expansion Architecture](#3-the-human-in-the-loop-hitl-dynamic-expansion-architecture)
4. [Candidate Discovery Engine (Tri-Tier Recall Extraction)](#4-candidate-discovery-engine-tri-tier-recall-extraction)
5. [Grouped Human Validation & Annotation Efficiency](#5-grouped-human-validation--annotation-efficiency)
6. [Dataset Engineering, Splitting & Leakage Audit (`dynamic_v1`)](#6-dataset-engineering-splitting--leakage-audit-dynamic_v1)
7. [Training Algorithm: Structured Averaged Sequence Perceptron](#7-training-algorithm-structured-averaged-sequence-perceptron)
8. [Experimental Setup & Benchmark Phases](#8-experimental-setup--benchmark-phases)
   - [Phase 5: Dynamic NER Adaptation & In-Domain Performance](#phase-5-dynamic-ner-adaptation--in-domain-performance)
   - [Phase 6: Few-Shot Sample Efficiency & Phase Transitions](#phase-6-few-shot-sample-efficiency--phase-transitions)
   - [Phase 7: Classical NLP & Statistical Baselines (spaCy)](#phase-7-classical-nlp--statistical-baselines-spacy)
   - [Phase 8: Continual Learning & Catastrophic Forgetting Mitigation](#phase-8-continual-learning--catastrophic-forgetting-mitigation)
   - [Phase 9: 5-Tier Canonical Entity Linking & Grounding](#phase-9-5-tier-canonical-entity-linking--grounding)
   - [Phase 10: Downstream Entity-Aware RAG with Hierarchical Gating](#phase-10-downstream-entity-aware-rag-with-hierarchical-gating)
   - [Phase 11A & 11B: Deep Neural Baselines (RoBERTa & Zero-Shot GLiNER)](#phase-11a--11b-deep-neural-baselines-roberta--zero-shot-gliner)
   - [Phase 12: Production Microservice & Web Dashboard](#phase-12-production-microservice--web-dashboard)
9. [Comprehensive 4-Way Model Comparison Table](#9-comprehensive-4-way-model-comparison-table)
10. [Error Analysis & Technical Limitations](#10-error-analysis--technical-limitations)
11. [Repository Artifacts, Code Inventory & Verification Instructions](#11-repository-artifacts-code-inventory--verification-instructions)

---

## 1. Executive Summary & Motivation

Clinical and pediatric nutritional decision support requires fine-grained understanding of concepts ranging from biochemical micronutrients to preparation techniques, feeding regimens, and medical conditions. Standard commercial Named Entity Recognition (NER) models operate on **static, rigid schemas** (e.g., standard CoNLL `PER`, `LOC`, `ORG` or coarse biomedical entities like `DISEASE`, `CHEMICAL`). 

In real-world pediatric healthcare systems, this fixed paradigm fails:
1. **Dynamic Schema Needs:** Guidelines frequently evolve. Practitioners need to track culinary processing (`COOKING_METHOD`) to quantify bioavailability and antinutrient reduction, pharmacological therapies (`SUPPLEMENT`) to audit clinical dosing, and systemic regimens (`DIET_PATTERN`).
2. **The Clinical Annotation Bottleneck:** Manually annotating thousands of medical sentences requires pediatricians whose clinical time cannot be allocated to word-by-word token labeling.
3. **Catastrophic Forgetting & Retrieval Noise:** Sequentially fine-tuning neural taggers leads to catastrophic representational forgetting on historical classes. Furthermore, injecting extracted entities naively into downstream Retrieval-Augmented Generation (RAG) floods the retriever with generic pediatric terms, causing retrieval degradation.

### The Solution:
We engineered and empirically validated an **end-to-end Human-in-the-Loop Dynamic NER pipeline** that connects:
- **Tri-tier automatic candidate extraction** across 913 pediatric guidelines.
- **Grouped human triage** reducing clinician annotation effort by **56.94%**.
- **A feature-engineered Structured Averaged Sequence Perceptron** that delivers **93.35% Micro-F1** at **3.87 ms/sentence CPU latency**—outperforming a 125M parameter transformer (`roberta-base`, 76.04% F1 at 907.67 ms) and zero-shot open-vocabulary encoder (`GLiNER`, 26.50% F1 at 304.70 ms).
- **Continual learning experience replay** mitigating catastrophic forgetting (+2.48% retention delta).
- **A 5-tier entity linking cascade** grounding mentions with 100% closed-world accuracy.
- **Hierarchical query-type gating** that boosts downstream RAG (+2.00% Recall@1, +0.0095 MRR@10) and cuts query degradation by **86.7%**.

---

## 2. Clinical Schema Specification (13 Entities)

The NutriBite clinical ontology spans **13 entity classes** represented in standard **BIO (Beginning-Inside-Outside)** token format (27 output labels total):

### Core Baseline Schema (10 Classes):
| # | Entity Class | Scope & Clinical Definition | Clinical Examples |
|:-:|:---|:---|:---|
| 1 | `FOOD` | Whole edible foods, ingredients, culinary raw items | *spinach, moong dal, egg, ragi, banana* |
| 2 | `NUTRIENT` | Biochemical macro- and micronutrients, vitamins, minerals | *iron, vitamin A, zinc, folate, calcium, DHA* |
| 3 | `HEALTH_CONDITION`| Pediatric clinical conditions, symptoms, deficiencies | *anemia, rickets, SAM, diarrhea, celiac* |
| 4 | `ALLERGEN` | Immunological triggers (IgE/non-IgE mediated) | *cow's milk protein, peanut, gluten, egg white* |
| 5 | `AGE_GROUP` | Developmental milestones & age brackets | *infant, toddler, 6-12 months, school-age* |
| 6 | `MEAL_TYPE` | Scheduled diurnal eating episodes | *breakfast, mid-morning snack, weaning meal* |
| 7 | `GROWTH_METRIC` | Anthropometric parameters & growth indices | *weight velocity, height-for-age, head circumference* |
| 8 | `FOOD_GROUP` | ICMR-NIN taxonomic food categories | *pulses, green leafy vegetables, dairy, millets* |
| 9 | `DIETARY_PROPERTY`| Functional properties, physical textures, fortifications | *mashed, bioavailable, fortified, anti-nutrient* |
| 10 | `FEEDING_METHOD` | Modalities and behavioral feeding approaches | *exclusive breastfeeding, responsive feeding, cup feeding* |

### Dynamically Onboarded Schema (3 Classes):
| # | Entity Class | Motivation & Clinical Utility | Clinical Examples |
|:-:|:---|:---|:---|
| 11 | `COOKING_METHOD` | Processing techniques that alter micronutrient retention, phytate degradation, and infant choking safety | *steaming, pressure cooking, sprouting, fermentation, pureeing* |
| 12 | `SUPPLEMENT` | Concentrated pharmacological or therapeutic nutrient preparations | *pediatric iron drops, vitamin D3 drops, ORS, RUTF* |
| 13 | `DIET_PATTERN` | Holistic pediatric nutritional regimens and feeding protocols | *balanced diet, dietary diversity, Mediterranean diet, vegetarian weaning* |

---

## 3. The Human-in-the-Loop (HITL) Dynamic Expansion Architecture

The pipeline operationalizes clinical entity expansion through a closed-loop 8-stage lifecycle:

```
[1. Concept Registry]
       │
       ▼
[2. Tri-Tier Candidate Discovery] (Exact + RapidFuzz + E5 Semantic Embeddings over 913 guidelines)
       │
       ▼
[3. Grouped Human Triage] (Clustered surface forms; 56.94% clinician effort reduction)
       │
       ▼
[4. Distant Supervision & Silver Label Propagation] (BIO constraint validation, 0% leakage)
       │
       ▼
[5. Structured Sequence Perceptron Training] (Feature extraction, transition constraints, parameter averaging)
       │
       ▼
[6. Multi-Model Controlled Benchmarking] (Perceptron vs. spaCy vs. RoBERTa vs. GLiNER)
       │
       ▼
[7. 5-Tier Canonical Entity Linking] (Exact -> Normalized -> Stem/Levenshtein -> Synonym -> Dense E5)
       │
       ▼
[8. Hierarchical Gated RAG Retrieval] (BM25 + FAISS with specificity-aware dampening)
```

---

## 4. Candidate Discovery Engine (Tri-Tier Recall Extraction)

The candidate discovery system scans the NutriBite unannotated corpus (**913 clinical pediatric guideline documents**, **91,623 words**) using three complementary channels to maximize recall before human validation:

1. **Tier 1 — Seed Lexicon / Exact Gazetteer Matching:** Matches known clinical terms and declared aliases.
2. **Tier 2 — Fuzzy Lexical Distance (`rapidfuzz`):** Normalized Levenshtein ratio ($\ge 85\%$) to catch misspellings, plurals, and hyphenation variations.
3. **Tier 3 — Dense Semantic Embedding Similarity (`intfloat/e5-small-v2`):** 384-dimensional dense cosine similarity ($\ge 0.75$) between passage sentence spans and entity class prototype embeddings to discover non-obvious clinical synonyms.

### Discovery Results & Channel Breakdown:
- **Total Raw Mentions Discovered:** 22,745 occurrences
- **Direct Duplicate Mentions Merged:** 350
- **Unique Surface-Form Candidates Generated:** 1,500 candidates across 680 semantic clusters
- **Discovery Channel Yield:**
  - Semantic Embeddings (`e5-small-v2`): **1,244 candidates (82.93%)**
  - Exact Seed Gazetteer: **181 candidates (12.07%)**
  - RapidFuzz Lexical Distance: **75 candidates (5.00%)**
- **Confidence Stratification:**
  - High Confidence ($\ge 0.85$): **443 candidates (29.53%)**
  - Medium-High Confidence ($0.75 - 0.84$): **1,057 candidates (70.47%)**

---

## 5. Grouped Human Validation & Annotation Efficiency

Instead of demanding sentence-by-sentence manual token annotation, candidate mentions were grouped by normalized surface form. Validating a single surface-form group simultaneously classified all identical occurrences across the corpus.

### Measured Validation Metrics:
- **Total Discovered Pool:** 1,500 candidates (680 unique groups)
- **Candidates Reviewed:** 281 candidates (100 group decisions)
- **Review Decisions:**
  - **Accepted Occurrences:** 156 (55.52%) — propagated into training and test datasets
  - **Rejected Occurrences:** 111 (39.50%) — archived with structured clinical rejection codes
  - **Skipped Occurrences:** 14 (4.98%) — flagged for multi-specialty panel audit
- **Annotation Time Measured:**
  - Traditional Sentence-by-Sentence Review: **70.25 clinician minutes** (at 15 sec/decision)
  - Grouped Surface-Form Triage: **30.25 clinician minutes** (100 cluster decisions)
  - **Measured Clinician Effort Reduction:** **56.94%** (saving **40.00 clinician minutes**)

### Structured Rejection Taxonomy (111 Rejected Mentions):
1. **Wrong Entity Type:** 42 (37.84%) — *e.g., ingredient misclassified as diet pattern*
2. **Ambiguous / Polysemous:** 28 (25.23%) — *e.g., common adjectives like "solid", "warm"*
3. **Span Boundary Contamination:** 19 (17.12%) — *e.g., prepositions attached to food nouns*
4. **Out-of-Domain Scope:** 12 (10.81%) — *e.g., adult maternal health conditions*
5. **Duplicate / Overlapping:** 8 (7.21%)
6. **Other:** 2 (1.80%)

---

## 6. Dataset Engineering, Splitting & Leakage Audit (`dynamic_v1`)

The final dynamic dataset (`dynamic_v1`) integrates the accepted dynamic mentions into the clinical corpus while strictly guaranteeing **0% document and sentence partition leakage**.

### Dataset Partition Statistics:
| Split | Sentences | Tokens | Gold Entity Spans | Purpose | Leakage Overlap |
|:---|:---:|:---:|:---:|:---|:---:|
| **Train** | 1,223 | 14,028 | 1,851 | Model Training | **0.0%** |
| **Validation** | 262 | 3,115 | 418 | Hyperparameter Selection & Checkpointing | **0.0%** |
| **Test (Held-Out)** | 263 | 5,961 | 491* | Final Unbiased Evaluation | **0.0%** |
| **Total** | **1,748** | **23,104** | **2,760** | Complete Dynamic Dataset | **0.0%** |

*\*Note: The test split contains exactly 491 gold entity spans (473 seen surface forms + 18 unseen surface forms).*

### Rigorous Leakage Audit Verification:
Our automated partition leakage audit (`ner/scripts/leakage_audit.py`) confirmed:
- **Train / Test Exact Sentence Overlap:** **0**
- **Train / Test Normalized Sentence Overlap:** **0**
- **Validation / Test Sentence Overlap:** **0**
- **Few-Shot / Test Overlap:** **0**

### Frozen Dataset Cryptographic Integrity:
To prevent silent data corruption, all 8 baseline datasets are locked with SHA-256 checksums verified on every test execution:
- `ner/data/train.jsonl`: `9803134184861ee96233613589092bf5828ee1575760a1c7f75b5eea5e54d36e`
- `ner/data/validation.jsonl`: `48f8fa7bf62bc16834ff24ec65764d2cf93daaa3cfb06dfce335a9f248e36d85`
- `ner/data/test.jsonl`: `c233156291a26b27e85741ef070c77604d5500e84b0559f518a4277b0c793ff8`
- `ner/data/human_gold/human_gold.jsonl`: `e6bc27008e4ac22ea6536e63587c91e226a96a5eed54dbff9033839f1b05ff86`
- `ner/data/human_gold/nutrient_challenge.jsonl`: `08034db645377bfabf8bf907304128f9c1ecf425501869e0619a9d59296fa2c0`
- `ner/data/schema_v2/train.jsonl`: `499616053805822f676451a511e494a86b24508aa7452d9a6fc430c441c2c27f`
- `ner/data/schema_v2/test.jsonl`: `ffec8c8135817c76899583196f30a911a3d3c79dfa98c56fa7eaef85672d966e`

---

## 7. Training Algorithm: Structured Averaged Sequence Perceptron

The production NER tagger is formulated as a linear structured prediction model decoding token sequences $\mathbf{y} \in \mathcal{Y}$ via Viterbi decoding over token scoring functions:

$$\hat{\mathbf{y}} = \arg\max_{\mathbf{y} \in \mathcal{Y}} \sum_{t=1}^{T} \mathbf{w}^\top \boldsymbol{\phi}(\mathbf{x}, y_t, y_{t-1}, t)$$

### Feature Engineering Template $\boldsymbol{\phi}(\mathbf{x}, y_t, y_{t-1}, t)$:
- **Word Identities:** Unigrams ($w_t$), lowercase normalized words, and exact casing.
- **Subword Morphology:** Prefix and suffix character n-grams of lengths 1, 2, 3, and 4 (captures biological affixes: *-ate*, *-ase*, *-ol*, *-ine* for nutrients).
- **Orthographic Word Shape:** Binary indicators for `is_title`, `is_upper`, `is_digit`, `has_hyphen`, `is_mixed_alphanumeric`.
- **Symmetric Context Windows:** Sliding window across context $w_{t-2}, w_{t-1}, w_{t+1}, w_{t+2}$.
- **Contextual Bigrams:** Collocations $(w_{t-1}, w_t)$ and $(w_t, w_{t+1})$.
- **Markov Transition Features:** Dependent on $y_{t-1}$ to learn valid grammatical transitions.
- **Hard BIO Decoding Constraints:** Hard transition mask prohibiting impossible transitions (e.g., `O` $\to$ `I-FOOD`, `B-FOOD` $\to$ `I-NUTRIENT`).
- **Polyak-Ruppert Parameter Averaging:** Maintains running weight sums across all iterations:
  $$\mathbf{w}_{\text{avg}} = \frac{1}{N \cdot T} \sum_{k=1}^{N \cdot T} \mathbf{w}_k$$
  This stabilizes decision boundaries and prevents overfitting on low-support medical terms.

---

## 8. Experimental Setup & Benchmark Phases

### Phase 5: Dynamic NER Adaptation & In-Domain Performance
Evaluated on the 263 held-out test sentences with strict exact span boundaries $(start, end, label)$:

- **Micro Precision:** **93.83%** (+1.35% over Phase 2 10-entity baseline)
- **Micro Recall:** **92.87%**
- **Micro F1:** **93.35%** (+0.54% over Phase 2 baseline)
- **Macro F1:** **82.08%** across all 13 classes
- **`COOKING_METHOD` F1:** **93.33%** (Precision: 90.32%, Recall: 96.55%, Support: 23 test mentions)
- **`DIET_PATTERN` F1:** **100.00%** (Precision: 100%, Recall: 100%, Support: 2 test mentions)
- **`SUPPLEMENT` F1:** **0.00%** (Single occurrence in test split, missed due to limited training support)

---

### Phase 6: Few-Shot Sample Efficiency & Phase Transitions
To model clinical low-resource scenarios, we trained models across controlled few-shot sample budgets $K \in \{5, 10, 25, 50, \text{Full}\}$:

| Few-Shot Budget ($K$) | `COOKING_METHOD` F1 | `DIET_PATTERN` F1 | `SUPPLEMENT` F1 | Empirical Clinical Insight |
|:---:|:---:|:---:|:---:|:---|
| **$K = 5$** | 0.00% | 0.00% | 0.00% | Insufficient support; transition penalties dominate |
| **$K = 10$** | 0.00% | *Unavailable* ($N=5$) | *Unavailable* ($N=3$) | Feature weights remain below decision threshold |
| **$K = 25$** | **46.67%** | *Unavailable* | *Unavailable* | **Sharp phase transition:** Core unigram stems emerge |
| **$K = 50$** | **78.95%** | *Unavailable* | *Unavailable* | Contextual n-grams stabilize (**84.6% of full F1**) |
| **Full ($K=79$)** | **93.33%** | 100.00% | 0.00% | Full morphological and context convergence |

**Key Research Finding:** Linear sequence perceptrons exhibit a sharp phase transition between $K=10$ and $K=25$. At $K=50$, the model recovers **84.6% of full performance**, proving that exhaustive manual annotation is unnecessary for dynamic clinical onboarding.

---

### Phase 7: Classical NLP & Statistical Baselines (spaCy)
We evaluated the custom model against two classical baselines:
1. **Rule-Based Lexical EntityRuler:** Pure string gazetteer matcher.
2. **spaCy Statistical NER:** Transition-based Convolutional Neural Network (CNN) with Bloom embeddings (`en_core_web_sm`).

| Model | Micro Precision | Micro Recall | Micro F1 | Macro F1 | Seen Mention F1 | Unseen Mention F1 |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **spaCy EntityRuler** | 98.75% | 95.94% | 97.33% | 84.37% | 99.37% | **0.00%** |
| **spaCy Statistical CNN** | 93.88% | 90.26% | 92.04% | 75.33% | 96.60% | 5.26% |
| **Custom Dynamic Perceptron** | **93.96%** | **91.48%** | **92.70%** | **78.32%** | **95.73%** | **16.22%** |

**Empirical Invariant Confirmed:** The lexical EntityRuler achieves 0.00% unseen generalization (it cannot detect uncatalogued mentions). The Custom Perceptron achieved **3x higher unseen generalization (16.22% vs. 5.26%)** than the spaCy CNN baseline.

---

### Phase 8: Continual Learning & Catastrophic Forgetting Mitigation
We evaluated sequential ontology expansion across four consecutive tasks:
$$\text{Task 0 (10 classes)} \longrightarrow \text{+COOKING (11)} \longrightarrow \text{+DIET (12)} \longrightarrow \text{+SUPPLEMENT (13)}$$

We compared **Naive Sequential Tuning** (no replay) against **Experience Replay** (maintaining an anchor replay buffer of 45–53 sentences, $< 4.5\%$ of training data):

| Expansion Step | Strategy | Active Classes | Micro F1 | Macro F1 | Flagship `NUTRIENT` F1 | Old Entity Retention ($\Delta$ F1) |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Step 0 (Base)** | Base | 10 | 90.32% | 85.25% | 92.71% | 0.00% |
| **Step 1 (+COOKING)** | *No Replay* | 11 | 91.81% | 83.97% | 94.05% | -1.46% |
| **Step 1 (+COOKING)** | **Replay** | 11 | **92.06%** | **86.28%** | 93.95% | **+1.40%** |
| **Step 2 (+DIET)** | *No Replay* | 12 | 85.36% | 76.42% | 92.35% | -1.60% |
| **Step 2 (+DIET)** | **Replay** | 12 | **90.61%** | **82.57%** | 91.55% | **+0.88%** |
| **Step 3 (+SUPPLEMENT)**| *No Replay* | 13 | 87.86% | 71.89% | 93.22% | -2.02% |
| **Step 3 (+SUPPLEMENT)**| **Replay** | 13 | **90.17%** | **76.12%** | 91.81% | **+0.54%** |

**Conclusion:** Experience Replay preserves old entity performance (**+0.88% retention vs. -1.60% degradation**), keeping overall Micro-F1 stable above 90.17%.

---

### Phase 9: 5-Tier Canonical Entity Linking & Grounding
Extracted surface text spans were linked to canonical concept IDs in the clinical knowledge graph using a cascading 5-tier pipeline:
1. **Tier 1:** Exact Case-Insensitive String Match
2. **Tier 2:** Lemmatized & Punctuation Normalized Match
3. **Tier 3:** Morphological Stemming & RapidFuzz Levenshtein ($\text{ratio} \ge 0.85$)
4. **Tier 4:** Curated Clinical Alias & Medical Synonym Map Match
5. **Tier 5:** Dense Bi-Encoder Cosine Embedding (`intfloat/e5-small-v2`, $\text{sim} \ge 0.80$)

### Linking Performance:
- **Controlled 100-Mention Validation Benchmark:** **100.0% linking accuracy** (Exact: 40%, Normalized: 15%, Fuzzy: 18%, Synonym: 12%, Dense Embedding: 15%).
- **Open Clinical Query Grounding (Phase 10):** Grounded **70.67% of unstructured user queries** (106/150 queries resolved to canonical pediatric concept IDs).

---

### Phase 10: Downstream Entity-Aware RAG with Hierarchical Gating
We integrated NER extraction and entity linking into the NutriBite RAG retriever (BM25 lexical + FAISS dense embeddings over 913 pediatric passages). Benchmarked across **150 clinical pediatric parent queries**:

| System Architecture | Recall@1 | Recall@3 | Recall@5 | Recall@10 | MRR@5 | MRR@10 | Queries Helped | Queries Hurt | Queries Neutral |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Baseline RAG** | 67.33% | 78.67% | 86.00% | 90.00% | 0.7416 | 0.7481 | — | — | — |
| **Entity-Aware v1 (Ungated)** | 66.00% | 74.00% | 79.33% | 84.67% | 0.7107 | 0.7172 | 6 | 15 | 129 |
| **Gated Entity-Aware v2** | **69.33%** | **79.33%** | **86.00%** | **90.67%** | **0.7511** | **0.7576** | **5** | **2** | **143** |
| **Net Gain (v2 vs. Baseline)** | **+2.00%** | **+0.67%** | **0.00%** | **+0.67%** | **+0.0095** | **+0.0095** | **+5** | **-2** | — |

### Root Cause of v1 Regression & The Gating Solution:
- **The Failure Mode:** In v1, broad high-frequency entities (`AGE_GROUP` like *"child"* or *"infant"*) received the same positive retrieval boost as specific clinical terms. This flooded the dense retriever with generic guidelines, displacing specific medical passages and harming 15 queries.
- **The v2 Gating Strategy:**
  1. **Strong Priority Boost ($\beta = 1.35$):** For high-specificity categories (`ALLERGEN`, `NUTRIENT`, `HEALTH_CONDITION`).
  2. **Soft Dampening ($\beta = 1.05$):** For broad categories (`AGE_GROUP`, `FOOD`, `FOOD_GROUP`, `MEAL_TYPE`).
  3. **Lexical Retention:** Retains raw user query tokens to prevent recall loss.
  - **Result:** Fully restored Recall@5 (86.00%), boosted Recall@1 to 69.33% (+2.00%), and eliminated **86.7% of harmed queries (15 $\to$ 2)**.

---

### Phase 11A & 11B: Deep Neural Baselines (RoBERTa & Zero-Shot GLiNER)

We benchmarked the production Custom Perceptron against two modern neural architectures on the exact identical 263-sentence test set:
1. **Phase 11A — RoBERTa Fine-Tuned Token Classifier (`roberta-base`, 125M parameters):** Standard HuggingFace transformer encoder with cross-entropy token classification head.
2. **Phase 11B — GLiNER Open-Vocabulary Zero-Shot Extractor (`urchade/gliner_small-v2.1`):** Bi-encoder bidirectional span model prompted with the 13 clinical label descriptions.

---

## 9. Comprehensive 4-Way Model Comparison Table

All 4 models evaluated on the identical held-out test split (263 sentences, 491 entities):

| Evaluation Metric | Custom Dynamic Perceptron (Phase 5) | spaCy Statistical NER (Phase 7) | Fine-Tuned RoBERTa (Phase 11A) | Zero-Shot GLiNER (Phase 11B) | Empirical Architectural Winner |
|:---|:---:|:---:|:---:|:---:|:---|
| **Architecture** | Averaged Sequence Perceptron | Transition-Based CNN | 12-Layer Transformer | Bi-Encoder Span LM | Custom Perceptron |
| **Model Size / Disk** | **~1.2 MB** | ~15 MB | ~498 MB | ~610 MB | **Perceptron (415x smaller)** |
| **Micro Precision** | **93.83%** | 93.25% | 73.99% | 19.28% | **Custom Perceptron** |
| **Micro Recall** | **92.87%** | **92.87%** | 78.21% | 42.36% | **Custom / spaCy Tied** |
| **Micro F1** | **93.35%** | 93.06% | 76.04% | 26.50% | **Custom Perceptron (+17.31% over RoBERTa)** |
| **Macro F1** | 82.08% | **82.48%** | 40.81% | 18.05% | **spaCy Statistical** |
| **`NUTRIENT` F1** | 92.44% | **92.71%** | 89.14% | 43.67% | High stability across models |
| **`FOOD` F1** | **91.72%** | 90.45% | 75.64% | 15.77% | **Custom Perceptron** |
| **`COOKING_METHOD` F1**| 93.33% | **93.62%** | 35.71% | 6.67% | Supervised models dominate |
| **`DIET_PATTERN` F1** | **100.00%** | **100.00%** | 0.00% | 12.50% | Perceptron / spaCy Tied |
| **`SUPPLEMENT` F1** | 0.00% | 0.00% | 0.00% | **9.09%** | GLiNER captures 1 zero-shot mention |
| **Seen Mentions F1** | 96.38% | **96.60%** | 84.26% | 56.21% | **spaCy Statistical** |
| **Unseen Mentions F1**| **16.22%** | 5.26% | 7.41% | 2.09% | **Custom Perceptron (3x over spaCy)** |
| **Inference CPU Latency**| **3.87 ms / sent** | 10.24 ms / sent | 907.67 ms / sent | 304.70 ms / sent | **Perceptron is 234.5x faster than RoBERTa** |
| **Inference Throughput**| **5,886 tokens / sec** | 2,224 tokens / sec | 25 tokens / sec | 75 tokens / sec | **Custom Perceptron** |

---

## 10. Error Analysis & Technical Limitations

Across our 12 experimental phases, extensive error auditing identified seven fundamental error categories:

1. **Semantic Over-Triggering in Zero-Shot GLiNER:** Without in-domain supervision, general class prompts (*"food item"*, *"dietary property"*) produced **330 false positives on `FOOD`**, mislabeling common nouns (*"intake"*, *"routine"*, *"spoons"*).
2. **Severe Low-Support Representation Collapse:** In standard transformer fine-tuning (`roberta-base`), rare classes ($N \le 5$ in train, such as `SUPPLEMENT` and `DIET_PATTERN`) suffered gradient starvation and collapsed completely to **0.0% F1**.
3. **Multi-Token Span Splitting:** Complex compound food descriptions (*"pureed sweet potato"*) were occasionally split by neural baselines into separate entities (*"pureed"* as `COOKING_METHOD` and *"potato"* as `FOOD`), discarding the clinical compound meaning.
4. **Shared Lexical Interference in Continual Learning:** Sequentially introducing `DIET_PATTERN` using only 5 training sentences caused perceptron weight drift on shared words (*"infant"*, *"milk"*), causing a **1.60% drop in old entity retention** without replay buffers.
5. **Broad Entity Flooding in RAG:** Adding unweighted broad entities (`AGE_GROUP`) flooded retrieval vectors with hundreds of generic guidelines until hierarchical dampening was added.
6. **Out-of-Vocabulary Generalization Cap:** While seen mentions achieved **96.38% F1**, completely unseen surface forms achieved only **16.22% F1** on the Custom Perceptron and **2.09%** on zero-shot GLiNER.
7. **Single-Annotator Review:** Human triage was completed by a single expert clinical nutritionist; inter-annotator agreement (Cohen's Kappa) was not formally quantified.

---

## 11. Repository Artifacts, Code Inventory & Verification Instructions

### Directory Structure:
```
project-phase/
├── ner/
│   ├── data/
│   │   ├── dynamic_v1/          # 1,748-sentence leak-free dynamic dataset (train, val, test)
│   │   ├── few_shot_v1/         # K-shot split datasets (K = 5, 10, 25, 50)
│   │   ├── continual_v1/        # Sequential continual learning task streams
│   │   ├── human_gold/          # 150-sentence independent human gold benchmark
│   │   └── schema_v2/           # Frozen 10-class baseline datasets
│   ├── models/
│   │   ├── dynamic_v1/          # Custom Averaged Perceptron weights & metadata
│   │   ├── few_shot_v1/         # Few-shot trained perceptron weights (K=5..50)
│   │   ├── baselines_v1/        # spaCy EntityRuler & Statistical NER models
│   │   ├── continual_v1/        # Continual learning checkpoints (Replay & No-Replay)
│   │   ├── transformer_baseline_v1/ # Fine-tuned RoBERTa token classifier
│   │   └── gliner_baseline_v1/  # GLiNER evaluation predictions & metadata
│   ├── scripts/                 # Complete pipeline reproduction scripts (01 through 28)
│   └── reports/                 # 76 detailed experimental markdown & JSON reports
├── ai-service-v2/               # FastAPI microservice for candidate discovery & dynamic registry
├── tests/                       # PyTest automated test suite (test_phase5 through test_phase11b)
└── ner.md                       # Master summary documentation (this file)
```

### Verification & Reproduction Commands:
```bash
# 1. Run Dynamic NER Regression Suite (Phase 5, 6, 7 & Registry)
pytest tests/test_phase5_dynamic_ner.py tests/test_phase6_few_shot.py tests/test_phase7_baselines.py tests/test_dynamic_entity_registry.py

# 2. Run Deep Learning Baselines (GLiNER & Transformer)
pytest tests/test_phase11a_transformer_baseline.py tests/test_phase11b_gliner.py

# 3. Verify 0% Dataset Leakage
python ner/scripts/leakage_audit.py

# 4. Verify Cryptographic Integrity of Frozen Checksums
python -c "import hashlib, os; from tests.test_phase5_dynamic_ner import FROZEN_HASHES; [print(p, 'OK' if expected in (hashlib.sha256(open(p, 'rb').read()).hexdigest(), hashlib.sha256(open(p, 'rb').read().replace(b'\r\n', b'\n')).hexdigest()) else 'FAIL') for p, expected in FROZEN_HASHES.items()]"
```

---
*Document Version: 1.0.0 (Master Unified NER Summary)*  
*NutriBite Engineering — Pediatric Clinical Nutrition Research*
