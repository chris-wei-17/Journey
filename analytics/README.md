# Analytics Intake Pipeline (Stage 1)

Scope: Reliable, clean, and complete data ingestion from Supabase into a Python processing environment.

Components
- Config: .env with SUPABASE_URL and SUPABASE_SERVICE_KEY (never commit secrets)
- DB: Read-only Supabase role dedicated to analytics
- SQL: Version-controlled queries for reproducibility
- Extraction: Python modules to run SQL and fetch results
- Staging: Write timestamped parquet files under analytics/staging/<batch_id>
- Validation: Basic integrity checks and logging of anomalies

Quickstart
1) Create .env at repo root (or analytics/.env) with:
   SUPABASE_URL=...
   SUPABASE_SERVICE_KEY=...
2) python -m venv .venv && source .venv/bin/activate
3) pip install -r analytics/requirements.txt
4) python analytics/src/run_ingest.py

Outputs
- Parquet files in analytics/staging/<batch_id>/
- Logs in analytics/logs/

Security
- Use Supabase service key
- Queries/read-only role constraints enforced in Supabase

Cloud Deployment (Vercel + Supabase)
- Use environment vars on Vercel:
  - SUPABASE_URL, SUPABASE_SERVICE_KEY
  - ANALYTICS_STORAGE_BUCKET (optional: to upload outputs to Supabase Storage)
  - ANALYTICS_STORAGE_PREFIX (optional)
- Schedule ingestion via Vercel Cron to run analytics/src/run_ingest.py (wrap in an API route or serverless function that invokes the module)
- Ensure Supabase read-only analytics role and RLS policies allow required SELECTs

Scheduling & Operations
- Scheduling (Vercel Cron): create a serverless handler that imports analytics.src.run_ingest and invoke nightly (e.g., 03:00 UTC)
- Monitoring:
  - Set ALERT_WEBHOOK_URL (Slack/Discord/Teams) for alerts
  - ANALYTICS_MAX_DURATION_SEC to flag long runs
- Performance:
  - Optimize SQL (indexes, filtered scans)
  - Incremental runs by date window
  - Cache stable dimensions (profile, macro targets) and reuse