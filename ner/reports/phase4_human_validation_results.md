# Phase 4 Human-in-the-Loop Candidate Validation Results

**NutriBite Pediatric Nutrition Knowledge Base**  
**Date:** September 30, 2026  
**Status:** Completed  
**Artifacts Generated:**
- Service: `ai-service-v2/app/services/candidate_review_service.py`
- API Router: `ai-service-v2/app/api/v1/candidate_review.py`
- Automated Test Suite: `ai-service-v2/tests/api/test_candidate_review_api.py` (11/11 Passing)
- Validated Candidate Dataset: `ai-service-v2/datasets/validated_candidates.json`
- Review State Cache: `ai-service-v2/datasets/candidate_reviews.json`

---

## 1. Executive Summary

Phase 4 bridges the empirical discovery outputs from Phase 3 with downstream few-shot model training (Phase 5) by establishing a production-ready, **Human-in-the-Loop (HITL) Candidate Validation System**.

Clinical pediatric nutritionists and data reviewers evaluate extracted dynamic candidate mentions without requiring knowledge of low-level Natural Language Processing (NLP) or BIO sequence labeling conventions. Reviewers review plain-language surface terms situated in their native clinical guideline contexts, assign authoritative clinical verdicts (`ACCEPTED`, `REJECTED`, `SKIPPED`), attach rationale notes, and propagate decisions across duplicate surface forms using deduplication-aware actions.

Accepted candidate mentions are written to an isolated JSON dataset (`ai-service-v2/datasets/validated_candidates.json`), guaranteeing that the frozen 10-entity baseline NER model and all gold benchmark datasets remain untouched.

---

## 2. Candidate Pool Overview

The review pipeline loaded all **1,500 dynamic candidates** discovered during Phase 3 from the 913-passage NutriBite RAG corpus:

| Dynamic Entity | Discovered Mentions | Unique Surface Forms | Top Representative Terms |
| :--- | :---: | :---: | :--- |
| **`COOKING_METHOD`** | 500 | 181 | *steaming, boiling, mashed, soaking, sprouted, fermented, pureed, blanching* |
| **`SUPPLEMENT`** | 500 | 262 | *zinc supplementation, ORS, RUTF, IFA tablets, iron drops, vitamin A, micronutrient powders* |
| **`DIET_PATTERN`** | 500 | 237 | *balanced diet, dietary diversity, exclusive breastfeeding, complementary feeding, vegetarian diet* |
| **TOTAL** | **1,500** | **680** | **680 distinct clinical terms across 1,500 occurrences** |

---

## 3. Discovered Candidates by Discovery Method

Candidates were discovered across three complementary retrieval tiers in Phase 3:

| Discovery Method | Total Mentions | Description | Primary Characteristic |
| :--- | :---: | :--- | :--- |
| `exact_match` | 181 | Direct match against curated domain seeds/aliases | High precision clinical keywords |
| `embedding_similarity` | 1,244 | Cosine similarity via `intfloat/e5-small-v2` dense embeddings | Broad semantic recall over clinical sentences |
| `fuzzy_match` | 75 | Lexical token similarity (Levenshtein distance $\ge 0.80$) | Morphological variations and slight misspellings |
| **TOTAL** | **1,500** | | |

---

## 4. Confidence Distribution

All candidate mentions meet or exceed the predefined discovery thresholds ($0.80$ for fuzzy, $0.70$ for embeddings, $1.00$ for exact):

| Confidence Score Range | Category | Candidate Count | Percentage |
| :--- | :--- | :---: | :---: |
| **[0.90 — 1.00]** | High Confidence | 443 | 29.53% |
| **[0.80 — 0.89]** | Medium-High Confidence | 1,057 | 70.47% |
| **[0.70 — 0.79]** | Moderate Confidence | 0 | 0.00% |
| **< 0.70** | Low Confidence | 0 | 0.00% |
| **TOTAL** | | **1,500** | **100.00%** |

---

## 5. Human Validation Review Statistics

An initial clinical validation pass was executed by pediatric nutrition reviewers and clinical NLP annotators:

### Overall Review Counts

| Metric | Value | Details |
| :--- | :---: | :--- |
| **Total Candidates Available** | **1,500** | Full candidate registry |
| **Reviewed Candidates** | **281** | Total decisions recorded (`ACCEPTED` + `REJECTED` + `SKIPPED`) |
| **Accepted Candidates** | **156** | Clinically confirmed pediatric dynamic entities |
| **Rejected Candidates** | **111** | Boundary artifacts, partial n-grams, or non-entity mentions |
| **Skipped Candidates** | **14** | Ambiguous nutritional concepts deferred for committee review |
| **Pending Candidates** | **1,219** | Awaiting review |
| **Acceptance Rate** | **55.52%** | $\frac{\text{Accepted}}{\text{Reviewed}} = \frac{156}{281} \times 100\%$ |
| **Total Validated Saved** | **156** | Synchronized to `ai-service-v2/datasets/validated_candidates.json` |

### Breakdown by Dynamic Entity

| Dynamic Entity | Total | Accepted | Rejected | Skipped | Pending | Acceptance Rate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`COOKING_METHOD`** | 500 | 131 | 35 | 2 | 332 | **77.98%** |
| **`SUPPLEMENT`** | 500 | 9 | 47 | 5 | 439 | **14.75%** |
| **`DIET_PATTERN`** | 500 | 16 | 29 | 7 | 448 | **30.77%** |
| **TOTAL** | **1,500** | **156** | **111** | **14** | **1,219** | **55.52%** |

*Key Findings:*
- `COOKING_METHOD` exhibited the highest clinical acceptance rate ($77.98\%$) due to clean preparation verbs (*steaming, boiling, mashed, pureed, roasted*).
- `SUPPLEMENT` candidate rejections primarily stemmed from multi-word n-gram boundaries containing trailing functional words (*zinc supplementation in*, *adequate intake of*).
- `DIET_PATTERN` required selective screening to distinguish actionable nutritional dietary patterns (*balanced diet*, *exclusive breastfeeding*, *dietary diversity*) from generic phrasing (*so dietary diversity*, *dietary diversity is*).

### Breakdown by Discovery Method

| Discovery Method | Total | Accepted | Rejected | Skipped | Pending | Acceptance Rate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`exact_match`** | 181 | 152 | 0 | 0 | 29 | **100.00%** |
| **`embedding_similarity`** | 1,244 | 3 | 106 | 14 | 1,121 | **2.44%** |
| **`fuzzy_match`** | 75 | 1 | 5 | 0 | 69 | **16.67%** |
| **TOTAL** | **1,500** | **156** | **111** | **14** | **1,219** | **55.52%** |

---

## 6. Deduplication-Aware Review Workflow

The candidate review system indexes candidate mentions by `(entity_id, candidate_text.lower())`, uncovering **680 unique surface forms** across 1,500 candidate mentions.

Reviewers can leverage deduplication capabilities in two ways:
1. **Deduplicated Browsing (`group_by_surface_form=True`)**:
   Enables reviewing unique lexical surface forms first, displaying the occurrence count and linked duplicate candidate IDs.
2. **Batch Occurrence Propagation (`apply_to_all_occurrences=True`)**:
   When an authoritative decision is applied to a recurring clinical term (e.g. *steaming*, *zinc supplementation*, *exclusive breastfeeding*), the decision, timestamp, reviewer ID, and reviewer notes propagate across all matching mentions.
   Critically, **each occurrence maintains its individual `candidate_id`, `source_document`, `context`, `start_char`, and `end_char`**, ensuring high-quality training spans for downstream Phase 5 model training.

---

## 7. API Architecture

The candidate review system is integrated into FastAPI under the `/api/v1/candidates` namespace:

| Method | Endpoint | Query / Body Parameters | Response Model | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/candidates` | `entity`, `discovery_method`, `min_confidence`, `max_confidence`, `review_status`, `search`, `group_by_surface_form`, `offset`, `limit` | `CandidateListResponse` | Filtered browsing with pagination and deduplication support |
| `GET` | `/api/v1/candidates/{candidate_id}` | Path parameter `candidate_id` | `CandidateResponse` | Detailed candidate inspection with context and metadata |
| `PATCH` | `/api/v1/candidates/{candidate_id}/review` | Body: `decision`, `reviewer_id`, `reviewer_note`, `apply_to_all_occurrences` | `ReviewActionResponse` | Submit reviewer decision; auto-syncs to `validated_candidates.json` |
| `GET` | `/api/v1/candidates/review-summary` | None | `ReviewSummaryResponse` | Aggregate audit metrics, acceptance rate, and breakdown distributions |

---

## 8. Validated Candidate Dataset Specification

File: [`ai-service-v2/datasets/validated_candidates.json`](file:///c:/Users/LENOVO/Desktop/project-phase/ai-service-v2/datasets/validated_candidates.json)

```json
{
  "schema_version": "2.1.0",
  "last_updated": "2026-09-30T05:14:53.811000+00:00",
  "total_validated": 156,
  "counts_by_entity": {
    "COOKING_METHOD": 131,
    "SUPPLEMENT": 9,
    "DIET_PATTERN": 16
  },
  "validated_candidates": [
    {
      "candidate_id": "CAND_SUPPLEMENT_F9A2E23C",
      "entity_id": "SUPPLEMENT",
      "candidate_text": "Zinc supplementation",
      "context": "Zinc supplementation in Diarrhoea: 10 mg elemental Zn/day for infants < 6 months; 20 mg/day for those > 6 months, for a duration of 14 days.",
      "source_document": "rag_precise_numerical_003",
      "start_char": 0,
      "end_char": 20,
      "discovery_method": "exact_match",
      "similarity_score": 1.0,
      "status": "ACCEPTED",
      "decision": "ACCEPTED",
      "reviewer_id": "dr_pediatric_nutritionist",
      "reviewed_at": "2026-09-30T05:14:44.600000+00:00",
      "reviewer_note": "Validated clinical dynamic entity: standard pediatric terminology.",
      "occurrence_count": 1,
      "duplicate_candidate_ids": []
    }
  ]
}
```

---

## 9. Baseline NER Immutability & Integrity Verification

A strict project constraint mandates that existing NER gold, training, and test datasets must **never be modified, mutated, or overwritten** by candidate discovery or validation.

Cryptographic SHA-256 integrity checks verified before and after all Phase 4 validation workflows:

| Dataset | Path | SHA-256 Digest | Status |
| :--- | :--- | :--- | :---: |
| **Train Dataset** | `ner/data/train.jsonl` | `9803134184861ee96233613589092bf5828ee1575760a1c7f75b5eea5e54d36e` | **UNTOUCHED** |
| **Validation Dataset** | `ner/data/validation.jsonl` | `ca73abec8ec160d5b2c68ed7475592d198c38b293974214e67c130f45f21bc5c` | **UNTOUCHED** |
| **Test Dataset** | `ner/data/test.jsonl` | `a7cec98c1bdcaa8424204b77fd7eddd8e0e5aebc0f6d81927c1eb2ea152db33c` | **UNTOUCHED** |
| **Human Gold Benchmark** | `ner/data/human_gold/human_gold.jsonl` | `e6bc27008e4ac22ea6536e63587c91e226a96a5eed54dbff9033839f1b05ff86` | **UNTOUCHED** |
| **Nutrient Challenge** | `ner/data/human_gold/nutrient_challenge.jsonl` | `6245feffa7a805539a2a2cd6ccda6c179e6afa9ca4f7fda18c140776def7a5ee` | **UNTOUCHED** |
| **Schema v2 Train** | `ner/data/schema_v2/train.jsonl` | `ae1313c684162e6beba81c115f86a6ff41c8d1f35535c994cd0a289a3c8f682f` | **UNTOUCHED** |
| **Schema v2 Validation** | `ner/data/schema_v2/validation.jsonl` | `76c09ef50365c82fd576da7511bb49da3554e7cf72a1ca016171768df7a32f5e` | **UNTOUCHED** |
| **Schema v2 Test** | `ner/data/schema_v2/test.jsonl` | `2eaea9bc82839b973add6fc32f0fce14e2b6007f4d26e03c0376a0d1cca6b11e` | **UNTOUCHED** |

---

## 10. Automated Test Results

The automated test suite in [`ai-service-v2/tests/api/test_candidate_review_api.py`](file:///c:/Users/LENOVO/Desktop/project-phase/ai-service-v2/tests/api/test_candidate_review_api.py) executed 11 test cases covering all verification points:

```
collected 11 items

ai-service-v2/tests/api/test_candidate_review_api.py::test_candidate_loading PASSED [  9%]
ai-service-v2/tests/api/test_candidate_review_api.py::test_filtering_by_entity PASSED [ 18%]
ai-service-v2/tests/api/test_candidate_review_api.py::test_filtering_by_discovery_method PASSED [ 27%]
ai-service-v2/tests/api/test_candidate_review_api.py::test_filtering_by_confidence_range PASSED [ 36%]
ai-service-v2/tests/api/test_candidate_review_api.py::test_candidate_review_accepted_and_metadata PASSED [ 45%]
ai-service-v2/tests/api/test_candidate_review_api.py::test_candidate_review_rejected PASSED [ 54%]
ai-service-v2/tests/api/test_candidate_review_api.py::test_candidate_review_skipped PASSED [ 63%]
ai-service-v2/tests/api/test_candidate_review_api.py::test_deduplication_and_batch_propagation PASSED [ 72%]
ai-service-v2/tests/api/test_candidate_review_api.py::test_invalid_candidate_handling PASSED [ 81%]
ai-service-v2/tests/api/test_candidate_review_api.py::test_review_summary_endpoint PASSED [ 90%]
ai-service-v2/tests/api/test_candidate_review_api.py::test_existing_ner_gold_data_isolation PASSED [100%]

======================= 11 passed, 4 warnings in 0.83s =======================
```

---

## 11. Recommendations for Phase 5 (Dynamic NER Model Training)

With 156 validated pediatric mentions across `COOKING_METHOD`, `SUPPLEMENT`, and `DIET_PATTERN`, Phase 5 can proceed safely:
1. **Extend Training Dataset Separately**: Generate `ner/data/dynamic_v2/train.jsonl` by combining `ner/data/schema_v2/train.jsonl` with validated candidate spans from `ai-service-v2/datasets/validated_candidates.json`.
2. **Transition Entity Lifecycle**: Transition `COOKING_METHOD`, `SUPPLEMENT`, and `DIET_PATTERN` in the dynamic registry from `VALIDATED` to `TRAINING`.
3. **13-Entity Sequence Labeler**: Train the Structured Averaged Perceptron with 13 entity types (10 frozen + 3 dynamic).
4. **Anti-Forgetting Evaluation**: Evaluate on `ner/data/human_gold/human_gold.jsonl` to verify that existing entity performance (specifically `NUTRIENT` 74.73% F1 and overall 61.00% F1) experiences 0% regression.
