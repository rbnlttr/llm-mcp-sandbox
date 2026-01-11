from pathlib import Path
from datetime import datetime
from .file_extractor import FileExtractor

SUPPORTED_EXT = {
    ".pdf", ".docx", ".xlsx", ".pptx",
    ".txt", ".md", ".py", ".json"
}

def scan_directory(path: Path, max_files: int = 100) -> dict:
    extractor = FileExtractor()
    files = []
    total_size = 0

    for p in path.rglob("*"):
        if not p.is_file() or p.suffix.lower() not in SUPPORTED_EXT:
            continue
        if len(files) >= max_files:
            break

        size = p.stat().st_size
        files.append({
            "name": p.name,
            "path": str(p.relative_to(path)),
            "size": size,
            "modified": datetime.fromtimestamp(p.stat().st_mtime).isoformat(),
            "content": extractor.extract(p),
        })
        total_size += size

    return {
        "files": files,
        "file_count": len(files),
        "total_size": total_size,
    }
