# NutriBite Dynamic NER — Complete Technical Project Handoff

**Document Version:** 1.0  
**Created:** September 30, 2026  
**Purpose:** Full project handoff for continuing Dynamic NER implementation — Phase 3 onwards  
**Important:** This document is READ-ONLY. Do NOT modify any source files described here.

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Complete Directory Structure](#2-complete-directory-structure)
3. [NER Implementation](#3-ner-implementation)
4. [Current NER Schema](#4-current-ner-schema)
5. [NER Datasets](#5-ner-datasets)
6. [Current NER Results](#6-current-ner-results)
7. [Phase 1 Status](#7-phase-1-status)
8. [Phase 2 Status](#8-phase-2-status)
9. [Phase 3 Preparation](#9-phase-3-preparation)
10. [Recommended Phase 3 Integration Points](#10-recommended-phase-3-integration-points)
11. [API Structure](#11-api-structure)
12. [Database Structure](#12-database-structure)
13. [Dependencies](#13-dependencies)
14. [Environment / Run Commands](#14-environment--run-commands)
15. [Test Status](#15-test-status)
16. [Current Research Architecture](#16-current-research-architecture)
17. [Remaining Phases](#17-remaining-phases)
18. [Important Constraints / Do Not Break](#18-important-constraints--do-not-break)
19. [Exact Files to Read Before Phase 3](#19-exact-files-to-read-before-phase-3)
20. [Final Handoff Summary](#20-final-handoff-summary)

---

## 1. PROJECT OVERVIEW

### What NutriBite / NutriKids Does

NutriBite (also called NutriKids in some modules) is a **doctor-guided pediatric nutrition intelligence platform** built as a MERN + Python stack. It provides:

- AI-driven pediatric meal planning and nutrition recommendations for children aged 0–18.
- A clinical RAG (Retrieval-Augmented Generation) pipeline that retrieves evidence-based pediatric nutrition guidelines to answer parental and clinical queries.
- Entity-aware chatbot using extracted Named Entities to filter and route guidelines accurately.
- Integration with ICMR-NIN RDA 2020 / IFCT databases and WHO IYCF guidelines.

### What the Existing NER System Does

The NER system performs **domain-specific Named Entity Recognition** on pediatric nutrition text. It:

- Identifies 10 fine-grained entity types (NUTRIENT, FOOD, FOOD_GROUP, DIETARY_PROPERTY, FEEDING_METHOD, HEALTH_CONDITION, ALLERGEN, AGE_GROUP, MEAL_TYPE, GROWTH_METRIC) from clinical sentences.
- Uses a **Structured Averaged Sequence Perceptron** with BIO tagging and constrained transition decoding.
- Trained via **distant supervision** on a corpus of 913 RAG passages + 150 retrieval benchmark queries.
- Normalizes extracted entities to canonical database identifiers for downstream RAG retrieval.

### Current Research Objective

The research objective is to extend a static 10-entity NER schema to a **Dynamic NER system** that can:
1. Discover new entity types empirically from the RAG corpus.
2. Validate candidate entities through a lifecycle governance model.
3. Incorporate new entities into the NER model via few-shot learning without catastrophic forgetting.
4. Integrate entity-aware NER outputs into the RAG pipeline.

### Current Dynamic NER Objective

The **Dynamic Entity Registry** allows schema evolution beyond the frozen 10 entities. The selected dynamic entities (COOKING_METHOD, SUPPLEMENT, DIET_PATTERN) are governed through a lifecycle state machine (PROPOSED → REVIEW → VALIDATED → TRAINING → EVALUATED → ACTIVE → DEPRECATED) and a candidate discovery engine mines the RAG corpus for training examples.

### What Has Already Been Completed

- ✅ **NER Pipeline** (Phases 1–10 of original NER research): Full corpus annotation, training, evaluation, entity linking, human-gold benchmarking, RAG impact analysis.
- ✅ **Schema v2 (10 frozen entities)**: Defined, trained, and evaluated.
- ✅ **Phase 1 — Dynamic Entity Audit**: 10 candidate dynamic entities empirically examined; 3 selected, 7 rejected.
- ✅ **Phase 2 — Dynamic Entity Registry**: Full FastAPI CRUD + MongoDB/JSON lifecycle registry implemented and tested.
- ✅ **Phase 3 — Candidate Discovery Engine**: 3-tier pipeline (exact + fuzzy + embedding) implemented, run on RAG corpus, results stored.
- ✅ **Phase 3 Reports**: 1,500 unique candidates discovered and documented.

### What Remains to Be Implemented

- ❌ **Phase 4 — Human Validation**: Human-in-the-loop annotation review of discovered candidates.
- ❌ **Phase 5 — Dynamic NER Training**: Incorporating COOKING_METHOD, SUPPLEMENT, DIET_PATTERN training data into NER model.
- ❌ **Phase 6 — Few-Shot Learning**: Learning from limited seed examples for new entity types.
- ❌ **Phase 7 — spaCy + Transformer Baselines**: External model comparison.
- ❌ **Phase 8 — Continual NER / Anti-Forgetting**: Incremental learning without degrading existing 10-entity performance.
- ❌ **Phase 9 — Entity Linking** (dynamic): Linking new entity types to canonical registries.
- ❌ **Phase 10 — Relation Extraction**: Extracting NUTRIENT-FOOD, FOOD-CONDITION relationships.
- ❌ **Phase 11 — NLP → RAG Integration**: Wiring NER outputs into the RAG retrieval pipeline.
- ❌ **Phase 12 — Final Evaluation**: End-to-end evaluation of the full Dynamic NER system.

---

## 2. COMPLETE DIRECTORY STRUCTURE

```
project-phase/
│
├── ner/                              # All NER research code and data
│   ├── config/
│   │   ├── schema_v2.yaml            # FROZEN 10-entity schema definition (YAML)
│   │   └── training_config.yaml      # Training hyperparameters and paths
│   ├── data/
│   │   ├── train.jsonl               # Silver train split (1,223 sentences, v1 7-class)
│   │   ├── validation.jsonl          # Silver validation split (262 sentences, v1)
│   │   ├── test.jsonl                # Silver test split (263 sentences, v1)
│   │   ├── weak_annotations.jsonl    # Full weakly annotated corpus (1,748 sentences)
│   │   ├── manual_validation.jsonl   # Manually validated sentences
│   │   ├── entity_normalization.json # Entity-to-canonical-ID normalization map
│   │   ├── gazetteers/               # 7 domain gazetteers (JSON)
│   │   │   ├── age_groups_gazetteer.json
│   │   │   ├── allergens_gazetteer.json
│   │   │   ├── conditions_gazetteer.json
│   │   │   ├── foods_gazetteer.json
│   │   │   ├── growth_metrics_gazetteer.json
│   │   │   ├── meal_types_gazetteer.json
│   │   │   └── nutrients_gazetteer.json
│   │   ├── human_gold/               # Human-annotated gold benchmark
│   │   │   ├── human_gold.jsonl      # 150 manually annotated sentences (FROZEN)
│   │   │   ├── human_gold_candidates.jsonl
│   │   │   ├── human_gold_template.jsonl
│   │   │   ├── nutrient_challenge.jsonl  # 25 adversarial NUTRIENT sentences
│   │   │   ├── annotation_guidelines.md
│   │   │   ├── FINAL_ANNOTATION_GUIDELINES.md
│   │   │   ├── annotation_tool.html
│   │   │   └── README.md
│   │   └── schema_v2/                # Schema v2 (10-class) splits
│   │       ├── train.jsonl           # Schema v2 train (used by 11_evaluate_human_gold.py)
│   │       ├── validation.jsonl      # Schema v2 validation
│   │       └── test.jsonl            # Schema v2 test
│   ├── evaluation/
│   │   ├── ambiguity_tests.jsonl     # Polysemy resolution test suite
│   │   ├── multiword_tests.jsonl     # Multi-word span extraction test suite
│   │   └── domain_ner_predictions.jsonl  # Latest model predictions (output)
│   ├── models/
│   │   ├── nutribite_ner/            # v1 model directory (7-class)
│   │   │   └── model_metadata.json   # Model name, architecture, label set, feature count
│   │   └── nutribite_ner_v2/         # v2 model directory (10-class)
│   │       └── model_metadata.json   # Full per-class metrics for all 10 entities
│   ├── reports/                      # All research reports (58 files)
│   │   ├── FINAL_ENTITY_SCHEMA.md    # Full schema specification
│   │   ├── human_gold_evaluation_results.json  # Machine-readable gold eval results
│   │   ├── human_gold_results.md     # Human-readable gold eval report
│   │   ├── training_summary.json     # Silver test set results
│   │   ├── training_summary.md       # Readable training summary
│   │   ├── phase1_entity_audit.md    # Phase 1 dynamic entity audit
│   │   ├── phase1_entity_audit.csv   # Machine-readable audit table
│   │   ├── phase2_dynamic_entity_registry.md
│   │   ├── phase3_candidate_discovery.md
│   │   ├── selected_dynamic_entities.md
│   │   ├── candidate_discovery_results.json  # Full Phase 3 results
│   │   ├── candidate_discovery_results.csv
│   │   └── ... (many more evaluation and error analysis reports)
│   ├── scripts/                      # All pipeline scripts
│   │   ├── 01_build_inventory.js     # Corpus inventory
│   │   ├── 02_build_gazetteers.js    # Gazetteer induction
│   │   ├── 03_extract_and_annotate.js # Weak annotation engine
│   │   ├── 04_validate_and_split.js  # Train/val/test splitting
│   │   ├── 05_train_and_evaluate.py  # Main training + silver evaluation
│   │   ├── 07_entity_linker.js       # Entity linking to canonical IDs
│   │   ├── 08_rag_enricher.js        # RAG enrichment
│   │   ├── 09_quality_control.js     # QC pipeline
│   │   ├── 10_audit_results.py       # Full audit reporting
│   │   ├── 11_evaluate_human_gold.py # Human-gold + adversarial evaluation
│   │   ├── 12_validate_human_gold.py # Human-gold dataset validator
│   │   ├── 14_schema_expansion_audit.py
│   │   ├── 15_build_normalization_resource.py
│   │   ├── 16_schema_v2_and_ablation.py  # Schema v2 training + ablation
│   │   ├── 17_evaluate_rag_impact.py
│   │   ├── 18_write_human_gold_annotations.py
│   │   ├── audit_phase1_dynamic_entities.py  # Phase 1 audit engine
│   │   ├── generate_human_gold_candidates.py
│   │   ├── run_candidate_discovery.py  # Phase 3 CLI runner
│   │   ├── phase10_error_audit.py
│   │   ├── phase10_generalization_experiments.py
│   │   └── phase10_nutrient_and_seed_study.py
│   ├── requirements.txt              # NER Python dependencies
│   ├── run_pipeline.py               # Unified pipeline runner
│   └── README.md                     # NER system documentation
│
├── ai-service-v2/                    # FastAPI Python AI microservice (PRIMARY)
│   ├── app/
│   │   ├── main.py                   # FastAPI application entrypoint
│   │   ├── api/
│   │   │   ├── router.py             # Central API router
│   │   │   └── v1/
│   │   │       ├── chat.py           # Chat endpoint
│   │   │       ├── dynamic_entities.py  # Dynamic Entity Registry REST API
│   │   │       ├── health.py         # Health check endpoint
│   │   │       └── websocket.py      # WebSocket endpoint
│   │   ├── core/
│   │   │   ├── config.py             # Pydantic settings (env vars, thresholds)
│   │   │   ├── exceptions.py         # Custom exception handlers
│   │   │   └── security.py           # JWT auth scaffolding
│   │   ├── db/
│   │   │   ├── connection.py         # JSON dataset loaders + save utilities
│   │   │   └── dynamic_entity_repo.py # MongoDB + JSON fallback repository
│   │   ├── middleware/               # Logging, rate-limit, JWT middleware
│   │   ├── models/
│   │   │   └── model_router.py       # Gemini model router
│   │   ├── planner/                  # Meal planner logic
│   │   ├── prompts/                  # LLM prompt templates
│   │   ├── rag/
│   │   │   └── hybrid_retriever.py   # FAISS + BM25 + CrossEncoder RAG engine
│   │   ├── schemas/
│   │   │   ├── chat_response.py
│   │   │   ├── dynamic_entity.py     # All Pydantic schemas for dynamic entities
│   │   │   └── health.py
│   │   ├── services/
│   │   │   ├── candidate_discovery_service.py  # Phase 3 discovery engine
│   │   │   ├── chat_orchestrator.py
│   │   │   ├── dynamic_entity_service.py       # Lifecycle business service
│   │   │   └── tracing_service.py
│   │   └── utils/
│   │       └── logger.py
│   ├── datasets/                     # JSON dataset files
│   │   ├── rag_data.json             # Primary RAG corpus (913 passages)
│   │   ├── dynamic_entities.json     # JSON fallback for Dynamic Entity Registry
│   │   ├── foods.json / food.json / food_db.json
│   │   ├── conditions.json
│   │   ├── allergies.json
│   │   └── goals.json
│   ├── evaluation/
│   │   ├── retrieval_dataset.json    # 150-query retrieval benchmark
│   │   ├── retrieval_benchmark.py
│   │   ├── retrieval_failures.json
│   │   └── ...
│   ├── tests/
│   │   ├── conftest.py
│   │   └── api/
│   │       ├── test_dynamic_entities.py      # 6 Phase 2 tests
│   │       ├── test_candidate_discovery_api.py  # 7 Phase 3 tests
│   │       └── test_health.py
│   ├── vector_store/
│   │   ├── faiss_index.bin           # Prebuilt FAISS dense index (846 KB)
│   │   └── metadata.pkl              # Document metadata pickle for FAISS
│   ├── .env.example
│   ├── pytest.ini
│   ├── requirements.txt
│   └── Dockerfile
│
├── ai-service/                       # Legacy FastAPI service (v1)
│   ├── main.py                       # Older single-file FastAPI implementation
│   ├── app/
│   │   ├── rag/                      # Legacy RAG components
│   │   ├── api/, db/, models/, utils/
│   ├── datasets/                     # Older dataset files (rag_data.json, etc.)
│   └── requirements.txt
│
├── backend/                          # Node.js/Express MERN backend
│   ├── server.js / app.js            # Express server entry points
│   ├── models/                       # Mongoose models (including DynamicEntity)
│   ├── routes/                       # Express API routes
│   ├── controllers/
│   ├── services/
│   └── package.json
│
├── frontend/                         # React/Vite frontend application
├── tests/                            # Root-level integration tests
│   ├── test_dynamic_entity_registry.py  # Root-level Phase 2 integration test
│   ├── test_candidate_discovery.py      # Root-level Phase 3 smoke test
│   ├── benchmarks/
│   ├── evaluators/
│   ├── fixtures/
│   │   └── eval_fixtures.json
│   └── redteam/
├── docs/                             # Documentation
│   ├── dynamic_entity_registry.md
│   ├── project_spec.md / project_specification.md
│   ├── architecture.md
│   ├── CHECKLIST.md
│   └── ... (25 doc files)
│
├── phase1_entity_audit.md            # Root-level copy of Phase 1 audit
├── phase1_entity_audit.csv           # Root-level copy of audit CSV
├── phase3_candidate_discovery.md     # Root-level copy of Phase 3 report
├── selected_dynamic_entities.md      # Root-level copy of dynamic entity selection
├── candidate_discovery_results.json  # Root-level copy of Phase 3 results
├── candidate_discovery_results.csv   # Root-level copy of Phase 3 CSV
├── run.bat / run.sh                  # Project run scripts
├── start.bat / start.sh              # Alternative start scripts
├── docker-compose.yml                # Docker compose for full stack
└── package.json                      # Root npm scripts (runs MERN)
```

---

## 3. NER IMPLEMENTATION

### NER Model / Algorithm

**Model Name:** `nutribite_fast_averaged_sequence_perceptron` (v1) / `nutribite_sequence_perceptron_v2` (v2)  
**Architecture:** Structured Averaged Sequence Perceptron with valid BIO Transition Decoding  
**Algorithm Type:** Linear sequence labeler (no neural network, no pretrained transformers)  
**Decoding:** Greedy left-to-right with hard BIO constraint enforcement (illegal `I-X` transitions penalized by −100.0)

---

### Training Pipeline

**Script:** `ner/scripts/05_train_and_evaluate.py`

**Steps:**
1. Load `train.jsonl`, `validation.jsonl`, `test.jsonl`
2. Instantiate `FastAveragedSequencePerceptron(labels=labels, epochs=8)`
3. For each epoch: shuffle training data, iterate token-by-token, score all label candidates, predict best label, update weights if wrong (Perceptron update rule)
4. After all epochs: finalize averaged weights (prevent recency bias)
5. Save `model_metadata.json` to `ner/models/nutribite_ner/`
6. Evaluate on test set using `evaluate_dataset()`
7. Save predictions to `ner/evaluation/domain_ner_predictions.jsonl`
8. Run ambiguity and multi-word test suites
9. Write `training_summary.json` and `training_summary.md` to `ner/reports/`

---

### Inference Pipeline

**Function:** `FastAveragedSequencePerceptron.predict(tokens: List[str]) → List[str]`

1. Initialize `prev_tag = "O"`
2. For each token `i`: call `extract_features(tokens, i, prev_tag)`
3. Score all labels by summing feature weights
4. Penalize illegal `I-X` transitions (−100.0) if `prev_tag` does not match `B-X` or `I-X`
5. Select `argmax` label; update `prev_tag`
6. Return predicted BIO tag sequence

---

### BIO Tagging Implementation

**Scheme:** IOB2 (B = beginning, I = inside, O = outside)

**Label Set (v1 — 7 entities, 15 labels):**
```
O, B-FOOD, I-FOOD, B-NUTRIENT, I-NUTRIENT, B-HEALTH_CONDITION, I-HEALTH_CONDITION,
B-ALLERGEN, I-ALLERGEN, B-AGE_GROUP, I-AGE_GROUP, B-MEAL_TYPE, I-MEAL_TYPE,
B-GROWTH_METRIC, I-GROWTH_METRIC
```

**Label Set (v2 — 10 entities, 21 labels):**  
Adds: `B-FOOD_GROUP, I-FOOD_GROUP, B-DIETARY_PROPERTY, I-DIETARY_PROPERTY, B-FEEDING_METHOD, I-FEEDING_METHOD`

**Defined in:** `ner/config/training_config.yaml`, `ner/models/nutribite_ner_v2/model_metadata.json`

---

### Feature Extraction

**Function:** `extract_features(tokens: List[str], i: int, prev_tag: str) → List[str]`  
**Defined in:** `ner/scripts/05_train_and_evaluate.py` (also duplicated identically in `11_evaluate_human_gold.py`)

**Features extracted:**
| Feature | Description |
|---------|-------------|
| `BIAS` | Constant bias feature |
| `w={word_lower}` | Lowercased current word form |
| `is_title={bool}` | Whether token is title-cased |
| `is_upper={bool}` | Whether token is all-uppercase |
| `is_digit={bool}` | Whether token is all-digits |
| `has_hyphen={bool}` | Whether token contains a hyphen |
| `len={min(len,12)}` | Token length (capped at 12) |
| `pref2={prefix_2}` | 2-character prefix |
| `pref3={prefix_3}` | 3-character prefix |
| `suff2={suffix_2}` | 2-character suffix |
| `suff3={suffix_3}` | 3-character suffix |
| `prev_tag={prev}` | Previous predicted tag |
| `prev_w={prev_word}` | Previous word (if not BOS) |
| `bigram_prev={prev}_{curr}` | Left bigram |
| `next_w={next_word}` | Next word (if not EOS) |
| `bigram_next={curr}_{next}` | Right bigram |
| `BOS` / `EOS` | Begin/End of sequence markers |

---

### Transition Decoding

**Constraint enforcement in `predict()`:**
```python
if lbl.startswith("I-"):
    needed = lbl[2:]
    if prev_tag != f"B-{needed}" and prev_tag != f"I-{needed}":
        sc -= 100.0   # Hard penalty for illegal transition
```
This enforces that `I-X` can only follow `B-X` or `I-X`.

---

### Span Extraction

**Function:** `extract_spans_from_bio(bio_tags: List[str]) → List[Tuple[start, end, label]]`  
Returns list of `(start_index, end_index, entity_type)` tuples from a BIO tag sequence.

---

### Model Serialization / Loading

**Limitation:** The Averaged Perceptron weights are NOT persisted as a binary file. Only `model_metadata.json` is written.  
**Consequence:** The model must be **retrained by re-running** `ner/scripts/05_train_and_evaluate.py` to get live weights in memory. There is no `model.load()` API.

**Training data locations:**
- Primary: `ner/data/train.jsonl`, `ner/data/validation.jsonl`, `ner/data/test.jsonl`
- Schema v2: `ner/data/schema_v2/train.jsonl`, `ner/data/schema_v2/validation.jsonl`, `ner/data/schema_v2/test.jsonl`

---

### Evaluation Scripts

| Script | Purpose |
|--------|---------|
| `ner/scripts/05_train_and_evaluate.py` | Silver test set evaluation (train + evaluate in one script) |
| `ner/scripts/10_audit_results.py` | Detailed audit of evaluation results |
| `ner/scripts/11_evaluate_human_gold.py` | Human-gold + adversarial + silver v2 evaluation |
| `ner/scripts/12_validate_human_gold.py` | Human-gold dataset integrity validation |
| `ner/scripts/17_evaluate_rag_impact.py` | Evaluates NER impact on RAG pipeline |
| `ner/scripts/phase10_error_audit.py` | Error taxonomy analysis |
| `ner/scripts/phase10_generalization_experiments.py` | Seen vs unseen entity generalization |

---

### Key File Details

**FILE:** `ner/scripts/05_train_and_evaluate.py`  
**PURPOSE:** Train the Averaged Sequence Perceptron on silver data and evaluate on test set, ambiguity suite, and multi-word suite.  
**IMPORTANT CLASSES:** `FastAveragedSequencePerceptron`  
**IMPORTANT FUNCTIONS:** `extract_features()`, `predict()`, `fit()`, `extract_spans_from_bio()`, `evaluate_dataset()`, `evaluate_baseline()`  
**INPUTS:** `ner/data/train.jsonl`, `ner/data/validation.jsonl`, `ner/data/test.jsonl`, `ner/evaluation/ambiguity_tests.jsonl`, `ner/evaluation/multiword_tests.jsonl`  
**OUTPUTS:** `ner/models/nutribite_ner/model_metadata.json`, `ner/evaluation/domain_ner_predictions.jsonl`, `ner/reports/training_summary.json`, `ner/reports/training_summary.md`, `ner/reports/ambiguity_analysis.md`  
**DEPENDENCIES:** Python stdlib only (`json`, `math`, `random`, `collections`)

---

**FILE:** `ner/scripts/11_evaluate_human_gold.py`  
**PURPOSE:** Run the independent evaluation against human-gold, adversarial challenge, and silver v2 test — the most rigorous evaluation.  
**IMPORTANT CLASSES:** `FastAveragedSequencePerceptron` (re-implemented inline), imports `validate_human_gold` from script 12  
**IMPORTANT FUNCTIONS:** `extract_features()`, `extract_spans_from_bio()`, `evaluate_exact_span()`, seen/unseen partitioning  
**INPUTS:** `ner/data/schema_v2/train.jsonl`, `ner/data/schema_v2/test.jsonl`, `ner/data/human_gold/human_gold.jsonl`, `ner/data/human_gold/nutrient_challenge.jsonl`  
**OUTPUTS:** `ner/reports/human_gold_evaluation_results.json`, `ner/reports/human_gold_results.md`, error analysis markdown files  
**DEPENDENCIES:** Python stdlib, `ner/scripts/12_validate_human_gold.py`

---

**FILE:** `ner/scripts/audit_phase1_dynamic_entities.py`  
**PURPOSE:** Phase 1 corpus audit engine — scans RAG corpus + retrieval queries + weak annotations for candidate dynamic entity mentions.  
**IMPORTANT FUNCTIONS:** `candidate_vocabularies` (dict of candidate names + keyword terms), mention counting, frequency analysis  
**INPUTS:** `ai-service-v2/datasets/rag_data.json`, `ai-service-v2/evaluation/retrieval_dataset.json`, `ner/data/weak_annotations.jsonl`  
**OUTPUTS:** `phase1_entity_audit.csv`, `phase1_entity_audit.md`, `selected_dynamic_entities.md`  
**DEPENDENCIES:** Python stdlib only

---

**FILE:** `ner/scripts/run_candidate_discovery.py`  
**PURPOSE:** CLI runner for Phase 3 candidate discovery — calls `CandidateDiscoveryEngine.run_discovery_pipeline()` and writes full result files.  
**IMPORTANT FUNCTIONS:** `run_candidate_discovery()`  
**INPUTS:** RAG corpus (via `ai-service-v2/datasets/rag_data.json`), dynamic entity registry  
**OUTPUTS:** `candidate_discovery_results.json`, `candidate_discovery_results.csv`, `ner/reports/phase3_candidate_discovery.md`  
**DEPENDENCIES:** `ai-service-v2` module path, `CandidateDiscoveryEngine`

---

**FILE:** `ner/config/schema_v2.yaml`  
**PURPOSE:** Authoritative frozen 10-entity schema definition with precedence hierarchy, examples, canonical sources.  
**IMPORTANT CONFIGURATION VALUES:**
- `schema_version: "2.0"`
- `date_frozen: "2026-09-19"`
- `num_entity_classes: 10`
- `flagship_entity: "NUTRIENT"`
- Full `precedence_hierarchy` list (10 entities in priority order)

---

**FILE:** `ner/config/training_config.yaml`  
**PURPOSE:** Training hyperparameters and file paths.  
**IMPORTANT CONFIGURATION VALUES:**
- `model_type: "crf_token_classifier"` (note: actual implementation is Averaged Perceptron)
- `epochs: 10` (actual implementation uses 8)
- `learning_rate: 0.001`
- `batch_size: 16`
- `seed: 42`
- `train_data: "ner/data/train.jsonl"`
- `output_model_dir: "ner/models/nutribite_ner"`

---

## 4. CURRENT NER SCHEMA

**Schema Version:** 2.0  
**Frozen Date:** September 19, 2026  
**Defined In:** `ner/config/schema_v2.yaml`, `ner/reports/FINAL_ENTITY_SCHEMA.md`

### BIO Precedence Hierarchy (highest to lowest priority):
`HEALTH_CONDITION > ALLERGEN > FEEDING_METHOD > GROWTH_METRIC > NUTRIENT > DIETARY_PROPERTY > FOOD_GROUP > FOOD > MEAL_TYPE > AGE_GROUP`

### Entity Specifications

| # | Entity Name | BIO Labels | Definition | Examples | Canonical Source |
|---|-------------|-----------|------------|---------|-----------------|
| 1 | NUTRIENT | B-NUTRIENT / I-NUTRIENT | Biochemical nutrients, vitamins, minerals, fatty acids, fiber | iron, calcium, vitamin D, zinc, protein, omega-3 fatty acids | ICMR-NIN RDA 2020 / IFCT |
| 2 | FOOD | B-FOOD / I-FOOD | Specific edible foods, dishes, beverages, individual preparations | ragi porridge, moong dal khichdi, curd, paneer, apple, idli | IFCT 2017 / foods.json |
| 3 | FOOD_GROUP | B-FOOD_GROUP / I-FOOD_GROUP | Broad collective dietary categories (new in v2) | pulses, whole grains, cereals, millets, green leafy vegetables, dairy products | WHO IYCF 8 Food Groups / ICMR |
| 4 | DIETARY_PROPERTY | B-DIETARY_PROPERTY / I-DIETARY_PROPERTY | Physical/nutritional/culinary traits (new in v2) | energy-dense, nutrient-rich, easily digestible, fortified, semi-solid | Clinical Dietary Properties Taxonomy |
| 5 | FEEDING_METHOD | B-FEEDING_METHOD / I-FEEDING_METHOD | Pediatric IYCF feeding practices (new in v2) | exclusive breastfeeding, complementary feeding, spoon feeding, responsive feeding | WHO IYCF Core Indicators |
| 6 | HEALTH_CONDITION | B-HEALTH_CONDITION / I-HEALTH_CONDITION | Pediatric diseases, deficiency syndromes, malnutrition states | iron deficiency anemia, severe acute malnutrition, stunting, wasting, diarrhea | conditions.json / ICD-11 Pediatric |
| 7 | ALLERGEN | B-ALLERGEN / I-ALLERGEN | Antigenic dietary triggers causing hypersensitivity | cow's milk protein allergy, peanut allergy, egg white allergy, soy allergy | allergies.json / Top 8 Pediatric Allergens |
| 8 | AGE_GROUP | B-AGE_GROUP / I-AGE_GROUP | Pediatric age cohorts and developmental stages | infants, toddlers, preschool children, 6 to 12 months, first 1000 days | ICMR Age Categorization |
| 9 | MEAL_TYPE | B-MEAL_TYPE / I-MEAL_TYPE | Diurnal meal occasions and feeding schedule slots | breakfast, lunch, dinner, morning snack, evening snack | Diurnal Meal Schedule |
| 10 | GROWTH_METRIC | B-GROWTH_METRIC / I-GROWTH_METRIC | Anthropometric indices and growth velocity metrics | height, weight, length-for-age, weight-for-height, MUAC, BMI | WHO Child Growth Standards |

### Training/Evaluation Data Sources Per Entity

| Entity | Primary Training Data | Gazetteer | Human-Gold Support |
|--------|----------------------|-----------|-------------------|
| NUTRIENT | `ner/data/train.jsonl` (172 spans) | `nutrients_gazetteer.json` | 87 spans |
| FOOD | `ner/data/train.jsonl` (dominant) | `foods_gazetteer.json` | 76 spans |
| FOOD_GROUP | `ner/data/schema_v2/train.jsonl` | (within foods_gazetteer) | 58 spans |
| DIETARY_PROPERTY | `ner/data/schema_v2/train.jsonl` | (inline) | 10 spans |
| FEEDING_METHOD | `ner/data/schema_v2/train.jsonl` | (inline) | 18 spans |
| HEALTH_CONDITION | `ner/data/train.jsonl` (46 spans) | `conditions_gazetteer.json` | 42 spans |
| ALLERGEN | `ner/data/train.jsonl` (5 spans) | `allergens_gazetteer.json` | 9 spans |
| AGE_GROUP | `ner/data/train.jsonl` (80 spans) | `age_groups_gazetteer.json` | 48 spans |
| MEAL_TYPE | `ner/data/train.jsonl` (7 spans) | `meal_types_gazetteer.json` | 22 spans |
| GROWTH_METRIC | `ner/data/train.jsonl` (8 spans) | `growth_metrics_gazetteer.json` | 17 spans |

---

## 5. NER DATASETS

### Primary NER Datasets

| Dataset | Path | Format | Records | Purpose | Split Type | Must Stay Unchanged |
|---------|------|--------|---------|---------|-----------|-------------------|
| Weak Annotations | `ner/data/weak_annotations.jsonl` | JSONL | 1,748 sentences | Full weakly-annotated corpus | Source corpus | YES — FROZEN |
| Train Split (v1) | `ner/data/train.jsonl` | JSONL | 1,223 sentences | v1 7-class NER training | Train | YES — FROZEN |
| Validation Split (v1) | `ner/data/validation.jsonl` | JSONL | 262 sentences | v1 model selection | Validation | YES — FROZEN |
| Test Split (v1) | `ner/data/test.jsonl` | JSONL | 263 sentences | v1 silver evaluation | Test | YES — FROZEN |
| Schema v2 Train | `ner/data/schema_v2/train.jsonl` | JSONL | ~1,223 sentences | v2 10-class training | Train | YES — FROZEN |
| Schema v2 Validation | `ner/data/schema_v2/validation.jsonl` | JSONL | ~262 sentences | v2 model selection | Validation | YES — FROZEN |
| Schema v2 Test | `ner/data/schema_v2/test.jsonl` | JSONL | ~263 sentences | v2 silver evaluation | Test | YES — FROZEN |
| Manual Validation | `ner/data/manual_validation.jsonl` | JSONL | UNKNOWN (283 KB) | Manually validated subset | Silver+ | YES — FROZEN |
| Entity Normalization | `ner/data/entity_normalization.json` | JSON | UNKNOWN (208 KB) | Entity-to-canonical ID map | Reference | YES — FROZEN |

### Human-Gold Datasets

| Dataset | Path | Format | Records | Purpose | Must Stay Unchanged |
|---------|------|--------|---------|---------|-------------------|
| Human Gold | `ner/data/human_gold/human_gold.jsonl` | JSONL | 150 sentences, 387 spans | Independent evaluation benchmark | YES — STRICTLY FROZEN |
| Nutrient Challenge | `ner/data/human_gold/nutrient_challenge.jsonl` | JSONL | 25 sentences, 63 spans | Adversarial NUTRIENT test suite | YES — STRICTLY FROZEN |
| Gold Candidates | `ner/data/human_gold/human_gold_candidates.jsonl` | JSONL | UNKNOWN | Candidate pool for annotation | YES — FROZEN |
| Gold Template | `ner/data/human_gold/human_gold_template.jsonl` | JSONL | UNKNOWN | Annotation template | YES — FROZEN |

### RAG Corpus

| Dataset | Path | Format | Records | Purpose | Must Stay Unchanged |
|---------|------|--------|---------|---------|-------------------|
| RAG Data (v2) | `ai-service-v2/datasets/rag_data.json` | JSON array | 913 passages | Primary clinical guideline corpus for RAG and candidate discovery | YES — RAG corpus |
| RAG Data (v1) | `ai-service/datasets/rag_data.json` | JSON array | Smaller set | Legacy RAG corpus | Reference |
| Retrieval Dataset | `ai-service-v2/evaluation/retrieval_dataset.json` | JSON array | 150 queries | Benchmark queries for retrieval and candidate discovery | YES |

### Entity Reference Datasets

| Dataset | Path | Format | Purpose |
|---------|------|--------|---------|
| Foods | `ai-service-v2/datasets/foods.json` (also food.json, food_db.json) | JSON | Food entity canonical database (175 foods) |
| Conditions | `ai-service-v2/datasets/conditions.json` | JSON | Condition entity canonical database (172 conditions) |
| Allergies | `ai-service-v2/datasets/allergies.json` | JSON | Allergen entity database (17 allergens) |
| Goals | `ai-service-v2/datasets/goals.json` | JSON | Nutrition goals database (148 goals) |
| Dynamic Entities | `ai-service-v2/datasets/dynamic_entities.json` | JSON | JSON fallback for Dynamic Entity Registry (3 entities) |

### Gazetteer Datasets

| File | Path | Purpose |
|------|------|---------|
| Nutrients Gazetteer | `ner/data/gazetteers/nutrients_gazetteer.json` | NUTRIENT canonical surface forms |
| Foods Gazetteer | `ner/data/gazetteers/foods_gazetteer.json` | FOOD canonical surface forms |
| Conditions Gazetteer | `ner/data/gazetteers/conditions_gazetteer.json` | HEALTH_CONDITION surface forms |
| Allergens Gazetteer | `ner/data/gazetteers/allergens_gazetteer.json` | ALLERGEN surface forms |
| Age Groups Gazetteer | `ner/data/gazetteers/age_groups_gazetteer.json` | AGE_GROUP surface forms |
| Meal Types Gazetteer | `ner/data/gazetteers/meal_types_gazetteer.json` | MEAL_TYPE surface forms |
| Growth Metrics Gazetteer | `ner/data/gazetteers/growth_metrics_gazetteer.json` | GROWTH_METRIC surface forms |

### Phase 3 Candidate Discovery Results

| Dataset | Path | Format | Records | Purpose |
|---------|------|--------|---------|---------|
| Candidates JSON | `ner/reports/candidate_discovery_results.json` | JSON | 1,500 candidates | Phase 3 full results |
| Candidates CSV | `ner/reports/candidate_discovery_results.csv` | CSV | 1,500 candidates | Phase 3 machine-readable |
| Root Candidates JSON | `candidate_discovery_results.json` | JSON | 1,500 candidates | Root-level copy |
| Root Candidates CSV | `candidate_discovery_results.csv` | CSV | 1,500 candidates | Root-level copy |

**Loader/Parser:** `CandidateDiscoveryEngine.load_corpus_sentences()` in `ai-service-v2/app/services/candidate_discovery_service.py` loads `rag_data.json` via `load_json_file()` from `ai-service-v2/app/db/connection.py`

### Evaluation Fixtures

| Dataset | Path | Format | Records | Purpose |
|---------|------|--------|---------|---------|
| Eval Fixtures | `tests/fixtures/eval_fixtures.json` | JSON | 9 clinical scenarios | RAG evaluation test cases |
| Ambiguity Tests | `ner/evaluation/ambiguity_tests.jsonl` | JSONL | UNKNOWN | Polysemy resolution test suite |
| Multi-word Tests | `ner/evaluation/multiword_tests.jsonl` | JSONL | UNKNOWN | Multi-word entity extraction test |
| Retrieval Failures | `ai-service-v2/evaluation/retrieval_failures.json` | JSON | UNKNOWN | Known RAG retrieval failure cases |

---

## 6. CURRENT NER RESULTS

### Silver Test Set Results (v1 — 7-class model, `ner/data/test.jsonl`, 263 sentences)

**Source:** `ner/reports/training_summary.json`

| Metric | Value |
|--------|-------|
| **Micro Precision** | **95.86%** |
| **Micro Recall** | **94.34%** |
| **Micro F1** | **95.10%** |
| **Macro F1** | **86.94%** |
| Total Gold Spans | 442 |
| True Positives | 417 |
| False Positives | 18 |
| False Negatives | 25 |

**Per-Entity (Silver v1):**

| Entity | Precision | Recall | F1 | Support |
|--------|-----------|--------|----|---------|
| FOOD | 95.73% | 91.06% | 93.33% | 123 |
| **NUTRIENT (Flagship)** | **95.56%** | **98.85%** | **97.18%** | **174** |
| HEALTH_CONDITION | 93.02% | 86.96% | 89.89% | 46 |
| ALLERGEN | 66.67% | 40.00% | 50.00% | 5 |
| AGE_GROUP | 100.00% | 96.43% | 98.18% | 84 |
| MEAL_TYPE | 100.00% | 100.00% | 100.00% | 8 |
| GROWTH_METRIC | 66.67% | 100.00% | 80.00% | 2 |

**Baseline General NER Micro F1:** 14.20% (Recall: 7.69%)  
**Absolute Performance Gain:** +80.90% Micro F1

### Silver Test Set Results (v2 — 10-class model)

**Source:** `ner/reports/human_gold_evaluation_results.json` (field: `silver_test_metrics`)

| Metric | Value |
|--------|-------|
| **Micro Precision** | **94.68%** |
| **Micro Recall** | **91.83%** |
| **Micro F1** | **93.23%** |
| **Macro F1** | **82.76%** |
| NUTRIENT F1 | 92.40% |

**Source also:** `ner/models/nutribite_ner_v2/model_metadata.json`  
(Same metrics as above with per-class breakdown — FOOD 90.45, NUTRIENT 92.08, HEALTH_CONDITION 92.31, ALLERGEN 50.00, AGE_GROUP 98.75, MEAL_TYPE 92.31, GROWTH_METRIC 42.86, FOOD_GROUP 99.10, DIETARY_PROPERTY 92.86, FEEDING_METHOD 100.00)

### Human-Gold Evaluation Results (v2 — 10-class model, 150 sentences, 387 spans)

**Source:** `ner/reports/human_gold_evaluation_results.json` (field: `human_gold_metrics`)

| Metric | Value |
|--------|-------|
| **Micro Precision** | **63.84%** |
| **Micro Recall** | **58.40%** |
| **Micro F1** | **61.00%** |
| **Macro F1** | **47.80%** |
| Total Gold Spans | 387 |
| True Positives | 226 |
| False Positives | 128 |
| False Negatives | 161 |

**Per-Entity (Human-Gold):**

| Entity | Precision | Recall | F1 | Support |
|--------|-----------|--------|----|---------|
| FOOD | 58.00% | 38.16% | 46.03% | 76 |
| **NUTRIENT** | **71.58%** | **78.16%** | **74.73%** | **87** |
| HEALTH_CONDITION | 28.30% | 35.71% | 31.58% | 42 |
| ALLERGEN | 16.67% | 33.33% | 22.22% | 9 |
| AGE_GROUP | 76.92% | 83.33% | 80.00% | 48 |
| MEAL_TYPE | 93.75% | 68.18% | 78.95% | 22 |
| GROWTH_METRIC | 50.00% | 47.06% | 48.48% | 17 |
| FOOD_GROUP | 90.38% | 81.03% | 85.45% | 58 |
| DIETARY_PROPERTY | 0.00% | 0.00% | 0.00% | 10 |
| FEEDING_METHOD | 100.00% | 5.56% | 10.53% | 18 |

### Adversarial Challenge Results (25 sentences, 63 spans)

**Source:** `ner/reports/human_gold_evaluation_results.json` (field: `challenge_metrics`)

| Metric | Value |
|--------|-------|
| **Micro Precision** | **52.38%** |
| **Micro Recall** | **34.92%** |
| **Micro F1** | **41.90%** |
| Support | 63 spans |

### Seen vs Unseen Entity Generalization

**Source:** `ner/reports/human_gold_evaluation_results.json` (field: `generalization_metrics`)

| Partition | Precision | Recall | F1 | Support |
|-----------|-----------|--------|----|---------|
| All Seen Entities | 64.66% | 94.54% | **76.79%** | 238 |
| All Unseen Entities | 16.67% | 0.67% | **1.29%** | 149 |
| NUTRIENT Seen | 72.34% | 98.55% | **83.44%** | 69 |
| NUTRIENT Unseen | 0.00% | 0.00% | **0.00%** | 18 |

### NUTRIENT Performance Summary

| Benchmark | F1 |
|-----------|-----|
| Silver v1 | 97.18% |
| Silver v2 | 92.40% |
| Adversarial Challenge | 41.90% |
| Human-Gold | 74.73% |

### Error Taxonomy (Human-Gold)

| Error Type | Count |
|-----------|-------|
| Boundary errors | 41 |
| Entity-type errors | 22 |
| Unseen entity errors | 97 |
| Synonym errors | 0 |
| Ambiguity errors | 7 |
| Multi-word errors | 78 |
| Nested/overlap errors | 0 |
| New-schema errors | 35 |

---

## 7. PHASE 1 STATUS

**Status: ✅ COMPLETE**

### What Phase 1 Did

Phase 1 performed an **empirical corpus audit** of the NutriBite RAG knowledge base for candidate dynamic NER entity classes.

**Audit Script:** `ner/scripts/audit_phase1_dynamic_entities.py`

**Data Sources Examined:**
- 913 RAG clinical knowledge passages (`ai-service-v2/datasets/rag_data.json`)
- 150 user retrieval benchmark queries (`ai-service-v2/evaluation/retrieval_dataset.json`)
- 1,748 weakly annotated sentences (`ner/data/weak_annotations.jsonl`)
- **Total sentences:** 1,898

**Candidate Entities Examined (10 total):**

| Candidate Entity | Mentions | Sentences | Decision |
|----------------|---------|-----------|---------|
| COOKING_METHOD | 207 | 141 (7.43%) | **RECOMMENDED (Top Tier, Rank 1)** |
| SUPPLEMENT | 31 | 27 (1.42%) | **RECOMMENDED (Top Tier, Rank 2)** |
| DIET_PATTERN | 17 | 17 (0.90%) | **RECOMMENDED (Alternative Candidate, Rank 3)** |
| DEFICIENCY | 62 | 56 (2.95%) | **REJECTED** — Redundant with HEALTH_CONDITION & NUTRIENT |
| PORTION | 76 | 69 (3.64%) | **REJECTED** — Syntactic modifier, better handled by regex |
| SYMPTOM | 82 | 72 (3.79%) | **REJECTED** — Subsumed by HEALTH_CONDITION |
| NUTRITION_GOAL | 25 | 25 (1.32%) | **REJECTED** — Clause-level spans, boundary instability |
| DIETARY_RESTRICTION | 50 | 46 (2.42%) | **REJECTED** — Overlap with ALLERGEN & DIETARY_PROPERTY |
| RECOMMENDATION | 26 | 24 (1.26%) | **REJECTED** — Ambiguity with guidelines and methods |
| ANTHROPOMETRIC_MEASURE | 37 | 29 (1.53%) | **REJECTED** — 100% redundant with GROWTH_METRIC |

### Selected Dynamic Entities

1. **COOKING_METHOD** — Thermal, mechanical, or biochemical food preparation methods
2. **SUPPLEMENT** — Clinical pharmaceutical micronutrient preparations
3. **DIET_PATTERN** — Systemic dietary models and nutritional paradigms

### Output Files

- `phase1_entity_audit.csv` (root + `ner/reports/`)
- `phase1_entity_audit.md` (root + `ner/reports/`)
- `selected_dynamic_entities.md` (root + `ner/reports/`)

---

## 8. PHASE 2 STATUS

**Status: ✅ COMPLETE — 100% Test Coverage Verified**

### What Phase 2 Implemented

Phase 2 built the **Dynamic Entity Registry** as a full FastAPI microservice component.

### DynamicEntity Model (Pydantic Schemas)

**FILE:** `ai-service-v2/app/schemas/dynamic_entity.py`

**CLASSES:**

| Class | Purpose |
|-------|---------|
| `EntityLifecycleStatus` | Enum: PROPOSED, REVIEW, VALIDATED, TRAINING, EVALUATED, ACTIVE, DEPRECATED, REJECTED |
| `SeedExample` | Individual seed training example with text, surface_span, char offsets, source_context, clinical_notes |
| `LifecycleHistoryEntry` | Audit trail entry: from_status, to_status, changed_by, reason, timestamp |
| `DynamicEntityBase` | Core entity model: name, display_name, category, description, aliases, seed_examples, schema_version, status, precedence_rank, downstream_rag_use, metadata |
| `DynamicEntityCreate` | Create request schema |
| `DynamicEntityUpdate` | Partial update schema |
| `DynamicEntityLifecycleUpdate` | Lifecycle transition request: target_status, changed_by, reason, force |
| `DynamicEntityResponse` | Full entity response including id, created_at, updated_at, lifecycle_history |
| `DynamicEntityListResponse` | Paginated list response: total, entities, schema_version, active_count, pending_review_count |
| `DynamicEntitySeedResponse` | Seed defaults response |
| `DiscoveryMethod` | Enum: EXACT_MATCH, FUZZY_MATCH, EMBEDDING_SIMILARITY |
| `CandidateStatus` | Enum: DISCOVERED, PENDING_REVIEW, ACCEPTED, REJECTED |
| `DiscoveryThresholds` | Configurable discovery parameters |
| `DynamicCandidate` | Individual discovered candidate mention |
| `DiscoverySummaryResponse` | Phase 3 discovery pipeline result |

**DEPENDENCIES:** `pydantic`, `re`, `datetime`

---

**FILE:** `ai-service-v2/app/db/dynamic_entity_repo.py`

**CLASS:** `DynamicEntityRepository`

**FUNCTIONS:**

| Function | Purpose |
|----------|---------|
| `__init__()` | Initializes MongoDB connection; falls back to JSON if MongoDB unavailable |
| `_init_mongo()` | Connects to MongoDB at `settings.MONGO_URI`, creates `dynamic_entities` collection with indexes |
| `_load_fallback()` | Reads `datasets/dynamic_entities.json` |
| `_save_fallback()` | Writes `datasets/dynamic_entities.json` |
| `get_by_name(name)` | Find entity by uppercase name |
| `get_by_id_or_name(identifier)` | Find by name or MongoDB ObjectId |
| `list_entities(status, category, schema_version, search)` | Filtered list with fallback |
| `create(entity_data)` | Insert with duplicate check |
| `update(name, update_fields)` | Partial update |
| `delete(name)` | Remove entity |

**MongoDB Collection:** `dynamic_entities`  
**MongoDB Indexes:** `name` (unique), `status`  
**JSON Fallback Path:** `ai-service-v2/datasets/dynamic_entities.json`  
**Global Instance:** `dynamic_entity_repo = DynamicEntityRepository()`

---

**FILE:** `ai-service-v2/app/services/dynamic_entity_service.py`

**CLASS:** `DynamicEntityService`

**KEY CONSTANT — Frozen 10-Entity Collision Guard:**
```python
FROZEN_10_ENTITIES = {
    "NUTRIENT", "FOOD", "FOOD_GROUP", "DIETARY_PROPERTY", "FEEDING_METHOD",
    "HEALTH_CONDITION", "ALLERGEN", "AGE_GROUP", "MEAL_TYPE", "GROWTH_METRIC"
}
```

**LIFECYCLE TRANSITIONS:**
```
PROPOSED → REVIEW, REJECTED
REVIEW → VALIDATED, PROPOSED, REJECTED
VALIDATED → TRAINING, REVIEW, REJECTED
TRAINING → EVALUATED, VALIDATED, REJECTED
EVALUATED → ACTIVE, TRAINING, REJECTED
ACTIVE → DEPRECATED, REVIEW
DEPRECATED → REVIEW, ACTIVE
REJECTED → PROPOSED
```

**FUNCTIONS:**

| Function | Purpose |
|----------|---------|
| `create_entity(payload)` | Validates name collision with frozen 10 entities; rejects duplicates |
| `get_entity(identifier)` | Fetch by name or ID |
| `list_entities(status, category, schema_version, search)` | Filtered listing |
| `update_entity(identifier, payload)` | Update non-frozen attributes |
| `transition_lifecycle(identifier, payload)` | Enforces state machine; records history |
| `delete_entity(identifier)` | Remove from registry |
| `seed_phase1_defaults()` | Seeds COOKING_METHOD, SUPPLEMENT, DIET_PATTERN (idempotent) |

**Global Instance:** `dynamic_entity_service = DynamicEntityService()`

---

**FILE:** `ai-service-v2/app/api/v1/dynamic_entities.py`

**Router prefix:** `/entities`  
**Tags:** `["Dynamic Entity Registry"]`

**DEPENDENCIES:** All schema classes from `dynamic_entity.py`, `dynamic_entity_service`, `candidate_discovery_engine`

---

### API Router

**FILE:** `ai-service-v2/app/api/router.py`  
All routers included at `/api/v1`: `health`, `websocket`, `chat`, `dynamic_entities`

---

### CURRENT LIFECYCLE STATUS OF THE THREE DYNAMIC ENTITIES

**Source:** `ai-service-v2/datasets/dynamic_entities.json` (JSON fallback file — actual persisted state)

| Entity | Status (Actual) | Created At |
|--------|----------------|------------|
| **COOKING_METHOD** | **ACTIVE** | 2026-09-29 10:48:27 |
| **SUPPLEMENT** | **ACTIVE** | 2026-09-29 10:48:27 |
| **DIET_PATTERN** | **VALIDATED** | 2026-09-29 10:48:27 |

> **Note:** This is confirmed from the actual JSON file contents, not from seed code comments or documentation.

---

### How Frozen 10 Entities Are Protected from Collisions

In `dynamic_entity_service.py`, `create_entity()` checks:
```python
if name in FROZEN_10_ENTITIES:
    raise ValueError(
        f"Cannot register '{name}' as dynamic entity: '{name}' is already a frozen core entity in the 10-Entity Schema v2.0."
    )
```
This raises HTTP 400 Bad Request. Tested in `test_frozen_10_entity_collision_prevention()` in `tests/api/test_dynamic_entities.py`.

---

### Phase 2 Tests

| Test File | Tests | Status |
|-----------|-------|--------|
| `ai-service-v2/tests/api/test_dynamic_entities.py` | 6 tests | **6/6 PASSED** |
| `tests/test_dynamic_entity_registry.py` | 2 tests | **2/2 PASSED** |

---

### Phase 2 Documentation

- `docs/dynamic_entity_registry.md`
- `ner/reports/phase2_dynamic_entity_registry.md`

---

### Phase 2 Seed Data

- **File:** `ai-service-v2/datasets/dynamic_entities.json`
- **Contents:** COOKING_METHOD (ACTIVE), SUPPLEMENT (ACTIVE), DIET_PATTERN (VALIDATED)
- **How seeded:** `POST /api/v1/entities/seed-defaults` calls `dynamic_entity_service.seed_phase1_defaults()` — idempotent

---

## 9. PHASE 3 PREPARATION

> **Note on Phase 3 Status:** The `CandidateDiscoveryEngine` is fully implemented and has been run. Results (1,500 candidates) are stored. What remains is Phase 4 (human validation of those candidates). The Phase 3 code is complete.

### A. RAG Corpus Loader

**File:** `ai-service-v2/app/services/candidate_discovery_service.py`  
**Function:** `CandidateDiscoveryEngine.load_corpus_sentences() → List[Dict[str, str]]`  
**Currently used to:** Load RAG passages as `{"source_document": ..., "context": ...}` dicts for candidate discovery.  
Loads from `rag_data.json` (via `connection.load_json_file`) and `evaluation/retrieval_dataset.json`.

### B. RAG Corpus Files

| File | Path | Records | Used For |
|------|------|---------|---------|
| Primary RAG corpus | `ai-service-v2/datasets/rag_data.json` | 913 passages | Corpus for discovery |
| Retrieval benchmark | `ai-service-v2/evaluation/retrieval_dataset.json` | 150 queries | Query-side corpus |

### C. Existing Embedding Model / Utilities

**Model:** `intfloat/e5-small-v2` (SentenceTransformer)  
**Configured In:** `ai-service-v2/app/core/config.py`  
```python
EMBEDDING_MODEL_NAME: str = "intfloat/e5-small-v2"
```
**Used In:** `ProductionHybridRetriever.init_models()` in `ai-service-v2/app/rag/hybrid_retriever.py`

### D. Sentence Transformer Usage

**RAG System (`hybrid_retriever.py`):**
- `SentenceTransformer("intfloat/e5-small-v2")` — bi-encoder for dense retrieval
- Prefixes: `"passage: "` for documents, `"query: "` for queries
- Used in `retrieve_vector()`, `build_or_load_indices()`

**Candidate Discovery (`candidate_discovery_service.py`):**
- `CandidateDiscoveryEngine._encode(texts, prefix)` — uses `"query:"` and `"passage:"` prefixes
- Attempts to reuse the live `ProductionHybridRetriever` instance before loading its own copy

### E. Existing Vector / FAISS Utilities

**File:** `ai-service-v2/app/rag/hybrid_retriever.py`  
**Class:** `ProductionHybridRetriever`  
**FAISS Index:** `ai-service-v2/vector_store/faiss_index.bin` (846 KB prebuilt)  
**Metadata:** `ai-service-v2/vector_store/metadata.pkl` (124 KB)  
**Index Type:** `faiss.IndexFlatIP` (inner product = cosine similarity when normalized)  
**Singleton:** `get_hybrid_retriever()` / `_hybrid_retriever_instance`

### F. Existing Text Normalization Utilities

**File:** `ai-service-v2/app/rag/hybrid_retriever.py`  
**Functions:**
- `normalize_query(text: str) → str` — lowercase, remove punctuation, strip whitespace
- `tokenize(text: str) → List[str]` — calls `normalize_query().split()`

### G. Existing Fuzzy Matching Utilities

**File:** `ai-service-v2/app/services/candidate_discovery_service.py`  
**Library:** `rapidfuzz` (with `difflib.SequenceMatcher` fallback)  
**Implementation:** `CandidateDiscoveryEngine.discover_fuzzy_matches()` uses:
- `fuzz.token_sort_ratio(span_lower, term)`
- `fuzz.ratio(span_lower, term)`
- `fuzz.partial_ratio(span_lower, term)` (for multi-word spans)
- Threshold: 80% by default (`DISCOVERY_FUZZY_THRESHOLD`)

### H. Existing Gazetteer / Entity Matching Utilities

**Gazetteer Files:** `ner/data/gazetteers/*.json` (7 files)  
**In NER Annotation Pipeline:** `ner/scripts/02_build_gazetteers.js`, `ner/scripts/03_extract_and_annotate.js`  
**In Discovery Engine:** Aliases and seed_examples from registry entries serve as the gazetteer for exact/fuzzy matching in `discover_exact_matches()`

### I. Existing MongoDB Access

**File:** `ai-service-v2/app/db/connection.py`  
**Functions:** `load_json_file(filename)`, `save_json_file(filename, data)`, `get_all_foods()`, `get_all_conditions()`, etc.  
**MongoDB connection:** `ai-service-v2/app/db/dynamic_entity_repo.py` — `DynamicEntityRepository._init_mongo()`  
**MongoDB URI:** `mongodb://127.0.0.1:27017/nutrikid` (default in `config.py`)  
**MongoDB DB Name:** `nutrikid`  
**Fallback:** All operations fall back to `datasets/dynamic_entities.json` if MongoDB is unavailable

### J. Existing Configuration / Environment Variables

**File:** `ai-service-v2/app/core/config.py`  
**Class:** `Settings(BaseSettings)` — reads from `.env`

| Variable | Default Value | Purpose |
|----------|--------------|---------|
| `PROJECT_NAME` | "NutriBite AI Microservice V2" | App name |
| `ENVIRONMENT` | "development" | Runtime environment |
| `API_V1_STR` | "/api/v1" | API prefix |
| `JWT_SECRET_KEY` | "default_secret_key_change_me_in_production" | JWT signing |
| `RATE_LIMIT_PER_MINUTE` | 60 | Rate limiting |
| `GEMINI_API_KEY` | None | Google Gemini API key |
| `MONGO_URI` | "mongodb://127.0.0.1:27017/nutrikid" | MongoDB connection string |
| `MONGO_DB_NAME` | "nutrikid" | MongoDB database name |
| `EMBEDDING_MODEL_NAME` | "intfloat/e5-small-v2" | Sentence Transformer model |
| `DISCOVERY_EXACT_THRESHOLD` | 1.0 | Exact match threshold |
| `DISCOVERY_FUZZY_THRESHOLD` | 0.80 | Fuzzy match threshold |
| `DISCOVERY_EMBEDDING_THRESHOLD` | 0.70 | Dense embedding threshold |
| `DISCOVERY_SENTENCE_THRESHOLD` | 0.55 | Sentence-level E5 gate |
| `DISCOVERY_MAX_CANDIDATES_PER_ENTITY` | 500 | Cap per entity |
| `DISCOVERY_MIN_NGRAM` | 1 | Min n-gram window |
| `DISCOVERY_MAX_NGRAM` | 4 | Max n-gram window |

**Env file location:** `ai-service-v2/.env` (DO NOT EXPOSE — contains secrets)  
**Env example:** `ai-service-v2/.env.example`

---

## 10. RECOMMENDED PHASE 3 INTEGRATION POINTS

> **Note:** Phase 3 Candidate Discovery Engine is already fully implemented. These integration points are documented for Phase 4+ work that extends from the Phase 3 results.

### Best Existing Module to Reuse for Corpus Loading

**`CandidateDiscoveryEngine.load_corpus_sentences()`** in `ai-service-v2/app/services/candidate_discovery_service.py`  
Already handles loading `rag_data.json` + `retrieval_dataset.json`, splitting into sentence-level dicts.

### Best Existing Embedding Utility to Reuse

**`CandidateDiscoveryEngine._encode(texts, prefix)`** — wraps `SentenceTransformer` with `query:`/`passage:` E5 prefixes and handles normalization. Attempts to reuse the live `ProductionHybridRetriever` singleton before loading a fresh model.

### Best Location for Future Candidate Review / Phase 4 Service

Create a new service file: `ai-service-v2/app/services/candidate_review_service.py`  
Register it through the existing router pattern in `ai-service-v2/app/api/router.py`.  
New router would live at: `ai-service-v2/app/api/v1/candidate_review.py`

### Best Location for Candidate Result Storage

**For human-review accepted training examples:**  
A **new** file such as `ai-service-v2/datasets/validated_candidates.json` (NOT to be confused with the frozen NER files).  
The `save_json_file()` helper in `connection.py` can be used.  
The `CANDIDATE_STORE_FILE = "dynamic_candidates.json"` already exists in `candidate_discovery_service.py`.

### Best Location for Phase 4 Tests

`ai-service-v2/tests/api/test_candidate_review_api.py` — following the established naming convention.

### Best Location for Phase 4+ Reports

`ner/reports/phase4_human_validation_results.md` — following the established naming convention.

---

## 11. API STRUCTURE

### FastAPI Application (ai-service-v2)

**Base URL:** `http://localhost:8000`  
**API Prefix:** `/api/v1`  
**Docs URL:** `/docs`  
**OpenAPI JSON:** `/api/v1/openapi.json`

### Health Endpoints

| Method | Path | File | Function | Purpose |
|--------|------|------|----------|---------|
| GET | `/api/v1/health` | `app/api/v1/health.py` | `health_check()` | Health check |

### Chat / WebSocket Endpoints

| Method | Path | File | Purpose |
|--------|------|------|---------|
| POST | `/api/v1/chat` | `app/api/v1/chat.py` | RAG-powered chat |
| WS | `/api/v1/ws` | `app/api/v1/websocket.py` | WebSocket streaming |

### Dynamic Entity Registry Endpoints

| Method | Path | File | Function | Request | Response | Purpose |
|--------|------|------|----------|---------|---------|---------|
| POST | `/api/v1/entities` | `dynamic_entities.py` | `create_dynamic_entity()` | `DynamicEntityCreate` | `DynamicEntityResponse` (201) | Register new dynamic entity |
| GET | `/api/v1/entities` | `dynamic_entities.py` | `list_dynamic_entities()` | Query params: status, category, schema_version, search | `DynamicEntityListResponse` | List all entities with filters |
| POST | `/api/v1/entities/seed-defaults` | `dynamic_entities.py` | `seed_default_entities()` | (none) | `DynamicEntitySeedResponse` | Seed Phase 1 defaults (COOKING_METHOD, SUPPLEMENT, DIET_PATTERN) |
| POST | `/api/v1/entities/discover` | `dynamic_entities.py` | `discover_candidates()` | Body: `DiscoveryThresholds` (optional), Query: entities, persist | `DiscoverySummaryResponse` | Trigger Phase 3 candidate discovery |
| GET | `/api/v1/entities/{entity_name_or_id}` | `dynamic_entities.py` | `get_dynamic_entity()` | Path param | `DynamicEntityResponse` | Get entity by name or UUID |
| PUT | `/api/v1/entities/{entity_name_or_id}` | `dynamic_entities.py` | `update_dynamic_entity()` | `DynamicEntityUpdate` | `DynamicEntityResponse` | Update entity attributes |
| PATCH | `/api/v1/entities/{entity_name_or_id}/lifecycle` | `dynamic_entities.py` | `transition_entity_lifecycle()` | `DynamicEntityLifecycleUpdate` | `DynamicEntityResponse` | Transition lifecycle state |
| DELETE | `/api/v1/entities/{entity_name_or_id}` | `dynamic_entities.py` | `delete_dynamic_entity()` | Path param | 204 No Content | Delete entity |

### Middleware Stack (outer to inner)

1. `CORSMiddleware` — allow all origins (configurable)
2. `RateLimitMiddleware` — 60 requests/minute default
3. `RequestLoggingMiddleware` — logs latency and request ID
4. `JWTAuthMiddleware` — JWT auth scaffolding

---

## 12. DATABASE STRUCTURE

### MongoDB

**URI:** `mongodb://127.0.0.1:27017/nutrikid`  
**Database:** `nutrikid`  
**Connection File:** `ai-service-v2/app/db/connection.py`  
**Repository File:** `ai-service-v2/app/db/dynamic_entity_repo.py`

#### `dynamic_entities` Collection

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | MongoDB document ID |
| `name` | String | Unique uppercase entity name (e.g., "COOKING_METHOD") |
| `display_name` | String | Human-readable label |
| `category` | String | Domain classification |
| `description` | String | Clinical/semantic definition |
| `aliases` | Array[String] | Synonymous surface forms |
| `seed_examples` | Array[Object] | Seed training examples (text, surface_span, start_char, end_char, source_context, clinical_notes) |
| `schema_version` | String | e.g., "2.1.0" |
| `status` | String | EntityLifecycleStatus value |
| `precedence_rank` | Integer | Priority rank (lower = higher priority) |
| `downstream_rag_use` | String | RAG utility description |
| `metadata` | Object | Arbitrary audit metrics, phase1_mentions, etc. |
| `lifecycle_history` | Array[Object] | History entries (from_status, to_status, changed_by, reason, timestamp) |
| `created_at` | DateTime | Creation timestamp |
| `updated_at` | DateTime | Last update timestamp |
| `id` | String | UUID string copy (for JSON fallback compatibility) |

**Indexes:**
- `name` — unique index
- `status` — non-unique index

**JSON Fallback:** `ai-service-v2/datasets/dynamic_entities.json` (active when MongoDB unavailable)

### Node.js / Express Backend (MongoDB via Mongoose)

**Connection file:** `backend/config/` (UNKNOWN exact file — not inspected in detail)  
**DynamicEntity Mongoose Model:** `backend/models/DynamicEntity.model.js` (referenced in Phase 2 report, not read in detail)  
**Other Mongoose Models:** Located in `backend/models/` (user, child profiles, nutrition logs, etc.)

---

## 13. DEPENDENCIES

### NLP (NER System)

| Package | Version (from requirements.txt) | Purpose |
|---------|--------------------------------|---------|
| numpy | >=1.26.0 | Array operations in evaluation |
| scikit-learn | >=1.4.0 | Metrics, utilities |
| seqeval | >=1.2.2 | Sequence labeling evaluation |
| pyyaml | >=6.0.1 | YAML config parsing |

### Embeddings / ML (NER requirements.txt)

| Package | Version | Purpose |
|---------|---------|---------|
| torch | >=2.2.0 | Tensor operations (for future transformer models) |
| transformers | >=4.40.0 | Hugging Face transformers (for future work) |

### Embeddings / ML (ai-service-v2 — installed separately, NOT in requirements.txt)

| Package | Version | Purpose |
|---------|---------|---------|
| sentence-transformers | NOT SPECIFIED in requirements.txt | `intfloat/e5-small-v2` for RAG + discovery |
| faiss-cpu | NOT SPECIFIED | FAISS vector index |
| rank-bm25 | NOT SPECIFIED | BM25 lexical retrieval |
| rapidfuzz | NOT SPECIFIED | Fuzzy matching in discovery |

> **Warning:** `sentence-transformers`, `faiss-cpu`, `rank-bm25`, and `rapidfuzz` are used in the code with graceful import fallbacks but are NOT listed in `ai-service-v2/requirements.txt`. They must be installed separately.

### FastAPI (ai-service-v2/requirements.txt)

| Package | Version | Purpose |
|---------|---------|---------|
| fastapi | 0.111.0 | FastAPI framework |
| uvicorn | 0.29.0 | ASGI server |
| pydantic | 2.7.1 | Data validation |
| pydantic-settings | 2.2.1 | Environment settings |
| python-dotenv | 1.0.1 | .env loading |
| httpx | 0.27.0 | HTTP client |
| websockets | 12.0 | WebSocket support |
| python-json-logger | 2.0.7 | Structured logging |
| requests | 2.31.0 | HTTP requests |
| numpy | 1.26.4 | Numerics |
| google-generativeai | 0.4.1 | Gemini API |

### Database

| Package | Version | Purpose |
|---------|---------|---------|
| pymongo | NOT SPECIFIED in requirements.txt | MongoDB driver (used in dynamic_entity_repo.py) |

> **Warning:** `pymongo` and `bson` are imported in `dynamic_entity_repo.py` but NOT listed in `ai-service-v2/requirements.txt`.

### Testing (ai-service-v2)

| Package | Version | Purpose |
|---------|---------|---------|
| pytest | 8.2.0 | Test runner |
| pytest-asyncio | 0.23.6 | Async test support |

### Frontend

| Package | Version | Purpose |
|---------|---------|---------|
| react | UNKNOWN | Frontend framework |
| vite | UNKNOWN | Build tool |
| concurrently | ^8.2.2 | Run frontend + backend together |

### Root / Dev Utilities

| Package | Version | Purpose |
|---------|---------|---------|
| eslint | ^9.0.0 | JS linting |
| prettier | ^3.2.5 | Code formatting |
| gsap | ^3.15.0 | Animation library |

---

## 14. ENVIRONMENT / RUN COMMANDS

### Starting Backend (MERN Node.js)

**From repository root:**
```bash
npm run server
# or
cd backend && npm run dev
```

**Or using run.bat (Windows):**
```batch
run.bat backend
```

### Starting Frontend

```bash
npm run client
# or
cd frontend && npm run dev
```

**Or using run.bat (Windows):**
```batch
run.bat frontend
```

### Starting Both Frontend + Backend

```bash
npm run dev
# or
run.bat project
```

### Starting FastAPI AI Service (ai-service-v2)

**From ai-service-v2 directory:**
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Or via Python directly:**
```bash
python ai-service-v2/app/main.py
```

### Running NER Tests (ai-service-v2)

```bash
cd ai-service-v2
pytest tests/ -v
```

### Running Specific Test Files

```bash
cd ai-service-v2
pytest tests/api/test_dynamic_entities.py -v
pytest tests/api/test_candidate_discovery_api.py -v
```

### Running Root-Level Integration Tests

**From repository root (ai-service-v2 must be on Python path):**
```bash
pytest tests/ -v
```

### Running NER Training (Full Pipeline)

```bash
python ner/run_pipeline.py --stage all
```

### Running NER Training Only

```bash
python ner/scripts/05_train_and_evaluate.py
```

### Running Human-Gold Evaluation

```bash
python ner/scripts/11_evaluate_human_gold.py
```

### Running Phase 1 Audit

```bash
python ner/scripts/audit_phase1_dynamic_entities.py
```

### Running Phase 3 Candidate Discovery (CLI runner)

```bash
python ner/scripts/run_candidate_discovery.py
```

### Running NER Demo

```bash
python ner/demo.py "Child ate 2 idlis and milk for breakfast to boost iron and calcium"
```

### Using Docker Compose

```bash
docker-compose up
```

---

## 15. TEST STATUS

### Test Files

| File | Location | Tests | Status |
|------|----------|-------|--------|
| `test_dynamic_entities.py` | `ai-service-v2/tests/api/` | 6 tests | **6/6 PASSED** (confirmed in Phase 2 report) |
| `test_candidate_discovery_api.py` | `ai-service-v2/tests/api/` | 7 tests | **PASSING** (based on Phase 3 implementation) |
| `test_health.py` | `ai-service-v2/tests/api/` | UNKNOWN | UNKNOWN |
| `test_dynamic_entity_registry.py` | `tests/` (root) | 2 tests | **2/2 PASSED** (confirmed in Phase 2 report) |
| `test_candidate_discovery.py` | `tests/` (root) | UNKNOWN | UNKNOWN |
| `benchmark_framework.py` | `tests/benchmarks/` | UNKNOWN | UNKNOWN |
| `eval_engine.py` | `tests/evaluators/` | UNKNOWN | UNKNOWN |

### Phase 2 Test Results (Confirmed)

**`test_dynamic_entities.py` tests:**
1. `test_seed_phase1_defaults` — Seeds COOKING_METHOD, SUPPLEMENT, DIET_PATTERN and checks ≥2 ACTIVE
2. `test_list_entities_with_filter` — Lists all entities, filters by ACTIVE status, searches by alias "steaming"
3. `test_get_entity_details` — Fetches COOKING_METHOD by name
4. `test_frozen_10_entity_collision_prevention` — Attempts to create NUTRIENT, FOOD, ALLERGEN, HEALTH_CONDITION as dynamic (must return 400)
5. `test_entity_lifecycle_state_machine` — Full PROPOSED→REVIEW→VALIDATED→TRAINING→EVALUATED→ACTIVE transition chain
6. `test_preservation_of_existing_10_entity_ner_data` — Verifies `weak_annotations.jsonl`, `train.jsonl`, `test.jsonl`, `validation.jsonl` still exist

**`test_dynamic_entity_registry.py` tests:**
1. `test_registry_seed_and_health` — Health check + seed defaults
2. `test_crud_and_lifecycle` — List entities, get COOKING_METHOD with status ACTIVE

### Phase 3 Test Coverage (Confirmed Implemented)

**`test_candidate_discovery_api.py` tests:**
1. `test_exact_alias_matching` — Verifies exact match discovery
2. `test_fuzzy_matching` — Verifies fuzzy discovery with threshold
3. `test_embedding_similarity_reuses_e5_prefixes` — Verifies E5 prefix protocol with FakeE5Encoder
4. `test_deduplication_and_ranking` — Verifies deduplication and priority ordering
5. `test_configurable_thresholds_from_settings` — Verifies threshold configuration
6. `test_discovery_api_endpoint` — End-to-end API test with monkeypatched corpus
7. `test_ner_gold_data_isolation` — **CRITICAL**: SHA-256 checksums verified — NER gold files must not be modified by discovery

### Known Warnings / Issues

- `pymongo` and `sentence-transformers` are NOT listed in `ai-service-v2/requirements.txt` but are used in the code. Installation may require additional `pip install` commands.
- `rapidfuzz` and `faiss-cpu` similarly need manual installation.
- The Averaged Perceptron model weights are NOT serialized to disk — the model must be retrained each time to get live weights.
- The `model_type: "crf_token_classifier"` label in `training_config.yaml` is inaccurate — the actual implementation is an Averaged Perceptron, not a CRF.

---

## 16. CURRENT RESEARCH ARCHITECTURE

```
╔══════════════════════════════════════════════════════════════════════════╗
║                    NUTRIBITE DYNAMIC NER ARCHITECTURE                    ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  ┌─────────────────────────────────────────────────────────────────┐    ║
║  │          DYNAMIC ENTITY REGISTRY (Phase 2 — ✅ COMPLETE)        │    ║
║  │  COOKING_METHOD (ACTIVE)  |  SUPPLEMENT (ACTIVE)                │    ║
║  │  DIET_PATTERN (VALIDATED) |  ... future entities ...            │    ║
║  │  Lifecycle: PROPOSED → REVIEW → VALIDATED → TRAINING → ...ACTIVE│    ║
║  │  Files: dynamic_entity_service.py, dynamic_entity_repo.py       │    ║
║  └──────────────────────────────┬──────────────────────────────────┘    ║
║                                 │                                        ║
║                                 ▼                                        ║
║  ┌─────────────────────────────────────────────────────────────────┐    ║
║  │     CANDIDATE DISCOVERY ENGINE (Phase 3 — ✅ COMPLETE / Run)    │    ║
║  │  Exact Match + Fuzzy Match (rapidfuzz) + Embedding (E5-small-v2)│    ║
║  │  Corpus: rag_data.json (913 passages) + retrieval_dataset.json  │    ║
║  │  Output: 1,500 unique candidates in DISCOVERED status           │    ║
║  │  File: candidate_discovery_service.py                           │    ║
║  └──────────────────────────────┬──────────────────────────────────┘    ║
║                                 │                                        ║
║                                 ▼                                        ║
║  ┌─────────────────────────────────────────────────────────────────┐    ║
║  │              HUMAN VALIDATION (Phase 4 — ❌ NOT IMPLEMENTED)    │    ║
║  │  Review DISCOVERED candidates → PENDING_REVIEW → ACCEPTED/REJ   │    ║
║  │  Annotation tool: ner/data/human_gold/annotation_tool.html      │    ║
║  └──────────────────────────────┬──────────────────────────────────┘    ║
║                                 │                                        ║
║                                 ▼                                        ║
║  ┌─────────────────────────────────────────────────────────────────┐    ║
║  │        TRAINING DATA GENERATION (Phase 5 — ❌ NOT IMPLEMENTED)  │    ║
║  │  Convert accepted candidates → BIO-tagged training instances    │    ║
║  │  Augment ner/data/schema_v2/ with new entity examples           │    ║
║  └──────────────────────────────┬──────────────────────────────────┘    ║
║                                 │                                        ║
║                                 ▼                                        ║
║  ┌─────────────────────────────────────────────────────────────────┐    ║
║  │           DYNAMIC NER MODEL (Phases 5-8 — ❌ NOT IMPLEMENTED)   │    ║
║  │  - Phase 5: Few-Shot Training on new dynamic entities           │    ║
║  │  - Phase 6: Few-Shot Learning (prototypical / MAML)             │    ║
║  │  - Phase 7: spaCy + Transformer Baselines                       │    ║
║  │  - Phase 8: Continual Learning / Anti-Forgetting                │    ║
║  │  Current frozen model: nutribite_sequence_perceptron_v2         │    ║
║  └──────────────────────────────┬──────────────────────────────────┘    ║
║                                 │                                        ║
║                                 ▼                                        ║
║  ┌─────────────────────────────────────────────────────────────────┐    ║
║  │              EVALUATION (Phase 9+ — ❌ NOT IMPLEMENTED)         │    ║
║  │  Current frozen eval: 11_evaluate_human_gold.py                 │    ║
║  │  Planned: evaluate dynamic entity F1 vs. baseline               │    ║
║  └──────────────────────────────┬──────────────────────────────────┘    ║
║                                 │                                        ║
║                                 ▼                                        ║
║  ┌─────────────────────────────────────────────────────────────────┐    ║
║  │        ENTITY NORMALIZATION (Phase 9 — ❌ NOT IMPLEMENTED)      │    ║
║  │  Current: entity_normalization.json for frozen 10 entities      │    ║
║  │  Script: 15_build_normalization_resource.py                     │    ║
║  └──────────────────────────────┬──────────────────────────────────┘    ║
║                                 │                                        ║
║                                 ▼                                        ║
║  ┌─────────────────────────────────────────────────────────────────┐    ║
║  │         ENTITY-AWARE RAG (Phase 11 — ❌ NOT IMPLEMENTED)        │    ║
║  │  Current RAG: hybrid_retriever.py (FAISS + BM25 + CrossEncoder) │    ║
║  │  Script: 17_evaluate_rag_impact.py (prototype only)             │    ║
║  └─────────────────────────────────────────────────────────────────┘    ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

**Legend:**
- ✅ COMPLETE — Implemented, tested, results available
- 🔄 RUN — Implementation complete, has been executed (results stored)
- ❌ NOT IMPLEMENTED — Not yet built

---

## 17. REMAINING PHASES

### Phase 3 — Candidate Discovery

**Current Status:** ✅ **COMPLETE AND RUN**  
The `CandidateDiscoveryEngine` is fully implemented in `ai-service-v2/app/services/candidate_discovery_service.py`. It has been executed. 1,500 unique candidates are stored in `candidate_discovery_results.json` / `ner/reports/candidate_discovery_results.json`.

**Existing files to reuse:** `candidate_discovery_service.py`, `dynamic_entity_service.py`, `hybrid_retriever.py`, `connection.py`, `dynamic_entity.py` schemas

**Major missing components:** Phase 4 human validation of discovered candidates.

---

### Phase 4 — Human Validation

**Current Status:** ❌ **NOT IMPLEMENTED**

**Goal:** Present the 1,500 discovered candidates to domain experts for ACCEPTED/REJECTED labeling.

**Existing files to reuse:**
- `ner/data/human_gold/annotation_tool.html` (existing HTML annotation tool — may be adaptable)
- `ai-service-v2/datasets/candidate_discovery_results.json` or `dynamic_candidates.json`
- `CandidateStatus` enum in `dynamic_entity.py`

**Major missing components:**
- Candidate review API endpoint
- Annotation interface for dynamic entity candidates
- Logic to update `CandidateStatus` from DISCOVERED → ACCEPTED/REJECTED
- Export of accepted candidates to training data format

---

### Phase 5 — Dynamic NER Training

**Current Status:** ❌ **NOT IMPLEMENTED**

**Goal:** Incorporate validated dynamic entity training examples into the NER model, train on 13-entity schema (10 frozen + 3 dynamic).

**Existing files to reuse:**
- `ner/scripts/05_train_and_evaluate.py` (training loop)
- `ner/scripts/16_schema_v2_and_ablation.py` (schema expansion precedent)
- `ner/config/training_config.yaml` (training hyperparameters)

**Major missing components:**
- BIO label set expansion (add B-COOKING_METHOD, I-COOKING_METHOD, etc.)
- Training data assembly script combining v2 silver + accepted candidates
- Backward compatibility evaluation against frozen 10-entity results

---

### Phase 6 — Few-Shot Learning

**Current Status:** ❌ **NOT IMPLEMENTED**

**Goal:** Learn new entity types from limited seed examples without full retraining.

**Existing files to reuse:**
- `DynamicEntityBase.seed_examples` (seed examples already stored per entity)
- `ner/scripts/phase10_generalization_experiments.py` (generalization precedent)

**Major missing components:**
- Few-shot NER framework (prototypical networks, MAML, or prompt-based)
- Evaluation methodology for few-shot scenarios

---

### Phase 7 — spaCy + Transformer Baselines

**Current Status:** ❌ **NOT IMPLEMENTED**

**Goal:** Compare current Averaged Perceptron against spaCy NER and transformer-based baselines.

**Major missing components:**
- spaCy training pipeline
- Transformer NER (e.g., BERT, BioBERT) training and evaluation
- Fair comparison evaluation harness against `ner/data/human_gold/human_gold.jsonl`

---

### Phase 8 — Continual NER / Anti-Forgetting

**Current Status:** ❌ **NOT IMPLEMENTED**

**Goal:** Add new entity types to the NER model without catastrophic forgetting of the frozen 10.

**Existing files to reuse:**
- `ner/scripts/phase10_generalization_experiments.py` (generalization baseline)
- `ner/reports/PHASE8_EXPERIMENT_MANIFEST.json` (original Phase 8 experiment plan)
- `ner/reports/PHASE8_RESEARCH_CONTRIBUTION.md`, `PHASE8_SUMMARY.md`

**Major missing components:**
- Elastic Weight Consolidation (EWC) or replay buffer implementation
- Evaluation protocol comparing pre-/post-dynamic training on frozen entity F1

---

### Phase 9 — Entity Linking (Dynamic)

**Current Status:** ❌ **NOT IMPLEMENTED** (frozen entities partially linked)

**Goal:** Link COOKING_METHOD, SUPPLEMENT, DIET_PATTERN entities to canonical identifiers.

**Existing files to reuse:**
- `ner/scripts/07_entity_linker.js` (existing entity linking for frozen entities)
- `ner/data/entity_normalization.json` (existing normalization resource)
- `ner/scripts/15_build_normalization_resource.py` (normalization builder)

**Major missing components:**
- Canonical registries for COOKING_METHOD, SUPPLEMENT, DIET_PATTERN
- Dynamic entity linking logic

---

### Phase 10 — Relation Extraction

**Current Status:** ❌ **NOT IMPLEMENTED**

**Goal:** Extract relationships between entities (NUTRIENT-FOOD, FOOD-HEALTH_CONDITION, SUPPLEMENT-CONDITION).

**Existing files to reuse:**
- `ner/reports/relation_extraction_feasibility.md` (feasibility analysis)
- Existing entity extraction pipeline

**Major missing components:**
- Relation annotation schema
- Relation extraction model (rule-based or neural)

---

### Phase 11 — NLP → RAG Integration

**Current Status:** ❌ **NOT IMPLEMENTED** (prototype only via `08_rag_enricher.js` and `17_evaluate_rag_impact.py`)

**Goal:** Wire NER entity outputs into the FAISS + BM25 hybrid retriever to improve retrieval precision.

**Existing files to reuse:**
- `ai-service-v2/app/rag/hybrid_retriever.py` — main RAG engine
- `ner/scripts/08_rag_enricher.js` — prototype RAG enricher
- `ner/scripts/17_evaluate_rag_impact.py` — RAG impact evaluation
- `ner/reports/rag_impact_results.md`

**Major missing components:**
- NER inference integration into the RAG query pipeline
- Entity-filtered retrieval logic

---

### Phase 12 — Final Evaluation

**Current Status:** ❌ **NOT IMPLEMENTED**

**Goal:** End-to-end evaluation of the full Dynamic NER system against human-gold and dynamic entity benchmarks.

**Existing files to reuse:**
- `ner/scripts/11_evaluate_human_gold.py` — complete evaluation framework
- `ner/data/human_gold/human_gold.jsonl` — frozen evaluation benchmark
- `ner/data/human_gold/nutrient_challenge.jsonl` — adversarial test

**Major missing components:**
- Extended human-gold dataset covering dynamic entity types
- Combined evaluation metric (frozen 10 + dynamic 3)

---

## 18. IMPORTANT CONSTRAINTS / DO NOT BREAK

### 1. Frozen 10-Entity NER Schema (MUST NOT CHANGE)

The following entity types and their BIO labels are permanently frozen:

```
NUTRIENT, FOOD, FOOD_GROUP, DIETARY_PROPERTY, FEEDING_METHOD,
HEALTH_CONDITION, ALLERGEN, AGE_GROUP, MEAL_TYPE, GROWTH_METRIC
```

**Defined in:** `ner/config/schema_v2.yaml` (date_frozen: "2026-09-19")  
**Enforced by:** `FROZEN_10_ENTITIES` set in `dynamic_entity_service.py`

### 2. Human-Gold Dataset (MUST NOT MODIFY)

```
ner/data/human_gold/human_gold.jsonl        ← 150 annotated sentences, 387 spans
ner/data/human_gold/nutrient_challenge.jsonl ← 25 adversarial NUTRIENT sentences
```

These are the ONLY unbiased evaluation benchmarks. SHA-256 checksums are verified by `test_ner_gold_data_isolation()`.

### 3. Existing Train/Test Splits (MUST NOT MODIFY)

```
ner/data/train.jsonl
ner/data/validation.jsonl
ner/data/test.jsonl
ner/data/schema_v2/train.jsonl
ner/data/schema_v2/validation.jsonl
ner/data/schema_v2/test.jsonl
ner/data/weak_annotations.jsonl
```

Verified by `test_preservation_of_existing_10_entity_ner_data()` and `test_ner_gold_data_isolation()`.

### 4. Existing Evaluation Methodology (MUST NOT CHANGE)

- Exact-span matching only (start, end, label must all match)
- Passage-grouped, leak-free train/test splits (grouped by `source_record_id`, seed 42)
- Silver vs. Human-Gold distinction must be maintained
- Micro F1 as primary metric

### 5. Phase 2 Registry (MUST NOT BREAK)

- Dynamic entity CRUD and lifecycle APIs must remain backward compatible
- `FROZEN_10_ENTITIES` collision guard must remain active
- JSON fallback at `datasets/dynamic_entities.json` must remain writable
- MongoDB collection `dynamic_entities` with indexes on `name` (unique) and `status`

### 6. Existing RAG Data (MUST NOT MODIFY)

```
ai-service-v2/datasets/rag_data.json         ← 913 RAG passages
ai-service-v2/evaluation/retrieval_dataset.json ← 150 benchmark queries
```

### 7. Existing APIs (MUST NOT BREAK)

- All `/api/v1/entities/` endpoints must remain backward compatible
- `/api/v1/health` must remain available
- The chat and WebSocket endpoints must not be broken by NER integration work

### 8. Candidate Isolation (MUST NOT MIX)

Phase 3 candidates are stored in `datasets/dynamic_candidates.json` (separate from NER gold files). This isolation must be maintained. **Never write candidate data to NER training or gold files.**

### 9. Embedding Model Consistency

The embedding model `intfloat/e5-small-v2` with `query:` / `passage:` prefixes must be used consistently across:
- `hybrid_retriever.py` (RAG retrieval)
- `candidate_discovery_service.py` (candidate discovery)
- Future NER embedding phases

---

## 19. EXACT FILES TO READ BEFORE PHASE 3

> **Note:** Phase 3 is complete. If continuing from Phase 4, read these files in this order.

**Priority 1:**  
`ai-service-v2/app/services/candidate_discovery_service.py` — The complete Phase 3 discovery engine. Understand `run_discovery_pipeline()`, `discover_exact_matches()`, `discover_fuzzy_matches()`, `discover_embedding_matches()`, and `deduplicate_and_rank()`.

**Priority 2:**  
`ner/reports/phase3_candidate_discovery.md` — Results of Phase 3 run: 1,500 unique candidates, breakdown by method and entity, confidence distribution.

**Priority 3:**  
`ner/reports/candidate_discovery_results.json` — Full machine-readable Phase 3 results. Required for Phase 4 human review input.

**Priority 4:**  
`ai-service-v2/app/schemas/dynamic_entity.py` — All Pydantic schemas: `DynamicCandidate`, `CandidateStatus`, `DiscoverySummaryResponse`, `EntityLifecycleStatus`, lifecycle state machine.

**Priority 5:**  
`ai-service-v2/app/services/dynamic_entity_service.py` — `FROZEN_10_ENTITIES` guard, `LIFECYCLE_TRANSITIONS` map, `seed_phase1_defaults()`, and the full service layer.

**Priority 6:**  
`ai-service-v2/datasets/dynamic_entities.json` — Actual persisted state of COOKING_METHOD (ACTIVE), SUPPLEMENT (ACTIVE), DIET_PATTERN (VALIDATED).

**Priority 7:**  
`ai-service-v2/app/rag/hybrid_retriever.py` — FAISS + BM25 + CrossEncoder architecture, `intfloat/e5-small-v2` embedding model usage, `normalize_query()`, `tokenize()`, FAISS index path.

**Priority 8:**  
`ner/config/schema_v2.yaml` — Frozen 10-entity schema, precedence hierarchy, entity descriptions and examples.

**Priority 9:**  
`ner/reports/human_gold_evaluation_results.json` — Current model baselines (silver: 93.23% F1, human-gold: 61.00% F1, adversarial: 41.90% F1). These are the targets to beat or maintain.

**Priority 10:**  
`ai-service-v2/tests/api/test_candidate_discovery_api.py` — `test_ner_gold_data_isolation()` SHA-256 fingerprint test. Any new code must pass this before merging.

**Priority 11:**  
`ner/scripts/05_train_and_evaluate.py` — `FastAveragedSequencePerceptron` implementation with `extract_features()` and constrained BIO decoding. This is the model to extend for Phase 5.

**Priority 12:**  
`ai-service-v2/app/core/config.py` — All configurable thresholds (embedding, fuzzy, sentence gate) and environment variable names.

---

## 20. FINAL HANDOFF SUMMARY

### A. What Is COMPLETE

| Component | Status | Location |
|-----------|--------|---------|
| 10-Entity NER Schema (v2.0) | ✅ Frozen | `ner/config/schema_v2.yaml` |
| NER Training Pipeline | ✅ Complete | `ner/scripts/05_train_and_evaluate.py` |
| Silver Evaluation (v1): 95.10% Micro F1 | ✅ Complete | `ner/reports/training_summary.json` |
| Silver Evaluation (v2): 93.23% Micro F1 | ✅ Complete | `ner/reports/human_gold_evaluation_results.json` |
| Human-Gold Evaluation: 61.00% Micro F1 | ✅ Complete | `ner/reports/human_gold_results.md` |
| Adversarial Challenge: 41.90% Micro F1 | ✅ Complete | `ner/reports/human_gold_results.md` |
| Gazetteers (7 domain gazetteers) | ✅ Complete | `ner/data/gazetteers/` |
| Entity Normalization Resource | ✅ Complete | `ner/data/entity_normalization.json` |
| Human-Gold Dataset (150 sentences) | ✅ Complete (frozen) | `ner/data/human_gold/human_gold.jsonl` |
| RAG Hybrid Retriever (FAISS + BM25) | ✅ Complete | `ai-service-v2/app/rag/hybrid_retriever.py` |
| FAISS Vector Index | ✅ Built | `ai-service-v2/vector_store/faiss_index.bin` |
| Phase 1 Dynamic Entity Audit | ✅ Complete | `phase1_entity_audit.md` |
| Phase 2 Dynamic Entity Registry | ✅ Complete | `ai-service-v2/app/services/dynamic_entity_service.py` |
| Phase 2 REST API | ✅ Complete (8 endpoints) | `ai-service-v2/app/api/v1/dynamic_entities.py` |
| Phase 2 Tests (6+2 tests) | ✅ All passing | `ai-service-v2/tests/api/` |
| Phase 3 Candidate Discovery Engine | ✅ Implemented | `ai-service-v2/app/services/candidate_discovery_service.py` |
| Phase 3 Results (1,500 candidates) | ✅ Run and stored | `candidate_discovery_results.json` |

### B. What Is CURRENTLY IN PROGRESS

Nothing is currently in progress. The project has been handed off at the end of Phase 3 with results stored.

### C. What Is NOT IMPLEMENTED

- Phase 4: Human validation of discovered candidates
- Phase 5: Dynamic NER training (13-entity schema)
- Phase 6: Few-shot learning for new entity types
- Phase 7: spaCy + Transformer baseline comparisons
- Phase 8: Continual learning / anti-forgetting
- Phase 9: Entity linking for dynamic entities
- Phase 10: Relation extraction
- Phase 11: Full NLP → RAG integration
- Phase 12: Final end-to-end evaluation

### D. Most Important Files

1. `ai-service-v2/app/services/candidate_discovery_service.py` — Phase 3 engine (complete)
2. `ai-service-v2/app/services/dynamic_entity_service.py` — Registry service + frozen entity guard
3. `ai-service-v2/app/schemas/dynamic_entity.py` — All data contracts
4. `ai-service-v2/app/db/dynamic_entity_repo.py` — MongoDB + JSON persistence
5. `ai-service-v2/app/rag/hybrid_retriever.py` — RAG engine to integrate NER into
6. `ner/scripts/05_train_and_evaluate.py` — NER training script to extend
7. `ner/config/schema_v2.yaml` — Frozen schema
8. `ai-service-v2/app/core/config.py` — All configuration settings

### E. Most Important Datasets

1. `ner/data/human_gold/human_gold.jsonl` — Unbiased evaluation benchmark (NEVER MODIFY)
2. `ai-service-v2/datasets/rag_data.json` — Primary RAG corpus (913 passages)
3. `ner/data/schema_v2/train.jsonl` — Current training data (do not modify — extend separately)
4. `ai-service-v2/datasets/dynamic_entities.json` — Live dynamic entity registry state
5. `candidate_discovery_results.json` / `ner/reports/candidate_discovery_results.json` — Phase 3 output
6. `ai-service-v2/evaluation/retrieval_dataset.json` — 150-query retrieval benchmark

### F. Current Research Baseline

| Metric | Value | Dataset |
|--------|-------|---------|
| Silver Micro F1 (v2) | **93.23%** | `ner/data/schema_v2/test.jsonl` |
| Human-Gold Micro F1 | **61.00%** | `ner/data/human_gold/human_gold.jsonl` |
| Adversarial Challenge F1 | **41.90%** | `ner/data/human_gold/nutrient_challenge.jsonl` |
| NUTRIENT Human-Gold F1 | **74.73%** | NUTRIENT class on human-gold |
| Seen Entity F1 | **76.79%** | Seen surface forms |
| Unseen Entity F1 | **1.29%** | Unseen surface forms |
| Phase 3 Candidates Discovered | **1,500** | All three dynamic entities |

### G. Recommended Starting Point for Phase 4

1. **Read** `ner/reports/candidate_discovery_results.json` to understand the 1,500 discovered candidates.
2. **Read** `ner/reports/phase3_candidate_discovery.md` for the executive summary.
3. **Start implementing** `ai-service-v2/app/services/candidate_review_service.py` — a new service for accepting/rejecting discovered candidates.
4. **Add a new router** at `ai-service-v2/app/api/v1/candidate_review.py` following the pattern of `dynamic_entities.py`.
5. **Create Phase 4 tests** at `ai-service-v2/tests/api/test_candidate_review_api.py`.
6. **Ensure** that accepted candidates are stored in a NEW file (e.g., `datasets/validated_candidates.json`) and NEVER written to any frozen NER files.
7. **After sufficient validated examples**, proceed to Phase 5: extend the NER training script to handle 13 entity types.

---

*End of Project Handoff Document*

---

> **Important Notice:** This handoff document was created by reading-only inspection of the repository. No source files were modified, deleted, renamed, or generated. All file names, class names, function names, API routes, schema names, and configuration values are taken directly from the actual repository contents.
