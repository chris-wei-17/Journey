from __future__ import annotations
from typing import Dict, Any, List
import numpy as np
import pandas as pd
from loguru import logger
from sklearn.cluster import KMeans
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from openai import OpenAI
import os

from .config import get_settings


def rolling_regression(y: pd.Series, window: int = 14) -> pd.Series:
    # returns slope per window (aligned to window end)
    slopes = []
    for i in range(len(y)):
        if i + 1 < window:
            slopes.append(np.nan)
            continue
        ys = y.iloc[i + 1 - window : i + 1].values
        xs = np.arange(window).reshape(-1, 1)
        model = LinearRegression().fit(xs, ys)
        slopes.append(model.coef_[0])
    return pd.Series(slopes, index=y.index)


def detect_trends(df: pd.DataFrame, user_col: str = "user_id", time_col: str = "date", cols: List[str] | None = None) -> pd.DataFrame:
    if cols is None:
        cols = [c for c in ["weight", "calories", "total_minutes"] if c in df.columns]
    out = []
    for uid, grp in df.sort_values(time_col).groupby(user_col):
        g = grp.set_index(pd.to_datetime(grp[time_col]))
        for c in cols:
            s = g[c].astype(float)
            slope = rolling_regression(s, 14)
            z = (s - s.mean()) / (s.std(ddof=0) + 1e-8)
            sharp = (z.abs() > 2).astype(int)
            out.append(pd.DataFrame({"user_id": uid, "date": s.index, f"{c}_slope14": slope.values, f"{c}_sharp_dev": sharp.values}))
    return pd.concat(out, ignore_index=True) if out else pd.DataFrame()


def find_recurring_sequences(df: pd.DataFrame) -> pd.DataFrame:
    # simple heuristic: count occurrences of (poor sleep -> low intensity next day)
    # requires sleep_hours and avg_intensity columns
    if not set(["sleep_lag1", "avg_intensity"]).issubset(df.columns):
        return pd.DataFrame()
    d = df.copy()
    d["poor_sleep"] = (d["sleep_lag1"].fillna(8) < 6).astype(int)
    d["low_intensity"] = (d.get("avg_intensity", pd.Series(0)).fillna(0) < 3).astype(int)
    d["pattern"] = (d["poor_sleep"] & d["low_intensity"]).astype(int)
    return d[["user_id", "date", "pattern"]]


def cluster_users(df: pd.DataFrame, cols: List[str], n_clusters: int = 5) -> pd.DataFrame:
    # anonymized benchmarking clusters based on selected features
    d = df.groupby("user_id")[cols].mean().dropna()
    if d.empty:
        return pd.DataFrame()
    X = StandardScaler().fit_transform(d.values)
    km = KMeans(n_clusters=min(n_clusters, len(d)), n_init="auto", random_state=0)
    labels = km.fit_predict(X)
    out = d.copy()
    out["cluster"] = labels
    out.reset_index(inplace=True)
    return out


def impact_on_weight(df: pd.DataFrame) -> pd.Series:
    # rough impact scoring via linear regression coefficients on standardized features
    cols = [c for c in ["calories", "total_minutes"] if c in df.columns]
    if "weight" not in df.columns or not cols:
        return pd.Series(dtype=float)
    d = df[["user_id", "date", "weight"] + cols].dropna().copy()
    d = d.sort_values(["user_id", "date"]).groupby("user_id").tail(90)  # last 90 days per user
    X = StandardScaler().fit_transform(d[cols].values)
    y = d["weight"].values
    model = LinearRegression().fit(X, y)
    return pd.Series(model.coef_, index=cols)


def generate_insights_with_openai(user_id: int, summary_stats: Dict[str, Any]) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        logger.warning("OPENAI_API_KEY not set; skipping insight generation")
        return ""
    client = OpenAI(api_key=api_key)
    prompt = (
        "You are a health analytics assistant. Given user summary metrics, generate 3-5 concise, actionable insights. "
        "Prefer trends and cause-effect patterns; avoid medical claims. Data: " + str(summary_stats)
    )
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=400,
    )
    return resp.choices[0].message.content or ""