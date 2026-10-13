# Pre-Phase 10 Research-Quality Audit Report
**NutriBite NER Framework (Phases 0–9)**  
**Audit Date:** October 1, 2026  
**Auditor:** Automated Pair Research Assistant  
**Status:** **CONDITIONALLY READY FOR PHASE 10**  
**Regression Test Status:** 34/34 PASSED (100%)  
**Dataset Integrity (SHA-256):** 8/8 VERIFIED (100%)

---

## 1. Executive Summary

This document provides a comprehensive research-quality audit of Phases 0 through 9 of the NutriBite Named Entity Recognition (NER) pipeline prior to commencing Phase 10. The audit inspects candidate review scalability, dataset provenance, continual learning catastrophic forgetting metrics, entity linking benchmarking validity, and dataset cryptographic integrity.

### Audit Verdict Summary
- **Overall Readiness:** **Conditionally Ready**. Core pipeline mechanics, models, and test suites are robust, reproducible, and internally consistent.
- **Issues Identified:**
  - **Medium Severity (2):**
    1. *Phase 8 Narrative Inversion:* Report text in `phase8_continual_ner_results.md` claims Catastrophic Forgetting Rate (CFR) was suppressed by 2.5x (3.73% vs 2.25%), whereas the benchmark log records Without-Replay at 2.25% and With-Replay at 3.73% for Step 2.
    2. *Phase 9 Self-Referential Gold Linking IDs:* The linking benchmark evaluation dataset (`gold_linked_eval.jsonl`) generated canonical IDs using `linker.link_entity()` during creation, meaning the 100% linking accuracy measures consistency against the heuristic pipeline rather than an independently annotated gold truth.
  - **Low Severity / Technical Observations (5):** Annotation effort tracking absent in Phase 4; 81.3% candidate backlog in Phase 4; dual naming collision of Phase 9; unseen linking subset size limited to 43 mentions; strict token containment in Phase 5 BIO alignment.
- **Regression Suite:** All 34 automated unit/regression tests passed in 144.16 seconds without error or failure.
- **Dataset Integrity:** All 8 frozen datasets in `ner/data/` match their expected SHA-256 manifests.

---

## 2. Phase 4 Candidate-Review Scalability Audit

### 2.1 Quantitative Candidate Breakdown
From `ner/reports/candidate_discovery_summary.md` and candidate registry tracking:
- **Total Raw Candidates Discovered:** 1,500 candidates (500 candidates per entity type across `FOOD`, `NUTRIENT`, and `HEALTH_BENEFIT`).
- **Unique Surface Forms:** 680 unique forms across discovery methods.
- **Status Breakdown:**
  - **Total Reviewed:** 281 (18.73% of raw pool)
  - **Accepted:** 156 (55.52% of reviewed candidates)
  - **Rejected:** 111 (39.50% of reviewed candidates)
  - **Skipped / Deferred:** 14 (4.98% of reviewed candidates)
  - **Pending Review (Backlog):** 1,219 (81.27% of total discovered)

### 2.2 Discovery Method Yield & Efficiency
| Method | Generated | Reviewed | Accepted | Rejected | Skipped | Acceptance Rate |
|---|---|---|---|---|---|---|
| Rule/Pattern Mining | 120 | 120 | 92 | 22 | 6 | **76.67%** |
| Frequency/N-gram | 230 | 120 | 61 | 55 | 4 | **50.83%** |
| Embedding/Similarity | 1,150 | 41 | 1 | 34 | 4 | **2.44%** |
| **Total** | **1,500** | **281** | **156** | **111** | **14** | **55.52% (of rev)** |

*Observation:* Embedding-based discovery yielded low precision (2.44% accepted) and constitutes the vast majority (1,109/1,219 = 91.0%) of the unreviewed backlog.

### 2.3 Group-Level / Duplicate Review Support
- **Support Status:** **Verified Supported**.
- In `ner/scripts/candidate_reviewer.py`, deduplication and batch review are natively implemented:
  - `group_by_surface_form=True` groups mentions across sources into unique canonical surface strings.
  - `apply_to_all_occurrences=True` enables propagating accept/reject decisions to all duplicate occurrences, preventing repetitive human triage.

### 2.4 Annotation-Effort Metrics
- **Metric Tracking Status:** **Absent**.
- Currently, the candidate review system records reviewer decision states (`accepted`, `rejected`, `skipped`) and timestamps, but does not capture:
  - Time elapsed per review item (seconds/candidate).
  - Inter-annotator agreement (IAA / Cohen's Kappa), as only single-annotator triage was supported.
  - Structured rejection reason taxonomies (e.g., polysemous ambiguity, out-of-domain, partial token split).

---

## 3. Training-Data Provenance Audit

### 3.1 Provenance Hierarchy: Silver vs. Gold
| Split / File | Mentions / Sentences | Generation Methodology | Provenance Tier | Intended Usage |
|---|---|---|---|---|
| `train.jsonl` | 2,500 sents / 6,842 spans | Automated dictionary & regex gazetteer matching | **Silver** | Primary pre-training / fine-tuning |
| `validation.jsonl` | 500 sents / 1,368 spans | Automated dictionary & regex gazetteer matching | **Silver** | Checkpoint tuning & validation |
| `test.jsonl` | 500 sents / 1,372 spans | Automated dictionary & regex gazetteer matching | **Silver** | Silver-standard benchmark baseline |
| `schema_v2/train.jsonl` | 2,800 sents / 7,914 spans | Automated synthesis + gazetteer schema expansion | **Silver** | Phase 5 dynamic adaptation |
| `schema_v2/validation.jsonl` | 550 sents / 1,540 spans | Automated synthesis + gazetteer schema expansion | **Silver** | Phase 5 checkpoint validation |
| `schema_v2/test.jsonl` | 550 sents / 1,548 spans | Automated synthesis + gazetteer schema expansion | **Silver** | Phase 5 schema_v2 evaluation |
| `human_gold/human_gold.jsonl` | 150 sents / 387 spans | Hand-annotated by domain expert with guidelines | **Gold (Human)** | Unbiased benchmark evaluation |
| `human_gold/nutrient_challenge.jsonl` | 25 sents / 63 spans | Hand-curated complex clinical & nutrient edge cases | **Gold (Human)** | Stress-testing challenge suite |
| `dynamic_v1/train.jsonl` | Variable | Silver auto-annotations + 156 human-reviewed candidates | **Silver + Validated** | Dynamic continual training |

### 3.2 BIO Training Data Generation Verification
- **Validation Engine:** `validate_bio_sequence()` in `ner/utils/annotation.py`.
- **Integrity Checks Conducted:**
  - Tokenization boundary alignment preserves exact character offsets `[start, end)`.
  - Illegal orphan `I-` tags (e.g., `O -> I-FOOD` without preceding `B-FOOD`) are strictly trapped and raise explicit `ValueError`.
  - Span overlap policy: When multiple gazetteer entries conflict on character offsets, the longest matching span is prioritized; overlapping sub-tokens are safely assigned to the primary span without producing conflicting BIO transitions.
- **Verification Verdict:** Passed. All generated BIO sequences across splits are syntactically and semantically valid.

---

## 4. Phase 8 Continual NER & Catastrophic Forgetting Audit

### 4.1 Catastrophic Forgetting Rate (CFR) Formulation
In `ner/scripts/continual_benchmark.py`:
$$\text{CFR}_{\text{step}} = \frac{1}{|E_{\text{old}}|} \sum_{e \in E_{\text{old}}} \max(0, F1_{\text{initial}}(e) - F1_{\text{current}}(e))$$
The metric calculates the mean degradation over previously learned entity types, non-negatively clipped at 0. This metric is mathematically sound and standard in continual learning literature.

### 4.2 Calculation Verification & Issue I-1 (Narrative Inversion)
Verification on raw data from `ner/models/continual_v1/continual_benchmark_results.json`:
- **Step 1 (Base Domain + Food Expansion):**
  - No Replay CFR: 0.00%
  - With Replay CFR: 0.00%
- **Step 2 (Nutrient & Bioactive Compounds Expansion):**
  - No Replay CFR: **2.25%**
  - With Replay CFR: **3.73%**
  - *Report Discrepancy:* `ner/reports/phase8_continual_ner_results.md` (line 29) states:
    > *"Catastrophic forgetting rate (CFR) was suppressed by 2.5x with replay buffer enabled (3.73% with replay vs 2.25% without replay on Step 2)."*
  - *Finding:* The numbers are accurately drawn from the log, but the narrative is inverted. Replay CFR (3.73%) is higher than non-replay CFR (2.25%) on Step 2. (This occurred because Step 2 with-replay slightly sacrificed initial entity precision while gaining higher macro-F1 overall).
  - *Status:* Tagged as **Issue I-1 (Medium)**.

### 4.3 Old-Entity $\Delta F1$ Calculations
All old-entity delta calculations reported in the Phase 8 summary were recomputed against raw step scores:
- **Step 1 With-Replay:** $\Delta F1 = +1.40\%$ (Retention verified)
- **Step 2 With-Replay:** $\Delta F1 = +0.88\%$ (Retention verified)
- **Step 3 With-Replay:** $\Delta F1 = +0.54\%$ (Retention verified)
All reported values match the underlying test artifacts exactly.

---

## 5. Phase 9 Entity Linking Audit

### 5.1 The 100% Linking Accuracy Scope & Issue I-2 (Circular Benchmark)
From `ner/models/entity_linking_v1/linking_evaluation_results.json`:
- **Total Mentions Evaluated:** 491
- **Attempted Links:** 486 (5 unlinked/ambiguous rejected by threshold)
- **Correct Links:** 486
- **Reported Accuracy:** $486 / 486 = 100.00\%$ (among attempted links)
- **Investigation of Dataset Creation (`ner/scripts/evaluate_entity_linking.py`):**
  - Inspection of `ner/data/entity_linking_v1/gold_linked_eval.jsonl` revealed that target canonical IDs were assigned during dataset synthesis by executing the heuristic `EntityLinker.link_entity()` method.
  - *Finding:* Because the evaluation dataset's ground-truth IDs were produced by the linker itself, the 100% accuracy score validates **internal deterministic consistency and schema conformance**, not an external, independently human-annotated gold standard.
  - *Status:* Tagged as **Issue I-2 (Medium)**.

### 5.2 Seen vs. Unseen Entity Partitioning
- **Seen Entity Mentions:** 448 (91.24% of mentions)
  - Linking Coverage: 98.88% (443 linked, 5 rejected)
  - Linking Accuracy: 100.00%
- **Unseen Entity Mentions:** 43 (8.76% of mentions)
  - Linking Coverage: 100.00% (43 linked, 0 rejected)
  - Linking Accuracy: 100.00%
- *Total Mentions:* $448 + 43 = 491$ (Exact partition match).
- *Observation:* The unseen evaluation slice is relatively small (43 mentions across 12 unique entities), representing a targeted smoke-test rather than a comprehensive statistical out-of-vocabulary evaluation.

### 5.3 Ambiguity & Method Partitioning
Mentions resolve across cascading resolution tiers:
| Linking Strategy | Count | Percentage |
|---|---|---|
| Exact Gazetteer Match | 342 | 69.65% |
| Normalized Lowercase Match | 134 | 27.29% |
| Levenshtein Fuzzy Match | 5 | 1.02% |
| Synonym Dictionary Match | 3 | 0.61% |
| Embedding Cosine Match | 2 | 0.41% |
| Ambiguous / Rejected Mentions | 5 | 1.02% |
| Unmatched / No Candidate | 0 | 0.00% |
| **Total** | **491** | **100.00%** |
The sum ($342 + 134 + 5 + 3 + 2 + 5 + 0 = 491$) confirms mathematical closure without unassigned entities.

---

## 6. Phase 0–9 Automated Regression Suite Execution

The full regression test suite was executed against the active codebase on Python 3.12.10:
```
pytest tests/ -v
```

### Test Results Breakdown
| Test Module | Tests Run | Passed | Failed | Execution Time |
|---|---|---|---|---|
| `tests/test_candidate_discovery.py` | 1 | 1 | 0 | 0.82s |
| `tests/test_dynamic_entity_registry.py` | 2 | 2 | 0 | 1.15s |
| `tests/test_phase5_dynamic_ner.py` | 6 | 6 | 0 | 12.40s |
| `tests/test_phase6_few_shot.py` | 6 | 6 | 0 | 14.85s |
| `tests/test_phase7_baselines.py` | 6 | 6 | 0 | 28.12s |
| `tests/test_phase8_continual_ner.py` | 5 | 5 | 0 | 45.30s |
| `tests/test_phase9_entity_linking.py` | 8 | 8 | 0 | 41.52s |
| **Total** | **34** | **34** | **0** | **144.16s** |

All 34 tests passed with zero failures, deprecation crashes, or assertion mismatches.

---

## 7. Frozen Dataset Cryptographic Integrity (SHA-256)

Dataset integrity was verified by computing SHA-256 hashes for all 8 frozen dataset artifacts against registered repository checksums:

| Dataset File | Computed SHA-256 Hash | Status |
|---|---|---|
| `ner/data/train.jsonl` | `f6c99c7160cb9db992f15e791b8d5420ee9b6ae68eeb678c18742ca2c8e31fc5` | **VERIFIED** |
| `ner/data/validation.jsonl` | `88c22754d9bce41be2973ebba35c2fb9d2a6a1aa5e4939b4ea4e930121114b0b` | **VERIFIED** |
| `ner/data/test.jsonl` | `a6b16d1ff5b8e9699fa2d89771ba6110f547c1f887b212f45ec7d6a5e1cf3a66` | **VERIFIED** |
| `ner/data/schema_v2/train.jsonl` | `2ea407c0eaeeea24d27164ffc9dc5e7ffec3d039274291880486c7530691e846` | **VERIFIED** |
| `ner/data/schema_v2/validation.jsonl` | `bf8350b91df1936e76cf0e32ef745be37a098c47dd3954dd0a0494cf5480749a` | **VERIFIED** |
| `ner/data/schema_v2/test.jsonl` | `84bb88319e71dc85243eb03a5ea79c7820bbdf99a19c636f883da59f71c4c92b` | **VERIFIED** |
| `ner/data/human_gold/human_gold.jsonl` | `ef31109dc0e8f3bf05b1a8d05a92cfb373cf55694ae9fbc2f60d65b75ff6ff1f` | **VERIFIED** |
| `ner/data/human_gold/nutrient_challenge.jsonl` | `c37b3401c43538408f654b0376ce57d07941ca49e6f364e5c8ae88b1397754f9` | **VERIFIED** |

All files are byte-for-byte identical with zero unauthorized modifications or tampering.

---

## 8. Consolidated Issues Table

| Issue ID | Phase | Summary | Severity | Recommended Remediation for Phase 10 |
|---|---|---|---|---|
| **I-1** | Phase 8 | CFR narrative claims 2.5x suppression (3.73% vs 2.25%), but With-Replay (3.73%) exceeded Without-Replay (2.25%) on Step 2. | **MEDIUM** | In Phase 10 reports and papers, correct narrative to describe Step 2 trade-off (macro-F1 gain at slight cost to step-local retention). |
| **I-2** | Phase 9 | Gold linking benchmark IDs were generated by calling the linker itself during creation; 100% accuracy reflects pipeline self-consistency. | **MEDIUM** | In Phase 10, construct an independently curated evaluation set (minimum 100 human-annotated entity-to-ID links). |
| **I-3** | Phase 4 | Annotation-effort metrics (triage duration, inter-annotator agreement, error categorizations) were not captured. | **LOW** | Add timestamp instrumentation and rejection reason taxonomy in active review tooling. |
| **I-4** | Phase 4 | 81.3% of candidate backlog (1,219 items) remains unreviewed, mostly low-precision embedding candidates (2.44% acceptance). | **LOW** | Apply higher cosine similarity threshold filters before presenting embedding candidates for review. |
| **I-5** | Phase 9 | Dual naming collision: Human-Gold NER and Entity Linking are both labeled "Phase 9" in certain report headings. | **LOW** | Standardize nomenclature: Phase 9A (Human-Gold NER) and Phase 9B (Entity Linking). |
| **I-6** | Phase 9 | The unseen entity linking evaluation subset is small ($N=43$ mentions across 12 entities). | **LOW** | Expand unseen out-of-vocabulary evaluation corpus to $\ge 200$ mentions during Phase 10. |
| **I-7** | Phase 5 | BIO token alignment relies on strict character containment; partial token overlaps are excluded silently. | **LOW** | Add fuzzy boundary reconciliation logging for edge cases in text tokenization. |

---

## 9. Phase 10 Readiness Assessment

| Readiness Category | Evaluation Status | Notes & Readiness Gate |
|---|---|---|
| **Regression Test Stability** | **PASS (100%)** | 34/34 tests pass cleanly. |
| **Data Integrity** | **PASS (100%)** | All 8 frozen datasets verified via SHA-256. |
| **Provenance Tracking** | **PASS** | Clear separation established between Silver and Human-Gold tiers. |
| **Algorithmic Correctness** | **PASS (with notes)** | Formulas for CFR, macro-F1, and linking methods verified; narrative fix noted for I-1. |
| **Entity Linking Robustness** | **CONDITIONAL** | Benchmark requires independent gold validation set (I-2) during Phase 10. |

### Final Verdict: CONDITIONALLY READY FOR PHASE 10
The NutriBite NER repository is in a rigorous, production-grade state. Proceeding to Phase 10 is approved subject to incorporating the documented reporting adjustments for Issues I-1 and I-2 in Phase 10 deliverables.
