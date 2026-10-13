# NutriBite Domain-Specific NER: File Manifest and Directory Structure

This manifest provides a comprehensive index of every file created for Phase 3 in the isolated `ner/` directory, detailing its exact functional purpose and role in the pipeline.

```
ner/
├── README.md                                 # Primary repository documentation and execution guide
├── requirements.txt                          # Python library dependencies (numpy, scikit-learn, seqeval, pyyaml)
├── run_pipeline.py                           # Master CLI entry point supporting modular execution stages
├── demo.py                                   # Interactive command-line demonstration for single-query extraction
│
├── config/
│   └── training_config.yaml                  # Model training hyperparameters, label definitions, and file paths
│
├── data/
│   ├── gazetteers/
│   │   ├── foods_gazetteer.json              # 172 normalized foods with IDs, categories, and aliases
│   │   ├── nutrients_gazetteer.json          # 18 normalized macro/micronutrients with aliases
│   │   ├── conditions_gazetteer.json         # 172 normalized pediatric health conditions
│   │   ├── allergens_gazetteer.json          # 10 clinical food allergens and sensitivities
│   │   ├── age_groups_gazetteer.json         # 6 pediatric developmental age brackets
│   │   ├── meal_types_gazetteer.json         # 6 diurnal meal occasions
│   │   └── growth_metrics_gazetteer.json     # 9 clinical anthropometric indices
│   │
│   ├── weak_annotations.jsonl               # 1,748 rule-annotated sentences from primary corpus (2,711 entity spans)
│   ├── manual_validation.jsonl              # 350 representative stratified validation instances
│   ├── train.jsonl                          # 1,223 training sentences (70% split, passage-grouped)
│   ├── validation.jsonl                     # 262 validation sentences (15% split, passage-grouped)
│   └── test.jsonl                           # 263 held-out test sentences (15% split, passage-grouped)
│
├── scripts/
│   ├── 01_build_inventory.js                # Programmatic corpus inventory and statistics generator
│   ├── 02_build_gazetteers.js               # Structured gazetteer builder and normalizer
│   ├── 03_extract_and_annotate.js           # Sentence extractor, distant annotator, and BIO encoder
│   ├── 04_validate_and_split.js             # Passage-grouped leak-free partitioner and distribution counter
│   ├── 05_train_and_evaluate.py             # Feature extractor, sequence classifier, and evaluator
│   ├── 07_entity_linker.js                  # Entity linking resolver to structured database IDs
│   ├── 08_rag_enricher.js                   # Experimental RAG query preprocessor and metadata filter
│   └── 09_quality_control.js                # Automated dataset syntax, offset, BIO, and leakage validator
│
├── evaluation/
│   ├── ambiguity_tests.jsonl                # 10 polysemous contextual evaluation sentences
│   ├── multiword_tests.jsonl                # 12 complex multi-word span evaluation sentences
│   └── domain_ner_predictions.jsonl         # Full model prediction traces on the 263 test sentences
│
├── models/
│   └── nutribite_ner/
│       └── model_metadata.json               # Serialized model architecture metadata and active feature count
│
└── reports/
    ├── corpus_inventory.json                # Machine-readable corpus statistics
    ├── corpus_inventory.md                  # Detailed Markdown table of all corpus sources
    ├── class_distribution.csv               # Raw CSV of label counts across Train/Val/Test
    ├── class_distribution.md                # Markdown report on entity class distribution
    ├── training_summary.json                # Serialized JSON summary of test performance metrics
    ├── training_summary.md                  # Markdown report on model test results vs baseline
    ├── before_after_examples.md             # 10 real test-set comparative examples (Baseline vs Domain NER)
    ├── error_analysis.md                    # In-depth breakdown of false positives, false negatives, and boundaries
    ├── ambiguity_analysis.md                # Results of the dedicated ambiguity benchmark
    ├── entity_linking_examples.md           # Proof-of-concept grounding outputs from NER to database IDs
    ├── NutriBite_NER_Academic_Report.md     # Full 16-section academic research paper report
    ├── NER_Project_Summary.md               # Concise presentation summary for lab defenses
    ├── NER_Viva_QA.md                       # 22 comprehensive viva examination questions and answers
    └── file_manifest.md                     # Complete manifest of all project files
```
