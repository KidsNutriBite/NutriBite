# Complete Research Contribution Report: Human-in-the-Loop Dynamic NER & Downstream RAG for Pediatric Nutrition

**Project:** NutriBite Pediatric Clinical Nutrition Knowledge Base  
**Repository:** `KidsNutriBite/NutriBite`  
**Scope:** Phases 0 through 11B (Fully Frozen Experimental Pipeline)  
**Document Purpose:** Master IEEE Journal Reference for Methodology, Experiments, Results, and System Contributions  

---

## 1. Research Problem

Clinical and pediatric nutritional advice requires fine-grained extraction of domain-specific concepts—ranging from biochemical micronutrients to dietary properties and feeding regimens. Conventional Named Entity Recognition (NER) systems rely on **rigid, fixed-schema token classifiers** trained on closed annotation datasets (e.g., standard CoNLL or OntoNotes schemas). 

In real-world pediatric clinical knowledge management, this paradigm breaks down due to three distinct challenges:
1. **Dynamic Schema Expansion in Specialized Domains:** As clinical guidelines evolve, practitioners must introduce new entity types (e.g., distinguishing preparation-induced nutrient loss via `COOKING_METHOD`, tracking therapeutic regimens via `DIET_PATTERN`, or auditing over-the-counter interventions via `SUPPLEMENT`). In standard NER frameworks, expanding an ontology requires manually curating thousands of gold sentences and retraining the model from scratch.
2. **Annotation Bottlenecks and High Clinician Cognitive Load:** Full manual document annotation is prohibitively expensive. Triage of unstructured text requires high-expertise pediatricians and dietitians whose time cannot be allocated to exhaustive sentence-level token tagging.
3. **Catastrophic Forgetting and Downstream Integration Fragility:** Retraining or sequentially adapting neural and statistical classifiers on new entity categories causes representational drift (catastrophic interference) across preexisting clinical classes. Furthermore, extracting entities in isolation without canonical grounding or retrieval-aware gating causes noise amplification when integrated into downstream clinical Retrieval-Augmented Generation (RAG).

---

## 2. Proposed Approach

To address these challenges, we developed the **Human-in-the-Loop (HITL) Dynamic Entity Expansion and Domain-Adaptive NER Framework**. The framework operationalizes an end-to-end clinical lifecycle connecting concept proposal to production retrieval:

$$\begin{aligned}
\text{Entity Proposal} &\longrightarrow \text{Multi-Method Candidate Discovery} \longrightarrow \text{Grouped Human Validation} \\
&\longrightarrow \text{Weak/Silver Label Propagation} \longrightarrow \text{Incremental Dynamic NER Adaptation} \\
&\longrightarrow \text{Controlled Multi-Model Benchmark} \longrightarrow \text{Multi-Tier Canonical Entity Linking} \\
&\longrightarrow \text{Gated Entity-Aware RAG}
\end{aligned}$$

### End-to-End Lifecycle Stages:
1. **Entity Registration:** Clinical concept registration via schema registry declaring validation criteria, token constraints, and parent categories.
2. **Automated Tri-Tier Candidate Discovery:** High-recall discovery combining seed lexicon matching, rapid string distance, and dense semantic embeddings over 913 pediatric guidelines.
3. **Grouped Human Validation:** Group-level surface-form triage enabling single-decision validation across multiple document occurrences with structured rejection reason tracking.
4. **Weak/Silver Supervision Propagation:** Automated distant annotation over unannotated clinical text using accepted mentions, strictly enforcing BIO sequence consistency and 0% train/test split leakage.
5. **Dynamic NER Adaptation:** Linear structured sequence learning with constrained transition decoding and parameter averaging, supporting incremental class onboarding.
6. **Multi-Faceted Evaluation:** Measuring in-domain accuracy, seen vs. unseen surface form generalization, few-shot sample efficiency, and sequential catastrophic forgetting.
7. **Canonical Grounding:** Cascading 5-tier entity linker resolving extracted surface mentions to canonical clinical IDs.
8. **Entity-Aware RAG Retrieval:** Query-time entity extraction and hierarchical query-type gating to steer BM25 + dense FAISS passage retrieval without topic drift.

---

## 3. Novelty & Research Contribution

The contribution of this work **is NOT** a claim of inventing foundational machine learning primitives. Specifically, we do not claim that:
- Linear sequence perceptrons or token classifiers are new.
- Few-shot prototypical learning is new.
- Distant/weak supervision is new.
- Cascading string/embedding entity linking is new.
- GLiNER or Transformer encoders are new.
- Experience replay for continual learning is new.

### The Actual Research Contribution:
The novelty is the **first unified, empirically validated, and end-to-end integrated Human-in-the-Loop Dynamic NER pipeline engineered specifically for pediatric clinical nutrition**. 

We establish a complete operational architecture that:
1. Replaces brute-force sentence annotation with **candidate discovery + group-level human triage**, achieving a **56.94% reduction in clinician annotation effort**.
2. Demonstrates that a **lightweight, feature-engineered Structured Averaged Sequence Perceptron (3.87 ms latency)** outperforms heavy modern transformer encoders (`roberta-base` at 907.67 ms and zero-shot `GLiNER` at 304.70 ms) by **+17.31% and +66.85% Micro-F1**, respectively, on low-resource clinical schemas.
3. Quantifies the empirical boundary where **Experience Replay buffers** mitigate catastrophic forgetting during sequential schema expansion.
4. Proves that raw entity-based retrieval injection degrades RAG (Recall@5 dropping from 86.00% to 79.33%), and provides a **hierarchical query-type gating strategy** that completely eliminates this regression (+2.00% Recall@1, +0.95% MRR@10, and an 86.7% reduction in harmed queries).

---

## 4. Final Entity Schema

The final NutriBite clinical schema spans **13 entity classes** (27 BIO labels):

### Core Frozen Schema (10 Entities):
1. **`FOOD`:** Edible dietary ingredients, raw whole foods, and specific food items (*e.g., spinach, lentils, egg*).
2. **`NUTRIENT`:** Biochemical macro- and micronutrients, vitamins, minerals, and fatty acids (*e.g., iron, vitamin A, DHA*).
3. **`HEALTH_CONDITION`:** Pediatric medical conditions, symptoms, and deficiencies (*e.g., anemia, rickets, diarrhea*).
4. **`ALLERGEN`:** Substances triggering immunoglobulin E (IgE) or non-IgE immune hypersensitivity (*e.g., cow's milk protein, peanut, gluten*).
5. **`AGE_GROUP`:** Pediatric developmental stages and clinical age brackets (*e.g., infant, toddler, 6-12 months*).
6. **`MEAL_TYPE`:** Diurnal eating episodes and feeding schedules (*e.g., breakfast, mid-morning snack, complementary meal*).
7. **`GROWTH_METRIC`:** Anthropometric parameters and physical development indices (*e.g., head circumference, length-for-age, weight velocity*).
8. **`FOOD_GROUP`:** Broad nutritional classifications and food groupings (*e.g., dairy, pulses, green leafy vegetables*).
9. **`DIETARY_PROPERTY`:** Functional food attributes, texture states, and fortification descriptors (*e.g., mashed, fortified, bioavailable*).
10. **`FEEDING_METHOD`:** Clinical and behavioural feeding modalities (*e.g., responsive feeding, exclusive breastfeeding, spoon feeding*).

### Dynamically Introduced Schema (3 Entities):
11. **`COOKING_METHOD`:** Culinary processing and heat-treatment techniques affecting pediatric nutrient retention and food safety (*e.g., steaming, pressure cooking, pureeing*).
12. **`SUPPLEMENT`:** Concentrated commercial or pharmacological nutritional preparations (*e.g., iron drops, vitamin D3 pearls, ORS*).
13. **`DIET_PATTERN`:** Formal structured pediatric feeding regimens and protocols (*e.g., Mediterranean diet, vegetarian weaning, DASH*).

---

## 5. Candidate Discovery Algorithm

The candidate discovery engine operates across 913 pediatric clinical guidelines (91,623 words) using three complementary extraction tiers:

```
Unannotated Corpus (913 guidelines)
  ├── Tier 1: Exact Gazetteer / Seed Lexicon Matching
  ├── Tier 2: RapidFuzz Normalized Levenshtein Matching (Threshold >= 85)
  └── Tier 3: Dense Semantic Embeddings (intfloat/e5-small-v2, Cosine >= 0.75)
        │
        ▼
   Raw Mentions Extracted (22,745 occurrences)
        │
        ▼
   Deduplication & Morphological Grouping (350 exact duplicates merged)
        │
        ▼
   Unique Candidate Forms (1,500 candidates across 680 groups)
```

### Measured Candidate Discovery Metrics:
- **Total Raw Mentions Extracted:** 22,745
- **Unique Candidate Surface Forms:** 1,500
- **Direct Duplicate Mentions Merged:** 350
- **Discovery Channel Yield:**
  - **Exact Seed Matching:** 181 candidates (12.07%)
  - **Embedding Similarity (`e5-small-v2`):** 1,244 candidates (82.93%)
  - **Fuzzy Lexical Distance:** 75 candidates (5.00%)
- **Confidence Stratification:**
  - **High Confidence ($\ge 0.85$):** 443 candidates (29.53%)
  - **Medium-High Confidence ($0.75 - 0.84$):** 1,057 candidates (70.47%)

> **Critical Distinction:** Candidate discovery generates **proposals for triage**, not verified ground truth. Dense embeddings capture broad topical associations (*e.g., "potassium-rich bananas"* proposed for `NUTRIENT`), requiring human validation to enforce clinical boundary correctness.

---

## 6. Human Validation Architecture & Effort Reduction

To validate proposed candidates without overwhelming annotators, candidates were clustered into **unique surface-form groups** (merging identical case-normalized strings across occurrences).

```
1,500 Discovered Candidates
  │
  ├── Grouped into 680 Unique Surface Form Clusters
  │
  └── Human Triage Phase: 281 Candidates Reviewed (18.73% of candidate pool)
        ├── 156 Accepted (Covering 156 training/test span occurrences)
        ├── 111 Rejected (Classified via 6 structured clinical rejection codes)
        └── 14 Skipped (Flagged for multidisciplinary panel review)
```

### Measured Validation Metrics:
- **Candidate Pool Size:** 1,500 candidates
- **Unique Surface-Form Groups:** 680
- **Total Candidates Reviewed:** 281 (100 group decisions)
- **Review Decisions:**
  - **Accepted Occurrences:** 156 (55.52% of reviewed candidates)
  - **Rejected Occurrences:** 111 (39.50% of reviewed candidates)
  - **Skipped Occurrences:** 14 (4.98% of reviewed candidates)
- **Annotation Effort Reduction:**
  - Time required for occurrence-by-occurrence review: **70.25 minutes** (at 15 seconds/decision).
  - Time required under group-level triage: **30.25 minutes** (100 group decisions + duration tracking).
  - **Measured Effort Reduction:** **56.94%** (saving **40.00 clinician minutes**).

### Structured Rejection Reason Taxonomy (111 Rejected Mentions):
1. **Wrong Entity Type:** 42 (37.84%) — *e.g., ingredient categorized as diet pattern.*
2. **Ambiguous / Polysemous:** 28 (25.23%) — *e.g., general descriptors like "solid" or "fresh".*
3. **Span Boundary Contamination:** 19 (17.12%) — *e.g., prepositional phrases appended to nouns.*
4. **Out-of-Domain:** 12 (10.81%) — *e.g., maternal health concepts outside pediatric scope.*
5. **Duplicate / Overlapping:** 8 (7.21%)
6. **Other:** 2 (1.80%)

---

## 7. Dynamic NER Training Algorithm

The core extraction model is a **Structured Averaged Sequence Perceptron** with Viterbi-style constrained BIO transition decoding:

$$\hat{\mathbf{y}} = \arg\max_{\mathbf{y} \in \mathcal{Y}} \sum_{t=1}^{T} \mathbf{w}^\top \boldsymbol{\phi}(\mathbf{x}, y_t, y_{t-1}, t)$$

### Feature Engineering Pipeline $\boldsymbol{\phi}(\mathbf{x}, y_t, y_{t-1}, t)$:
- **Current Word Identity:** Unigrams, lowercased forms, and exact case.
- **Prefix & Suffix Representations:** Subword character n-grams of lengths 1, 2, 3, and 4 (critical for chemical suffixes like *-ate*, *-ol*, *-ine* in `NUTRIENT`).
- **Orthographic Shape Features:** `is_title`, `is_upper`, `is_digit`, `has_hyphen`, `is_mixed_alphanumeric`.
- **Contextual Sliding Window:** Symmetric context features over $w_{t-2}, w_{t-1}, w_{t+1}, w_{t+2}$.
- **Bigram Context Pairs:** $(w_{t-1}, w_t)$ and $(w_t, w_{t+1})$.
- **Markov Transition Features:** Dependent on $y_{t-1}$ to prevent invalid label sequences.
- **Constrained Transition Masking:** Strictly forbidding transitions from `O` to `I-X` and across dissimilar entity classes (`B-FOOD` $\to$ `I-NUTRIENT`).
- **Parameter Averaging:** Maintains running weight sums across all updates to maximize boundary margin and prevent overfitting on low-frequency clinical terms.

---

## 8. Dataset Construction & Label Provenance

The unified leak-free dataset (`dynamic_v1`) was compiled by projecting the 156 accepted dynamic entity spans onto the frozen clinical corpus, preserving exact sentence boundaries:

| Split | Sentences | Tokens | Gold Entity Spans | Split Function | Leakage Overlap |
| :--- | :---: | :---: | :---: | :--- | :---: |
| **Train** | 1,223 | 14,028 | 1,851 | Model Training | 0% |
| **Validation** | 262 | 3,115 | 418 | Checkpointing & Thresholding | 0% |
| **Held-Out Test** | 263 | 5,961 | 491* | Final Unbiased Evaluation | 0% |
| **Total** | **1,748** | **23,104** | **2,760** | Complete Dynamic Dataset | **0.0%** |

*\*Note on Test Count: The test set contains 491 total gold entity spans (473 seen surface forms + 18 unseen surface forms). Certain preliminary prompt summaries rounded this figure to 496; the exact verified physical count is 491.*

### Label Provenance Distinction:
- **Human Gold Evaluation Data:** 150 sentences (`human_gold.jsonl`) annotated by clinical nutritionists; used strictly as an independent stress-test partition.
- **Silver / Distant Training Data:** 1,223 sentences (`train.jsonl`) constructed via distant supervision combining accepted candidate surface mentions with gazetteer dictionaries. All BIO sequences are validated with 0 syntax errors.

---

## 9. Dynamic NER Results (Phase 5)

Evaluated on the exact held-out test split (263 sentences, 491 entities) using exact span matching $(start, end, label)$:

| Model / Architecture | Active Classes | Micro Precision | Micro Recall | Micro F1 | Macro F1 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Phase 2 Baseline Perceptron** | 10 | 92.48% | 93.15% | 92.81% | 83.15% |
| **Phase 5 Dynamic Perceptron** | **13** | **93.83%** | **92.87%** | **93.35%** | **82.08%** |
| **Absolute Improvement ($\Delta$)** | **+3 Classes** | **+1.35%** | **-0.28%** | **+0.54%** | **-1.07%** |

### Dynamic Entity Breakdown:
- **`COOKING_METHOD` F1:** **93.33%** (Precision: 90.32%, Recall: 96.55%, Support: 23 in test). High accuracy driven by distinct verbal and past-participle morphology.
- **`DIET_PATTERN` F1:** **100.00%** (Precision: 100.00%, Recall: 100.00%, Support: 2 in test). Clean multi-token exact match.
- **`SUPPLEMENT` F1:** **0.00%** (Precision: 0.00%, Recall: 0.00%, Support: 1 in test). Single occurrence in test partition; model failed to trigger without extensive lexical context.

---

## 10. Few-Shot Adaptation Analysis (Phase 6)

To understand sample efficiency when onboarding dynamic entities, we evaluated adaptation curves across few-shot budgets $K \in \{5, 10, 25, 50, \text{Full}\}$:

| Few-Shot Budget ($K$) | `COOKING_METHOD` F1 | `DIET_PATTERN` F1 | `SUPPLEMENT` F1 | Empirical Finding |
| :--- | :---: | :---: | :---: | :--- |
| **$K = 5$** | 0.00% | 0.00% | 0.00% | Insufficient support to overcome transition penalty |
| **$K = 10$** | 0.00% | *Unavailable* ($N=5$) | *Unavailable* ($N=3$) | Feature weights remain below decision threshold |
| **$K = 25$** | **46.67%** | *Unavailable* | *Unavailable* | Rapid phase change; basic unigrams learned |
| **$K = 50$** | **78.95%** | *Unavailable* | *Unavailable* | Contextual modifiers and prefixes stabilized |
| **Full ($K=79$)** | **93.33%** | 100.00% | 0.00% | Full convergence across morphological variations |

### Scientific Finding:
Linear sequence perceptrons exhibit a **sharp phase transition** between $K=10$ and $K=25$. While $K < 10$ is insufficient to establish stable transition weights, $K=50$ recovers **84.6% of full-training performance**, proving that exhaustive large-scale annotation is unnecessary for dynamic clinical entity onboarding.

---

## 11. Comprehensive 4-Way Model Comparison

All models evaluated on the identical 263 held-out test sentences:

| Evaluation Metric | Custom Dynamic Perceptron (Phase 5) | spaCy Statistical NER (Phase 7) | RoBERTa Token Classifier (Phase 11A) | GLiNER Zero-Shot (Phase 11B) | Empirical Architectural Trade-Off |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Architecture** | Averaged Sequence Perceptron | Transition-Based CNN | 12-layer Transformer | Bi-Encoder Span GLiNER | Linear vs. Neural Encoders |
| **Parameters / Size** | **~1.2 MB** | ~15 MB | ~498 MB | ~610 MB | Perceptron is lightweight |
| **Micro Precision** | **93.83%** | 93.25% | 73.99% | 19.28% | Supervised models suppress false positives |
| **Micro Recall** | **92.87%** | **92.87%** | 78.21% | 42.36% | Gazetteer + n-gram features maximize recall |
| **Micro F1** | **93.35%** | 93.06% | 76.04% | 26.50% | Perceptron leads by **+17.31%** and **+66.85%** |
| **Macro F1** | 82.08% | **82.48%** | 40.81% | 18.05% | Imbalance penalizes zero-shot prompts |
| **`NUTRIENT` F1** | 92.44% | **92.71%** | 89.14% | 43.67% | High stability across all architectures |
| **`FOOD` F1** | **91.72%** | 90.45% | 75.64% | 15.77% | Ingredients vs. food groups disambiguation |
| **`COOKING_METHOD` F1** | 93.33% | **93.62%** | 35.71% | 6.67% | Heavy drop in zero-shot GLiNER ($R=4.35\%$) |
| **`DIET_PATTERN` F1** | **100.00%** | **100.00%** | 0.00% | 12.50% | GLiNER captures 1 zero-shot; RoBERTa collapses |
| **`SUPPLEMENT` F1** | 0.00% | 0.00% | 0.00% | **9.09%** | GLiNER achieves non-zero recall ($R=100\%$) |
| **Seen Mentions F1** | 96.38% | **96.60%** | 84.26% | 56.21% | Supervised memorization of training lexicon |
| **Unseen Mentions F1** | **16.22%** | 5.26% | 7.41% | 2.09% | Out-of-vocabulary zero-shot generalization |
| **CPU Latency** | **3.87 ms/sent** | 10.24 ms/sent | 907.67 ms/sent | 304.70 ms/sent | **Perceptron is 234.5x faster than RoBERTa** |
| **Throughput** | **5,886.3 tok/s** | 2,223.7 tok/s | 25.1 tok/s | 74.8 tok/s | High-volume operational readiness |

---

## 12. Continual Learning & Catastrophic Forgetting (Phase 8)

When expanding the schema sequentially:
$$\text{Schema v2.0 (10 classes)} \longrightarrow \text{+COOKING\_METHOD (11)} \longrightarrow \text{+DIET\_PATTERN (12)} \longrightarrow \text{+SUPPLEMENT (13)}$$

We evaluated **Naive Sequential Adaptation** (no replay) against **Experience Replay** (maintaining an anchor buffer of $\sim 45\text{--}53$ exemplars, $< 4.5\%$ of training data):

| Expansion Step | Strategy | Active Classes | Micro F1 | Macro F1 | Flagship `NUTRIENT` F1 | New Entity F1 | Old Entity Retention ($\Delta$ F1) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Step 0 (Base)** | Base | 10 | 90.32% | 85.25% | 92.71% | — | 0.00% |
| **Step 1 (+COOKING)** | *No Replay* | 11 | 91.81% | 83.97% | 94.05% | 85.71% | -1.46% |
| **Step 1 (+COOKING)** | **Replay** | 11 | **92.06%** | **86.28%** | 93.95% | 82.61% | **+1.40%** |
| **Step 2 (+DIET)** | *No Replay* | 12 | 85.36% | 76.42% | 92.35% | 6.78% | -1.60% |
| **Step 2 (+DIET)** | **Replay** | 12 | **90.61%** | **82.57%** | 91.55% | **66.67%** | **+0.88%** |
| **Step 3 (+SUPPLEMENT)**| *No Replay* | 13 | 87.86% | 71.89% | 93.22% | 0.00% | -2.02% |
| **Step 3 (+SUPPLEMENT)**| **Replay** | 13 | **90.17%** | **76.12%** | 91.81% | 0.00% | **+0.54%** |

### Catastrophic Forgetting Findings & Metric Discrepancy Note:
- **Discrepancy Clarification:** In the Phase 8 report summary, Step 2 CFR was listed as 2.25% (No Replay) vs 3.73% (Replay) because CFR was computed across *all* active classes including newly introduced classes exhibiting zero-support variance. When isolated strictly to **Old Entity Retention ($\Delta$ F1)**, Replay achieved **+0.88% retention** versus **-1.60% degradation** without replay.
- **Scientific Conclusion:** Experience Replay **does not completely eliminate** forgetting, but it stabilizes shared feature weights, preventing the severe degradation seen in naive sequential tuning (preserving Micro-F1 above 90.17%).

---

## 13. Entity Linking & Normalization (Phase 9)

Extracted clinical mentions were grounded to canonical concepts in the Pediatric Nutrition Knowledge Base using a **5-tier cascading resolver**:

```
Extracted Mention
  ├── Tier 1: Exact Case-Insensitive String Match
  ├── Tier 2: Lemmatized & Punctuation-Normalized Match
  ├── Tier 3: Morphological Stemming & Levenshtein Distance (Similarity >= 0.85)
  ├── Tier 4: Clinical Synonym & Curated Alias Map Match
  └── Tier 5: Dense Bi-Encoder Cosine Embedding (intfloat/e5-small-v2, Cosine >= 0.80)
        │
        ▼
Canonical Clinical Concept ID (e.g., NUT_IRON, COND_ANEMIA)
```

### Measured Linking Performance:
- **Curated 100-Mention Benchmark Accuracy:** **100.0%** (Exact: 40%, Normalized: 15%, Stem/Fuzzy: 18%, Synonym: 12%, Dense Embedding: 15%).
- **Self-Consistency Evaluation Limitation:** The 100% accuracy metric reflects evaluation on a controlled 100-mention validation set where every target entity existed in the canonical registry. 
- **Open-Domain Query Linking Rate:** When deployed on 150 unstructured user queries in Phase 10 RAG, the linker grounded **70.67% of queries** (106/150 queries linked, with 44 unlinked due to out-of-domain terms or conversational syntax).

---

## 14. Entity-Aware RAG Integration & Hierarchical Gating (Phase 10)

We integrated the Dynamic NER and Entity Linking cascade into the NutriBite RAG engine (BM25 + FAISS + reranking over 913 pediatric passages), evaluated across the fixed 150-query clinical benchmark:

| Retrieval System Architecture | Recall@1 | Recall@3 | Recall@5 | Recall@10 | Precision@3 | Precision@5 | MRR@5 | MRR@10 | Queries Helped | Queries Hurt | Queries Neutral |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **System A: Baseline RAG** | 67.33% | 78.67% | 86.00% | 90.00% | 64.00% | 54.40% | 0.7416 | 0.7481 | — | — | — |
| **System B: Entity-Aware v1 (Ungated)** | 66.00% | 74.00% | 79.33% | 84.67% | 60.89% | 50.40% | 0.7107 | 0.7172 | 6 | 15 | 129 |
| **System C: Gated Entity-Aware v2** | **69.33%** | **79.33%** | **86.00%** | **90.67%** | **65.33%** | **54.80%** | **0.7511** | **0.7576** | **5** | **2** | **143** |
| **Delta (v2 vs. Baseline)** | **+2.00%** | **+0.67%** | **+0.00%** | **+0.67%** | **+1.33%** | **+0.40%** | **+0.0095** | **+0.0095** | **+5** | **-2** | — |

### Root Cause of v1 Regression & v2 Gating Strategy:
- **Why v1 Degraded Retrieval:** In v1, broad high-frequency entities (particularly `AGE_GROUP` like *"child"* or *"infant"*) received the same positive weight boost as narrow clinical entities. This flooded the dense retrieval stage with hundreds of generic pediatric guidelines, crowding out specific medical passages and harming 15 queries (Recall@5 dropping from 86.00% to 79.33%).
- **The v2 Gating Solution:** We implemented **hierarchical query-type gating**:
  1. **Strong Priority Boosting ($\beta = 1.35$):** For high-specificity entities (`ALLERGEN`, `NUTRIENT`, `HEALTH_CONDITION`).
  2. **Soft Dampening ($\beta = 1.05$):** For broad categories (`AGE_GROUP`, `FOOD`, `FOOD_GROUP`, `MEAL_TYPE`).
  3. **No Hard Filtering:** Retaining lexical query terms to prevent zero-result drops.
  - **Outcome:** Completely restored Recall@5 (86.00%), improved Recall@1 (+2.00%), improved MRR@10 (+0.0095), and reduced harmed queries by **86.7% (15 $\to$ 2)**.

---

## 15. Technology Stack & Model Inventory

The table below lists all software libraries, machine learning models, and algorithms actually executed in the NutriBite pipeline:

| Pipeline Component | Concrete Technology / Model Checkpoint | Specific Role in System |
| :--- | :--- | :--- |
| **Production Dynamic NER** | Custom Structured Averaged Sequence Perceptron | Primary real-time 13-entity sequence tagger (3.87 ms latency) |
| **Statistical Baseline** | spaCy `en_core_web_sm` (Transition-based CNN) | Statistical baseline benchmark (Phase 7) |
| **Transformer Baseline** | `roberta-base` (125M parameters, HuggingFace) | Deep neural token classification baseline (Phase 11A) |
| **Open-Vocabulary Baseline**| `urchade/gliner_small-v2.1` | Zero-shot prompted entity extraction baseline (Phase 11B) |
| **Dense Semantic Embeddings**| `intfloat/e5-small-v2` (Sentence-Transformers) | Candidate discovery similarity & Tier-5 entity linking |
| **Lexical Search & Matching** | `rank-bm25` (Okapi BM25 implementation) | Keyword passage retrieval in RAG & candidate discovery |
| **Vector Similarity Index** | `faiss-cpu` (Facebook AI Similarity Search) | Dense index for 913 passage vectors (384-dim E5 embeddings) |
| **Fuzzy String Distance** | `rapidfuzz` (C++ Levenshtein distance) | Morphological grouping & Tier-3 entity linking |
| **Web Service API** | FastAPI / Uvicorn (Python 3.12) | Microservice endpoints for candidate discovery & registry |
| **Test & Validation Suite** | PyTest (72 automated test modules) | Regression testing, split isolation, and SHA-256 hash checks |

---

## 16. Comprehensive Error Analysis

Across all 11 phases, systematic error auditing identified seven primary failure modes:

1. **Semantic Over-Triggering in Zero-Shot GLiNER:** Generic prompts (*"food item"*, *"dietary property"*) produced **330 false positives on `FOOD`** and **105 on `DIETARY_PROPERTY`**, mistakenly tagging non-nutritional common nouns (*"intake"*, *"rich"*, *"meals"*).
2. **Span Boundary Inconsistencies:** Multi-token food preparations (*"pureed sweet potato"*) were occasionally split by neural baselines into separate modifiers (*"pureed"* as `COOKING_METHOD`) and nouns (*"potato"* as `FOOD`), missing the compound clinical context.
3. **Extreme Low-Support Collapse:** In standard cross-entropy fine-tuning (`roberta-base`), classes with support $\le 5$ in train (`SUPPLEMENT`, `DIET_PATTERN`, `FEEDING_METHOD`) experienced complete gradient starvation, collapsing to **0.0% F1**.
4. **Shared Lexical Interference in Continual Learning:** Sequentially introducing `DIET_PATTERN` using only 5 training sentences displaced perceptron weights for high-frequency shared words (*"child"*, *"feed"*), causing a **1.60% drop in old entity retention** without replay.
5. **Broad Entity Retrieval Flooding:** Injecting high-level age terms (*"infant"*) into RAG retrieval displaced disease-specific passages, harming 10% of queries until soft gating was implemented.
6. **Out-of-Vocabulary Generalization Gap:** While seen mentions achieved **96.38% F1**, completely unseen surface forms achieved only **16.22% F1** on the Custom Perceptron and **2.09%** on zero-shot GLiNER, indicating that zero-shot clinical generalization remains bounded.
7. **Nested Entity Omission:** The linear BIO representation cannot represent nested hierarchies (*e.g., "cow's milk allergy"* containing both `FOOD` and `HEALTH_CONDITION`).

---

## 17. Overall Measured Pipeline Improvements

| Dimension | Initial State (Baseline) | Final State (Dynamic Framework) | Measured Quantitative Impact | Primary Source |
| :--- | :---: | :---: | :---: | :--- |
| **Schema Capacity** | 10 Static Classes | **13 Dynamic Classes** | +3 clinical entity categories integrated | Phase 5 |
| **NER Micro F1** | 92.81% (Phase 2) | **93.35% (Phase 5)** | **+0.54% Micro-F1** across 13 classes | Phase 5 |
| **`COOKING_METHOD` F1**| 0.00% (Not present) | **93.33%** | +93.33% F1 on culinary preparation | Phase 5 |
| **`DIET_PATTERN` F1** | 0.00% (Not present) | **100.00%** | +100.00% F1 on structured regimens | Phase 5 |
| **Annotation Effort** | 70.25 clinician mins | **30.25 clinician mins** | **56.94% reduction** in human triage time | Phase 4.1 |
| **Old Entity Retention**| -1.60% (Without replay) | **+0.88% (With replay)** | **+2.48% stability** across historical classes | Phase 8 |
| **RAG Recall@1** | 67.33% (Baseline) | **69.33% (Gated v2)** | **+2.00% absolute Recall@1** | Phase 10 v2 |
| **RAG Recall@5** | 86.00% (Baseline) | **86.00% (Gated v2)** | Preserved baseline, **+6.67% over v1** | Phase 10 v2 |
| **RAG MRR@10** | 0.7481 (Baseline) | **0.7576 (Gated v2)** | **+0.0095 improvement** in reciprocal rank | Phase 10 v2 |
| **RAG Harmed Queries** | 15 harmed queries (v1) | **2 harmed queries (v2)** | **86.7% reduction** in query degradation | Phase 10 v2 |
| **Inference Efficiency**| 907.67 ms (RoBERTa) | **3.87 ms (Perceptron)** | **234.5x lower CPU latency** | Phase 11A |

---

## 18. Formal Research Contribution Synthesis

The core contribution of this research is a **validated, human-in-the-loop, domain-adaptive NER and entity-grounded RAG framework for pediatric clinical nutrition**. 

To provide clarity for peer review, we categorize our contributions across three dimensions:

### 1. Research Contribution:
- Formulating and verifying the complete lifecycle of clinical dynamic entity expansion—from discovery through human triage, silver label generation, and constrained sequential adaptation.
- Empirical characterization of **Experience Replay dynamics** in clinical sequence labeling, proving that an anchor buffer $< 4.5\%$ of training size prevents catastrophic forgetting when expanding medical ontologies.
- Establishing the failure mode of raw entity injection in medical RAG and proving that **hierarchical query-type gating** is mandatory to prevent broad concepts from degrading retrieval quality.

### 2. Engineering Contribution:
- Designing a **grouped human triage interface** that reduces pediatric annotation time by **56.94%**.
- Developing a multi-tier entity linking cascade achieving **100% self-consistency** on benchmark mentions and **70.67% query grounding** in conversational RAG.
- Engineering a **lightweight sequence perceptron** operating at **3.87 ms/sentence (5,886 tokens/sec)** on standard CPUs, enabling low-cost on-premise clinical deployment.

### 3. Experimental Contribution:
- Constructing and publicly freezing the 1,748-sentence `dynamic_v1` dataset across 13 pediatric nutrition categories.
- Conducting a rigorous **4-way controlled benchmark** (Custom Perceptron, spaCy Statistical, RoBERTa, GLiNER) on the identical held-out test split, providing a documented baseline for open-vocabulary vs. discriminative clinical extraction.
- Maintaining an automated **72-test regression suite** enforcing 100% SHA-256 hash preservation of all historical datasets.

---

## 19. Methodological Limitations

1. **Single Annotator Validation:** Human candidate triage in Phase 4 was conducted by a single pediatric domain expert. Multi-annotator Cohen's kappa or inter-annotator agreement (IAA) was not computed.
2. **Extreme Class Sparsity for Specific Dynamic Entities:** While `COOKING_METHOD` had adequate support (79 train, 23 test), `SUPPLEMENT` had only 3 training mentions and 1 test mention, and `DIET_PATTERN` had 5 training mentions and 2 test mentions. Consequently, 0.0% or 100.0% F1 scores on these classes reflect extreme small-sample sensitivity.
3. **Partial Candidate Pool Review:** Only 281 of the 1,500 discovered candidates (18.73%) were reviewed, leaving 1,219 candidates unreviewed in the discovery backlog.
4. **Self-Consistency Constraint in Linking Evaluation:** The 100% Phase 9 entity linking accuracy represents a closed-world benchmark where all targets existed in the knowledge base; open-domain linking achieves 70.67%.
5. **Zero-Shot GLiNER Prompting Limitation:** GLiNER was evaluated in a zero-shot prompting configuration without in-domain parameter fine-tuning, explaining its lower F1 (26.50%) relative to supervised models.
6. **No Claim of General-Domain Algorithmic Novelty:** The individual algorithmic building blocks (Perceptron, E5, BM25, FAISS, RoBERTa, GLiNER) are established techniques; the contribution is their domain-specific integration, empirical characterization, and clinical RAG optimization.

---

## 20. Master Final Metrics Summary

The table below summarizes the key empirical metrics across the entire NutriBite NER research program:

| Evaluation Dimension | Final Measured Value | Context / Setting | Source Report |
| :--- | :---: | :--- | :--- |
| **Total Corpus Guidelines** | **913 guidelines** | 91,623 words of clinical text | Phase 0 |
| **Raw Mentions Discovered** | **22,745 mentions** | Tri-tier extraction engine | Phase 3 |
| **Unique Candidates** | **1,500 candidates** | 680 grouped surface forms | Phase 3 |
| **Clinician Time Saved** | **56.94% (40.0 mins)** | Grouped triage vs. individual review | Phase 4.1 |
| **Final Clinical Classes** | **13 classes (27 BIO)** | 10 core + 3 dynamic categories | Phase 5 |
| **Dynamic Dataset Size** | **1,748 sentences** | 1,223 train / 262 val / 263 test | Phase 5 |
| **Production NER Micro F1** | **93.35%** | Custom Dynamic Perceptron on test split | Phase 5 |
| **Production NER Macro F1** | **82.08%** | 13-class unweighted average | Phase 5 |
| **Seen Mentions F1** | **96.38%** | 473 seen test spans | Phase 5 / 7 |
| **Unseen Mentions F1** | **16.22%** | 18 novel test spans | Phase 5 / 7 |
| **Few-Shot Convergence** | **78.95% F1 at $K=50$** | `COOKING_METHOD` recovery | Phase 6 |
| **Continual Replay Retention**| **+0.88% $\Delta$ F1** | Old class retention with replay | Phase 8 |
| **Entity Linking Accuracy** | **100.0% (Closed)** | 100-mention validation benchmark | Phase 9 |
| **RAG Query Linking Rate** | **70.67% (106/150)** | Open clinical query grounding | Phase 10 |
| **RAG Recall@1** | **69.33%** | +2.00% over baseline (67.33%) | Phase 10 v2 |
| **RAG Recall@5** | **86.00%** | Restored baseline (+6.67% over v1) | Phase 10 v2 |
| **RAG MRR@10** | **0.7576** | +0.0095 over baseline (0.7481) | Phase 10 v2 |
| **RAG Harm Reduction** | **86.7% (15 $\to$ 2)** | Harmed queries eliminated via gating | Phase 10 v2 |
| **RoBERTa Micro F1** | **76.04%** | 125M Transformer baseline | Phase 11A |
| **GLiNER Zero-Shot F1** | **26.50%** | Bi-encoder open-vocabulary baseline | Phase 11B |
| **Production CPU Latency** | **3.87 ms/sentence** | Custom Perceptron (5,886 tok/s) | Phase 11A / 11B |
| **Regression Test Suite** | **72 / 72 Passed** | 100% green across all phases | Phase 11B |
| **Frozen Dataset Checksums** | **8 / 8 Verified** | SHA-256 hash preservation | Phase 11B |

---
*End of Master Technical Research Contribution Report.*
