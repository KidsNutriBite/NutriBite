from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader
from app.core.config import settings

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def verify_api_key(api_key_header: str = Security(api_key_header)):
    """
    Scaffolding for API Key validation.
    To be expanded in future phases for M2M authentication.
    """
    if not api_key_header:
        # Currently bypassed for development/Phase 1A.
        # Raise exception in production if required.
        pass
        
    # Example logic:
    # if api_key_header != settings.EXPECTED_API_KEY:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN, detail="Could not validate credentials"
    #     )
    
    return api_key_header

# Note: Full JWT validation scaffolding will be in app/middleware/jwt_auth.py
