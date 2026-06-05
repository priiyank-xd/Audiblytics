from fastapi import APIRouter

from app.api.v1 import auth, collection, completions, days_of_use, health, paragraphs, recordings, settings

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(settings.router)
api_router.include_router(paragraphs.router)
api_router.include_router(recordings.router)
api_router.include_router(collection.router)
api_router.include_router(completions.router)
api_router.include_router(days_of_use.router)
