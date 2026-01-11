from app.services.directory import scan_directory

def test_scan_directory(tmp_path):
    (tmp_path / "a.txt").write_text("A")
    (tmp_path / "b.txt").write_text("B")

    result = scan_directory(tmp_path)

    assert result["file_count"] == 2
    assert result["total_size"] > 0
