from typing import Iterator
import psycopg
from psycopg.rows import dict_row
from .config import get_settings


def get_conn() -> psycopg.Connection:
    settings = get_settings()
    dsn = settings.supabase_url.replace("postgresql://", "").replace("postgres://", "")
    # Expect full DATABASE_URL style env var; if not provided, raise.
    # In Supabase, use the pooled connection string with service role credentials.
    if not settings.supabase_url:
        raise RuntimeError("SUPABASE_URL not set")
    # psycopg accepts connection string directly
    return psycopg.connect(settings.supabase_url, row_factory=dict_row)


def fetch_query(sql: str) -> list[dict]:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            return cur.fetchall()