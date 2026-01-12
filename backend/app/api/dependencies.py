from core.config import settings
from services.llm.ollama import OllamaClient as OllamaLLM
from services.llm.claude import ClaudeClient as ClaudeLLM
from services.chat_service import ChatService

def get_llm():
    if settings.USE_LOCAL_LLM:
        return OllamaLLM(settings.OLLAMA_HOST, settings.LOCAL_MODEL)
    return ClaudeLLM(settings.ANTHROPIC_API_KEY)

def get_chat_service():
    return ChatService(get_llm())
