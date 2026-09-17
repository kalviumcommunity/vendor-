# Migration Guide: NovaAPI v1.0 to v2.0

Document Type: migration_guide
Version: v2.0
Status: stable
Release Date: November 2023

## Executive Summary
Migrating from NovaAPI v1.0 to v2.0 transitions your application from Basic Authentication to API Key header authentication, adopts RESTful plural URL naming conventions, and switches completely to JSON payloads.

## Key Breaking Changes

1. **Authentication Mechanism**:
   - **v1.0**: HTTP Basic Auth (`Authorization: Basic base64(username:key)`).
   - **v2.0**: API Key Header (`X-API-Key: nova_live_...`).
   - *Action*: Update your HTTP client headers to send `X-API-Key`.

2. **Endpoint Pluralization**:
   - **v1.0**: `POST /api/v1/user/create`, `GET /api/v1/user/profile`
   - **v2.0**: `POST /api/v2/users`, `GET /api/v2/users/{id}`

3. **Parameter Renames**:
   - `user_name` → renamed to `username` (snake_case simplified).
   - `user_email` → renamed to `email`.
   - `user_role` `"member"` → deprecated and replaced with `"developer"`.

4. **XML Payload Support Dropped**:
   - v2.0 only accepts `application/json`. Requests with XML will return `415 Unsupported Media Type`.

## Code Comparison

### v1.0 Python Client
```python
import requests
import base64

credentials = base64.b64encode(b"admin_user:secret_key").decode("utf-8")
headers = {
    "Authorization": f"Basic {credentials}",
    "Content-Type": "application/json"
}
payload = {"user_name": "jane_doe", "user_email": "jane@example.com"}
resp = requests.post("https://api.novacloud.io/v1/user/create", headers=headers, json=payload)
```

### v2.0 Python Client
```python
import requests

headers = {
    "X-API-Key": "nova_live_981249712a",
    "Content-Type": "application/json"
}
payload = {"username": "jane_doe", "email": "jane@example.com", "role": "developer"}
resp = requests.post("https://api.novacloud.io/v2/users", headers=headers, json=payload)
```

## Migration Checklist
- [ ] Generate new v2 API keys from the Developer Console.
- [ ] Replace `Authorization: Basic` with `X-API-Key` headers across all API calls.
- [ ] Update endpoints to pluralized REST resource paths (`/users`).
- [ ] Rename request parameters (`user_name` -> `username`, `user_email` -> `email`).
- [ ] Remove XML serialization helpers.
- [ ] Verify rate limit monitoring using `X-RateLimit-*` headers.
