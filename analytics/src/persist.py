from __future__ import annotations
from typing import List, Dict, Any
from dataclasses import dataclass
from datetime import datetime
import json
from loguru import logger
from .db import get_conn


@dataclass
class RunLog:
    batch_id: str
    started_at: datetime
    finished_at: datetime | None = None
    status: str = "running"
    rows_processed: int = 0
    error: str | None = None


def create_run(batch_id: str) -> RunLog:
    rl = RunLog(batch_id=batch_id, started_at=datetime.utcnow())
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO analytics_runs(batch_id, started_at, status)
            VALUES(%s, %s, %s)
            ON CONFLICT (batch_id) DO NOTHING
            """,
            (rl.batch_id, rl.started_at, rl.status),
        )
        conn.commit()
    return rl


def finish_run(rl: RunLog):
    rl.finished_at = datetime.utcnow()
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            UPDATE analytics_runs
            SET finished_at = %s, status = %s, rows_processed = %s, error = %s
            WHERE batch_id = %s
            """,
            (rl.finished_at, rl.status, rl.rows_processed, rl.error, rl.batch_id),
        )
        conn.commit()


def upsert_summary(batch_id: str, user_id: int, summary: Dict[str, Any], insights: str | None):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO analytics_summary(batch_id, user_id, summary, insights)
            VALUES(%s, %s, %s::jsonb, %s)
            """,
            (batch_id, user_id, json.dumps(summary), insights),
        )
        conn.commit()


def insert_relationships(batch_id: str, rows: List[Dict[str, Any]]):
    if not rows:
        return
    with get_conn() as conn, conn.cursor() as cur:
        args = [
            (
                batch_id,
                r.get("user_id"),
                r.get("var_x"),
                r.get("var_y"),
                r.get("metric"),
                r.get("value"),
                r.get("lag"),
            )
            for r in rows
        ]
        cur.executemany(
            """
            INSERT INTO analytics_relationships(batch_id, user_id, var_x, var_y, metric, value, lag)
            VALUES(%s, %s, %s, %s, %s, %s, %s)
            """,
            args,
        )
        conn.commit()