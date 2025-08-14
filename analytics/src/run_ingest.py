from pathlib import Path
import pandas as pd
from .ingest import run_ingest
from .config import get_settings
from .metrics import daily_weekly_monthly_aggregates, derived_features
from .cloud import upload_dir_to_bucket
from .run_relations import run_relations
from .run_insights import run_insights
from .persist import create_run, finish_run, upsert_summary, insert_relationships
from loguru import logger
import os

if __name__ == "__main__":
    batch_id = run_ingest()
    settings = get_settings()
    base = Path(settings.staging_dir) / batch_id
    run_log = create_run(batch_id)

    # Load staged frames
    q1 = pd.read_parquet(base / "q1.parquet") if (base / "q1.parquet").exists() else pd.DataFrame()  # profiles
    q2 = pd.read_parquet(base / "q2.parquet") if (base / "q2.parquet").exists() else pd.DataFrame()  # activities
    q3 = pd.read_parquet(base / "q3.parquet") if (base / "q3.parquet").exists() else pd.DataFrame()  # macros
    q4 = pd.read_parquet(base / "q4.parquet") if (base / "q4.parquet").exists() else pd.DataFrame()  # metrics (weight)
    q5 = pd.read_parquet(base / "q5.parquet") if (base / "q5.parquet").exists() else pd.DataFrame()  # macro targets

    aggs = daily_weekly_monthly_aggregates(
        sleep=None,  # sleep not yet modeled separately in queries
        macros=q3,
        activities=q2,
        weight=q4.rename(columns={"date": "date"}),
        macro_targets=q5,
    )

    # Write aggregates
    metrics_dir = base / "metrics"
    metrics_dir.mkdir(parents=True, exist_ok=True)
    for domain, frames in aggs.items():
        for period, df in frames.items():
            df.to_parquet(metrics_dir / f"{domain}_{period}.parquet", index=False)

    # Derived features
    derived = derived_features(
        profiles=q1,
        macros_daily=aggs.get("macros", {}).get("daily"),
        activities_daily=aggs.get("exercise", {}).get("daily"),
        weight_daily=aggs.get("weight", {}).get("daily"),
    )
    if not derived.empty:
        derived.to_parquet(metrics_dir / "derived_features.parquet", index=False)

    # Relations (step 3)
    run_relations(batch_id)

    # Insights (step 4)
    run_insights(batch_id)

    # Persist summaries and relationships
    # Summary: one record per user with basic means and generated insights
    try:
        derived = pd.read_parquet(metrics_dir / "derived_features.parquet") if (metrics_dir / "derived_features.parquet").exists() else pd.DataFrame()
        openai_ins = pd.read_parquet(metrics_dir / "insights/openai_insights.parquet") if (metrics_dir / "insights/openai_insights.parquet").exists() else pd.DataFrame()
        if not derived.empty:
            for uid, grp in derived.groupby("user_id"):
                summary = {
                    "days": int(len(grp)),
                    "calories_mean": float(grp.get("calories", pd.Series(dtype=float)).mean()) if "calories" in grp.columns else None,
                    "activity_minutes_mean": float(grp.get("total_minutes", pd.Series(dtype=float)).mean()) if "total_minutes" in grp.columns else None,
                    "weight_mean": float(grp.get("weight", pd.Series(dtype=float)).mean()) if "weight" in grp.columns else None,
                }
                insights_txt = None
                if not openai_ins.empty:
                    row = openai_ins.loc[openai_ins["user_id"] == uid]
                    if not row.empty:
                        insights_txt = str(row.iloc[0]["insights"]) or None
                upsert_summary(batch_id, int(uid), summary, insights_txt)
                run_log.rows_processed += 1
    except Exception as e:
        logger.exception("Error persisting summaries")
        run_log.status = "error"
        run_log.error = str(e)

    try:
        # Relationships: write Pearson correlations as example
        corr_path = metrics_dir / "relations/corr_pearson.parquet"
        if corr_path.exists():
            corr = pd.read_parquet(corr_path)
            rel_rows = []
            for i, a in enumerate(corr.columns):
                for j, b in enumerate(corr.columns):
                    if j <= i:
                        continue
                    rel_rows.append({
                        "user_id": None,
                        "var_x": a,
                        "var_y": b,
                        "metric": "pearson",
                        "value": float(corr.iloc[i, j]) if pd.notna(corr.iloc[i, j]) else None,
                        "lag": None,
                    })
            insert_relationships(batch_id, rel_rows)
    except Exception as e:
        logger.exception("Error persisting relationships")
        run_log.status = "error"
        run_log.error = str(e)

    finish_run(run_log)

    # Optional cloud upload
    bucket = os.getenv("ANALYTICS_STORAGE_BUCKET")
    prefix = os.getenv("ANALYTICS_STORAGE_PREFIX", f"analytics/{batch_id}")
    if bucket:
        upload_dir_to_bucket(metrics_dir, bucket, prefix)