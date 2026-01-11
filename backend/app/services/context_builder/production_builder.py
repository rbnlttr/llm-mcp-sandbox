from services.context_builder.chunker import TextChunker
from core.token_budget import TokenBudget
from core.citations import CitationRegistry
from core.lexical import LexicalRetriever
from services.context_builder.retriever import HybridRetriever

class ProductionMCPContextBuilder:

    def __init__(self, query: str, max_tokens: int = 8_000):
        self.query = query
        self.chunker = TextChunker()
        self.budget = TokenBudget(max_tokens)
        self.citations = CitationRegistry()
        self.retriever = HybridRetriever(LexicalRetriever())
        self.blocks: list[str] = []

    def add_document(self, *, title: str, content: str, source: str):
        citation_id = self.citations.register(source, title)
        chunks = self.chunker.split(content)

        ranked = self.retriever.retrieve(self.query, chunks)

        for r in ranked:
            block = (
                f"\n--- {title} {citation_id} ---\n"
                f"{r.text.strip()}\n"
            )
            if not self.budget.can_add(block):
                break
            self.blocks.append(block)
            self.budget.add(block)

    def build(self) -> str:
        header = (
            "=== MCP KONTEXT (PRODUCTION) ===\n"
            "REGELN:\n"
            "- Jede Aussage MUSS [C#] zitieren\n"
            "- Keine externe Annahmen\n"
            "- Wenn Information fehlt: 'Nicht im Kontext enthalten'\n"
        )

        sources = "\n\n=== QUELLEN ===\n"
        for c in self.citations.all():
            sources += f"{c.id} {c.title} ({c.source})\n"

        return header + "".join(self.blocks) + sources
