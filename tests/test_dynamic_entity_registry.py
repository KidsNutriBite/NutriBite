import os
import sys
import pytest

# Ensure ai-service-v2 is in sys.path
ai_service_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ai-service-v2")
if ai_service_dir not in sys.path:
    sys.path.insert(0, ai_service_dir)

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_registry_seed_and_health():
    """Verify registry seeding and health checks from root test runner."""
    health_res = client.get("/api/v1/health")
    assert health_res.status_code == 200

    seed_res = client.post("/api/v1/entities/seed-defaults")
    assert seed_res.status_code == 200
    assert "COOKING_METHOD" in seed_res.json()["seeded_entities"]
    assert "SUPPLEMENT" in seed_res.json()["seeded_entities"]


def test_crud_and_lifecycle():
    """Verify CRUD and lifecycle from root test runner."""
    # List
    res = client.get("/api/v1/entities")
    assert res.status_code == 200
    assert res.json()["total"] >= 2

    # Get COOKING_METHOD
    res_cm = client.get("/api/v1/entities/COOKING_METHOD")
    assert res_cm.status_code == 200
    assert res_cm.json()["name"] == "COOKING_METHOD"
    assert res_cm.json()["status"] == "ACTIVE"
