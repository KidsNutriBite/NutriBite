# 🏗️ NutriBite AI: Core System Architecture

This document describes the layered, production-grade foundation architecture of the NutriBite AI microservice (`ai-service-v2`).

---

## Targeted Architecture Layers

```
             Frontend (Parent/Kid/Doctor Apps)
                       ↓ (REST + WebSocket)
          FastAPI Gateway + Unified ASGI Middleware
                       ↓
[Layer 1] Security Gates (Injection Shielding)
                       ↓
[Layer 2] Safety Guardrails (Emergency Triage / Bedtime Lockout)
                       ↓
[Layer 3] Hybrid RAG Pipeline (BM25 Lexical + FAISS Semantic + Cross-Encoder Reranking)
                       ↓
[Layer 4] Deterministic Planner (Nutrition Calculators & Allergy Blocks)
                       ↓
[Layer 5] Prompt Management Layer (Declarative Prompt Assembly)
                       ↓
[Layer 6] Centralized Model Router (Ollama Mistral Primary -> Gemini Fallback)
                       ↓
[Layer 7] Unified Logging & Tracing Service (Execution Span Profiling)
                       ↓
             Unified Response Schema Payload
```

---

## Layer Descriptions

1. **FastAPI Gateway**: Serves as the high-throughput entrypoint. Exposes standard routes with rate-limiting, Request ID logging, and JWT authentication middleware.
2. **Security Gates**: Active shield scanning queries for prompt injection, boundary override bypasses, and jailbreak commands. Intercepts threats before LLM dispatch.
3. **Safety Guardrails**: Analyzes pediatric medical emergency keywords for doctor triage escalation and handles kids bedtime lockouts.
4. **Hybrid RAG Pipeline**: Implements high-recall BM25 combined with semantic dense FAISS indices. Fuses candidates using Reciprocal Rank Fusion (RRF) and passes them to a Cross-Encoder reranker.
5. **Deterministic Planner**: An algorithmic decision engine performing calorie targets math, regional preference matching, and severe allergy exclusions. Never relies on LLM calculations.
6. **Prompt Management**: Compiles declarative prompts dynamically based on child profile inputs, retrieved chunks, and structured planner outputs.
7. **Model Router**: Centralized dispatcher handling local Ollama Mistral inference with automated API failovers to Google Gemini and static deterministic experts.
8. **Logging & Tracing**: Profiles latencies, generation durations, RAG indices matching, and confidence ratings across spans, printing clean trace logs.
