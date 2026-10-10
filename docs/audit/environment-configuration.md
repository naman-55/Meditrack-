# Meditrack V3.1 — Phase 2: Environment Configuration Report

## 1. Investigation of `injected env (0) from .env`
- **Initial State**: Running `npm run dev` produced the terminal notice `injected env (0) from .env`.
- **Root Cause**: `Test-Path .env` evaluated to `False`. The `.env` file was absent from the project root. While `.env.example` existed, no `.env` file had been instantiated for local execution.
- **Resolution**:
  1. Created a canonical local development `.env` file with secure local development defaults (high-entropy JWT secret, port 3000, development flags).
  2. Sanitized `.env.example` to remove any raw keys, replacing them with standard documented placeholders.
  3. Ensured `.gitignore` enforces exclusion of `.env*` while preserving `!.env.example`.

## 2. Centralized Environment Module (`backend/config/env.ts`)
- **Key Enhancements**:
  - Explicit path resolution using `path.resolve(process.cwd(), '.env')`.
  - Strict validation of production keys: fails hard if `NODE_ENV === 'production'` and `JWT_SECRET` is weak (<32 characters).
  - Clear separation between mandatory system configuration and optional integrations (`GEMINI_API_KEY`, `GOOGLE_MAPS_API_KEY`).
  - Added `getEnvironmentDiagnostics()` utility for zero-leakage diagnostic health reporting at `/api/health`.

## 3. Configuration Inventory
| Variable | Classification | Purpose | Default / Fallback |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | System | Environment mode | `development` |
| `PORT` | System | Server binding port | `3000` |
| `JWT_SECRET` | Required | JWT HMAC signing key | High-entropy dev secret |
| `ALLOWED_ORIGINS` | Required | CORS origin whitelist | `http://localhost:3000,http://127.0.0.1:3000` |
| `GEMINI_API_KEY` | Optional | Google Gemini API key | Unset (graceful fallback) |
| `GOOGLE_MAPS_API_KEY` | Optional | Maps Platform geocoding | Unset (OpenStreetMap fallback) |
| `FRONTEND_URL` | Optional | Password reset redirection | `http://localhost:3000` |
| `EMAIL_PROVIDER` | Optional | Password reset dispatch | `console` (dev) / `smtp` (prod) |
