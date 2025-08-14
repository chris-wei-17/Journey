from pathlib import Path
import pandas as pd
from .ingest import run_ingest
from .config import get_settings
from .metrics import daily_weekly_monthly_aggregates, derived_features
from .cloud import upload_dir_to_bucket
from .run_relations import run_relations
from .run_insights import run_insights
import os

if __name__ == "__main__":
    batch_id = run_ingest()
    settings = get_settings()
    base = Path(settings.staging_dir) / batch_id

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

    # Optional cloud upload
    bucket = os.getenv("ANALYTICS_STORAGE_BUCKET")
    prefix = os.getenv("ANALYTICS_STORAGE_PREFIX", f"analytics/{batch_id}")
    if bucket:
        upload_dir_to_bucket(metrics_dir, bucket, prefix)