from core.retrieval import Retriever, RetrievalResult

class LexicalRetriever(Retriever):
    def retrieve(self, query: str, documents: list[str]):
        q = set(query.lower().split())
        results = []

        for doc in documents:
            words = doc.lower().split()
            hits = sum(1 for w in words if w in q)
            score = hits / max(len(words), 1)
            results.append(RetrievalResult(doc, score, "lexical"))

        return sorted(results, key=lambda r: r.score, reverse=True)
