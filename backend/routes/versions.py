from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter(prefix="/versions", tags=["Versions"])

VERSIONS_METADATA = [
    {
        "version": "v1.0",
        "label": "Version 1.0 (Legacy)",
        "status": "legacy",
        "status_color": "gray",
        "release_date": "January 2023",
        "auth_method": "HTTP Basic Auth (base64)",
        "rate_limit": "60 req/min (Strict IP)",
        "payload_format": "JSON & XML",
        "pagination": "None / Simple query",
        "webhooks": "Not supported",
        "doc_count": 2,
        "description": "Initial legacy release with Basic Auth and XML support."
    },
    {
        "version": "v2.0",
        "label": "Version 2.0 (Stable)",
        "status": "stable",
        "status_color": "blue",
        "release_date": "November 2023",
        "auth_method": "X-API-Key Header",
        "rate_limit": "300 req/min (X-RateLimit-*)",
        "payload_format": "JSON only",
        "pagination": "Offset & Limit",
        "webhooks": "Not supported",
        "doc_count": 3,
        "description": "Standardized RESTful JSON endpoints and dedicated API key headers."
    },
    {
        "version": "v3.0",
        "label": "Version 3.0 (Current)",
        "status": "current",
        "status_color": "green",
        "release_date": "September 2024",
        "auth_method": "Bearer JWT Token (OAuth Flow)",
        "rate_limit": "1,000 req/min (RateLimit-*)",
        "payload_format": "JSON only",
        "pagination": "Cursor (starting_after)",
        "webhooks": "HMAC-SHA256 Signed Webhooks",
        "doc_count": 4,
        "description": "Current production standard with Bearer tokens, cursor pagination, and webhooks."
    },
    {
        "version": "v4.0",
        "label": "Version 4.0 (Latest)",
        "status": "latest",
        "status_color": "purple",
        "release_date": "August 2026",
        "auth_method": "OAuth 2.0 with PKCE & Granular Scopes",
        "rate_limit": "5,000 req/min (Adaptive Tiering)",
        "payload_format": "REST, GraphQL & WebSockets",
        "pagination": "Cursor & Realtime Stream",
        "webhooks": "Realtime Streams & DLQ Replay",
        "doc_count": 5,
        "description": "Modern enterprise architecture with OAuth 2.0 PKCE, GraphQL, and WebSockets."
    }
]

FEATURE_MATRIX = {
    "features": [
        {"feature": "Authentication", "v1": "Basic Auth (base64)", "v2": "X-API-Key Header", "v3": "Bearer JWT Token", "v4": "OAuth 2.0 PKCE + Scopes"},
        {"feature": "Serialization", "v1": "JSON & XML", "v2": "JSON only", "v3": "JSON only", "v4": "REST, GraphQL, WebSockets"},
        {"feature": "User Endpoint", "v1": "/api/v1/user/create", "v2": "/api/v2/users", "v3": "/api/v3/users", "v4": "/api/v4/users"},
        {"feature": "User Role Param", "v1": "user_role (member)", "v2": "role (developer)", "v3": "role (required)", "v4": "role_id (UUID)"},
        {"feature": "Pagination", "v1": "None", "v2": "limit / offset", "v3": "Cursor (starting_after)", "v4": "Cursor + GraphQL + WS"},
        {"feature": "Webhooks", "v1": "No", "v2": "No", "v3": "Yes (HMAC SHA-256)", "v4": "Yes (DLQ + Replay)"},
        {"feature": "Rate Limit", "v1": "60 req/min", "v2": "300 req/min", "v3": "1,000 req/min", "v4": "5,000 req/min (Adaptive)"},
        {"feature": "Idempotency Keys", "v1": "No", "v2": "No", "v3": "Optional Header", "v4": "Required for Mutations"},
        {"feature": "API Pinning Header", "v1": "None", "v2": "None", "v3": "None", "v4": "Nova-Version: 2026-08-01"}
    ]
}

@router.get("")
async def get_versions_list():
    return {
        "active_version": "v3.0",
        "available_versions": VERSIONS_METADATA
    }

@router.get("/matrix")
async def get_versions_matrix():
    return {
        "versions": ["v1.0", "v2.0", "v3.0", "v4.0"],
        "matrix": FEATURE_MATRIX["features"]
    }

@router.get("/{from_ver}/diff/{to_ver}")
async def get_version_diff(from_ver: str, to_ver: str):
    f = from_ver.lower()
    t = to_ver.lower()
    
    # Return structured diff
    diff_data = {
        "from_version": from_ver,
        "to_version": to_ver,
        "breaking_changes": [],
        "new_features": [],
        "deprecated_features": [],
        "recommended_steps": []
    }

    if "v2" in f and "v3" in t:
        diff_data["breaking_changes"] = [
            {"title": "Authentication", "old": "X-API-Key header", "new": "Bearer JWT token in Authorization header"},
            {"title": "Pagination", "old": "Numeric offset query parameter", "new": "Cursor-based starting_after parameter"},
            {"title": "User Creation", "old": "role defaulted to 'developer'", "new": "role parameter is strictly required"}
        ]
        diff_data["new_features"] = [
            "Webhooks subsystem with HMAC-SHA256 signatures",
            "Idempotency-Key header support for safe POST retries",
            "Rate limit increased from 300 to 1,000 req/min"
        ]
        diff_data["deprecated_features"] = [
            "X-API-Key static header (returns 401)",
            "Offset/limit numeric pagination"
        ]
    elif "v3" in f and "v4" in t:
        diff_data["breaking_changes"] = [
            {"title": "OAuth 2.0 Scopes", "old": "Universal JWT access token", "new": "Scoped OAuth 2.0 token (e.g. users:read, users:write)"},
            {"title": "API Pinning Header", "old": "None required", "new": "Nova-Version: 2026-08-01 mandatory header"},
            {"title": "Role Parameter", "old": "String role (e.g. 'developer')", "new": "UUID role_id (e.g. 'role_lead_developer_99')"},
            {"title": "Tenant ID", "old": "Optional", "new": "Mandatory tenant_id parameter"}
        ]
        diff_data["new_features"] = [
            "GraphQL gateway endpoint at /api/v4/graphql",
            "WebSockets real-time subscriptions at wss://stream.novacloud.io/v4/events",
            "Adaptive rate limits up to 5,000 req/min"
        ]
    elif "v1" in f and "v2" in t:
        diff_data["breaking_changes"] = [
            {"title": "Basic Auth Removed", "old": "Authorization: Basic base64", "new": "X-API-Key: nova_live_..."},
            {"title": "XML Support Dropped", "old": "application/xml", "new": "Strict JSON only"},
            {"title": "Endpoint Paths", "old": "/api/v1/user/create", "new": "/api/v2/users"}
        ]

    return diff_data
