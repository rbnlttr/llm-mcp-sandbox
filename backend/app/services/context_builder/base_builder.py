from typing import List
from dataclasses import dataclass

@dataclass
class ContextSource:
    title: str
    content: str
    source: str  # Dateipfad / Herkunft


class MCPContextBuilder:
    """
    Baut strukturierten, begrenzten Kontext für LLMs
    """

    def __init__(self, max_chars: int = 30_000):
        self.max_chars = max_chars
        self._sections: List[str] = []

    def add_section(self, title: str):
        self._sections.append(f"\n\n=== {title.upper()} ===\n")

    def add_source(self, source: ContextSource):
        block = (
            f"\n--- {source.title} ---\n"
            f"Quelle: {source.source}\n\n"
            f"{source.content}\n"
        )
        self._sections.append(block)

    def build(self) -> str:
        context = f"""
Du bist ein AI-Assistent mit MCP-Regeln.

REGELN:
- Nutze ausschließlich den Kontext
- Jede Aussage MUSS mit [C#] zitiert werden
- Wenn keine Quelle vorhanden ist, sage: "Nicht im Kontext enthalten"
"""
        for section in self._sections:
            if len(context) + len(section) > self.max_chars:
                break
            context += section
        return context.strip()

async def chat(self, message: str, context_builder: ProductionMCPContextBuilder):
        system_prompt = f"""


{context_builder.build()}
"""