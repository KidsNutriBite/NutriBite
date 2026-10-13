from fastapi.testclient import TestClient
from app.core.config import settings

def test_root(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()

def test_health_endpoint(client: TestClient):
    response = client.get(f"{settings.API_V1_STR}/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "timestamp" in data
    assert "uptime_seconds" in data

def test_ready_endpoint(client: TestClient):
    response = client.get(f"{settings.API_V1_STR}/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"

def test_metrics_endpoint(client: TestClient):
    response = client.get(f"{settings.API_V1_STR}/metrics")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "active"
    assert "metrics" in data
    assert "uptime_seconds" in data["metrics"]

def test_request_id_middleware(client: TestClient):
    response = client.get(f"{settings.API_V1_STR}/health")
    assert "X-Request-ID" in response.headers
    assert "X-Process-Time" in response.headers
