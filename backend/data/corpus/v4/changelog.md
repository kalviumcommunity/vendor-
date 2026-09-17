# NovaAPI v4.0 Changelog & Release Notes

Document Type: changelog
Version: v4.0
Status: latest
Release Date: August 15, 2026

## Release v4.2.0 (September 2026)
- **New**: Added real-time webhook payload replay and dead-letter queue inspection in Developer Console.
- **New**: Enhanced GraphQL query complexity limits and automatic cost analysis headers.
- **Changed**: Adaptive rate limits upgraded to 5,000 requests/minute for Enterprise accounts.
- **Fixed**: Fixed WebSocket reconnection backoff on transient network partitions.

## Release v4.0.0 (Major Release)
- **Breaking**: Replaced static JWTs with OAuth 2.0 PKCE and granular scopes (`users:read`, `users:write`, `projects:admin`).
- **Breaking**: Mandatory `Nova-Version` header required on all HTTP requests.
- **Breaking**: Replaced `role` string with `role_id` UUID and added required `tenant_id` on user mutations.
- **New**: GraphQL endpoint at `/api/v4/graphql`.
- **New**: WebSockets event streaming at `wss://stream.novacloud.io/v4/events`.
- **New**: Real-time MFA enforcement flags.
