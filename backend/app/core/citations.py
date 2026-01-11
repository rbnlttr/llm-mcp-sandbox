from dataclasses import dataclass

@dataclass(frozen=True)
class Citation:
    id: str
    source: str
    title: str

class CitationRegistry:
    def __init__(self):
        self._counter = 1
        self._citations: dict[str, Citation] = {}

    def register(self, source: str, title: str) -> str:
        cid = f"[C{self._counter}]"
        self._counter += 1
        self._citations[cid] = Citation(cid, source, title)
        return cid

    def all(self):
        return list(self._citations.values())
