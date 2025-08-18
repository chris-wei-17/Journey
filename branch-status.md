# Branch Status: feature/analytics-intake

Last updated: 2025-08-16

## Scope
End-to-end analytics ingestion, transformation, relationships, insights, storage, admin UI, and operational reliability for Journey. Python worker runs in Render; Vercel app orchestrates and displays results. Includes secure notification hook to alert users when new analytics are available.

## Components
- Python worker (Render): FastAPI at `/health` and `/run`; orchestrates pipeline
  - Ingest: pulls users, activities, macros, metrics, macro_targets (SQL in `analytics/sql/queries.sql`)
  - Metrics: daily/weekly/monthly aggregates; derived features
  - Relations: correlations, MI, PCA/ICA, VIF, cross-lag, clustering
  - Insights: trends, recurring patterns, impact scoring; optional OpenAI
  - Persist: `analytics_runs`, `analytics_summary`, `analytics_relationships`
  - Storage: parquet artifacts to Supabase Storage (bucket/prefix)
  - Notify: best‑effort webhook to app to email “New analytics available” to affected users

- Node app (Vercel):
  - `/api/run_pipeline` (admin/chris only) calls worker with timeout+retry and clear errors
  - Analytics admin page `/analytics`: run button, counts, prefix, sample previews
  - New secure webhook `/api/analytics/notify` (Bearer ANALYTICS_NOTIFY_KEY) to email users

## Recent changes
- Fixed Vercel->Render cold start/503s: health probe, timeout, retry
- Uploads: send bytes and explicit file_options; verified files appear in bucket
- Robust logging: stage try/except; service prints stack on error
- Numeric safety: avoid Decimal/zero divisions; coerce to float
- Resampling: monthly uses `ME`; weekly `W`
- Relations/Insights: guard empty inputs; write DataFrames to parquet; qualified imports
- Min‑days gating: all modules skip users with < 5 distinct logged days; downstream steps also skip if insufficient data
- Notify webhook: Python sends user_ids; server emails “New analytics available”; best‑effort
- Noise reduction: commented non‑error prints

## Env vars
- Worker (Render):
  - DATABASE_URL (Supabase pooled), SUPABASE_HTTP_URL, SUPABASE_SERVICE_KEY
  - ANALYTICS_STORAGE_BUCKET, ANALYTICS_STORAGE_PREFIX
  - SERVER_BASE_URL (Vercel origin), ANALYTICS_NOTIFY_KEY
  - OPENAI_API_KEY (optional)

- App (Vercel):
  - ANALYTICS_FUNCTION_URL, ANALYTICS_FUNCTION_KEY (if required by Render)
  - ANALYTICS_NOTIFY_KEY (same as worker)

## Current state
- Pipeline runs end‑to‑end with skip logic; artifacts uploaded; DB populated; admin UI reads counts and previews
- Notifications: emails sent to affected users if notify envs set

## Known items / Next steps
- Add sleep ingestion once modeled in SQL (currently derived as placeholder)
- Expand insights content for OpenAI output; add UI renderers for artifacts
- Optional: move notifications to web push or in‑app notifications table
- Optional: data backfills and multi‑user batch scheduling

