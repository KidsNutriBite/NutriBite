import logging
import sys
from pythonjsonlogger import jsonlogger
from app.core.config import settings

def setup_logger(name: str = "ai_service_v2") -> logging.Logger:
    """Configures structured JSON logging for the application."""
    logger = logging.getLogger(name)
    
    # Set log level based on config
    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    logger.setLevel(level)

    # Avoid adding duplicate handlers
    if not logger.handlers:
        log_handler = logging.StreamHandler(sys.stdout)
        
        # Define the JSON log format
        formatter = jsonlogger.JsonFormatter(
            '%(asctime)s %(levelname)s %(name)s %(message)s'
        )
        log_handler.setFormatter(formatter)
        logger.addHandler(log_handler)

    return logger

logger = setup_logger()
