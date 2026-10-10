# Meditrack V3.1 — Phase 7: File Management & Document Processing Report

## 1. Upload Lifecycle & Storage Architecture
- **Upload Directory**: Dedicated `./uploads/` directory on local disk. Private, not exposed as a public static Express folder.
- **Multipart Processing**: Multer middleware with a 10MB file size limit (`limits: { fileSize: 10 * 1024 * 1024 }`).
- **Filename Sanitization**: Uploaded files receive a cryptographically random, collision-resistant identifier:
  `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt}`.
- **Deduplication**: Cryptographic SHA-256 hash calculated over the buffer prior to storage. If a file with an identical hash already exists for the user, duplicate re-processing is avoided and the existing report is returned.

## 2. Document Access Control & PDF Streaming
- **Authorization Enforcement**: Download and view endpoints (`/api/reports/:id/download`, `/api/reports/:id/view`) strictly verify `user_id === req.user.id` or administrative privileges. Arbitrary file parameter tampering is blocked.
- **Path Traversal Protection**: File paths are validated against allowed storage locations; raw user-supplied paths cannot traverse into system directories.
- **PDF Fallback & Synthesis**: `ensureReportPdf()` inspects stored files. If a file is missing or corrupted, a clinical PDF report is dynamically synthesized via `jsPDF` using the verified database measurements, guaranteeing downloadable reports for patients.
