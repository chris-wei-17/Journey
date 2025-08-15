from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv()

class Settings(BaseModel):
    db_url: str
    supabase_http_url: str
    supabase_service_key: str
    staging_dir: str = "analytics/staging"
    logs_dir: str = "analytics/logs"

    class Config:
        extra = "ignore"


def _resolve_db_url() -> str:
    # Prefer explicit analytics DB URL or common DATABASE_URL
    for key in [
        "ANALYTICS_DB_URL",
        "DATABASE_URL",
        "SUPABASE_DB_URL",
    ]:
        val = os.getenv(key, "").strip()
        if val:
            return val
    # Fallback: if SUPABASE_URL is a postgres DSN (not HTTP), use it
    su = os.getenv("SUPABASE_URL", "").strip()
    if su.lower().startswith("postgres://") or su.lower().startswith("postgresql://"):
        return su
    return ""


def _resolve_http_url() -> str:
    # Prefer explicit HTTP URL envs
    for key in [
        "SUPABASE_HTTP_URL",
        "SUPABASE_URL",
    ]:
        val = os.getenv(key, "").strip()
        if val.lower().startswith("http"):
            return val
    return ""


def get_settings() -> Settings:
    return Settings(
        db_url=_resolve_db_url(),
        supabase_http_url=_resolve_http_url(),
        supabase_service_key=os.getenv("SUPABASE_SERVICE_KEY", ""),
        staging_dir=os.getenv("ANALYTICS_STAGING_DIR", "analytics/staging"),
        logs_dir=os.getenv("ANALYTICS_LOGS_DIR", "analytics/logs"),
    )