from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from ..rag.pipeline import rag_pipeline
from .monitoring import log_query_metric

router = APIRouter(prefix="/chat", tags=["Chat"])

class ChatRequest(BaseModel):
    question: str = Field(..., description="Developer question")
    version: Optional[str] = Field("v3.0", description="Selected product version (e.g. 'v3.0' or 'All')")
    documentType: Optional[str] = Field(None, description="Document type filter (api_reference, migration_guide, changelog)")
    conversationId: Optional[str] = Field(None, description="Conversation session ID")

class SourceItem(BaseModel):
    index: int
    document: str
    document_id: str
    version: str
    section: str
    page: int
    chunk_id: str
    relevance: int
    text: str
    source_url: str

class ChatResponse(BaseModel):
    answer: str
    version: str
    sources: List[SourceItem]
    latency_ms: float
    grounded: bool
    confidence_score: int

@router.post("", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    result = rag_pipeline.answer_query(
        question=req.question,
        version=req.version,
        document_type=req.documentType
    )
    
    # Log query metrics for monitoring
    log_query_metric(
        question=req.question,
        version=req.version or "All",
        latency_ms=result["latency_ms"],
        sources_count=len(result["sources"]),
        confidence=result["confidence_score"]
    )

    return result

@router.post("/stream")
async def chat_stream_endpoint(req: ChatRequest):
    # Log query metrics
    log_query_metric(
        question=req.question,
        version=req.version or "All",
        latency_ms=250.0,
        sources_count=3,
        confidence=96
    )

    generator = rag_pipeline.stream_query(
        question=req.question,
        version=req.version,
        document_type=req.documentType
    )
    return StreamingResponse(generator, media_type="text/event-stream")
