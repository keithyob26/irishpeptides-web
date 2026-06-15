"""
restore.py — irishpeptides-web one-click recovery script.

Usage on a fresh machine:
    py restore.py                    # full restore
    py restore.py --from-zip PATH    # restore from specific zip
    py restore.py --decrypt-secrets  # decrypt secrets.enc only
    py restore.py --from-drive       # download from Google Drive first

See RECOVERY.md for step-by-step instructions.
"""
import sys
import os
import json
import zipfile
import shutil
import argparse
import subprocess
from pathlib import Path

PROJECT_DIR   = Path(r"C:\Projects\irishpeptides-web")
BACKUP_DIR    = PROJECT_DIR / "backups"
SECRETS_FILE  = Path(r"C:\Projects\greyhound-dashboard\tableau_secrets.env")
KEY_FILE      = Path.home() / ".ip_jarvis_backup_key"
TOKEN_FILE    = Path.home() / ".ip_jarvis_gdrive_token.json"
DRIVE_PARENT  = "Irish Peptides Backup"
DRIVE_SUB     = "irishpeptides-web"
DRIVE_SCOPES  = ["https://www.googleapis.com/auth/drive.file"]


def _print(msg: str) -> None:
    print(f"[restore-web] {msg}")


def _require_key() -> bytes:
    if not KEY_FILE.exists():
        sys.exit(f"Encryption key not found: {KEY_FILE}\nCopy from old machine or secure storage.")
    return KEY_FILE.read_bytes().strip()


def decrypt_secrets(enc_path: Path = None) -> Path:
    from cryptography.fernet import Fernet
    enc = enc_path or BACKUP_DIR / "secrets.enc"
    if not enc.exists():
        sys.exit(f"Encrypted secrets not found: {enc}")
    key = _require_key()
    f   = Fernet(key)
    raw = f.decrypt(enc.read_bytes())
    out = BACKUP_DIR / "secrets_restored.env"
    out.write_bytes(raw)
    _print(f"Secrets decrypted -> {out}")
    _print(f"Copy to: {SECRETS_FILE}")
    return out


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
        _print(f"Drive auth error: {e}")
        return None


def download_from_drive() -> dict:
    service = _get_drive_service()
    if not service:
        _print("Drive not authenticated. Using local backups.")
        return {}

    from googleapiclient.http import MediaIoBaseDownload
    import io

    def find_folder(name, parent_id=None):
        q = f"name='{name}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
        if parent_id:
            q += f" and '{parent_id}' in parents"
        res = service.files().list(q=q, fields="files(id)").execute()
        files = res.get("files", [])
        return files[0]["id"] if files else None

    parent_id = find_folder(DRIVE_PARENT)
    if not parent_id:
        _print(f"Drive folder '{DRIVE_PARENT}' not found.")
        return {}
    sub_id = find_folder(DRIVE_SUB, parent_id)
    if not sub_id:
        _print(f"Drive subfolder '{DRIVE_SUB}' not found.")
        return {}

    files = service.files().list(
        q=f"'{sub_id}' in parents and trashed=false",
        fields="files(id,name)"
    ).execute().get("files", [])

    BACKUP_DIR.mkdir(exist_ok=True)
    downloaded = {}
    for f in files:
        dest = BACKUP_DIR / f["name"]
        req  = service.files().get_media(fileId=f["id"])
        buf  = io.FileIO(str(dest), "wb")
        dl   = MediaIoBaseDownload(buf, req)
        done = False
        while not done:
            _, done = dl.next_chunk()
        buf.close()
        _print(f"Downloaded: {f['name']}")
        downloaded[f["name"]] = dest

    return downloaded


def restore_project(zip_path: Path = None) -> None:
    src = zip_path or BACKUP_DIR / "project_backup.zip"
    if not src.exists():
        sys.exit(f"Project backup zip not found: {src}")
    _print(f"Extracting {src} -> {PROJECT_DIR}")
    with zipfile.ZipFile(src, "r") as zf:
        zf.extractall(PROJECT_DIR)
    _print("Project files restored.")


def post_restore_setup() -> None:
    pkg = PROJECT_DIR / "package.json"
    if pkg.exists():
        _print("Installing Node.js dependencies...")
        subprocess.run(["npm", "install"], cwd=str(PROJECT_DIR), check=False)
    _print("\n=== Recovery complete ===")
    _print(f"Project: {PROJECT_DIR}")
    _print("Start:   npm run dev")
    _print("See RECOVERY.md for full instructions.")


def main() -> None:
    parser = argparse.ArgumentParser(description="irishpeptides-web restore")
    parser.add_argument("--from-zip",        metavar="PATH")
    parser.add_argument("--decrypt-secrets", action="store_true")
    parser.add_argument("--from-drive",      action="store_true")
    args = parser.parse_args()

    if args.decrypt_secrets:
        decrypt_secrets()
        return

    if args.from_drive:
        _print("Downloading backups from Google Drive...")
        download_from_drive()

    restore_project(Path(args.from_zip) if args.from_zip else None)
    decrypt_secrets()
    post_restore_setup()


if __name__ == "__main__":
    main()
