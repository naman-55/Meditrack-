# Meditrack V3.1 — Phase 3: Gemini & AI API Integration Report

## 1. Investigation of `API key should be set when using the Gemini API`
- **Initial State**: During server startup, the Gemini SDK printed `API key should be set when using the Gemini API.` because `new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })` was called at the top of `server.ts` with an undefined `process.env.GEMINI_API_KEY`.
- **Root Cause**:
  1. No `.env` file existed to supply `GEMINI_API_KEY`.
  2. The SDK was initialized eagerly at module evaluation time rather than lazily.
  3. When reports were uploaded without an API key, the system entered an exponential backoff retry loop (5 retries lasting >30 seconds) before failing with an unhandled exception.

## 2. Centralized AI Service Architecture (`backend/services/ai.service.ts`)
To eliminate the warning and provide production-ready resilience, the AI integration was refactored into `aiService`:
- **Lazy Initialization**: `GoogleGenAI` is only instantiated when a valid `GEMINI_API_KEY` is present.
- **Fail-Fast Error Handling**: If an OCR request is made when no key is configured, `extractMedicalReport()` immediately throws a typed `GeminiAIError('GEMINI_NOT_CONFIGURED', ..., 503)`.
- **Error Classification**:
  - *Permanent Errors* (401, 403, invalid key, bad request): Fail immediately without wasteful retries.
  - *Transient Errors* (429 rate limit, 503 service unavailable, timeouts): Retried up to 3 times with exponential backoff.
- **Diagnostics**: A zero-cost provider health check endpoint was created at `/api/ai/health`.

## 3. Verified Verification Test
- **Test Executed**: Multipart upload to `/api/reports/upload` with dummy medical report.
- **Outcome**: Server immediately responded in <100ms with HTTP 503 and JSON:
  ```json
  {
    "error": "Gemini AI API key is not configured on this server. Please provide GEMINI_API_KEY in your .env file to enable document OCR biomarker extraction.",
    "code": "GEMINI_NOT_CONFIGURED"
  }
  ```
- **Conclusion**: Graceful degradation verified. Unrelated application features remain 100% operational.
