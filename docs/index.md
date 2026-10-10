# MediTrack V3.1 — Documentation Portal

Welcome to the central documentation hub for **MediTrack V3.1**. This repository provides clinical-grade biomarker tracking, automated medical document OCR extraction via Google Gemini AI, longitudinal health trend analytics, and real-time contradiction detection.

---

## 📚 Core Documentation Library

| Document | Description | Target Audience |
| :--- | :--- | :--- |
| [**System Architecture**](architecture.md) | Complete architectural blueprint of client, server, storage, and AI subsystems. | Full-Stack Engineers, Architects |
| [**REST API Reference**](api.md) | Comprehensive endpoint definitions, request/response models, and status codes. | Frontend Engineers, API Integrators |
| [**AI OCR Engine**](ai-engine.md) | Google Gemini 2.5 Flash pipeline, schema extraction, lazy initialization, and resilience. | AI Engineers, Data Engineers |
| [**Clinical Contradiction Logic**](clinical-rules.md) | Algorithmic biomarker normalization, numeric equivalence, and severity matrices. | Clinical Reviewers, Backend Devs |
| [**Production Deployment**](deployment.md) | Operational guidelines for Docker, Node.js runtime, reverse proxy, and SSL. | DevOps, Sysadmins |
| [**Troubleshooting & FAQ**](troubleshooting.md) | Step-by-step resolution of common errors, port binds, auth loops, and AI status. | Developers, QA Engineers |

---

## 🔍 Audit & Verification Reports

Detailed technical audit records created during comprehensive system verification:

- [**Final Repair & Audit Report**](audit/final-repair-report.md): Executive summary of all fixes applied, before/after metrics, and verification table.
- [**Initial Findings Report**](audit/initial-findings.md): Baseline scan and catalog of previous clutter and runtime issues.
- [**Environment Configuration Audit**](audit/environment-configuration.md): Deep dive into `.env`, credential handling, and zero-leakage security.
- [**AI Integration Audit**](audit/ai-integration.md): Transition to lazy initialization and resilient fail-fast architecture.
- [**API Inventory Audit**](audit/api-inventory.md): Full route classification, authentication checks, and payload schemas.
- [**Database Integrity Audit**](audit/database-integrity.md): SQLite relational structure, foreign keys, index coverage, and safety.
- [**Frontend-Backend Integration Audit**](audit/frontend-backend-integration.md): Auth token refresh lifecycle, client interceptors, and CORS.
- [**Security & RBAC Review**](audit/security-review.md): Bcrypt verification, JWT tampering defenses, cookie policies, and upload restrictions.
- [**Performance Review**](audit/performance-review.md): Startup latency, OCR turnaround, database index query benchmarks.
- [**File Management & Cleanup**](audit/file-management.md): Organization of archived scratch scripts into `scripts_archive/`.

---

## 🏁 Quick Reference

### Running the App Locally
```bash
# Install dependencies
npm install

# Ensure .env is present
cp .env.example .env

# Run development server
npm run dev
```

### Access Points
- **Web Application**: `http://localhost:3000`
- **System Health**: `http://localhost:3000/api/health`
- **AI Service Health**: `http://localhost:3000/api/ai/health`
- **Admin Validation**: `http://localhost:3000/admin/software-validation`
