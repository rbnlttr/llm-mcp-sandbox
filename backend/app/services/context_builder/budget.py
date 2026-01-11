class ContextBudget:
    def __init__(self, max_chars: int):
        self.max_chars = max_chars
        self.used = 0

    def can_add(self, text: str) -> bool:
        return self.used + len(text) <= self.max_chars

    def add(self, text: str):
        self.used += len(text)
