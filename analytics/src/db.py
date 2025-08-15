from typing import Iterator
import psycopg
from psycopg.rows import dict_row
from .config import get_settings


def get_conn() -> psycopg.Connection:
    settings = get_settings()
    if not settings.db_url:
        raise RuntimeError("Database URL not set. Provide ANALYTICS_DB_URL or DATABASE_URL.")
    return psycopg.connect(settings.db_url, row_factory=dict_row)


def fetch_query(sql: str) -> list[dict]:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            return cur.fetchall()