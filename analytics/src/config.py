from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv()

class Settings(BaseModel):
    supabase_url: str
    supabase_service_key: str
    staging_dir: str = "analytics/staging"
    logs_dir: str = "analytics/logs"

    class Config:
        extra = "ignore"


def get_settings() -> Settings:
    return Settings(
        supabase_url=os.getenv("SUPABASE_URL", ""),
        supabase_service_key=os.getenv("SUPABASE_SERVICE_KEY", ""),
        staging_dir=os.getenv("ANALYTICS_STAGING_DIR", "analytics/staging"),
        logs_dir=os.getenv("ANALYTICS_LOGS_DIR", "analytics/logs"),
    )