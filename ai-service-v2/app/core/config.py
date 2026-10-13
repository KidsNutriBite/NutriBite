from typing import List, Union, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "NutriBite AI Microservice V2"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    API_V1_STR: str = "/api/v1"
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    # Security Configuration
    JWT_SECRET_KEY: str = "default_secret_key_change_me_in_production"
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # API Keys Configuration
    GEMINI_API_KEY: Optional[str] = None

    # MongoDB Configuration
    MONGO_URI: str = "mongodb://127.0.0.1:27017/nutrikid"
    MONGO_DB_NAME: str = "nutrikid"

    # Same encoder as ProductionHybridRetriever (RAG dense index)
    EMBEDDING_MODEL_NAME: str = "intfloat/e5-small-v2"

    # Phase 3 candidate discovery thresholds
    DISCOVERY_EXACT_THRESHOLD: float = 1.0
    DISCOVERY_FUZZY_THRESHOLD: float = 0.80
    DISCOVERY_EMBEDDING_THRESHOLD: float = 0.70
    DISCOVERY_SENTENCE_THRESHOLD: float = 0.55
    DISCOVERY_MAX_CANDIDATES_PER_ENTITY: int = 500
    DISCOVERY_MIN_NGRAM: int = 1
    DISCOVERY_MAX_NGRAM: int = 4

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()

