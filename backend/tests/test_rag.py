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
