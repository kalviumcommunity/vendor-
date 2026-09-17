# NovaAPI v3.0 Developer Reference

Document Type: api_reference
Version: v3.0
Status: current
Release Date: September 2024

## Overview
NovaAPI v3.0 is the current production standard for the Nova platform. It brings stateless Bearer JWT token authentication, cursor-based pagination, resilient webhooks, and idempotent mutation support.

## Base URL
All requests must be made against:
`https://api.novacloud.io/v3`

## Authentication
Authentication in v3.0 uses Bearer token authentication in the standard `Authorization` header.
Static API keys in `X-API-Key` headers are **deprecated** and will return HTTP 401 Unauthorized in v3.

### Header Format
```http
Authorization: Bearer <jwt_access_token>
```

Example in curl:
```bash
curl -X GET https://api.novacloud.io/v3/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

### Obtaining an Access Token
Exchange your client credentials for a Bearer token:
```bash
curl -X POST https://api.novacloud.io/v3/auth/tokens \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "client_live_8819",
    "client_secret": "sec_jwt_secret_0128"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

## User Endpoints

### 1. Create User
- **Endpoint**: `POST /api/v3/users`
- **Content-Type**: `application/json`
- **Headers**:
  - `Authorization`: `Bearer <token>` (required)
  - `Idempotency-Key`: UUID string (recommended for safe retries)
- **Request Body Parameters**:
  - `username` (string, required): 3-50 characters.
  - `email` (string, required): User email address.
  - `role` (string, required): Allowed values: `"admin"`, `"developer"`, `"analyst"`, `"viewer"`.
  - `teams` (array of strings, optional): Team IDs the user belongs to.
  - `preferences` (object, optional): UI/notification preferences.
- **Response (201 Created)**:
```json
{
  "id": "usr_v3_99410",
  "username": "alex_smith",
  "email": "alex@example.com",
  "role": "developer",
  "teams": ["team_core_eng"],
  "created_at": "2024-09-10T14:22:00Z"
}
```

### 2. Cursor-Based User Pagination
- **Endpoint**: `GET /api/v3/users`
- **Query Parameters**:
  - `limit` (integer, optional): Maximum results (default 50, max 200).
  - `starting_after` (string, optional): Cursor ID for forward pagination.
  - `ending_before` (string, optional): Cursor ID for backward pagination.
- **Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "usr_v3_99410",
      "username": "alex_smith",
      "email": "alex@example.com"
    }
  ],
  "has_more": true,
  "next_cursor": "usr_v3_99410"
}
```

## Rate Limits
NovaAPI v3.0 supports **1,000 requests per minute**. Headers:
- `RateLimit-Limit`: 1000
- `RateLimit-Remaining`: 992
- `RateLimit-Reset`: 48
