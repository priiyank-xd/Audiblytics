from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory

API_ROOT = Path(__file__).resolve().parents[1]
EXPECTED_HEAD = "20260531_0006"


def test_alembic_has_single_head() -> None:
    cfg = Config(str(API_ROOT / "alembic.ini"))
    cfg.set_main_option("script_location", str(API_ROOT / "alembic"))
    script = ScriptDirectory.from_config(cfg)
    heads = script.get_revisions("heads")
    assert len(heads) == 1
    assert heads[0].revision == EXPECTED_HEAD


def test_alembic_revision_chain_is_linear() -> None:
    cfg = Config(str(API_ROOT / "alembic.ini"))
    cfg.set_main_option("script_location", str(API_ROOT / "alembic"))
    script = ScriptDirectory.from_config(cfg)
    revisions = list(script.walk_revisions())
    assert len(revisions) == 6
    assert revisions[0].revision == EXPECTED_HEAD
    assert revisions[-1].down_revision is None
