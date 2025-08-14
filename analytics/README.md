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