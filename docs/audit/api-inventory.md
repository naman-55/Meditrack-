# Meditrack V3.1 — Phase 4: Complete API Inventory & Verification

## 1. Public & Diagnostic Endpoints
| Method | Route | Auth Required | Purpose | Status Verified |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | None | System, database, env & AI status | 200 OK |
| `GET` | `/api/ai/health` | None | Gemini configuration check | 200 OK |
| `GET` | `/api/specialists/specialties` | None | List of medical specialties | 200 OK |
| `GET` | `/api/specialists/nearby` | None | Nearby facilities by radius/lat/lng | 200 OK |
| `GET` | `/api/specialists/geocode` | None | City / address geocoding | 200 OK |
| `GET` | `/api/specialists/directions`| None | Direction link generation | 200 OK |

## 2. Authentication Endpoints
| Method | Route | Auth Required | Purpose | Status Verified |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | None (Rate limited) | User registration | 200 OK |
| `POST` | `/api/auth/login` | None (Rate limited) | Login & token issuance | 200 OK |
| `POST` | `/api/auth/refresh` | Cookie | Silent access token refresh | 200 OK |
| `POST` | `/api/auth/logout` | Optional | Session revocation & cookie wipe | 200 OK |
| `POST` | `/api/auth/request-reset` | None | Password reset token request | 200 OK |
| `POST` | `/api/auth/verify-reset-token`| None | Token validity verification | 200 OK |
| `POST` | `/api/auth/reset-password` | None | Execute password reset | 200 OK |

## 3. User & Clinical Endpoints
| Method | Route | Auth Required | Purpose | Status Verified |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/auth/me` | Bearer Token | User profile payload | 200 OK |
| `PUT` | `/api/auth/me` | Bearer Token | Profile update | 200 OK |
| `GET` | `/api/reports` | Bearer Token | User medical reports list | 200 OK (401 if unauthenticated) |
| `POST` | `/api/reports/upload` | Bearer Token | Multipart PDF/Image report upload | Verified (503 fast fail if no key) |
| `GET` | `/api/reports/:id` | Bearer Token | Report details & measurements | 200 OK |
| `DELETE`| `/api/reports/:id` | Bearer Token | Delete report & cascade data | 200 OK |
| `GET` | `/api/reports/:id/view` | Bearer Token | Stream PDF for viewer | 200 OK |
| `GET` | `/api/reports/:id/download` | Bearer Token | Download authentic/synthesized PDF | 200 OK |
| `GET` | `/api/measurements` | Bearer Token | Extracted biomarker records | 200 OK |
| `GET` | `/api/contradictions` | Bearer Token | Detected clinical contradictions | 200 OK |
| `GET` | `/api/trends` | Bearer Token | Longitudinal trend list | 200 OK |
| `POST` | `/api/trends/analyze` | Bearer Token | Compute longitudinal trends | 200 OK |
| `GET` | `/api/risk` | Bearer Token | Multi-domain health risk score | 200 OK |
| `POST` | `/api/risk/analyze` | Bearer Token | Execute risk engine calculations | 200 OK |
| `GET` | `/api/outlook` | Bearer Token | Biomarker future forecasts | 200 OK |
| `POST` | `/api/outlook/analyze`| Bearer Token | Execute forecasting engine | 200 OK |
| `GET` | `/api/specialty` | Bearer Token | Specialty recommendations | 200 OK |
| `POST` | `/api/specialty/analyze`| Bearer Token | Execute specialty guidance rules | 200 OK |
| `GET` | `/api/search` | Bearer Token | Global search across clinical data | 200 OK |

## 4. Admin Endpoints (Require `role === 'ADMIN'`)
| Method | Route | Role Required | Purpose | Status Verified |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/users` | ADMIN | User management roster | 200 OK |
| `PUT` | `/api/admin/users/:id/status`| ADMIN | Suspend/activate user | 200 OK |
| `GET` | `/api/admin/facilities` | ADMIN | Facility database list | 200 OK |
| `POST` | `/api/admin/facilities` | ADMIN | Add healthcare facility | 200 OK |
| `GET` | `/api/admin/validation` | ADMIN | Execute software verification suite | 200 OK |
| `GET` | `/api/admin/logs` | ADMIN | System security & event logs | 200 OK |
