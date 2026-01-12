from fastapi import APIRouter
from core.config import settings

router = APIRouter()

@router.get("/models")
def models():
    return {
        "models": [
            {"name": settings.LOCAL_MODEL, "type": "local", "available": True},
            {"name": "claude-sonnet-4", "type": "cloud", "available": bool(settings.ANTHROPIC_API_KEY)},
        ]
    }
