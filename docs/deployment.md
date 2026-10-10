# MediTrack V3.1 — Production Deployment Guide

This guide describes how to configure, build, and deploy **MediTrack V3.1** to a production Linux or Windows server.

---

## 1. System Requirements

- **Runtime**: Node.js v20.x or higher LTS
- **Memory**: Minimum 1GB RAM (2GB+ recommended for concurrent OCR handling)
- **Disk**: 5GB free storage for SQLite databases, temporary uploads, and log retention
- **Reverse Proxy**: Nginx or Caddy with TLS/HTTPS enabled

---

## 2. Production Build Pipeline

MediTrack uses a two-phase production build:
1. **Frontend**: Vite bundles React 19 components, assets, and styles into the `./dist` folder.
2. **Backend**: `esbuild` bundles `server.ts` into a standalone CommonJS Node module at `./dist/server.cjs`.

### Build Command
```bash
npm run build
```

---

## 3. Production Environment Variables

Ensure your production `.env` is configured with cryptographically random secrets:

```ini
PORT=3000
NODE_ENV=production
APP_URL=https://meditrack.yourdomain.com

# Cryptographically random secrets (Generate using `openssl rand -hex 32`)
JWT_SECRET=your_production_jwt_secret_minimum_32_characters_long
JWT_REFRESH_SECRET=your_production_refresh_secret_minimum_32_characters_long
SESSION_SECRET=your_production_session_secret_minimum_32_characters_long

# Database path
DATABASE_URL=file:./meditrack_new.db

# Google Gemini API Key for document processing
GEMINI_API_KEY=AIzaSy...your_gemini_api_key...
GEMINI_MODEL=gemini-2.5-flash

# CORS Allowed Origins (Comma-separated)
CORS_ORIGIN=https://meditrack.yourdomain.com
```

---

## 4. Process Management (PM2)

Using PM2 ensures automatic process recovery, log rotation, and cluster management.

### Ecosystem File (`ecosystem.config.cjs`)
```javascript
module.exports = {
  apps: [
    {
      name: "meditrack-v3",
      script: "./dist/server.cjs",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
```

### Starting the Process
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

---

## 5. Reverse Proxy Configuration (Nginx)

Place Nginx in front of Node.js for SSL termination, request buffering, and static caching:

```nginx
server {
    listen 80;
    server_name meditrack.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name meditrack.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/meditrack.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/meditrack.yourdomain.com/privkey.pem;

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 6. Security Hardening Checklist

- [ ] Changed default passwords for demo accounts (`patient@meditrack.com`, `admin@meditrack.com`).
- [ ] Generated unique `JWT_SECRET` and `JWT_REFRESH_SECRET` values (min 32 bytes).
- [ ] Confirmed `NODE_ENV=production` is active.
- [ ] Set `secure: true` for cookies when running under HTTPS.
- [ ] Set appropriate backup retention on SQLite `meditrack_new.db`.
- [ ] Restricted permissions on `./uploads/` to the application user.
