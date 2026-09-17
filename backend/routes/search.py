from fastapi import APIRouter, Query
from typing import Optional, List, Dict, Any
from ..rag.pipeline import rag_pipeline

router = APIRouter(prefix="/search", tags=["Search"])

@router.get("")
async def search_endpoint(
    q: str = Query(..., description="Search query"),
    version: Optional[str] = Query(None, description="Filter by version (v1.0, v2.0, v3.0, v4.0, or All)"),
    document_type: Optional[str] = Query(None, description="Filter by doc type"),
    limit: int = Query(8, ge=1, le=20)
):
    results = rag_pipeline.retrieve(
        query=q,
        version=version,
        document_type=document_type,
        top_k=limit
    )

    formatted = []
    for item in results:
        c = item["chunk"]
        # Extract short highlight snippet
        snippet = c.text[:220] + "..." if len(c.text) > 220 else c.text
        formatted.append({
            "title": c.title,
            "document_id": c.document_id,
            "document_type": c.document_type,
            "version": c.version,
            "section": c.section,
            "page": c.page,
            "chunk_id": c.chunk_id,
            "snippet": snippet,
            "relevance_pct": item["relevance_pct"],
            "source_url": c.source_url
        })

    return {
        "query": q,
        "version_filter": version or "All",
        "total_results": len(formatted),
        "results": formatted
    }
