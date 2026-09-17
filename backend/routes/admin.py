import os
import time
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from pathlib import Path
from ..config import settings
from ..rag.pipeline import rag_pipeline

router = APIRouter(prefix="/admin", tags=["Admin Portal"])

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
ACTIVE_TOKENS = set(["adm_token_demo_authenticated"])

CUSTOM_APIS_STORE = []

class AdminLoginRequest(BaseModel):
    password: str

class AdminConfigUpdate(BaseModel):
    api_key: Optional[str] = None
    api_url: Optional[str] = None
    model_name: Optional[str] = None

class AddAPIEndpointRequest(BaseModel):
    title: str = Field(..., description="API Name / Title (e.g. 'Stripe Payment Webhook')")
    version: str = Field("v3.0", description="Target Product Version (v1.0, v2.0, v3.0, v4.0)")
    document_type: str = Field("api_reference", description="api_reference, migration_guide, changelog")
    method: str = Field("POST", description="HTTP Method (GET, POST, PUT, DELETE, PATCH)")
    path: str = Field(..., description="Endpoint Path (e.g. '/api/v3/payments/charge')")
    section: str = Field("Payments", description="Documentation section / category")
    description: str = Field(..., description="Endpoint behavior and details")
    headers: Optional[List[Dict[str, str]]] = Field(default=[], description="Headers like Authorization: Bearer <token>")
    request_params: Optional[List[Dict[str, Any]]] = Field(default=[], description="Query/Body params: name, type, required, desc")
    request_body: Optional[str] = Field(None, description="Sample JSON Request Body")
    response_body: Optional[str] = Field(None, description="Sample JSON Response")

def verify_admin(x_admin_token: Optional[str] = Header(None)):
    if not x_admin_token or x_admin_token not in ACTIVE_TOKENS:
        # Also allow demo master token
        if x_admin_token != "admin_authenticated_session":
            raise HTTPException(status_code=401, detail="Unauthorized: Admin password required.")
    return True

@router.post("/login")
async def admin_login(req: AdminLoginRequest):
    if req.password.strip() == ADMIN_PASSWORD.strip():
        token = f"adm_token_{int(time.time())}"
        ACTIVE_TOKENS.add(token)
        return {
            "status": "success",
            "message": "Admin authentication successful.",
            "token": token
        }
    raise HTTPException(status_code=401, detail="Invalid admin password. Default password is 'admin123'")

@router.get("/config")
async def get_admin_config(_: bool = Depends(verify_admin)):
    masked_key = ""
    if settings.API_KEY and len(settings.API_KEY) > 8:
        masked_key = f"{settings.API_KEY[:4]}...{settings.API_KEY[-4:]}"
    elif settings.API_KEY:
        masked_key = "***configured***"
    
    return {
        "api_key_configured": bool(settings.API_KEY and settings.API_KEY.strip() != "your_api_key_here"),
        "masked_api_key": masked_key,
        "api_url": settings.API_URL,
        "model_name": settings.MODEL_NAME,
        "total_indexed_chunks": len(rag_pipeline.vector_db.chunks),
        "total_custom_apis": len(CUSTOM_APIS_STORE)
    }

@router.post("/config")
async def update_admin_config(req: AdminConfigUpdate, _: bool = Depends(verify_admin)):
    if req.api_key is not None:
        settings.API_KEY = req.api_key.strip()
    if req.api_url is not None:
        settings.API_URL = req.api_url.strip()
    if req.model_name is not None:
        settings.MODEL_NAME = req.model_name.strip()

    return {
        "status": "success",
        "message": "AI & LLM API configuration updated successfully.",
        "api_url": settings.API_URL,
        "model_name": settings.MODEL_NAME
    }

@router.post("/add-api-endpoint")
async def add_api_endpoint(req: AddAPIEndpointRequest, _: bool = Depends(verify_admin)):
    # 1. Generate clean markdown document from structured inputs
    headers_md = "\n".join([f"- `{h.get('key', '')}`: {h.get('value', '')}" for h in req.headers if h.get('key')]) or "Standard Authorization header required."
    
    params_md = ""
    if req.request_params:
        params_md = "\n".join([
            f"- `{p.get('name', '')}` ({p.get('type', 'string')}, {'required' if p.get('required') else 'optional'}): {p.get('description', '')}"
            for p in req.request_params if p.get('name')
        ])
    else:
        params_md = "No specific body parameters required."

    doc_content = f"""# {req.title}

Document Type: {req.document_type}
Version: {req.version}
Section: {req.section}
Status: active

## Overview
{req.description}

## Endpoint Specification
- **Method**: `{req.method}`
- **Path**: `{req.path}`

## Request Headers
{headers_md}

## Parameters
{params_md}

## Request Example
```json
{req.request_body or '{\\n  "example": "data"\\n}'}
```

## Response Example (200 OK)
```json
{req.response_body or '{\\n  "status": "success"\\n}'}
```
"""

    # 2. Ingest and index dynamically into vector database
    file_id = f"custom_api_{int(time.time())}"
    chunks = rag_pipeline.ingestion.process_raw_text(
        file_name=f"{file_id}.md",
        content=doc_content,
        version=req.version,
        doc_type=req.document_type
    )
    rag_pipeline.vector_db.save_to_disk()

    api_entry = {
        "id": file_id,
        "title": req.title,
        "version": req.version,
        "method": req.method,
        "path": req.path,
        "section": req.section,
        "document_type": req.document_type,
        "chunks_created": len(chunks),
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    CUSTOM_APIS_STORE.insert(0, api_entry)

    return {
        "status": "success",
        "message": f"Successfully created, indexed, and grounded API endpoint '{req.method} {req.path}' for {req.version}!",
        "api": api_entry,
        "chunks_count": len(chunks)
    }

@router.get("/custom-apis")
async def list_custom_apis(_: bool = Depends(verify_admin)):
    return CUSTOM_APIS_STORE

@router.delete("/custom-apis/{api_id}")
async def delete_custom_api(api_id: str, _: bool = Depends(verify_admin)):
    global CUSTOM_APIS_STORE
    CUSTOM_APIS_STORE = [a for a in CUSTOM_APIS_STORE if a["id"] != api_id]
    
    # Remove from vector db
    rag_pipeline.vector_db.chunks = [c for c in rag_pipeline.vector_db.chunks if c.document_id != api_id]
    rag_pipeline.vector_db._build_index()
    rag_pipeline.vector_db.save_to_disk()

    return {"status": "success", "message": f"Custom API '{api_id}' removed from index."}
