import httpx
from .base import LLMClient

class OllamaClient(LLMClient):

    def __init__(self, host: str, model: str):
        self.host = host
        self.model = model

    async def chat(self, prompt: str, system_prompt: str) -> dict:
        async with httpx.AsyncClient(timeout=600) as c:
            r = await c.post(
                f"{self.host}/api/generate",
                json={
                    "model": self.model,
                    "prompt": f"System: {system_prompt}\n\nUser: {prompt}",
                    "stream": False,
                }
            )
        r.raise_for_status()
        data = r.json()
        return {"response": data["response"], "model": self.model}
