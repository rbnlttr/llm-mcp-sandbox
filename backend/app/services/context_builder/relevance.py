class RelevanceScorer:
    def score(self, query: str, text: str) -> float:
        query_terms = set(query.lower().split())
        text_terms = text.lower().split()

        if not text_terms:
            return 0.0

        hits = sum(1 for t in text_terms if t in query_terms)
        return hits / len(text_terms)
