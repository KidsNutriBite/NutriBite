# NutriBite NER — Phase 5 Reproducibility & Environment Report

This report provides complete environment specifications, command invocations, data checksums, hyperparameter configurations, and reproduction instructions for Phase 5 of the NutriBite domain-specific NER project.

---

## 1. System & Runtime Environment

| Parameter | Specification |
| :--- | :--- |
| **Operating System** | Windows 10/11 (PowerShell / Command Prompt) |
| **Python Version** | Python 3.12+ (standard library only for core pipeline) |
| **Node.js Runtime** | Node.js v18+ / v20+ (for JavaScript ingestion pipelines) |
| **Random Seed** | `42` (fixed across all data splits and perceptron shuffling) |
| **Character Encoding** | UTF-8 enforced (`sys.stdout.reconfigure(encoding='utf-8')`) |
| **External Heavy Dependencies** | None required for baseline reproduction; standard library `json`, `collections`, `re`, `os`, `sys`, `math`, `random` |

---

## 2. Dataset Artifacts & Verified Counts

| Partition / File | File Path | Sentences | Entity Spans | Annotation Nature |
| :--- | :--- | :---: | :---: | :--- |
| **Corpus Weak Annotations** | `ner/data/weak_annotations.jsonl` | 1,748 | 2,711 | Distant Supervision (Silver) |
| **Training Partition (70%)** | `ner/data/train.jsonl` | 1,223 | 1,851 | Distant Supervision (Silver) |
| **Validation Partition (15%)**| `ner/data/validation.jsonl` | 262 | 418 | Distant Supervision (Silver) |
| **Test Partition (15%)** | `ner/data/test.jsonl` | 263 | 442 | Distant Supervision (Silver) |
| **Human Gold Candidates** | `ner/data/human_gold/human_gold_candidates.jsonl` | 150 | TBD | Stratified Corpus Sampling |
| **Human Gold Template** | `ner/data/human_gold/human_gold_template.jsonl` | 150 | 0 | Blank Template for Human Annotator |
| **Nutrient Challenge Suite** | `ner/data/human_gold/nutrient_challenge.jsonl` | 25 | 63 | Adversarial Gold Challenge Set |

---

## 3. Execution Pipeline & Reproduction Commands

To reproduce all Phase 5 experiments and audits from scratch, execute the following commands in the project root:

### Step 1: Candidate Generation for Human Gold
```bash
python ner/scripts/generate_human_gold_candidates.py
```
*Expected Output:* Generates 150 stratified candidate sentences across 11 linguistic categories in `ner/data/human_gold/`.

### Step 2: Training & Distant-Supervision Test Evaluation
```bash
python ner/scripts/05_train_and_evaluate.py
```
*Expected Output:* Trains the Averaged Structured Perceptron over 8 epochs (Token Accuracy: 99.62%) and evaluates on `test.jsonl` (Overall Micro F1: 95.10%, NUTRIENT F1: 97.18%).

### Step 3: Phase 4 & 5 Verification Audit
```bash
python ner/scripts/10_audit_results.py
```
*Expected Output:* Recomputes all dataset span counts, verifies 0 data leakage, checks BIO integrity (0 errors), discloses gazetteer circularity (98.86%), and flags low-support classes (`ALLERGEN` support=5, `GROWTH_METRIC` support=2).

### Step 4: Phase 5 Independent Evaluation & Challenge Suite
```bash
python ner/scripts/11_evaluate_human_gold.py
```
*Expected Output:* 
- Verifies human gold completion status (`NO` pending manual annotation).
- Measures Seen NUTRIENT F1 (99.40%) vs Unseen NUTRIENT F1 (60.00%).
- Runs the 25-sentence nutrient challenge suite (Micro F1: 45.71%).
- Generates `phase5_experiment_results.md`, `nutrient_challenge_results.md`, and `nutrient_error_analysis.md`.

---

## 4. Hyperparameter & Model Configuration

* **Model Class:** `FastAveragedSequencePerceptron`
* **Feature Window:** Current token ($w_i$), previous token ($w_{i-1}$), next token ($w_{i+1}$), bigrams ($w_{i-1}\_w_i$, $w_i\_w_{i+1}$), prefixes (len 2, 3), suffixes (len 2, 3), token length, shape flags (title, upper, digit, hyphen), previous tag state ($y_{i-1}$).
* **Epochs:** 8
* **Weight Averaging:** Averaged Perceptron weight accumulator with lazy time-stamped updates.
* **Transition Constraints:** Strict BIO legal transition mask (penalizes illegal `I-X` transitions without prior `B-X` / `I-X` by $-100.0$).
