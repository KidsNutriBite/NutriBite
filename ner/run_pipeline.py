import os
import sys
import argparse
import subprocess

def run_cmd(cmd, desc):
    print(f"\n========================================================")
    print(f"STAGE: {desc}")
    print(f"Command: {cmd}")
    print(f"========================================================")
    res = subprocess.run(cmd, shell=True)
    if res.returncode != 0:
        print(f"[ERROR] Stage failed with exit code {res.returncode}")
        sys.exit(res.returncode)

def main():
    parser = argparse.ArgumentParser(description="NutriBite Domain-Specific NER Unified Pipeline")
    parser.add_argument("--stage", choices=["inventory", "gazetteer", "annotate", "split", "train", "evaluate", "link", "qc", "all"], default="all", help="Pipeline stage to execute")
    args = parser.parse_args()

    py_exe = sys.executable

    stages = {
        "inventory": ("node ner/scripts/01_build_inventory.js", "1. Machine-Readable Corpus Inventory"),
        "gazetteer": ("node ner/scripts/02_build_gazetteers.js", "2. Normalized Domain Gazetteers Induction"),
        "annotate": ("node ner/scripts/03_extract_and_annotate.js", "3. Weak Rule-Based & Contextual Annotation Engine"),
        "split": ("node ner/scripts/04_validate_and_split.js", "4. Representative Validation Sampling & Leak-Free Splitting"),
        "qc": ("node ner/scripts/09_quality_control.js", "5. Automated Quality Control & Integrity Verification"),
        "train": (f'"{py_exe}" ner/scripts/05_train_and_evaluate.py', "6. Domain Sequence Classifier Training & Evaluation"),
        "evaluate": (f'"{py_exe}" ner/scripts/05_train_and_evaluate.py', "7. Test Benchmark & Ambiguity/Multi-Word Evaluation"),
        "link": ("node ner/scripts/07_entity_linker.js", "8. Entity Linking to Canonical Food & Nutrient IDs")
    }

    if args.stage == "all":
        order = ["inventory", "gazetteer", "annotate", "split", "qc", "train", "link"]
        for st in order:
            cmd, desc = stages[st]
            run_cmd(cmd, desc)
        print("\n[SUCCESS] Full NutriBite Domain-Specific NER pipeline completed successfully!")
    else:
        cmd, desc = stages[args.stage]
        run_cmd(cmd, desc)

if __name__ == "__main__":
    main()
