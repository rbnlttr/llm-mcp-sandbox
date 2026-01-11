import anthropic
from .base import LLMClient

class ClaudeClient(LLMClient):

    def __init__(self, api_key: str):
        self.client = anthropic.Anthropic(api_key=api_key)

    async def chat(self, prompt: str, system_prompt: str) -> dict:
        msg = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4000,
            system=system_prompt,
            messages=[{"role": "user", "content": prompt}],
        )

        text = "".join(
            block.text for block in msg.content if block.type == "text"
        )

        return {"response": text, "model": msg.model}
