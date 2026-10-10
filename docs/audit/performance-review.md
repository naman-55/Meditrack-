# Meditrack V3.1 — Phase 10: Cache & Performance Review Report

## 1. Application-Level In-Memory Caching
- **Cached Domains**: Frequently accessed read-heavy datasets including `healthcare_facilities` and `specialtyRules`.
- **TTL & Invalidation**: Managed via `appCache` with a 60-second TTL (`CACHE_TTL_MS = 60000`).
- **Mutation Invalidation**: Admin mutations (`POST /api/admin/specialty_rules`, `PUT /api/admin/specialty_rules/:id`) trigger explicit cache eviction via `clearCache('specialtyRules')`.

## 2. Frontend Query & Network Optimization
- **Token Memoization**: `src/api/client.ts` caches access tokens in-memory to prevent repeated `localStorage` access on rapid sequential calls.
- **Debounced Search**: Frontend global search queries (`/api/search`) require a minimum of 2 characters and enforce limit of 5 records per category to minimize payload sizes.
- **Code Splitting**: Vite Rollup bundle splits vendor chunks (`html2canvas`, `pdfExport`, `purify.es`) and lazy-loads route views, keeping initial SPA index bundle lightweight.

## 3. Database Query Performance
- Indexed foreign keys and search attributes across SQLite tables avoid sequential scans on high-cardinality collections (`users`, `medical_reports`, `measurements`, `trends`, `future_outlook`).
