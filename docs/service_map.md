# 🗺️ service_map: Codebase Directory Structure

This document charts the refactored, standardized directory map of `ai-service-v2`.

---

## 1. Directory Tree Map

```
ai-service-v2/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── chat.py             <-- Refactored HTTP /ask, /chat, /generate-diet, /analyze-meal
│   │   │   ├── health.py           <-- Scaffolding API health checkers
│   │   │   └── websocket.py        <-- Refactored WebSockets /ws/chat streaming
│   │   └── router.py               <-- Standardized APIRouter mounting points
│   │
│   ├── core/
│   │   ├── config.py               <-- Central App Settings & Environment config
│   │   ├── exceptions.py           <-- Global Exception handling mapping
│   │   └── security.py             <-- Security keys & token verifiers
│   │
│   ├── db/
│   │   └── connection.py           <-- Migrated JSON database handlers
│   │
│   ├── guardrails/
│   │   ├── safety.py               <-- Pediatric medical safety & bedtime lockers
│   │   └── security_guardrails.py  <-- Active injection shield threat gate
│   │
│   ├── middleware/
│   │   ├── jwt_auth.py             <-- JWT authentication middleware
│   │   ├── logging.py              <-- ASGI RequestLoggingMiddleware
│   │   └── rate_limit.py           <-- Standard rate limiter
│   │
│   ├── models/
│   │   └── model_router.py         <-- Unified model routing and failover engine
│   │
│   ├── planner/
│   │   └── engine.py               <-- Algorithmic calorie target engine
│   │
│   ├── prompts/
│   │   ├── master_system_prompt.py <-- Static persona rules
│   │   ├── nutrition_prompt.py     <-- Indian local dietary guidelines
│   │   ├── safety_prompt.py        <-- Structural markdown formatting schemas
│   │   ├── planner_prompt.py       <-- Structured math guidelines
│   │   └── builder.py              <-- Dynamic prompt assembler
│   │
│   ├── rag/
│   │   └── hybrid_retriever.py     <-- Lexical & dense FAISS semantic RAG
│   │
│   ├── schemas/
│   │   ├── health.py               <-- Pydantic health validation schemas
│   │   └── chat_response.py        <-- Singular Unified Pydantic Response Schema
│   │
│   ├── utils/
│   │   └── logger.py               <-- Log handlers
│   │
│   └── main.py                     <-- Main microservice setup
│
├── datasets/                       <-- Shared raw JSON pediatric parameters
└── vector_store/                   <-- Compiled FAISS binary vector indexes
```

---

## 2. Standardized Roles

* **`app/api/`**: Only handles protocol serialization/deserialization (HTTP endpoints & WebSockets). Contains zero business logic, routing all requests immediately to the Orchestrator.
* **`app/services/`**: Houses Orchestrators and Tracers, coordinating data flow between calculations, retrieval, and generation.
* **`app/models/`**: Completely isolates LLM configurations, pings, and generation loops. Zero coupling with API layers.
* **`app/prompts/`**: Declarative prompting blocks. No manual prompt generation resides outside this directory.
