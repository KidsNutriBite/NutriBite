from pydantic import BaseModel, Field
from typing import List, Dict, Any, Union

class ChatResponse(BaseModel):
    answer: Union[str, Dict[str, Any]] = Field(..., description="Conversational text output (parents) or structured JSON object (kids)")
    sources: List[Dict[str, Any]] = Field(default_factory=list, description="List of source citations with document source names and trust levels")
    confidence: float = Field(0.0, description="Overall RAG grounding and reasoning confidence score")
    model_used: str = Field(..., description="Identification string of the LLM or agent used for response generation")
    request_id: str = Field("", description="Unique identifier tracking this execution span")

    model_config = {
        "protected_namespaces": ()
    }
