# NutriBite Machine-Readable Corpus Inventory

This inventory provides exact, programmatically measured statistics of all data assets in the NutriBite corpus used for NER dataset construction, gazetteer induction, and model evaluation.

| Source Filename | Source Type | Records | Sentences | Approx. Tokens | Size (Bytes) | Nature | Annotation Target? | Gazetteer Source? | Evaluation? |
| :--- | :--- | ---: | ---: | ---: | ---: | :--- | :---: | :---: | :---: |
| `ai-service-v2/datasets/rag_data.json` | RAG Knowledge Base | 913 | 1487 | 28216 | 446213 | Natural Language | Yes | Yes | No |
| `ai-service-v2/evaluation/retrieval_dataset.json` | User Query Benchmark | 150 | 150 | 1253 | 18710 | Natural Language | Yes | No | Yes |
| `tests/fixtures/eval_fixtures.json` | Clinical Safety Benchmarks | 2 | 2 | 0 | 6344 | Natural Language | Yes | No | Yes |
| `ai-service-v2/evaluation/retrieval_failures.json` | Diagnostic Retrieval Log | 106 | 106 | 899 | 57299 | Natural Language | No | No | Yes |
| `ai-service-v2/datasets/foods.json` | Food Database | 175 | 175 | 306 | 113657 | Structured | No | Yes | No |
| `ai-service-v2/datasets/conditions.json` | Clinical Rules Catalog | 172 | 172 | 172 | 71525 | Structured | No | Yes | No |
| `ai-service-v2/datasets/allergies.json` | Allergen Catalog | 17 | 17 | 17 | 2813 | Structured | No | Yes | No |
| `ai-service-v2/datasets/goals.json` | Dietary Goals Catalog | 148 | 148 | 148 | 63357 | Structured | No | Yes | No |

### Corpus Summary Totals:
- **Total Raw Records Across All Files:** 1683
- **Total Natural Language Sentences Available:** 1745
- **Total Approximate Natural Language Tokens:** 30368
- **Total Corpus Byte Size:** 761.6 KB (779918 bytes)
