"""
app.py — FastAPI Application for NutriKid LangGraph Agent
==========================================================

Endpoints
---------
POST /agent/chat     — Main agentic conversation endpoint
GET  /agent/health   — Health-check for Docker / Prometheus
GET  /agent/graph    — Returns ASCII representation of the compiled graph

Usage
-----
    uvicorn app:app --host 0.0.0.0 --port 8080 --reload

Environment variables (see .env.example)
-----------------------------------------
    GROQ_API_KEY            — Groq API key (optional; uses Ollama if absent)
    OPENAI_API_KEY          — OpenAI API key (optional)
    LLM_MODEL_NAME          — Model name for Ollama (default: qwen3:4b)
    OLLAMA_HOST             — Ollama base URL (default: http://localhost:11434)
    AI_SERVICE_URL          — NutriKid FastAPI AI service (default: http://localhost:8000)
    BACKEND_URL             — NutriKid Express backend (default: http://localhost:5000/api)
    NER_SERVICE_URL         — NER microservice (default: http://localhost:8001)
    LANGCHAIN_TRACING_V2    — "true" to enable LangSmith tracing
    LANGCHAIN_API_KEY       — LangSmith API key
    LANGCHAIN_PROJECT       — LangSmith project name
"""

from __future__ import annotations

import logging
import os
import uuid
from typing import Any

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from graph import nutrikid_graph
from state import AgentState

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("nutrikid.app")

# ═══════════════════════════════════════════════════════════════════════════════
# ── FastAPI Application ────────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

app = FastAPI(
    title="NutriKid LangGraph Agent",
    description=(
        "Production-grade agentic orchestration layer for the NutriBite "
        "pediatric nutrition platform. Built with LangGraph, LangChain, "
        "and LangSmith."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS (adjust origins for production) ─────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════════════════════
# ── REQUEST / RESPONSE MODELS ──────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

class ChatRequest(BaseModel):
    """
    POST /agent/chat — Request body
    """
    child_id:        str = Field(...,  description="MongoDB ObjectId of the active child profile.")
    query:           str = Field(...,  description="Parent's natural-language nutrition query.")
    conversation_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="UUID for multi-turn conversation memory. Generate once per session.",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "child_id":        "64a1f3e2b8c9d12e45f67890",
                "query":           "My 5-year-old is showing signs of iron deficiency. What foods should I add?",
                "conversation_id": "c1f2a3b4-d5e6-7890-abcd-ef1234567890",
            }
        }


class ChatResponse(BaseModel):
    """
    POST /agent/chat — Response body
    """
    conversation_id:      str
    child_id:             str
    intent:               str
    final_response:       str
    follow_ups:           list[str]
    safety_flags:         list[str]
    tool_results_summary: dict[str, Any]
    rag_confidence:       float
    step_count:           int
    verification_decision: str


# ═══════════════════════════════════════════════════════════════════════════════
# ── ENDPOINTS ──────────────────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/", summary="Root Status & Navigation")
async def root() -> dict[str, Any]:
    """
    Root endpoint returning service status and navigation links.
    """
    return {
        "service": "NutriKid LangGraph Agent",
        "status": "online",
        "version": "1.0.0",
        "documentation": "/docs",
        "health_check": "/agent/health",
        "graph_topology": "/agent/graph",
        "chat_endpoint": "POST /agent/chat",
    }


@app.post("/agent/chat", response_model=ChatResponse, summary="Agentic Nutrition Chat")
async def agent_chat(req: ChatRequest) -> ChatResponse:
    """
    Main agentic conversation endpoint.

    Flow
    ----
    1. Build the initial AgentState from the request.
    2. Invoke the compiled LangGraph with the conversation_id as thread_id
       (MemorySaver uses this to persist and restore multi-turn context).
    3. Extract the final state and return a structured ChatResponse.

    The graph internally runs:
        Understand → Observe → Plan → Act → Verify
            (loops back to Plan if NEED_MORE_TOOLS & step_count < 4)
        → Synthesize → Follow-up
    """
    logger.info(
        "POST /agent/chat | child_id=%s | conversation_id=%s | query=%s",
        req.child_id,
        req.conversation_id,
        req.query[:80],
    )

    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    if not req.child_id.strip():
        raise HTTPException(status_code=400, detail="child_id is required.")

    # ── Build initial state ───────────────────────────────────────────────────
    initial_state: AgentState = {
        "messages":               [],
        "user_query":             req.query.strip(),
        "normalized_query":       "",
        "intent":                 "",
        "child_id":               req.child_id.strip(),
        "child_context":          {},
        "selected_tools":         [],
        "executed_tools":         [],
        "allow_external":         False,
        "tool_results":           {},
        "rag_confidence":         0.0,
        "verification_decision":  "",
        "verification_reason":    "",
        "step_count":             0,
        "final_response":         "",
        "follow_ups":             [],
        "safety_flags":           [],
        "conversation_id":        req.conversation_id,
    }

    # ── LangGraph config (thread_id enables MemorySaver multi-turn) ───────────
    langgraph_config = {
        "configurable": {
            "thread_id": req.conversation_id,
        },
        # LangSmith run metadata
        "metadata": {
            "child_id":        req.child_id,
            "conversation_id": req.conversation_id,
        },
        "run_name": f"NutriKid-{req.conversation_id[:8]}",
    }

    # ── Invoke the graph ──────────────────────────────────────────────────────
    try:
        final_state: AgentState = nutrikid_graph.invoke(
            initial_state,
            config=langgraph_config,
        )
    except Exception as exc:
        logger.exception("Graph invocation failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail=f"Agent execution failed: {exc}",
        )

    # ── Build tool results summary (truncate for API response) ────────────────
    tool_results_summary: dict[str, Any] = {}
    for tool_name, result in final_state.get("tool_results", {}).items():
        if isinstance(result, dict):
            # Return only top-level keys and their types/values (truncated)
            tool_results_summary[tool_name] = {
                k: (str(v)[:200] if len(str(v)) > 200 else v)
                for k, v in result.items()
            }
        else:
            tool_results_summary[tool_name] = str(result)[:300]

    response = ChatResponse(
        conversation_id=       req.conversation_id,
        child_id=              req.child_id,
        intent=                final_state.get("intent", "UNKNOWN"),
        final_response=        final_state.get("final_response", "No response generated."),
        follow_ups=            final_state.get("follow_ups", []),
        safety_flags=          final_state.get("safety_flags", []),
        tool_results_summary=  tool_results_summary,
        rag_confidence=        final_state.get("rag_confidence", 0.0),
        step_count=            final_state.get("step_count", 0),
        verification_decision= final_state.get("verification_decision", ""),
    )

    logger.info(
        "Response generated | intent=%s | steps=%d | decision=%s | flags=%s",
        response.intent,
        response.step_count,
        response.verification_decision,
        response.safety_flags,
    )
    return response


@app.get("/agent/health", summary="Health Check")
async def health_check() -> dict[str, str]:
    """
    Lightweight health check for Docker HEALTHCHECK and Prometheus scraping.
    """
    return {
        "status":  "ok",
        "service": "NutriKid LangGraph Agent",
        "version": "1.0.0",
    }


@app.get("/agent/graph", summary="Graph Topology")
async def get_graph_info() -> dict[str, Any]:
    """
    Returns the graph's node and edge topology.
    Useful for debugging and documentation.
    """
    return {
        "nodes": [
            "understand", "observe", "plan", "act",
            "verify", "synthesize", "follow_up",
        ],
        "edges": [
            {"from": "START",      "to": "understand"},
            {"from": "understand", "to": "observe"},
            {"from": "observe",    "to": "plan"},
            {"from": "plan",       "to": "act"},
            {"from": "act",        "to": "verify"},
            {"from": "verify",     "to": "plan",      "condition": "NEED_MORE_TOOLS & step_count < MAX_STEPS"},
            {"from": "verify",     "to": "synthesize", "condition": "PROCEED | BLOCK | step_count >= MAX_STEPS"},
            {"from": "synthesize", "to": "follow_up"},
            {"from": "follow_up",  "to": "END"},
        ],
        "max_steps":   4,
        "checkpointer": "MemorySaver (in-memory, multi-turn)",
        "langsmith":    os.getenv("LANGCHAIN_TRACING_V2", "false"),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ── GLOBAL EXCEPTION HANDLER ──────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={
            "error":   "Internal server error",
            "detail":  str(exc),
            "path":    str(request.url),
        },
    )


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=int(os.getenv("AGENT_PORT", "8080")),
        reload=os.getenv("DEBUG", "false").lower() == "true",
        log_level="info",
    )
