from pathlib import Path

API_ROOT = Path(__file__).resolve().parents[1]
DOCKERFILE = API_ROOT / "Dockerfile"


def test_dockerfile_exists() -> None:
    assert DOCKERFILE.is_file()


def test_dockerfile_runs_uvicorn_with_healthcheck() -> None:
    content = DOCKERFILE.read_text()
    assert "uvicorn" in content
    assert "HEALTHCHECK" in content
    assert "/api/v1/health" in content
    assert "python:3.12" in content
