# Meditrack V3.1 — Phase 5: Frontend & Backend Integration Report

## 1. Client-Server Architecture
- **API Client**: Implemented in `src/api/client.ts`. Employs relative path routing (`/api/...`), ensuring that both development (via Vite middleware proxying) and production (via Express static serving) connect to the active backend without hardcoded hostname/port collisions.
- **Authentication Lifecycle**:
  - `getAccessToken()` retrieves JWT from in-memory cache or `localStorage`.
  - On HTTP 401 response, `executeWithRefresh()` triggers a silent POST to `/api/auth/refresh` using HttpOnly refresh cookie credentials.
  - Pending API requests are queued and automatically retried once a refreshed token is acquired.
- **Error Propagation**: Non-2xx responses are parsed for `{ error }` and `{ message }` payloads and thrown as formatted JS Errors to trigger UI alert banners and form state errors.

## 2. Page & Endpoint Integration Matrix
- **Dashboard (`src/pages/Dashboard.tsx`)**: Queries `/api/reports`, `/api/measurements`, `/api/trends`, `/api/risk`, `/api/alerts`.
- **Reports Management (`src/pages/Reports.tsx`)**: Queries `/api/reports`, supports multipart uploads to `/api/reports/upload`, PDF streaming from `/api/reports/:id/view`, and deletion from `/api/reports/:id`.
- **Trends & Forecast (`src/pages/Trends.tsx`, `FutureOutlook.tsx`)**: Queries `/api/trends`, `/api/trends/analyze`, `/api/outlook`, `/api/outlook/analyze`.
- **Care Near Me (`src/pages/CareNearMe.tsx`)**: Uses `facilitiesService` (`/api/facilities`) and `specialistsService` (`/api/specialists/nearby`, `/api/specialists/specialties`).
- **Software Validation Dashboard (`src/pages/SoftwareValidation.tsx`)**: Calls `/api/admin/validation` to display live software verification metrics and test outcomes.

## 3. UI Integrity & Design System
- All existing Tailwind CSS 4 design tokens, color palettes, responsive layouts, and interactive components are strictly preserved.
- Empty states, loading spinners, and error boundary wrappers (`src/components/ErrorBoundary.tsx`) protect all core views from unhandled rendering errors.
