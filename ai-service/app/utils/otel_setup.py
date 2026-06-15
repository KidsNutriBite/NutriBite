import time
from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response

# --- Prometheus Metrics Definitions ---

# Request counts
REQUEST_COUNT = Counter(
    "nutribite_ai_requests_total",
    "Total count of HTTP requests parsed by the AI microservice",
    ["method", "endpoint", "status"]
)

# API Global Latency
REQUEST_LATENCY = Histogram(
    "nutribite_ai_request_latency_seconds",
    "Overall latency duration for API requests in seconds",
    ["method", "endpoint"]
)

# Granular Internal Spans Latency
SPANS_LATENCY = Histogram(
    "nutribite_ai_spans_latency_seconds",
    "Execution latency for specific internal processing blocks (RAG, reranking, LLM, etc.)",
    ["span_name"]
)

# Model specific metrics
LLM_CALL_COUNT = Counter(
    "nutribite_llm_calls_total",
    "Total requests sent to specific LLM models",
    ["model_name", "status"]
)

SAFETY_BLOCK_COUNT = Counter(
    "nutribite_safety_blocks_total",
    "Total counts of queries blocked by active guardrails",
    ["category"]
)

RETRIEVAL_MISS_COUNT = Counter(
    "nutribite_retrieval_misses_total",
    "Total counts of queries returning zero RAG context chunks"
)

# --- Instrumentation Middleware ---

class PrometheusMetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path in ["/metrics", "/", "/docs", "/openapi.json"]:
            return await call_next(request)
            
        endpoint = request.url.path
        method = request.method
        
        start_time = time.time()
        try:
            response = await call_next(request)
            duration = time.time() - start_time
            
            REQUEST_COUNT.labels(method=method, endpoint=endpoint, status=response.status_code).inc()
            REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(duration)
            return response
        except Exception as e:
            duration = time.time() - start_time
            REQUEST_COUNT.labels(method=method, endpoint=endpoint, status=500).inc()
            REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(duration)
            raise e

def instrument_app(app: FastAPI):
    """
    Hooks metrics endpoints and instrumentation middlewares into the FastAPI application instance.
    """
    app.add_middleware(PrometheusMetricsMiddleware)
    
    @app.get("/metrics")
    def metrics_endpoint():
        return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

class TraceSpan:
    """
    A clean, Pythonic context manager to trace and record execution time of specific spans of code.
    Example:
        with TraceSpan("reranking"):
            # run rerank logic
    """
    def __init__(self, span_name: str):
        self.span_name = span_name
        self.start = 0.0
        
    def __enter__(self):
        self.start = time.time()
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = time.time() - self.start
        SPANS_LATENCY.labels(span_name=self.span_name).observe(duration)
