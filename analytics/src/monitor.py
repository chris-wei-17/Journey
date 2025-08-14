from __future__ import annotations
import os
import json
import httpx
from loguru import logger


def send_alert(message: str):
    url = os.getenv("ALERT_WEBHOOK_URL")
    if not url:
        logger.warning("ALERT_WEBHOOK_URL not set; skipping alert")
        return
    try:
        payload = {"text": message}
        httpx.post(url, json=payload, timeout=10)
    except Exception as e:
        logger.exception("Failed to send alert")