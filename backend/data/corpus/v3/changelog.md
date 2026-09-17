# NovaAPI v3.0 Changelog & Release Notes

Document Type: changelog
Version: v3.0
Status: current
Release Date: September 10, 2024

## Release v3.2.0 (December 2024)
- **New**: Webhook signature verification improvements with timestamp tolerance checks.
- **New**: Added batch user status updates endpoint (`POST /api/v3/users/batch-status`).
- **Fixed**: Fixed cursor serialization bug on edge-case empty collections.

## Release v3.0.0 (Major Release)
- **Breaking**: Replaced static `X-API-Key` with OAuth-style JWT Bearer tokens via `Authorization: Bearer <token>`.
- **Breaking**: Switched all list endpoints to cursor pagination (`starting_after` / `ending_before`).
- **Breaking**: Standardized rate limit headers to `RateLimit-*` (dropping `X-` prefix).
- **New**: Added Webhooks subsystem (`POST /api/v3/webhooks`).
- **New**: Added `Idempotency-Key` header support for safe POST retries.
- **New**: Increased rate limit ceiling to 1,000 requests per minute.
