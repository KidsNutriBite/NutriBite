import time
from datetime import datetime, timezone
from fastapi import APIRouter
from app.schemas.health import HealthResponse, MetricsResponse

router = APIRouter()

# Capture start time when module loads
START_TIME = time.time()

def _get_uptime() -> float:
    return round(time.time() - START_TIME, 2)

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Basic health check endpoint."""
    return HealthResponse(
        status="ok",
        timestamp=datetime.now(timezone.utc).isoformat(),
        uptime_seconds=_get_uptime()
    )

@router.get("/ready", response_model=HealthResponse)
async def readiness_check():
    """
    Readiness probe. In a full system, this would check DB/Redis connections.
    For Phase 1A infrastructure, it simply returns OK.
    """
    # Future: check db.is_connected()
    return HealthResponse(
        status="ready",
        timestamp=datetime.now(timezone.utc).isoformat(),
        uptime_seconds=_get_uptime()
    )

@router.get("/metrics", response_model=MetricsResponse)
async def metrics():
    """
    Basic metrics endpoint.
    Future: Export actual prometheus metrics from here.
    """
    return MetricsResponse(
        status="active",
        timestamp=datetime.now(timezone.utc).isoformat(),
        metrics={
            "uptime_seconds": _get_uptime(),
            "active_connections": 0  # Scaffolding for WebSocket tracking
        }
    )
