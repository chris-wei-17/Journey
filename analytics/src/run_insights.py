from pathlib import Path
import pandas as pd
from .config import get_settings
from .insights import detect_trends, find_recurring_sequences, cluster_users, impact_on_weight, generate_insights_with_openai


def run_insights(batch_id: str):
    settings = get_settings()
    base = Path(settings.staging_dir) / batch_id / "metrics"
    out = base / "insights"
    out.mkdir(parents=True, exist_ok=True)

    derived_path = base / "derived_features.parquet"
    if not derived_path.exists():
        return
    df = pd.read_parquet(derived_path)

    trends = detect_trends(df)
    if not trends.empty:
        trends.to_parquet(out / "trends.parquet", index=False)

    patterns = find_recurring_sequences(df)
    if not patterns.empty:
        patterns.to_parquet(out / "patterns.parquet", index=False)

    clusters = cluster_users(df, cols=[c for c in ["calories", "total_minutes", "weight"] if c in df.columns])
    if not clusters.empty:
        clusters.to_parquet(out / "clusters.parquet", index=False)

    impact = impact_on_weight(df)
    if not impact.empty:
        impact.to_parquet(out / "impact_weight.parquet")

    # Generate OpenAI insights per user (summaries)
    summaries = []
    for uid, grp in df.groupby("user_id"):
        summary = {
            "uid": int(uid),
            "days": int(len(grp)),
            "calories_mean": float(grp.get("calories", pd.Series(dtype=float)).mean()) if "calories" in grp.columns else None,
            "activity_minutes_mean": float(grp.get("total_minutes", pd.Series(dtype=float)).mean()) if "total_minutes" in grp.columns else None,
            "weight_change_30d": float(grp.sort_values("date").tail(30)["weight"].diff().sum()) if "weight" in grp.columns else None,
        }
        text = generate_insights_with_openai(uid, summary)
        summaries.append({"user_id": uid, "insights": text})
    if summaries:
        pd.DataFrame(summaries).to_parquet(out / "openai_insights.parquet", index=False)