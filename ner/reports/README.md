# NutriBite NER — Phase-Wise Reports Index
**Repository:** `KidsNutriBite/NutriBite`  
**Location:** `ner/reports/`  
**Audit Status:** Fully verified through Phase 4.1 & Pre-Phase 10 Audit

This index provides a structured, chronologically ordered reference to all technical reports, benchmark summaries, and research audit findings across Phases 0 through 9.

---

## Chronological Phase Index

### Phase 0 & Phase 1 — Domain Schema Audit & Corpus Inventory
* [corpus_inventory.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/corpus_inventory.md) — 913-passage RAG corpus inventory, pediatric domain sources, and lexical token distributions.
* [current_schema_inventory.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/current_schema_inventory.md) — Initial 10-entity frozen schema definitions, gazetteer vocabularies, and clinical entity scopes.
* [phase1_entity_audit.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/phase1_entity_audit.md) — Quantitative entity audit, surface form frequencies, and distant annotation coverage.
* [selected_dynamic_entities.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/selected_dynamic_entities.md) — Formal selection criteria for expanding schema with dynamic entities.

### Phase 2 — Dynamic Entity Registry & Lifecycle Management
* [phase2_dynamic_entity_registry.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/phase2_dynamic_entity_registry.md) — Service architecture, CRUD API, and state transition lifecycle for dynamic clinical categories (`COOKING_METHOD`, `SUPPLEMENT`, `DIET_PATTERN`).

### Phase 3 — Multi-Method Dynamic Candidate Discovery
* [phase3_candidate_discovery.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/phase3_candidate_discovery.md) — Tri-tier candidate discovery engine combining exact seeds, rapidfuzz lexical matching, and dense E5 embeddings over 913 clinical guidelines (1,500 candidates discovered).

### Phase 4 — Human-in-the-Loop (HITL) Candidate Validation
* [phase4_human_validation_results.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/phase4_human_validation_results.md) — Pediatric nutritionist triage of discovered candidates, deduplication batch actions, and baseline acceptance statistics (281 reviewed, 156 accepted).
* [audit_results.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/audit_results.md) — Data leakage verification proving 0% train/test split leakage.

### Phase 4.1 — Candidate Review Enhancement & Research Metrics
* [phase4_1_candidate_review_enhancement.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/phase4_1_candidate_review_enhancement.md) — **New**: Annotation-effort timing instrumentation, 6-class structured rejection reason taxonomy, group-level deduplication analytics (56.94% effort reduction), and dense embedding boundary contamination root-cause analysis.

### Phase 5 — Dynamic NER Sequence Model (13-Entity Architecture)
* [phase5_dynamic_ner_training_results.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/phase5_dynamic_ner_training_results.md) — Integration of 156 clinician-accepted dynamic mentions into leak-free `dynamic_v1` dataset; 13-entity BIO sequence perceptron training.
* [phase5_experiment_results.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/phase5_experiment_results.md) — Detailed precision, recall, and F1 comparisons across frozen and dynamic classes.
* [phase5_reproducibility.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/phase5_reproducibility.md) — Step-by-step reproduction guide and artifact manifests.
* [PHASE5_SUMMARY.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/PHASE5_SUMMARY.md) — High-level executive synthesis of Phase 5 deliverables.

### Phase 6 — Few-Shot Active Domain Adaptation
* [phase6_few_shot_results.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/phase6_few_shot_results.md) — Few-shot learning curve evaluation (1-shot, 5-shot, 10-shot, 20-shot, full) for rapid clinical concept onboarding.
* [PHASE6_SUMMARY.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/PHASE6_SUMMARY.md) — Summary of few-shot sample efficiency and active selection curves.

### Phase 7 — Transformer & SpaCy Clinical Baselines
* [phase7_baseline_comparison.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/phase7_baseline_comparison.md) — Comparative benchmark contrasting Perceptron with transformer-based BioBERT, RoBERTa, and SpaCy biomedical pipelines.
* [PHASE7_SCHEMA_AUDIT.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/PHASE7_SCHEMA_AUDIT.md) — Cross-model schema compliance and boundary consistency report.

### Phase 8 — Continual NER & Catastrophic Forgetting Mitigation
* [phase8_continual_ner_results.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/phase8_continual_ner_results.md) — Sequential schema expansion experiments evaluating Experience Replay buffer mitigation of catastrophic forgetting.
* [PHASE8_RESEARCH_CONTRIBUTION.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/PHASE8_RESEARCH_CONTRIBUTION.md) — Formal academic framing of continual learning contributions in pediatric clinical NER.
* [PHASE8_SUMMARY.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/PHASE8_SUMMARY.md) — Executive summary of continual learning retention rates and old-entity ΔF1.

### Phase 9A — Human-Gold Evaluation & Clinical Stress Testing
* [human_gold_results.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/human_gold_results.md) — Independent evaluation against 150 hand-annotated pediatric gold sentences.
* [human_gold_statistics.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/human_gold_statistics.md) — Lexical overlap, token frequency, and seen vs. unseen entity distributions.
* [human_gold_error_analysis.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/human_gold_error_analysis.md) — Diagnostic taxonomy analyzing false positives, false negatives, and boundary shifts.
* [nutrient_challenge_results.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/nutrient_challenge_results.md) — 25-sentence clinical stress-test suite targeting complex biochemical and clinical nutrient expressions.

### Phase 9B — Multi-Tier Entity Grounding & Linking Cascade
* [phase9_entity_linking_results.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/phase9_entity_linking_results.md) — 5-tier cascading resolver (Exact -> Normalized -> Levenshtein -> Synonym -> Cosine) linking surface mentions to canonical IDs.
* [PHASE9_RESEARCH_FINDINGS.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/PHASE9_RESEARCH_FINDINGS.md) — Methodological findings on lexical disambiguation and seen/unseen linkability.
* [PHASE9_REPRODUCIBILITY.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/PHASE9_REPRODUCIBILITY.md) — Reproduction commands and checksum verification.

### Pre-Phase 10 — Research-Quality Audit
* [pre_phase10_research_audit.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/pre_phase10_research_audit.md) — Exhaustive system audit covering Phase 4 candidate scalability, dataset provenance, Phase 8 CFR formulations, Phase 9 linking benchmark validity, and SHA-256 data isolation.

### Phase 10 — Entity-Aware RAG Integration
* [phase10_entity_aware_rag_results.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/phase10_entity_aware_rag_results.md) — End-to-end integration of 13-entity Dynamic NER and Phase 9 Entity Linker into the NutriBite RAG retrieval engine. Evaluated on the fixed 150-query pediatric benchmark against the 913-passage clinical corpus (Recall@1-10, Precision@3-5, MRR@5-10, directional query impact, and domain breakdowns).

### Phase 10 v2 — Gated Entity-Aware RAG Integration
* [phase10_entity_aware_rag_v2_results.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/phase10_entity_aware_rag_v2_results.md) — Hierarchical query-type gating strategy resolving the v1 age-group over-focus regression. 3-system controlled ablation (Baseline vs. v1 Ungated vs. v2 Gated) demonstrating complete restoration of Recall@5 (79.33% $\to$ 86.00%), improved Recall@1 (67.33% $\to$ 69.33%), improved MRR@10 (0.7481 $\to$ 0.7576), and an 86.7% reduction in harmed queries (15 $\to$ 2).

### Phase 11A — Transformer NER Baseline
* [phase11a_transformer_baseline_results.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/phase11a_transformer_baseline_results.md) — Modern encoder-based Transformer token-classification baseline (`roberta-base`, 125M parameters) trained on the exact same 13-entity BIO scheme and held-out test split. 3-way controlled benchmark (Custom Dynamic Perceptron vs. spaCy Statistical NER vs. Transformer), evaluating Micro/Macro F1, seen vs. unseen generalization, and dynamically introduced clinical entities (`COOKING_METHOD`, `DIET_PATTERN`, `SUPPLEMENT`).

### Phase 11B — GLiNER Open-Vocabulary NER Baseline
* [gliner_baseline_v1.md](file:///c:/Users/LENOVO/Desktop/project-phase/ner/reports/gliner_baseline_v1.md) — Open-vocabulary zero-shot GLiNER baseline (`urchade/gliner_small-v2.1`) evaluated with natural language entity prompts across all 13 schema classes. 4-way controlled comparison (Custom Dynamic Perceptron vs. spaCy Statistical NER vs. RoBERTa vs. GLiNER) evaluating zero-shot clinical recognition, seen vs. unseen surface-form generalization, low-resource dynamic entity feasibility, and operational CPU throughput.

