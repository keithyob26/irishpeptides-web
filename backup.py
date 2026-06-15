"""
backup.py — irishpeptides-web auto-backup script.

Called by .git/hooks/post-commit after every commit.

What it does:
1. Encrypts tableau_secrets.env -> backups/secrets.enc (Fernet symmetric key)
2. Zips the project -> backups/project_backup.zip
3. Uploads to Google Drive 'Irish Peptides Backup/irishpeptides-web/' folder
4. Updates memory/backup_status.json in irishpeptides-jarvis repo via GitHub API

First-time Drive setup:
    py -3.14 backup.py --auth-drive

Encryption key: ~/.ip_jarvis_backup_key  (shared with jarvis repo, never commit)
"""
import sys
import os
import json
import zipfile
import shutil
import argparse
import logging
from pathlib import Path
from datetime import datetime, timezone

# ── Paths ───────────────────────────────────────────────────────────────────
PROJECT_DIR  = Path(r"C:\Projects\irishpeptides-web")
SECRETS_FILE = Path(r"C:\Projects\greyhound-dashboard\tableau_secrets.env")
BACKUP_DIR   = PROJECT_DIR / "backups"
LOG_FILE     = BACKUP_DIR / "backup.log"
KEY_FILE     = Path.home() / ".ip_jarvis_backup_key"
TOKEN_FILE   = Path.home() / ".ip_jarvis_gdrive_token.json"
CREDS_FILE   = Path.home() / ".ip_jarvis_gdrive_credentials.json"

DRIVE_PARENT_FOLDER = "Irish Peptides Backup"
DRIVE_SUBFOLDER     = "irishpeptides-web"
DRIVE_SCOPES        = ["https://www.googleapis.com/auth/drive.file"]

SKIP_DIRS  = {".git", "__pycache__", "backups", "node_modules", ".next", ".vercel", ".mypy_cache"}
SKIP_EXTS  = {".pyc", ".pyo"}

# ── Logging ──────────────────────────────────────────────────────────────────
BACKUP_DIR.mkdir(exist_ok=True)
_stream_handler = logging.StreamHandler(sys.stdout)
try:
    _stream_handler.stream.reconfigure(encoding="utf-8")
except AttributeError:
    pass
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        _stream_handler,
    ],
)
log = logging.getLogger("backup-web")


# ── Encryption ───────────────────────────────────────────────────────────────
def _get_or_create_key() -> bytes:
    if KEY_FILE.exists():
        return KEY_FILE.read_bytes().strip()
    from cryptography.fernet import Fernet
    key = Fernet.generate_key()
    KEY_FILE.write_bytes(key)
    try:
        os.chmod(KEY_FILE, 0o600)
    except Exception:
        pass
    log.info("New encryption key generated -> %s  (keep this safe!)", KEY_FILE)
    return key


def encrypt_secrets() -> Path:
    from cryptography.fernet import Fernet
    if not SECRETS_FILE.exists():
        log.warning("Secrets file not found: %s", SECRETS_FILE)
        return None
    key  = _get_or_create_key()
    f    = Fernet(key)
    enc  = f.encrypt(SECRETS_FILE.read_bytes())
    dest = BACKUP_DIR / "secrets.enc"
    dest.write_bytes(enc)
    log.info("Secrets encrypted -> %s", dest)
    return dest


# ── Project Zip ───────────────────────────────────────────────────────────────
def zip_project() -> Path:
    zip_path = BACKUP_DIR / "project_backup.zip"
    count = 0
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for src in sorted(PROJECT_DIR.rglob("*")):
            if not src.is_file():
                continue
            rel = src.relative_to(PROJECT_DIR)
            parts = set(rel.parts)
            if parts & SKIP_DIRS:
                continue
            if src.suffix in SKIP_EXTS:
                continue
            zf.write(src, rel)
            count += 1
    size_kb = zip_path.stat().st_size // 1024
    log.info("Project zipped -> %s (%d files, %d KB)", zip_path, count, size_kb)
    return zip_path


# ── Google Drive ──────────────────────────────────────────────────────────────
def _get_drive_service():
    try:
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request
        from googleapiclient.discovery import build

        if not TOKEN_FILE.exists():
            return None
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), DRIVE_SCOPES)
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            TOKEN_FILE.write_text(creds.to_json())
        return build("drive", "v3", credentials=creds, cache_discovery=False)
    except Exception as e:
        log.warning("Drive auth error: %s", e)
        return None


def _get_or_create_folder(service, name: str, parent_id: str = None) -> str:
    q = f"name='{name}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
    if parent_id:
        q += f" and '{parent_id}' in parents"
    res = service.files().list(q=q, fields="files(id)").execute()
    files = res.get("files", [])
    if files:
        return files[0]["id"]
    body = {"name": name, "mimeType": "application/vnd.google-apps.folder"}
    if parent_id:
        body["parents"] = [parent_id]
    folder = service.files().create(body=body, fields="id").execute()
    log.info("Created Drive folder '%s' (id=%s)", name, folder["id"])
    return folder["id"]


def _drive_upload_file(service, local_path: Path, folder_id: str) -> bool:
    from googleapiclient.http import MediaFileUpload
    name = local_path.name
    q = f"name='{name}' and '{folder_id}' in parents and trashed=false"
    res = service.files().list(q=q, fields="files(id)").execute()
    existing = res.get("files", [])
    media = MediaFileUpload(str(local_path), resumable=False)
    if existing:
        service.files().update(fileId=existing[0]["id"], media_body=media).execute()
    else:
        service.files().create(
            body={"name": name, "parents": [folder_id]},
            media_body=media, fields="id",
        ).execute()
    log.info("Drive upload: %s -> %s/%s/", name, DRIVE_PARENT_FOLDER, DRIVE_SUBFOLDER)
    return True


def upload_to_drive(paths: list) -> bool:
    service = _get_drive_service()
    if not service:
        log.warning("Google Drive not authenticated. Run: py -3.14 backup.py --auth-drive")
        return False
    try:
        parent_id = _get_or_create_folder(service, DRIVE_PARENT_FOLDER)
        sub_id    = _get_or_create_folder(service, DRIVE_SUBFOLDER, parent_id)
        for p in paths:
            if p and p.exists():
                _drive_upload_file(service, p, sub_id)
        return True
    except Exception as e:
        log.error("Drive upload failed: %s", e)
        return False


# ── GitHub status update ──────────────────────────────────────────────────────
def _read_github_token() -> str:
    if SECRETS_FILE.exists():
        for line in SECRETS_FILE.read_text(encoding="utf-8").splitlines():
            if line.startswith("GITHUB_TOKEN="):
                return line.split("=", 1)[1].strip()
    return os.environ.get("GITHUB_TOKEN", "")


def update_backup_status(ts: str) -> None:
    """Update memory/backup_status.json in irishpeptides-jarvis via GitHub API."""
    import urllib.request
    import urllib.error
    import base64

    token = _read_github_token()
    if not token:
        log.warning("GITHUB_TOKEN not found — skipping backup status update")
        return

    api_base = "https://api.github.com"
    repo     = "keithyob26/irishpeptides-jarvis"
    path     = "memory/backup_status.json"
    url      = f"{api_base}/repos/{repo}/contents/{path}"

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
    }

    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read())
        current = json.loads(base64.b64decode(data["content"]).decode())
        sha = data["sha"]
    except urllib.error.HTTPError as e:
        if e.code == 404:
            current = {"repos": {}}
            sha = None
        else:
            log.warning("GitHub API error reading backup_status: %s", e)
            return

    current.setdefault("repos", {})
    current["repos"]["irishpeptides-web"] = {
        "last_backup": ts,
        "status": "ok",
    }

    content_b64 = base64.b64encode(json.dumps(current, indent=2).encode()).decode()
    payload = {
        "message": f"chore: update irishpeptides-web backup status [{ts[:10]}]",
        "content": content_b64,
    }
    if sha:
        payload["sha"] = sha

    req = urllib.request.Request(
        url, data=json.dumps(payload).encode(),
        headers=headers, method="PUT",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            log.info("Backup status updated in GitHub: irishpeptides-web = %s", ts)
    except Exception as e:
        log.warning("Failed to update GitHub backup status: %s", e)


# ── Auth ──────────────────────────────────────────────────────────────────────
def auth_drive() -> None:
    from google_auth_oauthlib.flow import InstalledAppFlow
    if not CREDS_FILE.exists():
        print(f"\nMissing credentials file: {CREDS_FILE}\nSee jarvis/backup.py --auth-drive for setup instructions.\n")
        sys.exit(1)
    flow = InstalledAppFlow.from_client_secrets_file(str(CREDS_FILE), DRIVE_SCOPES)
    creds = flow.run_local_server(port=0)
    TOKEN_FILE.write_text(creds.to_json())
    print(f"Drive authenticated. Token saved to {TOKEN_FILE}")


# ── Main ──────────────────────────────────────────────────────────────────────
def run_backup() -> None:
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    log.info("=== irishpeptides-web backup started — %s ===", ts)

    enc_path = encrypt_secrets()
    zip_path = zip_project()

    drive_ok = upload_to_drive([enc_path, zip_path])
    if not drive_ok:
        log.info("Local backup complete. Drive upload skipped (not authenticated).")
    else:
        log.info("Local + Drive backup complete.")

    # Write local status
    status_file = BACKUP_DIR / "last_backup.json"
    status_file.write_text(json.dumps({"last_backup": ts, "repo": "irishpeptides-web"}))

    # Update central status in jarvis repo
    update_backup_status(ts)

    log.info("=== Backup finished ===")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="irishpeptides-web backup")
    parser.add_argument("--auth-drive", action="store_true", help="Authenticate Google Drive OAuth")
    args = parser.parse_args()
    if args.auth_drive:
        auth_drive()
    else:
        run_backup()
