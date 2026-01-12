from fastapi import APIRouter
from core.config import settings

router = APIRouter()

@router.get("/health")
def health():
    return {
        "status": "healthy",
        "ollama_available": True,  # Assuming Ollama is available
        "claude_available": bool(settings.ANTHROPIC_API_KEY),
        "default_llm": "local" if settings.USE_LOCAL_LLM else "cloud"
    }
