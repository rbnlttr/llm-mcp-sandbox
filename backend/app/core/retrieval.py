from abc import ABC, abstractmethod
from typing import List

class RetrievalResult:
    def __init__(self, text: str, score: float, source: str):
        self.text = text
        self.score = score
        self.source = source

class Retriever(ABC):
    @abstractmethod
    def retrieve(self, query: str, documents: List[str]) -> List[RetrievalResult]:
        ...
