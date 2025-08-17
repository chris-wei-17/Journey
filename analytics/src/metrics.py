from __future__ import annotations
from typing import Dict, Any, Tuple, List
import numpy as np
import pandas as pd


def ensure_datetime(df: pd.DataFrame, col: str) -> pd.DataFrame:
    if col in df.columns:
        df[col] = pd.to_datetime(df[col], errors="coerce").dt.tz_localize(None)
    return df


def _valid_users_min_days(df: pd.DataFrame, user_col: str, date_col: str, value_cols: List[str], min_days: int = 5) -> pd.Series:
    if df.empty:
        return pd.Series([], dtype=int)
    d = df.copy()
    # Any non-null (and numeric-usable) across value columns counts as a logged day
    mask = np.zeros(len(d), dtype=bool)
    for c in value_cols:
        if c in d.columns:
            mask = mask | d[c].notna()
    d = d.loc[mask]
    if d.empty:
        return pd.Series([], dtype=int)
    counts = d.groupby(user_col)[date_col].nunique()
    return counts[counts >= min_days].index


def daily_weekly_monthly_aggregates(
    sleep: pd.DataFrame | None = None,
    macros: pd.DataFrame | None = None,
    activities: pd.DataFrame | None = None,
    weight: pd.DataFrame | None = None,
    macro_targets: pd.DataFrame | None = None,
) -> Dict[str, Dict[str, pd.DataFrame]]:
    results: Dict[str, Dict[str, pd.DataFrame]] = {}
    MIN_DAYS = 5

    # Sleep aggregates
    if sleep is not None and not sleep.empty:
        sleep = ensure_datetime(sleep, "date")
        # Expect a column hours (if not, attempt from duration minutes)
        if "hours" not in sleep.columns and "duration_minutes" in sleep.columns:
            sleep["hours"] = (sleep["duration_minutes"].astype(float) / 60.0)
        g = sleep.groupby(["user_id", pd.Grouper(key="date", freq="D")])["hours"]
        daily = g.agg(avg_hours="mean", std_hours="std", min_hours="min", max_hours="max").reset_index()
        # Filter users with at least MIN_DAYS of data
        valid = _valid_users_min_days(daily, "user_id", "date", ["avg_hours"], MIN_DAYS)
        daily = daily[daily["user_id"].isin(valid)]
        weekly = (
            sleep.set_index("date")
            .groupby("user_id")["hours"]
            .resample("W")
            .agg(avg_hours="mean", std_hours="std", min_hours="min", max_hours="max")
            .reset_index()
        )
        weekly = weekly[weekly["user_id"].isin(valid)]
        monthly = (
            sleep.set_index("date")
            .groupby("user_id")["hours"]
            .resample("ME")
            .agg(avg_hours="mean", std_hours="std", min_hours="min", max_hours="max")
            .reset_index()
        )
        monthly = monthly[monthly["user_id"].isin(valid)]
        results["sleep"] = {"daily": daily, "weekly": weekly, "monthly": monthly}

    # Macros aggregates
    if macros is not None and not macros.empty:
        macros = ensure_datetime(macros, "date")
        # calories from explicit or compute
        if "calories" not in macros.columns or macros["calories"].isna().all():
            macros["calories"] = (macros["protein"].astype(float) * 4 + macros["fats"].astype(float) * 9 + macros["carbs"].astype(float) * 4)
        # daily totals
        daily = (
            macros.groupby(["user_id", pd.Grouper(key="date", freq="D")])[ ["calories", "protein", "fats", "carbs"] ]
            .sum()
            .reset_index()
        )
        valid = _valid_users_min_days(daily, "user_id", "date", ["calories", "protein", "fats", "carbs"], MIN_DAYS)
        daily = daily[daily["user_id"].isin(valid)]
        # % of target if provided (join on user)
        if macro_targets is not None and not macro_targets.empty:
            mt = macro_targets.rename(columns={"protein_target": "protein_t", "fats_target": "fats_t", "carbs_target": "carbs_t"})
            daily = daily.merge(mt, on="user_id", how="left")
            for col, tgt in [("protein", "protein_t"), ("fats", "fats_t"), ("carbs", "carbs_t")]:
                num = pd.to_numeric(daily[col], errors="coerce")
                den = pd.to_numeric(daily[tgt], errors="coerce")
                safe_den = den.replace(0, np.nan)
                daily[f"{col}_pct_goal"] = num.divide(safe_den) * 100.0
        # macro ratios
        p = pd.to_numeric(daily["protein"], errors="coerce").fillna(0)
        f = pd.to_numeric(daily["fats"], errors="coerce").fillna(0)
        cb = pd.to_numeric(daily["carbs"], errors="coerce").fillna(0)
        total_macros = p + f + cb
        for c in ["protein", "fats", "carbs"]:
            num = pd.to_numeric(daily[c], errors="coerce")
            ratio = pd.Series(np.nan, index=daily.index)
            mask = total_macros > 0
            ratio.loc[mask] = num.loc[mask] / total_macros.loc[mask]
            daily[f"{c}_ratio"] = ratio
        # period resamples
        weekly = (
            daily.set_index("date").groupby("user_id")[
                [c for c in daily.columns if c not in ["user_id", "date"]]
            ].resample("W").mean().reset_index()
        )
        monthly = (
            daily.set_index("date").groupby("user_id")[
                [c for c in daily.columns if c not in ["user_id", "date"]]
            ].resample("ME").mean().reset_index()
        )
        results["macros"] = {"daily": daily, "weekly": weekly, "monthly": monthly}

    # Exercise aggregates (from activities)
    if activities is not None and not activities.empty:
        activities = ensure_datetime(activities, "date")
        # frequency and durations per day
        agg = activities.groupby(["user_id", pd.Grouper(key="date", freq="D")]).agg(
            sessions=("activity_type", "count"),
            total_minutes=("duration_minutes", "sum"),
        ).reset_index()
        valid = _valid_users_min_days(agg, "user_id", "date", ["sessions", "total_minutes"], MIN_DAYS)
        agg = agg[agg["user_id"].isin(valid)]
        # intensity score placeholder: duration scaled (0-10)
        agg["avg_intensity"] = np.clip(agg["total_minutes"].astype(float) / 30.0, 0, 10)
        weekly = agg.set_index("date").groupby("user_id").resample("W").agg({
            "sessions": "sum",
            "total_minutes": "sum",
            "avg_intensity": "mean",
        }).reset_index()
        monthly = agg.set_index("date").groupby("user_id").resample("ME").agg({
            "sessions": "sum",
            "total_minutes": "sum",
            "avg_intensity": "mean",
        }).reset_index()
        results["exercise"] = {"daily": agg, "weekly": weekly, "monthly": monthly}

    # Weight metrics
    if weight is not None and not weight.empty:
        weight = ensure_datetime(weight, "date")
        w = weight.sort_values(["user_id", "date"]).copy()
        w["w_ma7"] = w.groupby("user_id")["weight"].transform(lambda s: s.rolling(7, min_periods=1).mean())
        w["w_roll_std7"] = w.groupby("user_id")["weight"].transform(lambda s: s.rolling(7, min_periods=2).std())
        w["w_7d_change"] = w.groupby("user_id")["weight"].diff(7)
        # Filter by min days
        valid = _valid_users_min_days(w, "user_id", "date", ["weight"], MIN_DAYS)
        w_daily = w[w["user_id"].isin(valid)]
        w_weekly = w_daily.set_index("date").groupby("user_id").resample("W").agg({
            "weight": "mean",
            "w_ma7": "mean",
            "w_roll_std7": "mean",
            "w_7d_change": "mean",
        }).reset_index()
        w_monthly = w_daily.set_index("date").groupby("user_id").resample("ME").agg({
            "weight": "mean",
            "w_ma7": "mean",
            "w_roll_std7": "mean",
            "w_7d_change": "mean",
        }).reset_index()
        results["weight"] = {"daily": w_daily, "weekly": w_weekly, "monthly": w_monthly}

    return results


def derived_features(
    profiles: pd.DataFrame | None,
    macros_daily: pd.DataFrame | None,
    activities_daily: pd.DataFrame | None,
    weight_daily: pd.DataFrame | None,
) -> pd.DataFrame:
    # Merge basic frames on user_id and date where applicable
    frames = []
    if macros_daily is not None and not macros_daily.empty:
        frames.append(macros_daily[["user_id", "date", "calories", "protein", "fats", "carbs"]])
    if activities_daily is not None and not activities_daily.empty:
        frames.append(activities_daily[["user_id", "date", "total_minutes", "avg_intensity"]])
    if weight_daily is not None and not weight_daily.empty:
        frames.append(weight_daily[["user_id", "date", "weight", "w_ma7"]])

    if not frames:
        return pd.DataFrame()

    base = frames[0]
    for f in frames[1:]:
        base = base.merge(f, on=["user_id", "date"], how="outer")

    # Enforce min days per user: at least 5 distinct dates with any measurement present
    MIN_DAYS = 5
    value_cols = [c for c in ["calories", "total_minutes", "weight"] if c in base.columns]
    if value_cols:
        valid = _valid_users_min_days(base, "user_id", "date", value_cols, MIN_DAYS)
        base = base[base["user_id"].isin(valid)]

    # BMI if profiles have height/weight (height expected in cm or inches — treat as cm if numeric string)
    if profiles is not None and not profiles.empty:
        p = profiles.copy()
        # normalize height to meters if possible
        def height_to_m(x):
            try:
                v = float(str(x).strip())
                # heuristic: >3 means cm
                return v / 100.0 if v > 3 else v
            except:
                return np.nan
        p["height_m"] = p["height"].apply(height_to_m)
        base = base.merge(p[["user_id", "height_m"]], on="user_id", how="left")
        if "weight" in base.columns:
            base["bmi"] = np.where((base["height_m"] > 0) & (base["weight"].notna()), base["weight"] / (base["height_m"] ** 2), np.nan)

    # Energy balance (placeholder): calories in minus estimated calories out (kcal)
    # Estimate calories out from total_minutes * 5 kcal per minute as a simple baseline
    mins = pd.to_numeric(base.get("total_minutes", pd.Series(0, index=base.index)), errors="coerce").fillna(0.0)
    base["calories_out_est"] = mins * 5.0
    cal_in = pd.to_numeric(base.get("calories"), errors="coerce").fillna(0.0)
    cal_out = pd.to_numeric(base.get("calories_out_est"), errors="coerce").fillna(0.0)
    base["energy_balance"] = cal_in - cal_out

    # Lag features
    base = base.sort_values(["user_id", "date"])  # ensure order
    base["sleep_lag1"] = np.nan  # placeholder; we don't have sleep hours merged here
    for col in ["calories", "total_minutes", "weight"]:
        if col in base.columns:
            base[f"{col}_lag1"] = base.groupby("user_id")[col].shift(1)

    # Moving averages and rolling std for calories and activity
    for col in ["calories", "total_minutes"]:
        if col in base.columns:
            base[f"{col}_ma7"] = base.groupby("user_id")[col].transform(lambda s: s.rolling(7, min_periods=1).mean())
            base[f"{col}_std7"] = base.groupby("user_id")[col].transform(lambda s: s.rolling(7, min_periods=2).std())

    return base