from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from fastapi.responses import JSONResponse
from app.utils.logger import logger

class JWTAuthMiddleware(BaseHTTPMiddleware):
    """
    Scaffolding for JWT Authentication Middleware.
    Will be fully implemented in future phases to support RBAC and User Auth.
    """
    async def dispatch(self, request: Request, call_next):
        # List of public routes that don't require authentication
        public_routes = ["/api/v1/health", "/api/v1/ready", "/api/v1/metrics", "/docs", "/openapi.json"]
        
        # Bypassing auth logic for Phase 1A to ensure connectivity
        # In the future, parse request.headers.get("Authorization") here.
        
        # Example of how it would work:
        # auth_header = request.headers.get("Authorization")
        # if request.url.path not in public_routes:
        #     if not auth_header or not auth_header.startswith("Bearer "):
        #         return JSONResponse(
        #             status_code=401,
        #             content={"error": True, "message": "Missing or invalid authorization header"}
        #         )
        #     # Validate JWT...
        
        request.state.user = None  # Inject user payload here later
        
        return await call_next(request)
