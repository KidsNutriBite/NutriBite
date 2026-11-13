"""
graph.py — LangGraph StateGraph Construction for NutriKid Agent
================================================================

Graph topology
--------------

  [Understand] → [Observe] → [Plan] → [Act] → [Verify]
                                         ↑           |
                              NEED_MORE_TOOLS ←──────┘
                                                     |
                                               PROCEED / BLOCK
                                                     ↓
                                             [Synthesize] → [Follow-up]

Controlled cycles: Plan → Act → Verify loops at most MAX_STEPS times.
MemorySaver is used for multi-turn persistence (thread_id = conversation_id).
LangSmith tracing is enabled via LANGCHAIN_TRACING_V2 env variable.
"""

from __future__ import annotations

import logging
import os
from typing import Literal

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph

from algorithms import MAX_STEPS
from nodes import (
    node_act,
    node_followup,
    node_observe,
    node_plan,
    node_synthesize,
    node_understand,
    node_verify,
)
from state import AgentState

logger = logging.getLogger("nutrikid.graph")

# ── LangSmith tracing (enable by setting env vars) ────────────────────────────
# Set in .env:
#   LANGCHAIN_TRACING_V2=true
#   LANGCHAIN_API_KEY=<your-langsmith-key>
#   LANGCHAIN_PROJECT=NutriKid-Agent
_LANGSMITH_ENABLED = os.getenv("LANGCHAIN_TRACING_V2", "false").lower() == "true"
if _LANGSMITH_ENABLED:
    logger.info("LangSmith tracing enabled. Project: %s", os.getenv("LANGCHAIN_PROJECT", "NutriKid-Agent"))


# ═══════════════════════════════════════════════════════════════════════════════
# ── CONDITIONAL EDGE: Verify → Plan | Synthesize ──────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

def route_after_verify(
    state: AgentState,
) -> Literal["plan", "synthesize"]:
    """
    Conditional routing function called after the Verify node.

    Rules
    -----
    - If decision == "NEED_MORE_TOOLS" AND step_count < MAX_STEPS:
          loop back to Plan for another tool execution cycle.
    - Otherwise (PROCEED, BLOCK, or max steps reached):
          forward to Synthesize.
    """
    decision   = state.get("verification_decision", "PROCEED")
    step_count = state.get("step_count", 0)

    if decision == "NEED_MORE_TOOLS" and step_count < MAX_STEPS:
        logger.info(
            "[Router] NEED_MORE_TOOLS at step %d/%d → routing to Plan",
            step_count,
            MAX_STEPS,
        )
        return "plan"

    logger.info(
        "[Router] decision=%s at step %d → routing to Synthesize",
        decision,
        step_count,
    )
    return "synthesize"


# ═══════════════════════════════════════════════════════════════════════════════
# ── GRAPH CONSTRUCTION ─────────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

def build_graph() -> StateGraph:
    """
    Construct and compile the NutriKid LangGraph StateGraph.

    Returns
    -------
    CompiledStateGraph
        A compiled LangGraph that can be invoked with:
            graph.invoke(initial_state, config={"configurable": {"thread_id": conversation_id}})
    """
    # ── Create the graph with AgentState schema ───────────────────────────────
    builder = StateGraph(AgentState)

    # ── Register the 7 nodes ──────────────────────────────────────────────────
    builder.add_node("understand",  node_understand)
    builder.add_node("observe",     node_observe)
    builder.add_node("plan",        node_plan)
    builder.add_node("act",         node_act)
    builder.add_node("verify",      node_verify)
    builder.add_node("synthesize",  node_synthesize)
    builder.add_node("follow_up",   node_followup)

    # ── Define the linear backbone edges ─────────────────────────────────────
    builder.add_edge(START,         "understand")
    builder.add_edge("understand",  "observe")
    builder.add_edge("observe",     "plan")
    builder.add_edge("plan",        "act")
    builder.add_edge("act",         "verify")

    # ── Conditional edge: Verify → (Plan | Synthesize) ───────────────────────
    builder.add_conditional_edges(
        "verify",
        route_after_verify,
        {
            "plan":      "plan",        # loop back
            "synthesize": "synthesize", # proceed to synthesis
        },
    )

    # ── Terminal linear edges ─────────────────────────────────────────────────
    builder.add_edge("synthesize",  "follow_up")
    builder.add_edge("follow_up",   END)

    # ── Compile with MemorySaver for multi-turn conversation support ──────────
    memory = MemorySaver()
    compiled = builder.compile(checkpointer=memory)

    logger.info(
        "NutriKid LangGraph compiled successfully. "
        "Nodes: understand→observe→plan→act→verify→[loop|synthesize]→follow_up. "
        "Max steps: %d. MemorySaver: enabled. LangSmith: %s.",
        MAX_STEPS,
        "enabled" if _LANGSMITH_ENABLED else "disabled",
    )
    return compiled


# ── Singleton compiled graph ──────────────────────────────────────────────────
nutrikid_graph = build_graph()
