# NovaAPI v2.0 Changelog & Release Notes

Document Type: changelog
Version: v2.0
Status: stable
Release Date: November 15, 2023

## Release v2.4.0 (March 2024)
- **New**: Added Projects API (`POST /api/v2/projects`, `GET /api/v2/projects`).
- **Changed**: User listing pagination improved with offset/limit parameters.
- **Fixed**: Fixed timestamp parsing bug on timezone offsets.

## Release v2.0.0 (Major Release)
- **Breaking**: Replaced Basic Authentication with `X-API-Key` headers.
- **Breaking**: Dropped XML format support; API is strictly JSON.
- **Breaking**: Renamed user creation parameters (`user_name` -> `username`, `user_email` -> `email`).
- **New**: Added standardized rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`).
- **New**: Increased rate limit to 300 req/min.
