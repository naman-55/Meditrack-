# MediTrack V3.1 — Troubleshooting & Diagnostic Guide

This guide provides resolutions for common issues and debugging steps for **MediTrack V3.1**.

---

## 1. Port Conflict (`EADDRINUSE: port 3000`)

### Symptoms
When running `npm run dev`, the server fails to start with:
```text
Error: listen EADDRINUSE: address already in use :::3000
```

### Resolution
A previous Node.js instance is still holding port 3000.

#### On Windows (PowerShell)
```powershell
# Identify process ID
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess

# Force terminate
Stop-Process -Id <PID> -Force
```

#### On Linux / macOS
```bash
# Find and terminate process
lsof -ti :3000 | xargs kill -9
```

---

## 2. White Screen Stuck on "Loading..."

### Symptoms
Navigating to `http://localhost:3000` shows an unstyled `"Loading..."` text or blank screen that never transitions to `/login` or the dashboard.

### Root Cause
An unresolved Promise deadlock occurred during initial unauthenticated checks:
- The API client refresh subscriber queue in [`src/api/client.ts`](file:///d:/meditrack-v2.0/Meditrack%20V3.1/src/api/client.ts) only notified subscribers if a new token was successfully returned. When unauthenticated (`newToken === null`), queued promises waited indefinitely.
- The `AuthContext.tsx` `initAuth` call stayed in an uncompleted state, leaving `isLoading: true` forever.

### Verification of the Fix
Ensure your codebase has the patched `executeWithRefresh` logic:
- `onTokenRefreshed(newToken)` is called in the `finally` block in `src/api/client.ts`.
- `AuthContext.tsx` has a 2000ms safety timeout that guarantees `isLoading` resolves to `false`.
- Refresh your browser cache (`Ctrl + F5` or `Cmd + Shift + R`).

---

## 3. Gemini AI Integration Issues

### "AI service is currently not configured" (HTTP 503)
- **Cause**: No `GEMINI_API_KEY` is present in your `.env` file.
- **Resolution**:
  1. Generate an API key in [Google AI Studio](https://aistudio.google.com/).
  2. Open `.env` in the workspace root.
  3. Add `GEMINI_API_KEY=your_key_here`.
  4. Restart `npm run dev`.
  5. Check status via `http://localhost:3000/api/ai/health`.

### Transient 429 Rate Limit Errors
- **Cause**: Google Gemini free tier rate limit reached.
- **Resolution**: The AI service automatically classifies HTTP 429 responses and displays a friendly notice suggesting the user wait 30 seconds before retrying report extraction.

---

## 4. SQLite Database Locks (`SQLITE_BUSY`)

### Symptoms
API requests write-fail with `SqliteError: database is locked` or `SQLITE_BUSY`.

### Resolution
1. Verify that no other process (such as external DB viewers like DB Browser for SQLite) has opened `meditrack_new.db` in exclusive write mode.
2. Ensure WAL mode is active:
   ```sql
   PRAGMA journal_mode = WAL;
   ```
3. Close stale terminal sessions running duplicate `tsx server.ts` background workers.

---

## 5. TypeScript Compilation & Lint Errors

### Symptoms
`npx tsc --noEmit` fails on legacy script files.

### Resolution
Ensure `tsconfig.json` contains the exclusion rule:
```json
"exclude": [
  "node_modules",
  "dist",
  "scripts_archive"
]
```
All experimental one-off scripts should reside inside `scripts_archive/`.

---

## 6. Diagnostic API Health Probes

Run these commands to verify runtime state:

```bash
# Check overall system and database health
curl http://localhost:3000/api/health

# Check AI service state
curl http://localhost:3000/api/ai/health

# Run automated software validation
curl -H "Authorization: Bearer <ADMIN_TOKEN>" http://localhost:3000/api/admin/validation
```

---

## 7. Vite WebSocket Port 24678 & Dotenv Banner Resolution

### `WebSocket server error: Port 24678 is already in use`
- **Root Cause**: By default in development mode, when Vite is initialized via `createViteServer({ server: { middlewareMode: true } })` without an attached HTTP server instance, Vite creates an independent WebSocket server on fallback port `24678`. If an existing instance is active or port 24678 is bound, this error is displayed.
- **Permanent Fix Applied**: In `server.ts`, an explicit `http.Server` wraps the Express application (`http.createServer(app)`), and Vite's HMR configuration is explicitly bound to it:
  ```typescript
  const vite = await createViteServer({
    server: { 
      middlewareMode: true,
      hmr: { server: httpServer }
    },
    appType: 'spa',
  });
  ```
  HMR WebSocket upgrades are now handled over the primary HTTP server port (`3000`), completely eliminating port 24678 collisions.

### `◇ injected env (0) from .env // tip: ...`
- **Root Cause**: Dotenv v17+ prints diagnostic banner tips on boot. When `tsx` executes `server.ts`, environment variables are populated into `process.env` before Dotenv's `populate()` check runs, reporting `(0)` new keys injected.
- **Permanent Fix Applied**:
  1. Configured `DOTENV_CONFIG_QUIET=true` in `.env`.
  2. Updated `server.ts` and `backend/config/env.ts` to call `dotenv.config({ quiet: true, override: true })`.
  3. Clean console startup output: only the server URL `Server running on http://localhost:3000` is displayed.

