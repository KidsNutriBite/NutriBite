from fastapi import Request, status
from fastapi.responses import JSONResponse
from app.utils.logger import logger

class APIException(Exception):
    """Base exception for all API errors."""
    def __init__(self, message: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class ResourceNotFoundException(APIException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message=message, status_code=status.HTTP_404_NOT_FOUND)

class RateLimitException(APIException):
    def __init__(self, message: str = "Too many requests"):
        super().__init__(message=message, status_code=status.HTTP_429_TOO_MANY_REQUESTS)

class UnauthorizedException(APIException):
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message=message, status_code=status.HTTP_401_UNAUTHORIZED)

async def global_exception_handler(request: Request, exc: Exception):
    """Centralized exception handler to return structured JSON errors."""
    if isinstance(exc, APIException):
        logger.warning(f"API Exception: {exc.message} | Path: {request.url.path}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": True, "message": exc.message, "path": request.url.path}
        )
    
    # Unhandled exceptions
    logger.error(f"Unhandled Exception: {str(exc)} | Path: {request.url.path}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": True, "message": "Internal Server Error", "path": request.url.path}
    )
