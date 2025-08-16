from pathlib import Path
import pandas as pd
from .config import get_settings
from . import relations as rel


def run_relations(batch_id: str):
    settings = get_settings()
    base = Path(settings.staging_dir) / batch_id / "metrics"
    out = base / "relations"
    out.mkdir(parents=True, exist_ok=True)

    derived_path = base / "derived_features.parquet"
    if not derived_path.exists():
        return
    df = pd.read_parquet(derived_path)

    # Correlations
    mats = rel.correlation_matrices(df)
    mats["pearson"].to_parquet(out / "corr_pearson.parquet")
    mats["spearman"].to_parquet(out / "corr_spearman.parquet")

    # Mutual information
    mi = rel.mutual_information_matrix(df)
    mi.to_parquet(out / "mutual_info.parquet")

    # PCA/ICA
    comps = rel.pca_ica(df, n_components=5)
    pd.DataFrame(comps["pca"][0]).to_parquet(out / "pca_components.parquet")
    pd.DataFrame({"explained_variance_ratio": comps["pca"][1]}).to_parquet(out / "pca_explained_variance.parquet")
    pd.DataFrame(comps["ica"][0]).to_parquet(out / "ica_components.parquet")

    # VIF
    vif = rel.vif_scores(df)
    vif.to_frame(name="vif").to_parquet(out / "vif.parquet")

    # Pairwise over time (example columns)
    value_cols = [c for c in ["calories", "total_minutes", "weight"] if c in df.columns]
    if value_cols:
        corr_time = rel.pairwise_correlation_over_time(df, time_col="date", value_cols=value_cols)
        pd.Series(corr_time).to_frame(name="corr").to_parquet(out / "pairwise_corr_over_time.parquet")

    # Cross-lag (example: calories vs weight)
    if all(c in df.columns for c in ["calories", "weight"]):
        xlag = rel.cross_lag(df, x="calories", y="weight")
        xlag.to_parquet(out / "cross_lag_calories_weight.parquet")

    # Cluster multivariate patterns
    cols = [c for c in ["calories", "total_minutes", "weight"] if c in df.columns]
    if cols:
        clus = rel.cluster_multivariate_patterns(df, cols=cols, n_std=1.0)
        clus.to_parquet(out / "clusters.parquet")