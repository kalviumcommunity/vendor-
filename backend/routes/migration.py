from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from ..rag.pipeline import rag_pipeline

router = APIRouter(prefix="/migration", tags=["Migration"])

class MigrationAssistRequest(BaseModel):
    source_version: str = "v2.0"
    target_version: str = "v3.0"
    topic: Optional[str] = "authentication"
    custom_question: Optional[str] = None

@router.post("/assist")
async def migration_assistant_endpoint(req: MigrationAssistRequest):
    q = req.custom_question or f"How do I migrate {req.topic} from {req.source_version} to {req.target_version}?"
    
    # Query knowledge base for target version migration guide
    result = rag_pipeline.answer_query(
        question=q,
        version=req.target_version,
        document_type="migration_guide"
    )
    
    # If no doc found under migration_guide specifically, fallback to any document in target version
    if not result["sources"]:
        result = rag_pipeline.answer_query(
            question=q,
            version=req.target_version
        )

    return {
        "source_version": req.source_version,
        "target_version": req.target_version,
        "topic": req.topic,
        "question": q,
        "answer": result["answer"],
        "sources": result["sources"],
        "confidence_score": result["confidence_score"]
    }
