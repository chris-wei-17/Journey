from pathlib import Path
import pandas as pd
from .config import get_settings
from .relations import (
    correlation_matrices,
    mutual_information_matrix,
    pca_ica,
    vif_scores,
    pairwise_correlation_over_time,
    cross_lag,
    cluster_multivariate_patterns,
)
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

    # Numeric-only frame for certain analyses
    num = df.select_dtypes(include="number").dropna()

    # Correlations
    if not num.empty:
        mats = correlation_matrices(df)
        mats["pearson"].to_parquet(out / "corr_pearson.parquet")
        mats["spearman"].to_parquet(out / "corr_spearman.parquet")

        # Mutual information
        mi = mutual_information_matrix(df)
        mi.to_parquet(out / "mutual_info.parquet")

        # PCA/ICA
        comps = pca_ica(df, n_components=5)
        if comps["pca"][0].size:
            pd.DataFrame(comps["pca"][0]).to_parquet(out / "pca_components.parquet")
            pd.Series(comps["pca"][1]).to_parquet(out / "pca_explained_variance.parquet")
        if comps["ica"][0].size:
            pd.DataFrame(comps["ica"][0]).to_parquet(out / "ica_components.parquet")

        # VIF
        vif = vif_scores(df)
        if not vif.empty:
            vif.to_parquet(out / "vif.parquet")

    # Pairwise over time (example columns)
    value_cols = [c for c in ["calories", "total_minutes", "weight"] if c in df.columns]
    if value_cols:
        corr_time = pairwise_correlation_over_time(df, time_col="date", value_cols=value_cols)
        pd.Series(corr_time).to_parquet(out / "pairwise_corr_over_time.parquet")

    # Cross-lag (example: calories vs weight)
    if all(c in df.columns for c in ["calories", "weight"]):
        xlag = cross_lag(df, x="calories", y="weight")
        xlag.to_parquet(out / "cross_lag_calories_weight.parquet")

    # Cluster multivariate patterns
    cols = [c for c in ["calories", "total_minutes", "weight"] if c in df.columns]
    if cols:
        clus = cluster_multivariate_patterns(df, cols=cols, n_std=1.0)
        clus.to_parquet(out / "clusters.parquet")

    # index file for UI
    (out / "index.json").write_text("{\"products\":[\"corr_pearson\",\"corr_spearman\",\"mutual_info\",\"pca_components\",\"pca_explained_variance\",\"ica_components\",\"vif\",\"pairwise_corr_over_time\",\"cross_lag_calories_weight\",\"clusters\"]}")

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