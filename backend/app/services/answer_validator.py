import re

class CitationValidator:

    def validate(self, answer: str, valid_ids: set[str]) -> None:
        used = set(re.findall(r"\[C\d+\]", answer))

        if not used:
            raise ValueError("Antwort enthält KEINE Zitate")

        invalid = used - valid_ids
        if invalid:
            raise ValueError(f"Ungültige Zitate: {invalid}")
