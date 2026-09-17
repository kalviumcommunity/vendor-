# Migration Guide: NovaAPI v2.0 to v3.0

Document Type: migration_guide
Version: v3.0
Status: current
Release Date: September 2024

## Overview & Rationale
Migrating from NovaAPI v2.0 to v3.0 upgrades your application from static API keys to standard Bearer token authentication, transitions pagination from offset-based to high-scale cursor pagination, and introduces Webhooks.

## Major Breaking Changes

1. **Authentication Migration**:
   - **v2.0**: Static API key passed via `X-API-Key: nova_live_...`
   - **v3.0**: Dynamic JWT token passed via `Authorization: Bearer <jwt_token>`
   - *Impact*: You must call `POST /api/v3/auth/tokens` using your `client_id` and `client_secret` to obtain a short-lived token (valid for 1 hour).

2. **Pagination Strategy**:
   - **v2.0**: `limit` and `offset` query parameters.
   - **v3.0**: Cursor pagination with `starting_after` and `ending_before`.
   - *Impact*: Large offsets will no longer work in v3. Use `next_cursor` from the response.

3. **User Creation Parameters**:
   - `role` parameter in v3.0 is **strictly required** (in v2.0 it defaulted to `"developer"`).
   - Added new role `"analyst"`.

4. **Rate Limit Headers**:
   - v2.0 used `X-RateLimit-*`.
   - v3.0 conforms to IETF standards with `RateLimit-*` (dropping the `X-` prefix).

## Code Comparison

### v2.0 Request (Deprecated)
```javascript
const response = await fetch("https://api.novacloud.io/v2/users?limit=20&offset=40", {
  headers: {
    "X-API-Key": "nova_live_981249712a",
    "Content-Type": "application/json"
  }
});
```

### v3.0 Request (Current)
```javascript
// Step 1: Fetch Bearer Token
const authRes = await fetch("https://api.novacloud.io/v3/auth/tokens", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ client_id: "client_live_8819", client_secret: "sec_jwt_secret_0128" })
});
const { access_token } = await authRes.json();

// Step 2: Make Authenticated Call with Cursor
const response = await fetch("https://api.novacloud.io/v3/users?limit=50&starting_after=usr_v3_99410", {
  headers: {
    "Authorization": `Bearer ${access_token}`,
    "Content-Type": "application/json"
  }
});
```

## Migration Checklist
- [ ] Implement token refresh service using `POST /api/v3/auth/tokens`.
- [ ] Replace `X-API-Key` headers with `Authorization: Bearer <access_token>`.
- [ ] Refactor list/table queries from numeric offset to cursor (`starting_after`).
- [ ] Explicitly pass `role` in all `POST /api/v3/users` requests.
- [ ] Update rate-limit monitoring to parse `RateLimit-Limit` instead of `X-RateLimit-Limit`.
- [ ] Set up webhooks listener for asynchronous events.
