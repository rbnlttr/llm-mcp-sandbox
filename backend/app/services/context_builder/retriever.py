from core.retrieval import Retriever 

class HybridRetriever:
    def __init__(self, lexical: Retriever, embedding: Retriever | None = None):
        self.lexical = lexical
        self.embedding = embedding

    def retrieve(self, query: str, docs: list[str]):
        results = self.lexical.retrieve(query, docs)

        if self.embedding:
            emb = self.embedding.retrieve(query, docs)
            results.extend(emb)

        # normalize & rerank
        return sorted(results, key=lambda r: r.score, reverse=True)
