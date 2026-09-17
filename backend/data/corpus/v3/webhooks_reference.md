# NovaAPI v3.0 Webhooks Guide

Document Type: api_reference
Version: v3.0
Status: current
Release Date: September 2024

## Webhooks Overview
Webhooks in NovaAPI v3.0 allow your application to receive real-time HTTP POST notifications whenever key resources change.

## Supported Events
- `user.created`: Emitted when a new user registers or is provisioned.
- `user.deleted`: Emitted when a user account is removed.
- `project.deployed`: Emitted when a cloud deployment completes.
- `invoice.paid`: Emitted upon billing payment confirmation.

## Register Webhook Endpoint
- **Endpoint**: `POST /api/v3/webhooks`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "url": "https://api.myapp.com/webhooks/nova",
  "events": ["user.created", "project.deployed"],
  "secret": "whsec_live_90184abcdef"
}
```

## Signature Verification
All incoming webhook payloads contain the `Nova-Signature` header computed using HMAC-SHA256:
```
Nova-Signature: t=1725974400,v1=6a2b8e...
```
You should calculate the HMAC of `timestamp + '.' + payload_body` with your endpoint secret and compare it using a constant-time equality check.
