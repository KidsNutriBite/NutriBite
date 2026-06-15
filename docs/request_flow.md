# 🔄 request_flow: End-to-End Execution Flow

This document details how a user query moves through the structured foundation architecture in `ai-service-v2`.

---

## 1. Request Lifecycle Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Client as Client App (Parent/Kid)
    participant APIRouter as FastAPI Router
    participant Orchestrator as ChatOrchestrator
    participant Guardrail as Security & Safety Gates
    participant RAG as Hybrid Retriever (BM25 + FAISS)
    participant Planner as Deterministic Planner
    participant Router as Model Router (Mistral/Gemini)
    participant Trace as Tracing Service

    Client->>APIRouter: HTTP POST /api/v1/chat/ask (Payload)
    APIRouter->>Trace: Initialize TracingSpan
    APIRouter->>Orchestrator: handle_request(Payload)
    
    Orchestrator->>Guardrail: Scan query for Injections & Emergencies
    alt Threat or Emergency Detected
        Guardrail-->>Orchestrator: Block/Triage Response
        Orchestrator-->>Client: Unified Safe JSON (Confidence 0.0)
    end

    Orchestrator->>RAG: retrieve_hybrid_chunks(query)
    RAG-->>Orchestrator: Returns text chunks + Citations list
    Note over Orchestrator,RAG: Profiles Retrieval latency

    Orchestrator->>Planner: generate_personalized_diet_plan(profile)
    Planner-->>Orchestrator: Returns calorie metrics + allergy exclusions

    Orchestrator->>Router: generate(Prompt, target_mode)
    Note over Router: Pings local Ollama -> falls back to Gemini -> fallback Static
    Router-->>Orchestrator: Returns compiled Answer text + Model used

    Orchestrator->>Trace: Record completion spans & profiling trace logs
    Orchestrator->>Client: Send ChatResponse Schema
```

---

## 2. Component Explanations

1. **Security Interception**: Threat gates analyze user prompts immediately. If prompt injection strings or jailbreak commands are detected, execution halts. It does not waste RAG resources or LLM tokens, returning a clean interception verdict instantly.
2. **Safety Gates**: Regular checks search for pediatric emergency keywords. For kids mode, bedtime lockdowns and medical vocabulary restrictions are enforced.
3. **Retrieval**: Retrieval parses the query, matches tokens using standard BM25, searches FAISS inner-product spaces using sentence embeddings, merges inputs via Reciprocal Rank Fusion, and reranks candidate documents using a Cross-Encoder.
4. **Deterministic Calculation**: Algorithmic planner constructs numerical diet plans. It scores meals, adjusts portions, validates caloric bounds, and isolates allergenic foods.
5. **Centralized Routing**: System dispatches structured prompts. Model router prioritizes local Mistral, fallback APIs, and rule-based specialists.
