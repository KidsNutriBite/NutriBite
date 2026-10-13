import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client() -> TestClient:
    """Provides a TestClient for testing FastAPI endpoints."""
    with TestClient(app) as c:
        yield c
