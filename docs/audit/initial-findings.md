# Meditrack V3.1 — Phase 1: Initial Findings & Repository Discovery

## 1. System Overview
Meditrack V3.1 is a full-stack clinical biomarker tracking, health risk analysis, longitudinal trend monitoring, and medical specialist locator platform.

- **Frontend**: React 19 SPA with Vite 6, Tailwind CSS 4, Lucide React, Recharts, Leaflet / Google Maps, Motion.
- **Backend**: Node.js with Express 5, TypeScript via `tsx` (dev) and `esbuild` bundled CJS (production).
- **Database**: SQLite via `@libsql/client` (`meditrack_new.db`).
- **AI Integration**: Google Gemini (`@google/genai`) for medical document OCR and structured biomarker extraction.
- **Security**: JWT (access token in-memory, refresh token in HttpOnly cookie), bcryptjs hashing, strict CORS, rate limiting.

## 2. Architecture Map
```
Frontend (React 19 SPA)
  ↓ [API Client: src/api/client.ts with auto-refresh]
Backend Express Server (server.ts, port 3000)
  ↓ [Middleware: securityHeaders, CORS, rateLimiters, authenticateToken]
Controllers & Routers (backend/routes/specialists.routes.ts, authService, etc.)
  ↓ [Engines & Services]
  ├── contradictionEngine.ts (Physiological & same-date contradiction detector)
  ├── riskEngine.ts (Cardiovascular, metabolic, renal risk assessment)
  ├── forecastService.ts (Longitudinal biomarker forecasting)
  ├── backend/services/ai.service.ts (Centralized Gemini OCR service)
  └── backend/services/validationRunner.service.ts (14-point software verification)
  ↓ [Data Persistence & Storage]
SQLite / LibSQL (meditrack_new.db) & Local Disk Storage (uploads/)
```

## 3. Discovered Defects & Verified Root Causes
1. **Missing `.env` File**:
   - *Observation*: Startup warning `injected env (0) from .env`.
   - *Root cause*: No `.env` existed in repository root. Only `.env.example` was present.
2. **Unconditional Gemini AI Instantiation**:
   - *Observation*: Startup warning `API key should be set when using the Gemini API.`.
   - *Root cause*: Direct instantiation of `new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })` in `server.ts` before verifying whether the key is present.
   - *Impact*: Caused a 30-second hang and retry loop during report uploads when no key was configured.
3. **Workspace Clutter & Script Pollution**:
   - Over 150 legacy scratch scripts (`patch_*.cjs`, `fix_*.cjs`, `test_*.cjs`) cluttered root directory and broke TypeScript type checks.
4. **Contradiction Engine Defect**:
   - Unhandled numeric formatting (`'120'` vs `'120.0'`) and strict un-normalized string comparison led to false-positive contradictions.
5. **TypeScript Exclusions**:
   - `tsconfig.json` lacked an `exclude` block, causing archived test scripts to break `tsc --noEmit`.
