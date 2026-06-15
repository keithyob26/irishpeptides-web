# irishpeptides-web — Disaster Recovery Guide

> Next.js dashboard at irishpeptides-web.vercel.app. One-page restore guide.

---

## Full restore on a new machine

### Step 1 — Prerequisites (3 min)

```powershell
winget install Git.Git
winget install OpenJS.NodeJS
```

### Step 2 — Clone repo (1 min)

```powershell
cd C:\Projects
git clone https://github.com/keithyob26/irishpeptides-web.git irishpeptides-web
cd irishpeptides-web
```

### Step 3 — Install dependencies (2 min)

```powershell
npm install
```

### Step 4 — Restore secrets (2 min)

1. Get `secrets.enc` from Google Drive: `Irish Peptides Backup/irishpeptides-web/`
2. Copy `~/.ip_jarvis_backup_key` from old machine (or the jarvis repo's backup)
3. Decrypt: `py restore.py --decrypt-secrets`
4. Move decrypted file to `C:\Projects\greyhound-dashboard\tableau_secrets.env`

### Step 5 — Configure Vercel environment variables

See the Vercel dashboard: vercel.com/keithyob26/irishpeptides-web/settings/environment-variables

Required env vars:
- `GITHUB_TOKEN` — for agent status, commit history
- `NOTION_API_KEY` — for build queue and approvals
- `ANTHROPIC_API_KEY` — for AI chat (Claude)
- `GEMINI_API_KEY` — fallback chat
- `DEEPSEEK_API_KEY` — fallback chat
- `RESEND_API_KEY` — newsletter subscribers
- `VERCEL_TOKEN` — site control deployments
- `GA4_SERVICE_ACCOUNT_JSON` — analytics

### Step 6 — Start local dev (30 sec)

```powershell
npm run dev
```

Open: http://localhost:3000

### Step 7 — Re-enable Google Drive backup hook

```powershell
copy .git\hooks\post-commit.sample .git\hooks\post-commit
# Hook already present if restored from zip
```

---

## Re-authenticate Google Drive (if token expired)

```powershell
py -3.14 backup.py --auth-drive
```

Requires `~/.ip_jarvis_gdrive_credentials.json` (OAuth client from console.cloud.google.com).

---

## Backup locations

| Item | Location |
|------|----------|
| Code | Google Drive: `Irish Peptides Backup/irishpeptides-web/project_backup.zip` |
| Secrets | Google Drive: `Irish Peptides Backup/irishpeptides-web/secrets.enc` |
| Status | GitHub: `keithyob26/irishpeptides-jarvis/memory/backup_status.json` |

---

## Repo links

- Code: https://github.com/keithyob26/irishpeptides-web
- Live: https://irishpeptides-web.vercel.app

---

*Updated: 2026-06-15 | Irish Peptides Jarvis v2*
