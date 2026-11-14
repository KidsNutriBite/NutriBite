"""
nutrikid_langgraph_agent/mcp_server.py
======================================
Model Context Protocol (MCP) Server for NutriKid Clinical Pediatric Tools
=========================================================================

Exposes all 7 NutriKid tools over the official Model Context Protocol (MCP)
JSON-RPC 2.0 specification:
  1. rag_search          — FAISS + BM25 ICMR-NIN & WHO guideline retrieval
  2. nutrition_analysis  — ICMR 2020 RDA & IFCT database nutrient gap math
  3. growth_analysis     — WHO growth standards percentile calculator
  4. meal_planner        — KidsNutri database 6-meal allergen-filtered planner
  5. web_search          — Live DuckDuckGo scientific literature search
  6. update_rag          — Continuous knowledge base vector embedding ingestion
  7. update_ner          — Dynamic clinical Named Entity Recognition ontology updater

Transports supported:
  • stdio (standard MCP pipe for Claude Desktop, Cursor, AGY CLI)
  • HTTP/JSON-RPC (port 8081 for Express / web clients)
"""

import sys
import json
import logging
from typing import Any, Dict, List

# Import actual tool functions
from tools import (
    rag_search,
    nutrition_analysis,
    growth_analysis,
    meal_planner,
    web_search,
    update_rag,
    update_ner,
    TOOL_REGISTRY,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [MCP] %(message)s")
logger = logging.getLogger("NutriKid-MCP")

# ═══════════════════════════════════════════════════════════════════════════════
# ── MCP TOOL SCHEMAS (JSON Schema v7 conforming to Anthropic MCP Specification)──
# ═══════════════════════════════════════════════════════════════════════════════

MCP_TOOLS: List[Dict[str, Any]] = [
    {
        "name": "rag_search",
        "description": "Searches ICMR-NIN 2020 pediatric guidelines and WHO manuals via hybrid FAISS + BM25 RAG.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Pediatric nutrition or clinical guideline question."},
                "child_id": {"type": "string", "description": "Optional child profile identifier.", "default": ""}
            },
            "required": ["query"]
        }
    },
    {
        "name": "nutrition_analysis",
        "description": "Calculates macronutrient & micronutrient gaps against ICMR-NIN 2020 Recommended Dietary Allowances.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "child_id": {"type": "string", "description": "Target child profile ID.", "default": "demo_123"},
                "age_years": {"type": "number", "description": "Age in years.", "default": 5.0},
                "weight_kg": {"type": "number", "description": "Weight in kilograms.", "default": 18.0},
                "gender": {"type": "string", "enum": ["male", "female", "neutral"], "default": "female"},
                "query": {"type": "string", "description": "Parent's dietary context.", "default": ""}
            }
        }
    },
    {
        "name": "growth_analysis",
        "description": "Computes WHO percentile curves, BMI z-score, and stature velocity for anthropometric assessment.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "child_id": {"type": "string", "description": "Child profile identifier.", "default": "demo_123"}
            },
            "required": ["child_id"]
        }
    },
    {
        "name": "meal_planner",
        "description": "Queries KidsNutri DB to generate chronological 6-meal allergen-filtered Indian pediatric schedules.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "child_id": {"type": "string", "description": "Child profile ID.", "default": "demo_123"},
                "plan_type": {"type": "string", "enum": ["daily", "weekly"], "default": "daily"},
                "allergies": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Contraindicated allergens to strictly filter out.",
                    "default": []
                },
                "calorie_target": {"type": "number", "description": "Daily caloric target.", "default": 1500}
            }
        }
    },
    {
        "name": "web_search",
        "description": "Queries live DuckDuckGo scientific literature when RAG confidence is < 0.75 in adaptive re-planning.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Scientific nutrition query."}
            },
            "required": ["query"]
        }
    },
    {
        "name": "update_rag",
        "description": "Continuous vector knowledge ingestion into FAISS vector database.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "new_knowledge": {"type": "string", "description": "Validated medical text chunk."},
                "source_label": {"type": "string", "default": "clinical_literature"}
            },
            "required": ["new_knowledge"]
        }
    },
    {
        "name": "update_ner",
        "description": "Updates dynamic clinical Named Entity Recognition ontology with new dishes, allergens, or symptoms.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "entity_text": {"type": "string", "description": "Entity token string."},
                "label": {"type": "string", "description": "Ontology label: DISH, ALLERGEN, NUTRIENT, SYMPTOM."}
            },
            "required": ["entity_text", "label"]
        }
    }
]

# ═══════════════════════════════════════════════════════════════════════════════
# ── JSON-RPC 2.0 PROTOCOL DISPATCHER ──────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════════════════════

def handle_jsonrpc(req: Dict[str, Any]) -> Dict[str, Any]:
    msg_id = req.get("id")
    method = req.get("method")
    params = req.get("params", {})

    # Protocol initialization
    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": msg_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {"listChanged": False}},
                "serverInfo": {"name": "NutriKid-MCP-Server", "version": "1.0.0"}
            }
        }

    # List all available tools
    if method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": msg_id,
            "result": {"tools": MCP_TOOLS}
        }

    # Execute a tool call
    if method == "tools/call":
        tool_name = params.get("name")
        arguments = params.get("arguments", {})

        tool_fn = TOOL_REGISTRY.get(tool_name)
        if not tool_fn:
            return {
                "jsonrpc": "2.0",
                "id": msg_id,
                "error": {"code": -32601, "message": f"Tool '{tool_name}' not found in NutriKid MCP registry."}
            }

        try:
            # Execute tool
            output = tool_fn.invoke(arguments) if hasattr(tool_fn, "invoke") else tool_fn(**arguments)
            return {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {
                    "content": [
                        {"type": "text", "text": json.dumps(output, indent=2, default=str)}
                    ],
                    "isError": False
                }
            }
        except Exception as e:
            logger.exception("Error executing MCP tool %s: %s", tool_name, e)
            return {
                "jsonrpc": "2.0",
                "id": msg_id,
                "error": {"code": -32000, "message": f"Execution failed: {str(e)}"}
            }

    # Default unknown method
    return {
        "jsonrpc": "2.0",
        "id": msg_id,
        "error": {"code": -32601, "message": f"Unknown MCP method: {method}"}
    }


def main():
    """Run standard stdio MCP transport loop."""
    logger.info("NutriKid MCP Server started on stdio transport. Exposing 7 clinical tools.")
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            res = handle_jsonrpc(req)
            sys.stdout.write(json.dumps(res) + "\n")
            sys.stdout.flush()
        except Exception as err:
            err_res = {"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": str(err)}}
            sys.stdout.write(json.dumps(err_res) + "\n")
            sys.stdout.flush()


if __name__ == "__main__":
    main()
