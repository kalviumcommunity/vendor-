import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.rag.pipeline import rag_pipeline

client = TestClient(app)

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"

def test_versions():
    res = client.get("/api/versions")
    assert res.status_code == 200
    data = res.json()
    assert len(data["available_versions"]) == 4

def test_search_v2_auth():
    res = client.get("/api/search?q=authentication&version=v2.0")
    assert res.status_code == 200
    data = res.json()
    assert len(data["results"]) > 0
    # Every returned chunk must be v2.0
    for r in data["results"]:
        assert r["version"] == "v2.0"

def test_search_v3_auth():
    res = client.get("/api/search?q=bearer+token&version=v3.0")
    assert res.status_code == 200
    data = res.json()
    assert len(data["results"]) > 0
    assert any("bearer" in r["snippet"].lower() for r in data["results"])

def test_chat_grounding_v1():
    res = client.post("/api/chat", json={
        "question": "How do I authenticate with the API in version 1?",
        "version": "v1.0"
    })
    assert res.status_code == 200
    data = res.json()
    assert "Basic" in data["answer"] or "basic" in data["answer"]
    assert len(data["sources"]) > 0
    assert data["sources"][0]["version"] == "v1.0"

def test_chat_grounding_v3():
    res = client.post("/api/chat", json={
        "question": "How do I authenticate with the API in version 3?",
        "version": "v3.0"
    })
    assert res.status_code == 200
    data = res.json()
    assert "Bearer" in data["answer"] or "bearer" in data["answer"]
    assert len(data["sources"]) > 0
    assert data["sources"][0]["version"] == "v3.0"

def test_evaluation_benchmarks():
    res = client.get("/api/evaluation/benchmarks")
    assert res.status_code == 200
    data = res.json()
    assert data["retrieval_accuracy"] >= 80.0
    assert data["citation_accuracy"] >= 80.0
    assert data["total_tests"] > 0

def test_admin_auth_and_add_api():
    # 1. Invalid password
    res_bad = client.post("/api/admin/login", json={"password": "wrong_password"})
    assert res_bad.status_code == 401

    # 2. Valid password (admin123)
    res_ok = client.post("/api/admin/login", json={"password": "admin123"})
    assert res_ok.status_code == 200
    token = res_ok.json()["token"]

    # 3. Add custom API endpoint dynamically
    add_res = client.post(
        "/api/admin/add-api-endpoint",
        headers={"x-admin-token": token},
        json={
            "title": "Custom Payments Gateway",
            "version": "v3.0",
            "document_type": "api_reference",
            "method": "POST",
            "path": "/api/v3/payments/custom-charge",
            "section": "Payments",
            "description": "Custom billing charge endpoint for NovaAPI v3.",
            "headers": [{"key": "Authorization", "value": "Bearer <token>"}],
            "request_params": [{"name": "amount", "type": "integer", "required": True, "description": "Amount in cents"}],
            "request_body": "{\"amount\": 5000}",
            "response_body": "{\"charge_id\": \"ch_991823\"}"
        }
    )
    assert add_res.status_code == 200
    assert add_res.json()["status"] == "success"

    # 4. Verify search retrieves newly created custom API
    search_res = client.get("/api/search?q=custom-charge&version=v3.0")
    assert search_res.status_code == 200
    assert len(search_res.json()["results"]) > 0

