from pydantic import BaseModel, Field
from typing import Dict, Any

class HealthResponse(BaseModel):
    status: str = Field(..., description="Service health status")
    timestamp: str = Field(..., description="ISO 8601 formatted timestamp")
    uptime_seconds: float = Field(..., description="Service uptime in seconds")

class MetricsResponse(BaseModel):
    status: str = Field(..., description="Metrics availability status")
    timestamp: str = Field(..., description="ISO 8601 formatted timestamp")
    metrics: Dict[str, Any] = Field(default_factory=dict, description="Basic application metrics")
