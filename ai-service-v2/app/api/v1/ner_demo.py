from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any

router = APIRouter(prefix="/ner-demo", tags=["Live NER Demo"])

class NerExtractRequest(BaseModel):
    text: str

class EntityExtraction(BaseModel):
    surface_form: str
    entity_type: str
    normalized: str
    confidence: float

class NerExtractResponse(BaseModel):
    text: str
    entities: List[EntityExtraction]

@router.post("/extract", response_model=NerExtractResponse, summary="Extract Entities (Live NER Demo)")
async def extract_entities(payload: NerExtractRequest):
    """
    Live NER demo extraction. In a real system, this would call the loaded NER model.
    Here we implement a robust heuristic based on the NutriBite corpus for the demo.
    """
    text = payload.text.lower()
    entities = []
    
    # Mocking real NER extraction mapping to corpus entities
    rules = {
        "FOOD": ["vegetables", "apple", "chicken", "rice", "dal", "milk", "egg", "eggs"],
        "NUTRIENT": ["protein", "vitamin c", "calcium", "iron", "carbohydrates", "energy"],
        "COOKING_METHOD": ["steaming", "steamed", "boiled", "boiling", "fried", "roasted", "baked"],
        "SUPPLEMENT": ["whey", "multivitamin", "creatine", "omega-3"],
        "DIET_PATTERN": ["vegan", "keto", "vegetarian", "paleo", "veg", "non-veg"],
        "AGE_GROUP": ["toddler", "infant", "child", "teen", "teenager", "adult"]
    }
    
    words = text.split()
    # Very simple span matcher for demo purposes
    for i, word in enumerate(words):
        clean_word = "".join(c for c in word if c.isalnum())
        for ent_type, keywords in rules.items():
            if clean_word in keywords:
                entities.append(EntityExtraction(
                    surface_form=word,
                    entity_type=ent_type,
                    normalized=clean_word.upper(),
                    confidence=0.92 + (len(clean_word) % 5) * 0.01
                ))
                break
                
    # Entity Linker Output format
    return NerExtractResponse(
        text=payload.text,
        entities=entities
    )

class RagContextRequest(BaseModel):
    query: str
    extracted_entities: List[EntityExtraction]

@router.post("/rag-context", summary="Simulate Entity-Aware RAG")
async def rag_context(payload: RagContextRequest):
    """
    Shows how extracted entities are used to filter and augment the RAG retrieval.
    """
    linked = []
    for ent in payload.extracted_entities:
        linked.append(f"{ent.surface_form} → {ent.entity_type} (Weight: {ent.confidence:.2f})")
        
    return {
        "pipeline_steps": [
            "Query Received",
            f"Extracted {len(payload.extracted_entities)} entities",
            "Entity Linking against Food & Guidelines DB",
            "Vector Search with Entity Bias",
            "Context Retrieval"
        ],
        "linked_entities": linked,
        "retrieved_context_preview": "Dietary guidelines state that " + ", ".join([e.surface_form for e in payload.extracted_entities]) + " are important considerations for this query."
    }
