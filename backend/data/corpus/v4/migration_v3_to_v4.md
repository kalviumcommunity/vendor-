# Migration Guide: NovaAPI v3.0 to v4.0

Document Type: migration_guide
Version: v4.0
Status: latest
Release Date: August 2026

## Overview
Migrating from NovaAPI v3.0 to v4.0 upgrades your integrations to enterprise OAuth 2.0 with granular permissions, requires the `Nova-Version` header on all API calls, renames `role` (string) to `role_id` (UUID), and adds multi-tenancy requirements.

## Major Breaking Changes

1. **OAuth 2.0 Scopes Required**:
   - **v3.0**: Single universal JWT token with full access.
   - **v4.0**: Scoped tokens (e.g. `users:read`, `users:write`). Requests without the matching scope will return `403 Forbidden: insufficient_scope`.

2. **Required `Nova-Version` Header**:
   - **v4.0**: Every API request must include the `Nova-Version: 2026-08-01` header. Omitting this header yields `400 Bad Request`.

3. **User Creation Parameter Updates**:
   - `role` (string, e.g. `"developer"`) is **removed**.
   - Replaced by `role_id` (UUID string, e.g. `"role_lead_developer_99"`).
   - Added required `tenant_id` (string).

4. **GraphQL & WebSocket Alternative**:
   - High-throughput listing and mutation endpoints can now be executed over GraphQL at `/api/v4/graphql` or subscribed via WebSockets.

## Code Comparison

### v3.0 JavaScript Request (Old)
```javascript
const res = await fetch("https://api.novacloud.io/v3/users", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${v3Token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    username: "alex_smith",
    email: "alex@example.com",
    role: "developer"
  })
});
```

### v4.0 JavaScript Request (Latest)
```javascript
const res = await fetch("https://api.novacloud.io/v4/users", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${v4ScopedToken}`,
    "Nova-Version": "2026-08-01", // Required API version pin
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    username: "alex_smith",
    email: "alex@example.com",
    role_id: "role_lead_developer_99", // Role UUID
    tenant_id: "ten_prod_01",         // Multi-tenant workspace
    mfa_enforced: true
  })
});
```

## Migration Checklist
- [ ] Upgrade authentication service to request OAuth 2.0 granular scopes (`users:read`, `users:write`).
- [ ] Add `Nova-Version: 2026-08-01` header to API client defaults.
- [ ] Query `/api/v4/roles` to map legacy string roles to new `role_id` UUIDs.
- [ ] Pass `tenant_id` on all resource creation requests.
- [ ] Migrate long-polling endpoints to WebSockets stream `wss://stream.novacloud.io/v4/events`.
