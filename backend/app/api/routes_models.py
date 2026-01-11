from fastapi import APIRouter
from core.config import settings

router = APIRouter()

@router.get("/models")
def models():
    return {
        "models": [
            {"name": settings.local_model, "type": "local"},
            {"name": "claude-sonnet-4", "type": "cloud"},
        ]
    }
