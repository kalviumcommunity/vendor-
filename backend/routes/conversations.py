from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

router = APIRouter(prefix="/conversations", tags=["Conversations"])

# In-memory storage with initial sample sessions
CONVERSATIONS_STORE = [
    {
        "id": "conv_01",
        "title": "Authentication differences between v2 & v3",
        "version": "v3.0",
        "last_message": "Authentication changed in v3 to use Bearer tokens...",
        "created_at": "2026-09-17 08:30",
        "messages_count": 3
    },
    {
        "id": "conv_02",
        "title": "Migrating user creation to v4 OAuth",
        "version": "v4.0",
        "last_message": "In v4, role was replaced with role_id UUID...",
        "created_at": "2026-09-16 16:45",
        "messages_count": 4
    },
    {
        "id": "conv_03",
        "title": "Webhook signature verification in v3",
        "version": "v3.0",
        "last_message": "Use Nova-Signature header with HMAC SHA-256...",
        "created_at": "2026-09-15 11:20",
        "messages_count": 2
    }
]

class ConversationCreate(BaseModel):
    title: str
    version: str = "v3.0"
    first_question: Optional[str] = None

@router.get("")
async def list_conversations():
    return CONVERSATIONS_STORE

@router.post("")
async def create_conversation(req: ConversationCreate):
    new_conv = {
        "id": f"conv_{len(CONVERSATIONS_STORE) + 1:02d}",
        "title": req.title,
        "version": req.version,
        "last_message": req.first_question or "New conversation started.",
        "created_at": "Just now",
        "messages_count": 1
    }
    CONVERSATIONS_STORE.insert(0, new_conv)
    return new_conv

@router.delete("/{conv_id}")
async def delete_conversation(conv_id: str):
    global CONVERSATIONS_STORE
    CONVERSATIONS_STORE = [c for c in CONVERSATIONS_STORE if c["id"] != conv_id]
    return {"status": "success", "message": f"Conversation {conv_id} deleted."}
