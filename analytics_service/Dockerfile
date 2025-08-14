FROM python:3.11-slim
WORKDIR /app
COPY analytics /app/analytics
COPY analytics_service /app/analytics_service
COPY analytics/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt fastapi uvicorn
ENV PYTHONPATH=/app
EXPOSE 8080
CMD ["uvicorn","analytics_service.main:app","--host","0.0.0.0","--port","8080"]