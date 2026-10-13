from fastapi import APIRouter
from app.api.v1 import health, websocket, chat, dynamic_entities, candidate_review, adaptation, ner_demo

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(websocket.router, tags=["websocket"])
api_router.include_router(chat.router, tags=["chat"])
api_router.include_router(dynamic_entities.router, tags=["Dynamic Entity Registry"])
api_router.include_router(candidate_review.router, tags=["Candidate Review"])
api_router.include_router(adaptation.router, tags=["Model Adaptation"])
api_router.include_router(ner_demo.router, tags=["Live NER Demo"])
