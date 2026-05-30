from fastapi import APIRouter

from app.api.v1 import auth, health, paragraphs, settings

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(settings.router)
api_router.include_router(paragraphs.router)
