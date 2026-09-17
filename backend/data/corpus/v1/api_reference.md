# NovaAPI v1.0 Reference Manual

Document Type: api_reference
Version: v1.0
Status: legacy
Release Date: January 2023

## Overview
NovaAPI v1.0 is the initial legacy REST interface for the Nova cloud platform. It supports both JSON and XML data serialization.

## Base URL
All requests must be directed to:
`https://api.novacloud.io/v1`

## Authentication
Authentication in v1.0 uses HTTP Basic Authentication over HTTPS. You must pass your account username and secret API key as base64 encoded credentials in the `Authorization` header.

### Header Format
```http
Authorization: Basic <base64(username:secret_key)>
```

Example in curl:
```bash
curl -X GET https://api.novacloud.io/v1/user/profile \
  -u "my_username:nova_sec_991823"
```

## User Endpoints

### 1. Create User
- **Endpoint**: `POST /api/v1/user/create`
- **Content-Type**: `application/json` or `application/xml`
- **Request Parameters**:
  - `user_name` (string, required): Alphanumeric account name (3-30 chars).
  - `user_email` (string, required): Valid user email address.
  - `user_role` (string, optional): Default is `"member"`. Allowed: `"admin"`, `"member"`, `"viewer"`.
- **Response (201 Created)**:
```json
{
  "status": "success",
  "data": {
    "user_id": "usr_legacy_1001",
    "user_name": "alex_smith",
    "user_email": "alex@example.com",
    "user_role": "member",
    "created_timestamp": 1673827200
  }
}
```

### 2. Get User Profile
- **Endpoint**: `GET /api/v1/user/profile`
- **Query Parameters**:
  - `id` (string, required): The legacy user ID.
- **Response (200 OK)**:
```json
{
  "user_id": "usr_legacy_1001",
  "user_name": "alex_smith",
  "is_active": true
}
```

## Rate Limits
In v1.0, all accounts share a strict global limit of **60 requests per minute**. Exceeding this limit returns HTTP 429 Too Many Requests with a plain text error body.
