import os
import time
import uuid
from pathlib import Path
from typing import Dict, Any

import pandas as pd
from loguru import logger

from .config import get_settings
from .db import fetch_query


def load_queries(sql_path: str) -> Dict[str, str]:
    with open(sql_path, "r") as f:
        content = f.read()
    # Split queries by double newlines where SELECT starts lines
    segments = [seg.strip() for seg in content.split(";\n\n") if seg.strip()]
    queries: Dict[str, str] = {}
    for idx, seg in enumerate(segments, start=1):
        # Simple key naming: q1, q2, ...
        key = f"q{idx}"
        queries[key] = seg.rstrip(";")
    return queries


def basic_validation(df: pd.DataFrame, name: str) -> Dict[str, Any]:
    checks: Dict[str, Any] = {
        "name": name,
        "rows": len(df),
        "columns": list(df.columns),
        "null_counts": df.isna().sum().to_dict(),
        "duplicate_rows": int(df.duplicated().sum()),
    }
    # Simple outlier check for numeric columns (z-score > 5)
    numeric_cols = df.select_dtypes(include=["number"]).columns
    outliers = {}
    for col in numeric_cols:
        series = df[col].dropna()
        if series.empty:
            continue
        z = (series - series.mean()) / (series.std(ddof=0) or 1)
        outliers[col] = int((z.abs() > 5).sum())
    checks["numeric_outliers_z5"] = outliers
    return checks


def stage_parquet(df: pd.DataFrame, out_dir: Path, name: str) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{name}.parquet"
    df.to_parquet(out_path, index=False)
    return out_path


def run_ingest(sql_path: str = "analytics/sql/queries.sql") -> str:
    settings = get_settings()
    Path(settings.logs_dir).mkdir(parents=True, exist_ok=True)
    batch_id = f"batch_{time.strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
    out_dir = Path(settings.staging_dir) / batch_id

    logger.add(str(Path(settings.logs_dir) / f"ingest_{batch_id}.log"))
    logger.info(f"Starting ingest: {batch_id}")

    queries = load_queries(sql_path)
    summary = {}

    for key, sql in queries.items():
        logger.info(f"Executing {key}")
        rows = fetch_query(sql)
        df = pd.DataFrame(rows)
        summary[key] = basic_validation(df, key)
        path = stage_parquet(df, out_dir, key)
        logger.info(f"Staged {key} -> {path}")

    logger.info(f"Ingest complete: {batch_id}")
    return batch_id