from pathlib import Path
import pandas as pd
from .ingest import run_ingest
from .config import get_settings
from .metrics import daily_weekly_monthly_aggregates, derived_features
from .cloud import upload_dir_to_bucket
from .cloud import build_manifest
from .run_relations import run_relations
from .run_insights import run_insights
from .persist import create_run, finish_run, upsert_summary, insert_relationships
from loguru import logger
import os
from .monitor import send_alert
import time


def run_pipeline() -> str:
	"""Run full analytics pipeline and return the batch_id."""
	t0 = time.time()
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

	# Optional user filter (manual validation)
	user_filter = os.getenv("ANALYTICS_USER_FILTER")
	if user_filter:
		try:
			uf = int(user_filter)
			for df_name in ["q1", "q2", "q3", "q4", "q5"]:
				df = locals().get(df_name)
				if isinstance(df, pd.DataFrame) and not df.empty and "user_id" in df.columns:
					locals()[df_name] = df[df["user_id"] == uf]
		except Exception:
			pass

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
	try:
		derived = derived_features(
			profiles=q1,
			macros_daily=aggs.get("macros", {}).get("daily"),
			activities_daily=aggs.get("exercise", {}).get("daily"),
			weight_daily=aggs.get("weight", {}).get("daily"),
		)
		if not derived.empty:
			derived.to_parquet(metrics_dir / "derived_features.parquet", index=False)
	except Exception as e:
		logger.exception("derived_features failed")

	# Relations (step 3)
	try:
		run_relations(batch_id)
	except Exception as e:
		logger.exception("run_relations failed")

	# Insights (step 4)
	try:
		run_insights(batch_id)
	except Exception as e:
		logger.exception("run_insights failed")

	# Persist summaries and relationships
	# Summary: one record per user with basic means and generated insights
	try:
		derived = pd.read_parquet(metrics_dir / "derived_features.parquet") if (metrics_dir / "derived_features.parquet").exists() else pd.DataFrame()
		openai_ins = pd.read_parquet(metrics_dir / "insights/openai_insights.parquet") if (metrics_dir / "insights/openai_insights.parquet").exists() else pd.DataFrame()
		processed_user_ids = set()
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
				processed_user_ids.add(int(uid))
				run_log.rows_processed += 1
		# Notify server to send user notifications (best-effort)
		try:
			import os, httpx
			server_url = os.getenv("SERVER_BASE_URL", "")
			notify_key = os.getenv("ANALYTICS_NOTIFY_KEY", "")
			if server_url and notify_key and processed_user_ids:
				url = server_url.rstrip('/') + "/api/analytics/notify"
				headers = {"Authorization": f"Bearer {notify_key}", "Content-Type": "application/json"}
				payload = {"batchId": batch_id, "userIds": sorted(processed_user_ids)}
				with httpx.Client(timeout=5.0) as client:
					client.post(url, headers=headers, json=payload)
		except Exception:
			pass
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
	duration = time.time() - t0
	if duration > float(os.getenv("ANALYTICS_MAX_DURATION_SEC", "600")):
		send_alert(f"Analytics batch {batch_id} exceeded duration threshold: {duration:.1f}s")
	if run_log.status == "error":
		send_alert(f"Analytics batch {batch_id} ended with errors: {run_log.error}")

	# Optional cloud upload
	bucket = os.getenv("ANALYTICS_STORAGE_BUCKET")
	# Support base or templated prefix values
	raw_prefix = os.getenv("ANALYTICS_STORAGE_PREFIX", "analytics/{batch_id}")
	if "{batch_id}" in raw_prefix or "<batch_id>" in raw_prefix:
		prefix = raw_prefix.replace("{batch_id}", batch_id).replace("<batch_id>", batch_id)
	else:
		# Treat as base folder and append batch_id
		prefix = f"{raw_prefix.rstrip('/')}/{batch_id}" if raw_prefix else f"analytics/{batch_id}"

	# Save manifest
	manifest = build_manifest(metrics_dir)
	try:
		(metrics_dir / "manifest.json").write_text(pd.Series(manifest["files"]).to_json(orient='values'))
	except Exception:
		pass

	if bucket:
		try:
			upload_dir_to_bucket(metrics_dir, bucket, prefix)
			print(f"UPLOAD_ATTEMPT:bucket={bucket},prefix={prefix},files={len(manifest['files'])}")
		except Exception as e:
			logger.warning(f"Upload failed: {e}")

	# Emit batch id for external orchestration
	print(f"BATCH_ID:{batch_id}")
	return batch_id


if __name__ == "__main__":
	# Allow CLI execution
	run_pipeline()