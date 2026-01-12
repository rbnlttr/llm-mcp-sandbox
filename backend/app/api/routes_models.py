from fastapi import APIRouter, HTTPException
from core.config import settings
import httpx
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/models")
def models():
    return {
        "models": [
            {"name": settings.LOCAL_MODEL, "type": "local", "available": True},
            {"name": "claude-sonnet-4", "type": "cloud", "available": bool(settings.ANTHROPIC_API_KEY)},
        ]
    }

@router.post("/ollama/pull")
async def pull_model(model_name: str = settings.LOCAL_MODEL):
    """Pull a model from Ollama registry"""
    try:
        async with httpx.AsyncClient(timeout=600.0) as client:
            response = await client.post(
                f"{settings.OLLAMA_HOST}/api/pull",
                json={"name": model_name}
            )

            if response.status_code == 200:
                return {"status": "success", "message": f"Model {model_name} pulled successfully"}
            else:
                raise HTTPException(status_code=response.status_code, detail=f"Failed to pull model: {response.text}")

    except Exception as e:
        logger.error(f"Error pulling model {model_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Error pulling model: {str(e)}")
