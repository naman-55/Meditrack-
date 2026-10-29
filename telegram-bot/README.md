# 🤖 MediTrack Telegram Health Assistant Bot

Dedicated folder for the MediTrack Telegram Bot and Health Assistant integration.

---

## 📁 Folder Structure

```
telegram-bot/
├── index.ts               # Module entry point
├── telegramService.ts     # Core bot logic, commands, AI clinical assistant & linking
├── runner.ts              # Standalone polling worker (npx tsx telegram-bot/runner.ts)
└── README.md              # Documentation & setup guide
```

---

## 🚀 Quick Start / Kaise Run Karein

### 1. Configure Environment (`.env`)
Add your Telegram Bot credentials to the root `.env` file:

```env
TELEGRAM_BOT_TOKEN="your_bot_token_from_botfather"
TELEGRAM_BOT_USERNAME="MediTrackAlertsBot"
APP_BASE_URL="http://localhost:3000"
```

### 2. Standalone Polling Mode (Bina Webhook Ke Run Karna)
To run the Telegram bot independently in your terminal:

```bash
npm run telegram:bot
```
*Ya fir:*
```bash
npx tsx telegram-bot/runner.ts
```

### 3. Integrated Webhook Mode (Default Web Server Ke Saath)
Jab MediTrack ka main server chalta hai (`npm run dev`), bot ke endpoints automatically active rehte hain:
- `POST /api/notifications/telegram/webhook` (Official Telegram Webhook)
- `POST /api/notifications/telegram/poll-updates` (Manual polling trigger)
- `POST /api/notifications/telegram/connect-link` (Generate 15-min single-use deep link)
- `POST /api/notifications/telegram/disconnect` (Unlink contact)

---

## 💬 Bot Commands

| Command | Description |
|---|---|
| `/start <token>` | Secure single-use account linking token validate karke chat link karta hai |
| `/status` | Latest health status and active alert overview |
| `/summary` | Latest medical report & lab biomarkers summary |
| `/alerts` | Recent clinical alerts list |
| `/reports` | Uploaded diagnostic reports list |
| `/trends` | Biomarker trajectory & historical comparison |
| `/risk` | Cardiovascular & metabolic risk assessment |
| `/medications` | Active prescribed medications |
| `/help` | Complete command list |
| `/stop` | Disconnect Telegram and stop alerts |

---

## 🔒 Security & Data Privacy
- **Strict Data Isolation:** Unlinked chats ko koi medical data nahi milta.
- **Single-Use Tokens:** Deep linking links 15 minute me expire hote hain aur atomic single-use consume hote hain.
- **Token Redaction:** Telegram bot tokens kabhi client responses ya server logs me leak nahi hote.
- **Emergency Disclaimer:** Emergency symptoms detect hone par bot turant emergency care (911/112) lene ki advice deta hai.
