from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api.router import api_router
from app.core.exceptions import global_exception_handler, APIException
from app.middleware.logging import RequestLoggingMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.jwt_auth import JWTAuthMiddleware
from app.utils.logger import logger

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup hook
    logger.info("Starting up NutriBite AI Microservice V2...")
    # Initialize DB pools, load models here in future phases
    yield
    # Shutdown hook
    logger.info("Shutting down NutriBite AI Microservice V2...")
    # Clean up resources here in future phases

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="2.0.0",
    description="Production-grade AI Infrastructure Skeleton (Phase 1A)",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Exception Handlers
app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(APIException, global_exception_handler)

# Middleware Setup (Order matters: outermost to innermost)
# 1. CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# 2. Rate Limiting
app.add_middleware(RateLimitMiddleware)
# 3. Request Logging (Latency, Request ID)
app.add_middleware(RequestLoggingMiddleware)
# 4. JWT Auth (Scaffolding)
app.add_middleware(JWTAuthMiddleware)

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
