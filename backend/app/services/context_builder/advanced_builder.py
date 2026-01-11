from typing import List
from services.context_builder.chunker import TextChunker
from services.context_builder.relevance import RelevanceScorer
from services.context_builder.budget import ContextBudget
from core.citations import CitationRegistry

class AdvancedMCPContextBuilder:

    def __init__(self, query: str, max_chars: int = 30_000):
        self.query = query
        self.chunker = TextChunker()
        self.scorer = RelevanceScorer()
        self.budget = ContextBudget(max_chars)
        self.citations = CitationRegistry()
        self._blocks: List[str] = []

    def add_document(self, *, title: str, content: str, source: str):
        citation_id = self.citations.register(source, title)
        chunks = self.chunker.split(content)

        ranked = sorted(
            chunks,
            key=lambda c: self.scorer.score(self.query, c),
            reverse=True
        )

        for chunk in ranked:
            block = (
                f"\n--- {title} {citation_id} ---\n"
                f"{chunk.strip()}\n"
            )
            if not self.budget.can_add(block):
                break

            self._blocks.append(block)
            self.budget.add(block)

    def build(self) -> str:
        header = (
            "=== MCP KONTEXT ===\n"
            "Alle Aussagen müssen mit [C#] zitiert werden.\n"
        )

        body = "".join(self._blocks)

        citations = "\n\n=== QUELLEN ===\n"
        for c in self.citations.all():
            citations += f"{c.id} {c.title} ({c.source})\n"

        return header + body + citations
