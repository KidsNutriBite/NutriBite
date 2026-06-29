# 🛡️ Architecture Audit: NutriKids AI Service

This audit captures the current architectural gaps, duplicate code paths, direct model dependencies, and structural inconsistencies in the legacy `ai-service` codebase, laying out the target blueprint for `ai-service-v2`.

---

## 1. Flow Tracing

### Request Flow
* **Legacy (`ai-service`)**: Incoming HTTP requests hit `main.py` directly. The endpoint functions act as their own controllers, sequentially executing rate-limiting, security validation, RAG retrieval, diet calculation, prompt building, LLM inference, and custom JSON/Markdown formatting.
* **Target (`ai-service-v2`)**: Request lands on modular routes -> validation schemas -> `ChatOrchestrator.handle_request()` -> processes layers sequentially -> returns unified Pydantic schema.

### Retrieval Flow
* **Legacy (`ai-service`)**: RAG retrieval is executed via `retrieve_hybrid_chunks` in `main.py` directly. `/ask`, `/chat`, and `/generate-diet` all contain slightly varying parameters or fallback hardcodings for chunk quantities (`top_k=8`, `top_k=2`, etc.).
* **Target (`ai-service-v2`)**: Encapsulated within `RetrievalService` or fetched strictly via `ChatOrchestrator` using a standardized `top_k` parameter configured in app settings.

### Model Flow
* **Legacy (`ai-service`)**: Direct dependency on `run_comparative_benchmark()` inside `llm.py`, which is loaded inside `main.py`. This function directly interacts with `google.generativeai` and initiates HTTP POST calls to a local Ollama server, containing tight coupling with specific models and hardcoded fallback behaviors.
* **Target (`ai-service-v2`)**: Unified `ModelRouter` interface with standard `.generate()` and `.stream()` methods. Endpoint code has zero knowledge of API keys or model names.

### Prompt Flow
* **Legacy (`ai-service`)**: System instructions are defined inside `app/prompts/builder.py`. However, presentation formats, JSON schemas, companion personas (Captain Milk, Iron-Man Ragi, etc.), and emergency instructions are all compiled inside a single mammoth function.
* **Target (`ai-service-v2`)**: Static prompts separated into discrete, declarative files (`prompts/master_system_prompt.py`, `prompts/nutrition_prompt.py`, etc.). `builder.py` only imports and combines these snippets.

### Guardrail Flow
* **Legacy (`ai-service`)**: Safety validation checks are executed inside endpoint code via separate functions: `audit_security_gate()` (injection shield) and `apply_guardrails()` (bedtime/medical flags). If triggered, the endpoints return custom custom dicts.
* **Target (`ai-service-v2`)**: Structured as pre-inference filters in the orchestrator pipeline. A triggered guardrail returns immediately with a safe, unified schema response.

### Response Flow
* **Legacy (`ai-service`)**: High variance in returned schemas. `/ask` returns either structured Markdown partitioned by `|||DETAILED|||` (Parents mode) or dynamically deserialized JSON strings (Kids mode). `/chat` returns general text dictionary. `/generate-diet` returns plans rephrased by the comparative LLM benchmark.
* **Target (`ai-service-v2`)**: All endpoints output a single, unified Pydantic schema: `ChatResponse` (`answer`, `sources`, `confidence`, `model_used`, `request_id`).

---

## 2. Structural Gaps & Issues Identified

### Duplicate Logic & Middleware
1. **Rate Limiting**: `main.py` implements an in-memory client-ip tracking class `RateLimitMiddleware` (lines 28-55). This duplicates `ai-service-v2/app/middleware/rate_limit.py`, which provides a standardized ASGI middleware.
2. **Text Cleaners**: Multiple functions inside `main.py` parse float/int strings (`parse_int_from_string`, `parse_float_from_string`), repeating simple regex cleaning across endpoints.

### Direct Model Dependencies & Lack of Decoupling
1. **Gemini SDK Coupling**: `app/models/llm.py` directly handles `google.generativeai.GenerativeModel`, meaning any update to the API standard breaks all calling logic.
2. **HTTP Hardcoding for Ollama**: Direct requests to `f"{OLLAMA_HOST}/api/chat"` are handled inside the model file, lacking proper async connection pooling.

### Prompt Inconsistencies & Bloat
1. **Giant Prompt Strings**: `app/prompts/builder.py` mixes system persona guidelines, scientific response mandates, and JSON schema requirements. If a formatting rule changes, it risks corrupting unrelated schemas.

---

## 3. Recommendations & Stage 1 Blueprint

1. **Copy Local Datasets**: Copy `ai-service/datasets` folder to `ai-service-v2/datasets` to ensure local filesystem operations for the RAG index and Planner calculations work immediately.
2. **Create Unified Router**: Implement `ModelRouter` inside `ai-service-v2/app/models/model_router.py` to encapsulate Ollama & Gemini routing under unified endpoints.
3. **Consolidate Schemas**: Use `ai-service-v2/app/schemas/chat_response.py` as the singular source of truth for response models across all endpoints.

