from pathlib import Path
from loguru import logger
from supabase import create_client, Client
from .config import get_settings
import json


def get_supabase_client() -> Client:
    s = get_settings()
    if not s.supabase_http_url or not s.supabase_service_key:
        raise RuntimeError("Supabase HTTP URL/service key not set for cloud operations")
    return create_client(s.supabase_http_url, s.supabase_service_key)


def upload_dir_to_bucket(local_dir: Path, bucket: str, prefix: str = ""):
    client = get_supabase_client()
    for path in local_dir.rglob("*"):
        if path.is_file():
            rel = path.relative_to(local_dir)
            key = f"{prefix}/{rel}" if prefix else str(rel)
            with open(path, "rb") as f:
                logger.info(f"Uploading {path} -> {bucket}/{key}")
                client.storage.from_(bucket).upload(key, f, file_options={"upsert": True})


def build_manifest(local_dir: Path) -> dict:
    files = []
    for path in local_dir.rglob("*"):
        if path.is_file():
            files.append(str(path.relative_to(local_dir)))
    return {"files": files}