# NovaAPI v2.0 RESTful Reference

Document Type: api_reference
Version: v2.0
Status: stable
Release Date: November 2023

## Overview
NovaAPI v2.0 introduced pure RESTful resources, switched entirely to JSON payloads (XML deprecated and removed), and upgraded authentication to dedicated API Keys in request headers.

## Base URL
All API requests must be routed to:
`https://api.novacloud.io/v2`

## Authentication
Authentication in v2.0 requires an API Key sent via the `X-API-Key` HTTP header. Basic Authentication is no longer accepted and will return HTTP 401 Unauthorized.

### Header Format
```http
X-API-Key: nova_live_a98f7b6c5d4e3f2a1b
```

Example in curl:
```bash
curl -X GET https://api.novacloud.io/v2/users \
  -H "X-API-Key: nova_live_a98f7b6c5d4e3f2a1b" \
  -H "Content-Type: application/json"
```

## User Endpoints

### 1. Create User
- **Endpoint**: `POST /api/v2/users`
- **Content-Type**: `application/json`
- **Request Body Parameters**:
  - `username` (string, required): Lowercase alphanumeric username (camelCase parameter rename from v1 `user_name`).
  - `email` (string, required): Valid email address.
  - `role` (string, optional): `"admin"`, `"developer"`, or `"viewer"`. Default is `"developer"`. Note that `"member"` role was removed.
  - `metadata` (object, optional): Arbitrary key-value metadata dictionary.
- **Response (201 Created)**:
```json
{
  "id": "usr_v2_99410",
  "username": "alex_smith",
  "email": "alex@example.com",
  "role": "developer",
  "metadata": {},
  "created_at": "2023-11-20T10:30:00Z"
}
```

### 2. List & Query Users
- **Endpoint**: `GET /api/v2/users`
- **Query Parameters**:
  - `limit` (integer, optional): Maximum records per page (default 20, max 100).
  - `offset` (integer, optional): Offset index for pagination.
  - `status` (string, optional): Filter by `"active"` or `"suspended"`.
- **Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "usr_v2_99410",
      "username": "alex_smith",
      "email": "alex@example.com",
      "role": "developer"
    }
  ],
  "pagination": {
    "total": 140,
    "limit": 20,
    "offset": 0
  }
}
```

## Projects API

### 1. Create Project
- **Endpoint**: `POST /api/v2/projects`
- **Request Body**:
  - `name` (string, required): Project display name.
  - `organization_id` (string, required): Organization ID.
- **Response (201 Created)**:
```json
{
  "id": "prj_2024_01",
  "name": "Production Engine",
  "organization_id": "org_5510",
  "created_at": "2023-11-20T11:00:00Z"
}
```

## Rate Limits
NovaAPI v2.0 expands rate limits to **300 requests per minute per API key**.
Rate limit status is returned in every response header:
- `X-RateLimit-Limit`: 300
- `X-RateLimit-Remaining`: 298
- `X-RateLimit-Reset`: 1700481600
