import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
DECISIONS_DIR = REPO_ROOT / "docs" / "decisions"
BV_PATTERN = re.compile(r"\bBV\d{1,2}\b")


def test_decisions_directory_has_three_adrs() -> None:
    adr_files = [
        path
        for path in DECISIONS_DIR.glob("*.md")
        if path.name != "README.md" and path.name[:4].isdigit()
    ]
    assert len(adr_files) >= 3


def test_each_adr_references_bv_decision_id() -> None:
    adr_files = sorted(DECISIONS_DIR.glob("0*.md"))
    assert adr_files, "expected numbered ADR files under docs/decisions/"
    for path in adr_files:
        content = path.read_text()
        assert BV_PATTERN.search(content), f"{path.name} must reference at least one BV decision ID"
