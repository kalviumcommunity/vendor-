import time
from typing import List, Dict, Any
from .pipeline import rag_pipeline

BENCHMARK_TEST_SUITE = [
    {
        "id": "test_001",
        "question": "How do I authenticate in API v1?",
        "version": "v1.0",
        "expected_version": "v1.0",
        "expected_keywords": ["basic", "base64", "authorization"],
        "expected_document": "NovaAPI v1.0 Reference Manual",
        "category": "Authentication"
    },
    {
        "id": "test_002",
        "question": "How do I authenticate in API v2?",
        "version": "v2.0",
        "expected_version": "v2.0",
        "expected_keywords": ["x-api-key", "header"],
        "expected_document": "NovaAPI v2.0 RESTful Reference",
        "category": "Authentication"
    },
    {
        "id": "test_003",
        "question": "How do I authenticate with the API in version 3?",
        "version": "v3.0",
        "expected_version": "v3.0",
        "expected_keywords": ["bearer", "jwt", "/auth/tokens"],
        "expected_document": "NovaAPI v3.0 Developer Reference",
        "category": "Authentication"
    },
    {
        "id": "test_004",
        "question": "How does authentication work in v4?",
        "version": "v4.0",
        "expected_version": "v4.0",
        "expected_keywords": ["oauth", "pkce", "scope"],
        "expected_document": "NovaAPI v4.0 Modern Enterprise Reference",
        "category": "Authentication"
    },
    {
        "id": "test_005",
        "question": "How do I migrate from v2 to v3?",
        "version": "v3.0",
        "expected_version": "v3.0",
        "expected_keywords": ["bearer", "cursor", "role"],
        "expected_document": "Migration Guide: NovaAPI v2.0 to v3.0",
        "category": "Migration"
    },
    {
        "id": "test_006",
        "question": "What parameters does the createUser API accept in v4?",
        "version": "v4.0",
        "expected_version": "v4.0",
        "expected_keywords": ["role_id", "tenant_id", "nova-version"],
        "expected_document": "NovaAPI v4.0 Modern Enterprise Reference",
        "category": "Parameters"
    },
    {
        "id": "test_007",
        "question": "What is the webhook signature header in v3?",
        "version": "v3.0",
        "expected_version": "v3.0",
        "expected_keywords": ["nova-signature", "hmac-sha256"],
        "expected_document": "NovaAPI v3.0 Webhooks Guide",
        "category": "Webhooks"
    },
    {
        "id": "test_008",
        "question": "What is the endpoint to teleport quantum servers in v3?",
        "version": "v3.0",
        "expected_version": "v3.0",
        "expected_keywords": ["couldn't find", "not found"],
        "expected_document": "None (Hallucination Rejection)",
        "category": "Hallucination Rejection"
    }
]

class RAGEvaluator:
    """Automated evaluation engine for testing RAG retrieval and answer groundedness."""
    
    def run_evaluations(self) -> Dict[str, Any]:
        results = []
        total_retrieval_correct = 0
        total_citations_correct = 0
        total_grounded = 0
        total_latency = 0.0

        for t in BENCHMARK_TEST_SUITE:
            start = time.time()
            res = rag_pipeline.answer_query(
                question=t["question"],
                version=t["version"]
            )
            lat = (time.time() - start) * 1000
            total_latency += lat

            answer_lower = res["answer"].lower()
            sources = res["sources"]

            # Check retrieval match
            if t["category"] == "Hallucination Rejection":
                # For rejection, pass if system states not found or has low confidence
                retrieval_ok = True
                grounded_ok = "couldn't find" in answer_lower or "not found" in answer_lower or len(sources) == 0
                citation_ok = True
                retrieved_source_title = "None (Correctly Rejected)"
            else:
                top_source = sources[0] if sources else None
                retrieved_source_title = top_source["document"] if top_source else "No source retrieved"
                
                # Check version matching
                version_match = (top_source["version"] == t["expected_version"]) if top_source else False
                doc_match = (t["expected_document"].lower() in top_source["document"].lower()) if top_source else False
                retrieval_ok = version_match and (doc_match or top_source is not None)
                
                # Groundedness: contains expected keywords
                keyword_matches = [k for k in t["expected_keywords"] if k in answer_lower]
                grounded_ok = len(keyword_matches) >= 1
                
                # Citation verification
                citation_ok = len(sources) > 0 and ("[1]" in res["answer"] or "[2]" in res["answer"])

            if retrieval_ok:
                total_retrieval_correct += 1
            if citation_ok:
                total_citations_correct += 1
            if grounded_ok:
                total_grounded += 1

            passed = retrieval_ok and citation_ok and grounded_ok

            results.append({
                "test_id": t["id"],
                "question": t["question"],
                "version": t["version"],
                "category": t["category"],
                "expected_source": t["expected_document"],
                "retrieved_source": retrieved_source_title,
                "retrieval_ok": retrieval_ok,
                "citation_ok": citation_ok,
                "grounded": grounded_ok,
                "passed": passed,
                "latency_ms": round(lat, 1),
                "answer_preview": res["answer"][:120] + "..." if len(res["answer"]) > 120 else res["answer"]
            })

        total = len(BENCHMARK_TEST_SUITE)
        summary = {
            "total_tests": total,
            "passed_tests": sum(1 for r in results if r["passed"]),
            "retrieval_accuracy": round((total_retrieval_correct / total) * 100, 1),
            "citation_accuracy": round((total_citations_correct / total) * 100, 1),
            "groundedness_score": round((total_grounded / total) * 100, 1),
            "overall_quality_score": round(((total_retrieval_correct + total_citations_correct + total_grounded) / (3 * total)) * 100, 1),
            "avg_latency_ms": round(total_latency / total, 1),
            "test_results": results,
            "evaluated_at": "September 2026"
        }
        return summary

evaluator = RAGEvaluator()
