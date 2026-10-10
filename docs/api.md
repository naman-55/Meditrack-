# MediTrack V3.1 — REST API Reference

This specification documents the complete HTTP REST API for MediTrack V3.1.

---

## 1. Authentication & Security

All authenticated endpoints require an `Authorization` header containing a valid Bearer JWT:
```http
Authorization: Bearer <access_token>
```

Additionally, `/api/auth/refresh` expects an HTTP-only secure cookie named `refreshToken`:
```http
Cookie: refreshToken=<refresh_token_jwt>
```

---

## 2. System & Diagnostic Endpoints

### `GET /api/health`
Retrieves overall system status, configuration validity, and runtime metrics.
- **Authentication**: None
- **Response**: `200 OK`
```json
{
  "status": "HEALTHY",
  "version": "3.1.0",
  "timestamp": "2026-10-10T15:49:43.149Z",
  "env": {
    "environment": "development",
    "port": 3000,
    "corsOriginsCount": 2,
    "authConfigured": true,
    "geminiConfigured": true,
    "mapsConfigured": true,
    "emailProvider": "console"
  },
  "ai": {
    "status": "CONFIGURED",
    "provider": "Google Gemini",
    "model": "gemini-2.5-flash",
    "message": "Gemini AI integration is active and configured."
  }
}
```

### `GET /api/ai/health`
Retrieves the operational status of the Google Gemini AI integration.
- **Authentication**: None
- **Response**: `200 OK`
```json
{
  "status": "CONFIGURED",
  "provider": "Google Gemini",
  "model": "gemini-2.5-flash",
  "message": "Gemini AI integration is active and configured."
}
```

---

## 3. Authentication Endpoints

### `POST /api/auth/register`
Creates a new patient account.
- **Authentication**: None
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!",
  "name": "Jane Doe"
}
```
- **Response**: `201 Created`
```json
{
  "message": "User registered successfully",
  "access_token": "eyJhbGciOi...",
  "user": {
    "id": 12,
    "email": "user@example.com",
    "name": "Jane Doe",
    "role": "PATIENT"
  }
}
```

### `POST /api/auth/login`
Authenticates user credentials and issues an access token and refresh cookie.
- **Authentication**: None
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```
- **Response**: `200 OK`
```json
{
  "access_token": "eyJhbGciOi...",
  "user": {
    "id": 12,
    "email": "user@example.com",
    "name": "Jane Doe",
    "role": "PATIENT"
  }
}
```

### `POST /api/auth/refresh`
Rotates access token using the HTTP-only `refreshToken` cookie.
- **Authentication**: Cookie-based
- **Response**: `200 OK`
```json
{
  "access_token": "eyJhbGciOi..."
}
```
- **Errors**: `401 Unauthorized` if refresh token is expired or absent.

### `GET /api/auth/me`
Fetches the current user profile.
- **Authentication**: Bearer Token
- **Response**: `200 OK`
```json
{
  "id": 12,
  "email": "user@example.com",
  "name": "Jane Doe",
  "role": "PATIENT"
}
```

---

## 4. Clinical Reports & Measurements

### `GET /api/reports`
Retrieves all uploaded medical reports for the authenticated patient.
- **Authentication**: Bearer Token
- **Response**: `200 OK`
```json
[
  {
    "id": 1,
    "title": "Complete Blood Count & Metabolic Panel",
    "report_date": "2026-08-15",
    "category": "Hematology",
    "created_at": "2026-08-15T10:00:00.000Z"
  }
]
```

### `POST /api/reports/upload`
Uploads a clinical document (PDF, PNG, JPG) and triggers AI biomarker extraction.
- **Authentication**: Bearer Token
- **Content-Type**: `multipart/form-data`
- **Fields**: `file` (Binary)
- **Response**: `201 Created`
```json
{
  "report_id": 42,
  "title": "Lipid Profile",
  "date": "2026-10-01",
  "parameters_extracted": 5,
  "contradictions_detected": 0
}
```
- **Fail-Fast Error**: `503 Service Unavailable` if AI service is unconfigured:
```json
{
  "error": "AI service is currently not configured. Set GEMINI_API_KEY in server environment.",
  "code": "AI_UNCONFIGURED"
}
```

### `GET /api/measurements`
Retrieves longitudinal biomarker data.
- **Authentication**: Bearer Token
- **Query Parameters**:
  - `parameter` (optional): Filter by name (e.g., `HbA1c`, `Systolic BP`)
- **Response**: `200 OK`
```json
[
  {
    "id": 101,
    "parameter_name": "Hemoglobin A1c",
    "normalized_value": 5.7,
    "unit": "%",
    "reference_range": "4.0 - 5.6",
    "flag": "HIGH",
    "measurement_date": "2026-08-15"
  }
]
```

---

## 5. Clinical Contradictions & Analytics

### `GET /api/contradictions`
Retrieves all detected conflicts across the patient's reports.
- **Authentication**: Bearer Token
- **Response**: `200 OK`
```json
[
  {
    "id": 3,
    "parameter_name": "Blood Group",
    "report_a_id": 1,
    "report_b_id": 2,
    "value_a": "O+",
    "value_b": "A+",
    "severity": "CRITICAL",
    "explanation": "Biological invariant conflict: Blood Group cannot mutate between reports."
  }
]
```

### `GET /api/trends`
Calculates directional trends for key biomarkers over time.
- **Authentication**: Bearer Token
- **Response**: `200 OK`
```json
[
  {
    "parameter": "Fasting Blood Sugar",
    "unit": "mg/dL",
    "direction": "INCREASING",
    "percent_change": 12.5,
    "data_points": 4
  }
]
```

---

## 6. Geolocation & Facilities

### `GET /api/specialists/nearby`
Finds healthcare facilities near the user's coordinates.
- **Authentication**: None
- **Query Parameters**:
  - `lat`: Latitude
  - `lng`: Longitude
  - `specialty` (optional): Specialty filter (e.g., `Cardiology`, `Endocrinology`)
- **Response**: `200 OK`
```json
[
  {
    "id": 1,
    "name": "Metro Health Specialty Center",
    "address": "123 Medical Center Blvd",
    "specialty": "Cardiology",
    "lat": 37.7749,
    "lng": -122.4194,
    "distance_km": 2.4
  }
]
```

---

## 7. Administrative Endpoints

### `GET /api/admin/validation`
Executes the comprehensive 14-point software validation suite.
- **Authentication**: Bearer Token (`role === 'ADMIN'`)
- **Response**: `200 OK`
```json
{
  "suite": "MediTrack System Integrity Validation",
  "timestamp": "2026-10-10T15:00:00.000Z",
  "summary": {
    "total": 14,
    "passed": 14,
    "failed": 0,
    "status": "PASS"
  },
  "results": [
    { "test_id": "DB-01", "name": "SQLite Relational Connection", "status": "PASSED" },
    { "test_id": "AUTH-01", "name": "Bcrypt Password Hashing & Salt Verification", "status": "PASSED" },
    { "test_id": "AUTH-02", "name": "JWT Issuance, Expiry & Tamper Rejection", "status": "PASSED" },
    { "test_id": "CLINICAL-01", "name": "Contradiction Engine Numeric Equivalence", "status": "PASSED" }
  ]
}
```
