from app.services.file_extractor import FileExtractor
from pathlib import Path

def test_txt_extraction(tmp_path: Path):
    f = tmp_path / "test.txt"
    f.write_text("Hello World")

    extractor = FileExtractor()
    assert extractor.extract(f) == "Hello World"
