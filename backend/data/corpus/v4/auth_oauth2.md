# NovaAPI v4.0 OAuth 2.0 & Authorization Guide

Document Type: api_reference
Version: v4.0
Status: latest
Release Date: August 2026

## Authorization Code Flow with PKCE
NovaAPI v4.0 implements OAuth 2.1 specifications with Mandatory Proof Key for Code Exchange (PKCE).

### Flow Steps:
1. **Generate Code Verifier & Challenge**:
   Generate a cryptographic random string `code_verifier` (43-128 characters) and compute its SHA256 base64url hash `code_challenge`.

2. **Redirect User to Authorization Server**:
```http
GET https://auth.novacloud.io/oauth/authorize?
  client_id=client_app_v4_771&
  response_type=code&
  redirect_uri=https://myapp.com/callback&
  scope=users:read%20projects:admin&
  code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&
  code_challenge_method=S256
```

3. **Exchange Code for Access Token**:
```bash
curl -X POST https://auth.novacloud.io/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "client_id=client_app_v4_771" \
  -d "code=auth_code_991823" \
  -d "redirect_uri=https://myapp.com/callback" \
  -d "code_verifier=high_entropy_random_string_here"
```

Response:
```json
{
  "access_token": "nova_tok_oauth2_scoped_882918",
  "token_type": "Bearer",
  "expires_in": 7200,
  "refresh_token": "nova_ref_77182937",
  "scope": "users:read projects:admin"
}
```

## Service-to-Service: Client Credentials
For machine-to-machine background tasks:
```bash
curl -X POST https://auth.novacloud.io/oauth/token \
  -d "grant_type=client_credentials" \
  -d "client_id=svc_prod_worker" \
  -d "client_secret=sec_m2m_supersecret_0918" \
  -d "scope=users:write audit:logs"
```
