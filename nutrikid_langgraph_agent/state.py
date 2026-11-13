"""
state.py — AgentState TypedDict for NutriKid LangGraph Agent
=============================================================
Defines the full shared state that flows through all 7 graph nodes.
"""

from __future__ import annotations

from typing import Annotated, Any

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages
from typing_extensions import TypedDict


class AgentState(TypedDict):
    """
    Comprehensive shared state for the NutriKid agentic orchestration graph.

    Fields
    ------
    messages            : Full conversation history (append-only via add_messages reducer).
    user_query          : Raw, un-modified query submitted by the user.
    normalized_query    : Lowercased, trimmed, and whitespace-collapsed version of user_query.
    intent              : Classified intent string (see Algorithm 1).
    child_id            : MongoDB ObjectId string of the active child profile.
    child_context       : Hydrated child profile dict (name, age, allergies, conditions, goals, …).
    selected_tools      : Tools the Plan node has decided to execute this cycle.
    executed_tools      : Accumulative list of tool names that have already been called.
    allow_external      : Whether web_search / update_rag are permitted for this intent.
    tool_results        : Map of tool_name → raw result dict returned by each tool.
    rag_confidence      : Float [0.0, 1.0] confidence score extracted from rag_search result.
    verification_decision : "PROCEED" | "NEED_MORE_TOOLS" | "BLOCK"  (Algorithm 3 output).
    verification_reason : Human-readable explanation for the verification decision.
    step_count          : Number of Plan→Act→Verify cycles completed so far.
    final_response      : Fully synthesised, safety-annotated answer returned to the user.
    follow_ups          : 2-3 proactive follow-up question suggestions.
    safety_flags        : Any safety concerns raised (allergen conflicts, medication advice, …).
    conversation_id     : UUID string for multi-turn memory checkpointing (MemorySaver thread_id).
    """

    # ── Conversation history ──────────────────────────────────────────────────
    messages: Annotated[list[BaseMessage], add_messages]

    # ── Raw & processed query ────────────────────────────────────────────────
    user_query: str
    normalized_query: str

    # ── Intent classification ─────────────────────────────────────────────────
    intent: str

    # ── Child profile ─────────────────────────────────────────────────────────
    child_id: str
    child_context: dict[str, Any]

    # ── Tool orchestration ────────────────────────────────────────────────────
    selected_tools: list[str]
    executed_tools: list[str]
    allow_external: bool
    tool_results: dict[str, Any]

    # ── RAG confidence ────────────────────────────────────────────────────────
    rag_confidence: float

    # ── Verification gate ─────────────────────────────────────────────────────
    verification_decision: str   # "PROCEED" | "NEED_MORE_TOOLS" | "BLOCK"
    verification_reason: str

    # ── Loop control ──────────────────────────────────────────────────────────
    step_count: int

    # ── Output ────────────────────────────────────────────────────────────────
    final_response: str
    follow_ups: list[str]
    safety_flags: list[str]

    # ── Session identity ──────────────────────────────────────────────────────
    conversation_id: str
