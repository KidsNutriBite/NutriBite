from fastapi import APIRouter
from app.api.v1 import health, websocket, chat

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(websocket.router, tags=["websocket"])
api_router.include_router(chat.router, tags=["chat"])
