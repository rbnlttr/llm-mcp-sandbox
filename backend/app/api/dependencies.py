from core.config import settings
from services.llm.ollama import OllamaClient as OllamaLLM
from services.llm.claude import ClaudeClient as ClaudeLLM
from services.chat_service import ChatService

def get_llm():
    if settings.use_local_llm:
        return OllamaLLM(settings.ollama_host, settings.local_model)
    return ClaudeLLM(settings.anthropic_api_key)

def get_chat_service():
    return ChatService(get_llm())
