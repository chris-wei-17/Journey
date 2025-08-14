from __future__ import annotations
from typing import Dict, List, Tuple
import numpy as np
import pandas as pd
from sklearn.feature_selection import mutual_info_regression
from sklearn.decomposition import PCA, FastICA
from statsmodels.stats.outliers_influence import variance_inflation_factor
from scipy import stats


def _numeric_df(df: pd.DataFrame, cols: List[str] | None = None) -> pd.DataFrame:
    if cols is None:
        cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    return df[cols].select_dtypes(include=[np.number])


def correlation_matrices(df: pd.DataFrame, cols: List[str] | None = None) -> Dict[str, pd.DataFrame]:
    num = _numeric_df(df, cols)
    pearson = num.corr(method="pearson")
    spearman = num.corr(method="spearman")
    return {"pearson": pearson, "spearman": spearman}


def mutual_information_matrix(df: pd.DataFrame, cols: List[str] | None = None) -> pd.DataFrame:
    num = _numeric_df(df, cols)
    cols = list(num.columns)
    mi = np.zeros((len(cols), len(cols)))
    for i, xi in enumerate(cols):
        for j, yj in enumerate(cols):
            if i == j:
                mi[i, j] = 0.0
            else:
                # Mutual info requires finite values
                x = num[xi].replace([np.inf, -np.inf], np.nan).dropna()
                y = num[yj].replace([np.inf, -np.inf], np.nan).dropna()
                # align indices
                idx = x.index.intersection(y.index)
                if len(idx) < 10:
                    mi[i, j] = np.nan
                    continue
                mi[i, j] = mutual_info_regression(x.loc[idx].values.reshape(-1, 1), y.loc[idx].values, random_state=0)[0]
    return pd.DataFrame(mi, index=cols, columns=cols)


def partial_correlation(df: pd.DataFrame, x: str, y: str, controls: List[str]) -> float:
    cols = [x, y] + controls
    sub = df[cols].dropna()
    if sub.empty:
        return np.nan
    # regress x on controls
    Xc = sub[controls]
    Xc = np.c_[np.ones(len(Xc)), Xc]  # add intercept
    beta_x, *_ = np.linalg.lstsq(Xc, sub[x].values, rcond=None)
    beta_y, *_ = np.linalg.lstsq(Xc, sub[y].values, rcond=None)
    rx = sub[x].values - Xc @ beta_x
    ry = sub[y].values - Xc @ beta_y
    r = np.corrcoef(rx, ry)[0, 1]
    return float(r)


def matrix_rank(df: pd.DataFrame, cols: List[str] | None = None) -> int:
    num = _numeric_df(df, cols).dropna()
    if num.empty:
        return 0
    return int(np.linalg.matrix_rank(num.values))


def pca_ica(df: pd.DataFrame, n_components: int = 5, cols: List[str] | None = None) -> Dict[str, Tuple[np.ndarray, np.ndarray, List[str]]]:
    num = _numeric_df(df, cols).dropna()
    feature_names = list(num.columns)
    X = (num - num.mean()) / (num.std(ddof=0) + 1e-8)
    pca = PCA(n_components=min(n_components, X.shape[1]))
    pca_components = pca.fit_transform(X)
    ica = FastICA(n_components=min(n_components, X.shape[1]), random_state=0, whiten='unit-variance')
    ica_components = ica.fit_transform(X)
    return {
        "pca": (pca_components, pca.explained_variance_ratio_, feature_names),
        "ica": (ica_components, None, feature_names),
    }


def vif_scores(df: pd.DataFrame, cols: List[str] | None = None) -> pd.Series:
    num = _numeric_df(df, cols).dropna()
    if num.shape[1] < 2:
        return pd.Series(dtype=float)
    X = num.values
    vif = [variance_inflation_factor(X, i) for i in range(X.shape[1])]
    return pd.Series(vif, index=num.columns)


def pairwise_correlation_over_time(df: pd.DataFrame, time_col: str, value_cols: List[str]) -> Dict[Tuple[str, str], float]:
    # correlate based on time-aligned daily means
    d = df[[time_col] + value_cols].dropna()
    d = d.groupby(pd.to_datetime(d[time_col]).dt.date)[value_cols].mean()
    out: Dict[Tuple[str, str], float] = {}
    for i, a in enumerate(value_cols):
        for j in range(i + 1, len(value_cols)):
            b = value_cols[j]
            out[(a, b)] = d[a].corr(d[b])
    return out


def cross_lag(df: pd.DataFrame, x: str, y: str, user_col: str = "user_id", time_col: str = "date", max_lag: int = 7) -> pd.DataFrame:
    # compute cross-correlation between x_t and y_{t+k} for k in [-max_lag, max_lag]
    d = df[[user_col, time_col, x, y]].dropna().copy()
    d[time_col] = pd.to_datetime(d[time_col])
    out_rows = []
    for uid, grp in d.groupby(user_col):
        g = grp.sort_values(time_col).set_index(time_col)
        xs = g[x].astype(float)
        ys = g[y].astype(float)
        for k in range(-max_lag, max_lag + 1):
            if k < 0:
                r = xs.corr(ys.shift(-k))
            else:
                r = xs.shift(k).corr(ys)
            out_rows.append({"user_id": uid, "lag": k, "corr": r})
    return pd.DataFrame(out_rows)


def cluster_multivariate_patterns(df: pd.DataFrame, cols: List[str], n_std: float = 1.0) -> pd.DataFrame:
    # flag dates where multiple variables deviate simultaneously
    d = df[cols + ["user_id", "date"]].dropna().copy()
    for c in cols:
        z = (d[c] - d[c].mean()) / (d[c].std(ddof=0) + 1e-8)
        d[f"z_{c}"] = z
    d["cluster_flag"] = (d[[f"z_{c}" for c in cols]].abs() > n_std).sum(axis=1) >= 2
    return d[["user_id", "date", "cluster_flag"] + [f"z_{c}" for c in cols]]