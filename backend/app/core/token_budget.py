import math

class TokenBudget:
    """
    Grobe, aber stabile Token-Schätzung (LLM-agnostisch)
    """
    def __init__(self, max_tokens: int):
        self.max_tokens = max_tokens
        self.used = 0

    def estimate(self, text: str) -> int:
        # ~4 chars pro Token (bewährt, konservativ)
        return math.ceil(len(text) / 4)

    def can_add(self, text: str) -> bool:
        return self.used + self.estimate(text) <= self.max_tokens

    def add(self, text: str):
        self.used += self.estimate(text)
