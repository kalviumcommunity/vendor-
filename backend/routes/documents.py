from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List, Dict, Any, Optional
from pathlib import Path
from ..rag.pipeline import rag_pipeline
from ..config import settings

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.get("")
async def get_documents_list():
    # Return inventory of indexed documents with chunk counts
    docs = []
    # If ingestion metadata exists, return structured list
    if rag_pipeline.ingestion.documents_metadata:
        for doc_id, meta in rag_pipeline.ingestion.documents_metadata.items():
            docs.append(meta)
    else:
        # Group chunks by document_id
        grouped = {}
        for c in rag_pipeline.vector_db.chunks:
            if c.document_id not in grouped:
                grouped[c.document_id] = {
                    "id": c.document_id,
                    "title": c.title,
                    "file_name": f"{c.document_id}.md",
                    "version": c.version,
                    "document_type": c.document_type,
                    "chunk_count": 0,
                    "status": "indexed",
                    "updated_at": "September 2026"
                }
            grouped[c.document_id]["chunk_count"] += 1
        docs = list(grouped.values())

    return {
        "total_documents": len(docs),
        "total_chunks": len(rag_pipeline.vector_db.chunks),
        "documents": docs
    }

@router.get("/{document_id}")
async def get_document_by_id(document_id: str):
    # Find all chunks belonging to this document
    matching_chunks = [c.to_dict() for c in rag_pipeline.vector_db.chunks if c.document_id.lower() == document_id.lower()]
    if not matching_chunks:
        raise HTTPException(status_code=404, detail=f"Document '{document_id}' not found in knowledge base.")

    first = matching_chunks[0]
    # Reassemble full text from chunks
    full_content = "\n\n".join([f"## {c['section']}\n\n{c['text']}" for c in matching_chunks])

    return {
        "id": document_id,
        "title": first["title"],
        "version": first["version"],
        "document_type": first["document_type"],
        "total_chunks": len(matching_chunks),
        "content": full_content,
        "chunks": matching_chunks
    }

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    version: str = Form("v3.0"),
    document_type: str = Form("api_reference")
):
    try:
        content_bytes = await file.read()
        content_str = content_bytes.decode("utf-8", errors="ignore")

        # Process and index document
        chunks = rag_pipeline.ingestion.process_raw_text(
            file_name=file.filename,
            content=content_str,
            version=version,
            doc_type=document_type
        )
        rag_pipeline.vector_db.save_to_disk()

        return {
            "status": "success",
            "message": f"Successfully ingested and indexed '{file.filename}'.",
            "file_name": file.filename,
            "version": version,
            "document_type": document_type,
            "chunks_created": len(chunks),
            "pipeline_stages": [
                {"stage": "upload", "status": "completed"},
                {"stage": "text_extraction", "status": "completed"},
                {"stage": "cleaning", "status": "completed"},
                {"stage": "chunking", "status": "completed", "count": len(chunks)},
                {"stage": "metadata_attachment", "status": "completed"},
                {"stage": "embedding_generation", "status": "completed"},
                {"stage": "vector_indexing", "status": "completed"}
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to ingest document: {str(e)}")

@router.post("/reindex")
async def reindex_all():
    if settings.CORPUS_DIR.exists():
        count = rag_pipeline.ingestion.ingest_corpus_directory(settings.CORPUS_DIR)
        return {
            "status": "success",
            "message": f"Knowledge base successfully re-indexed from corpus directory. {count} chunks generated.",
            "total_chunks": count
        }
    return {"status": "error", "message": "Corpus directory not found."}

@router.delete("/{document_id}")
async def delete_document(document_id: str):
    rag_pipeline.vector_db.chunks = [c for c in rag_pipeline.vector_db.chunks if c.document_id.lower() != document_id.lower()]
    rag_pipeline.vector_db._build_index()
    rag_pipeline.vector_db.save_to_disk()
    if document_id in rag_pipeline.ingestion.documents_metadata:
        del rag_pipeline.ingestion.documents_metadata[document_id]

    return {"status": "success", "message": f"Document '{document_id}' removed from index."}
