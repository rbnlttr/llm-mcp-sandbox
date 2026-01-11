from abc import ABC, abstractmethod

class LLMClient(ABC):
    @abstractmethod
    async def chat(self, prompt: str, system_prompt: str) -> dict:
        ...
