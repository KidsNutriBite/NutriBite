import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from app.utils.logger import logger

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Generate a unique request ID
        request_id = str(uuid.uuid4())
        
        # Inject request_id into state for downstream use
        request.state.request_id = request_id
        
        start_time = time.time()
        
        # Add context to logger if your logger supports context vars, 
        # or just log it directly.
        logger.info("Request started", extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "client_ip": request.client.host if request.client else None
        })
        
        try:
            response = await call_next(request)
            
            process_time = time.time() - start_time
            
            # Inject header
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = str(process_time)
            
            logger.info("Request completed", extra={
                "request_id": request_id,
                "status_code": response.status_code,
                "process_time_ms": round(process_time * 1000, 2)
            })
            
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            logger.error("Request failed", extra={
                "request_id": request_id,
                "error": str(e),
                "process_time_ms": round(process_time * 1000, 2)
            }, exc_info=True)
            raise
