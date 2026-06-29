from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from fastapi.responses import JSONResponse
import time
from app.core.config import settings
from app.utils.logger import logger

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Basic Rate Limiting Scaffolding.
    In Phase 1A, this is an in-memory sliding window concept.
    For production (Phase 2), this should be backed by Redis.
    """
    def __init__(self, app):
        super().__init__(app)
        self.clients = {}
        self.limit = settings.RATE_LIMIT_PER_MINUTE
        self.window = 60

    async def dispatch(self, request: Request, call_next):
        # Exclude health checks from rate limiting
        if request.url.path in ["/api/v1/health", "/api/v1/ready", "/api/v1/metrics"]:
            return await call_next(request)
            
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        
        if client_ip not in self.clients:
            self.clients[client_ip] = []
            
        # Clean up old requests
        self.clients[client_ip] = [t for t in self.clients[client_ip] if now - t < self.window]
        
        if len(self.clients[client_ip]) >= self.limit:
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            return JSONResponse(
                status_code=429,
                content={"error": True, "message": "Too many requests. Please slow down."}
            )
            
        self.clients[client_ip].append(now)
        return await call_next(request)
