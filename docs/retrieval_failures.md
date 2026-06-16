# ❌ RAG Retrieval Failure Analysis

This document catalogs critical retrieval failure modes, vocabulary mismatches, and noise retrieval issues identified in the baseline evaluation of `ai-service-v2`.

---

## 1. Key Failure Modes Identified

### A. Keyword Blindness (Lack of Lexical Constraints)
* **Description**: Purely semantic retrievers (`e5-small-v2`) match general concepts but frequently fail to respect strict keyword filters.
* **Examples**:
  * Query: `"why is ragi good for growing kids"` $\rightarrow$ retrieved: "Limiting added fat, salt, and sugar" and "Bad vs Good Cholesterol" (Missed ragi entirely).
  * Query: `"is spinach a good source of iron for toddlers"` $\rightarrow$ retrieved: "A balanced diet containing all essential nutrients" (Missed spinach entirely).
  * Query: `"is curd good for a 3 year old toddler"` $\rightarrow$ retrieved: "Goodenough's Draw-A-Man Test" (Matched "3 year old" but missed "curd").

### B. High-Frequency Generalist Noise
* **Description**: Chunks containing general words like "balanced diet", "children", or "development" represent massive semantic gravity wells. They are retrieved for nearly every query, crowding out highly specific pediatric advice.
* **Examples**:
  * "Honey Safety" and "Geriatric Age Groups" repeatedly occupy Top-K slots for unrelated queries like `"healthy snacks for 8 year old after school"`.

### C. Specific Medical & Nutritional Term Gaps
* **Description**: Specific clinical deficiency conditions (e.g. "rickets", "scurvy") and specific local foods (e.g. "ragi porridge", "moong dal khichdi", "curd") are ranked below generic lifestyle advice because their vectors drift towards broader children guidelines.
* **Examples**:
  * Query: `"soft bones and bowed legs in toddlers rickets"` $\rightarrow$ retrieved: "Toddlers physiological anorexia" and "Adolescent U/L Ratio".

### D. Redundant & Overlapping Chunks
* **Description**: The database contains highly duplicate semantic definitions, which occupies multiple slots in Top-K.
* **Examples**:
  * Chunks: `"Tea reduces iron absorption and should be avoided near meal times."` and `"Tea reduces iron absorption and should not be consumed with meals."` are retrieved simultaneously, wasting LLM context space.

---

## 2. Quantitative Diagnostic Indicators

* **Recall@5 Limit**: **35.0%** average recall means that out of 3 expected topics needed to construct a medically-safe plan, **fewer than 1.1** are typically present in the RAG prompt context.
* **Semantic Drift**: Abstract terms like `"Draw-A-Man Test"` score high on age-matching queries (e.g. "3 year old") because dense embeddings fail to enforce the core search subject ("curd").
