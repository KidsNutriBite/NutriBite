# NutriKid LangGraph Agent

> Production-grade agentic orchestration layer for the **NutriBite** pediatric nutrition platform.
> Built with **LangGraph**, **LangChain**, and **LangSmith**.

---

## Architecture

```
Understand → Observe → Plan → Act → Verify
                                ↑         |
                     NEED_MORE_TOOLS ◄────┘  (max 4 cycles)
                                         |
                                  PROCEED / BLOCK
                                         ↓
                               Synthesize → Follow-up
```

The graph implements **three formal algorithms**:

| Algorithm | Node | Purpose |
|:---|:---:|:---|
| **Algorithm 1 — IntentClassification** | `Understand` | Normalises the query and maps it to one of 7 intent labels |
| **Algorithm 2 — ToolPlanning** | `Plan` | Selects the right tool set; re-plans if RAG confidence is low |
| **Algorithm 3 — ConfidenceSafetyGating** | `Verify` | Detects allergy conflicts, diagnosis advice, and low-confidence results |

---

## Project Structure

```
nutrikid_langgraph_agent/
├── state.py        → AgentState TypedDict (23 fields)
├── algorithms.py   → The 3 formal algorithms (IntentClassification, ToolPlanning, ConfidenceSafetyGating)
├── tools.py        → 7 LangChain @tool definitions (rag_search, web_search, update_rag, nutrition_analysis, growth_analysis, meal_planner, update_ner)
├── nodes.py        → 7 node functions (understand, observe, plan, act, verify, synthesize, follow_up)
├── graph.py        → StateGraph construction, conditional edges, MemorySaver, LangSmith
├── app.py          → FastAPI application (POST /agent/chat, GET /agent/health, GET /agent/graph)
├── requirements.txt
├── .env.example
└── README.md
```

---

## Quick Start

### 1. Install dependencies

```bash
cd nutrikid_langgraph_agent
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — add at least one LLM key (GROQ recommended)
```

### 3. Run the agent

```bash
uvicorn app:app --host 0.0.0.0 --port 8080 --reload
```

### 4. Test the endpoint

```bash
curl -X POST http://localhost:8080/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "child_id":        "64a1f3e2b8c9d12e45f67890",
    "query":           "My 5-year-old is showing signs of iron deficiency. What foods should I add?",
    "conversation_id": "c1f2a3b4-d5e6-7890-abcd-ef1234567890"
  }'
```

---

## LLM Configuration

The agent supports three LLM backends (priority order):

| Provider | Env Variable | Default Model | Speed |
|:---|:---|:---|:---|
| **Groq** (recommended) | `GROQ_API_KEY` | `llama-3.3-70b-versatile` | Fastest |
| **OpenAI** | `OPENAI_API_KEY` | `gpt-4o-mini` | Fast |
| **Ollama** (local default) | `OLLAMA_HOST` | `qwen2.5:7b` | Slower |

---

## LangSmith Tracing

Set in `.env`:
```env
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langsmith_key
LANGCHAIN_PROJECT=NutriKid-Agent
```

Every agent run will appear in your [LangSmith dashboard](https://smith.langchain.com) with the full node-by-node trace.

---

## Seven Intent Labels (Algorithm 1)

| Intent | Trigger Keywords |
|:---|:---|
| `MEAL_PLANNING` | plan, meal plan, diet plan, weekly plan, what should, suggest meals |
| `GROWTH_ANALYSIS` | growth, height, weight, percentile, who chart, is my child growing |
| `ALLERGY_CHECK` | allergy, allergic, intolerant, reaction, can he eat, safe to give |
| `NUTRITION_ANALYSIS` | nutrient, vitamin, iron, calcium, protein, deficient, how much |
| `KNOWLEDGE_QUERY` | what is, explain, tell me about, benefits of, is good for |
| `NER_UPDATE` | update, new concept, add entity, learn this |
| `GENERAL_NUTRITION_CHAT` | *(default fallback)* |

---

## Seven Tool Stubs

All tools call existing NutriBite microservices via HTTP and fall back to realistic stubs when services are offline.

| Tool | Service | Purpose |
|:---|:---|:---|
| `rag_search` | `ai-service` `:8000/chat` | Query ICMR/NIN RAG pipeline |
| `web_search` | DuckDuckGo | External search when RAG confidence < 0.75 |
| `update_rag` | `ai-service` `:8000/rag/update` | Inject new knowledge into FAISS |
| `nutrition_analysis` | `backend` `:5000/api/nutrition/analyze` | Micronutrient gap analysis |
| `growth_analysis` | `backend` `:5000/api/growth/:id` | WHO growth chart evaluation |
| `meal_planner` | `ai-service` `:8000/meal-plan` | Allergen-safe meal plan generation |
| `update_ner` | `ner-service` `:8001/ner/register` | Queue new entity for HITL review |

---

## Safety Features

- **Allergy Shield** (Algorithm 3, Step 1): Blocks responses if any tool result mentions a food matching the child's registered allergens.
- **Diagnosis/Medication Block** (Algorithm 3, Step 2): Blocks if tool results contain clinical diagnosis or medication advice keywords.
- **Max Steps Circuit Breaker**: Hard-caps the Plan→Act→Verify loop at 4 cycles.
- **Mandatory Disclaimer**: Every synthesised response appends a pediatric safety disclaimer.

---

## Multi-Turn Conversations

Pass the same `conversation_id` across requests. `MemorySaver` will restore the full conversation history for each turn, enabling contextual follow-up questions.

---

*NutriKid LangGraph Agent v1.0.0 — Built as part of the NutriBite Final Year Project*
