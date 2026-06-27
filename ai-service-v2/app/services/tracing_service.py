import time
import uuid
from typing import Dict, Any, Optional
from app.utils.logger import logger

class TracingService:
    @staticmethod
    def generate_request_id() -> str:
        return str(uuid.uuid4())

    def __init__(self, request_id: Optional[str] = None):
        self.request_id = request_id or self.generate_request_id()
        self.start_time = time.time()
        self.metrics: Dict[str, Any] = {
            "request_id": self.request_id,
            "retrieval_time_ms": 0.0,
            "generation_time_ms": 0.0,
            "latency_ms": 0.0,
            "model_used": "unknown",
            "confidence": 0.0,
            "status": "initiated"
        }

    def start_span(self) -> float:
        return time.time()

    def end_span(self, start_timestamp: float) -> float:
        return round((time.time() - start_timestamp) * 1000, 2)

    def log_retrieval(self, duration_ms: float, count: int):
        self.metrics["retrieval_time_ms"] = duration_ms
        logger.info(f"[{self.request_id}] RAG Retrieval complete in {duration_ms}ms. Chunks returned: {count}")

    def log_generation(self, duration_ms: float, model: str, confidence: float):
        self.metrics["generation_time_ms"] = duration_ms
        self.metrics["model_used"] = model
        self.metrics["confidence"] = confidence
        logger.info(f"[{self.request_id}] LLM Generation complete via {model} in {duration_ms}ms. Confidence: {confidence}")

    def log_complete(self, query: str, status: str = "success"):
        self.metrics["latency_ms"] = round((time.time() - self.start_time) * 1000, 2)
        self.metrics["status"] = status
        
        # Output clean structured metrics trace log
        logger.info(
            f"Trace: RequestID={self.request_id} | Query=\"{query[:50]}...\" | "
            f"Model={self.metrics['model_used']} | Latency={self.metrics['latency_ms']}ms | "
            f"RetrievalTime={self.metrics['retrieval_time_ms']}ms | "
            f"GenerationTime={self.metrics['generation_time_ms']}ms | "
            f"Confidence={self.metrics['confidence']} | Status={status}"
        )

def get_tracing_service(request_id: Optional[str] = None) -> TracingService:
    return TracingService(request_id)
