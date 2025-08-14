# Apple Health Integration - Framework

Goals
- Allow users to connect Apple Health data (via HealthKit / Apple Health Records exports or companion app)
- Support import of core domains: activity (steps, workouts), sleep, nutrition, body metrics (weight)
- Run through server pipeline to unify with existing analytics

Approach
- For PWA/web: support manual Apple Health export (XML/zip) upload and parsing
- For native bridge (future): add iOS companion to sync via secure endpoints
- Store raw import batches (for audit) and normalized records in existing tables (activities, macros, metrics, sleep)

Server endpoints
- POST /api/health/apple/upload (multipart zip/xml)
  - Accepts Apple Health export zip or XML
  - Extracts, parses key records, stages to temp tables
  - Normalizes and inserts to core tables for the authenticated user
- GET /api/health/apple/status
  - Returns last import timestamps and counts

Data flow
- Upload -> staging -> validation -> normalization -> core tables -> analytics pipeline (optional trigger)

Security & Privacy
- Auth required
- PII stays within user scope; audit import batches with minimal metadata

Next steps
- Implement parser for Apple Health XML (workouts, sleep, body mass, nutrition)
- Add staging tables and migration
- Build upload UI in profile/settings