# NovaAPI v4.0 Modern Enterprise Reference

Document Type: api_reference
Version: v4.0
Status: latest
Release Date: August 2026

## Overview
NovaAPI v4.0 is the latest enterprise-grade release of the Nova platform. It introduces full OAuth 2.0 with PKCE and granular scopes, GraphQL gateway endpoints alongside REST, real-time WebSocket subscriptions, and adaptive AI-driven rate limiting.

## Base URL
All requests must target:
- REST API: `https://api.novacloud.io/v4`
- GraphQL Endpoint: `https://api.novacloud.io/v4/graphql`
- WebSocket Real-Time Stream: `wss://stream.novacloud.io/v4/events`

## Authentication
Authentication in v4.0 requires OAuth 2.0 Access Tokens with strict granular scopes.
Tokens are passed in the `Authorization` header with the Bearer scheme.

### Header Format
```http
Authorization: Bearer <oauth2_scoped_token>
```

### Granular Scopes
NovaAPI v4.0 enforces least-privilege scope verification:
- `users:read`: View user profiles and directory.
- `users:write`: Create, edit, and delete users.
- `projects:admin`: Manage cloud infrastructure and deploy environments.
- `webhooks:manage`: Configure event streams and replay payloads.
- `audit:logs`: Inspect organization security logs.

Example curl request:
```bash
curl -X GET https://api.novacloud.io/v4/users \
  -H "Authorization: Bearer nova_tok_oauth2_scoped_882918" \
  -H "Nova-Version: 2026-08-01" \
  -H "Content-Type: application/json"
```

## User Endpoints

### 1. Create User
- **Endpoint**: `POST /api/v4/users`
- **Required Scope**: `users:write`
- **Headers**:
  - `Authorization`: `Bearer <token>` (required)
  - `Nova-Version`: `"2026-08-01"` (required API pinning header)
  - `Idempotency-Key`: UUID (recommended)
- **Request Body Parameters**:
  - `username` (string, required): 3-50 chars.
  - `email` (string, required): Valid verified email address.
  - `role_id` (string, required): Role UUID (replaces plain string `role` in v3).
  - `tenant_id` (string, required): Multi-tenant workspace ID.
  - `mfa_enforced` (boolean, optional): Default `true`.
  - `tags` (array of strings, optional): Custom searchable metadata tags.
- **Response (201 Created)**:
```json
{
  "id": "usr_v4_881920",
  "username": "alex_smith",
  "email": "alex@example.com",
  "role_id": "role_lead_developer_99",
  "tenant_id": "ten_prod_01",
  "mfa_enforced": true,
  "tags": ["core-team", "backend"],
  "status": "active",
  "created_at": "2026-08-15T08:00:00Z"
}
```

### 2. Stream Users (WebSockets)
Connect to `wss://stream.novacloud.io/v4/events?topic=users` to receive instant binary/JSON stream events for user state updates without polling.

## Adaptive Rate Limits
In v4.0, rate limits adapt dynamically based on enterprise tier and burst metrics, up to **5,000 requests per minute**. Headers:
- `Nova-RateLimit-Tier`: `"Enterprise"`
- `RateLimit-Limit`: 5000
- `RateLimit-Remaining`: 4980
- `RateLimit-Reset`: 60
