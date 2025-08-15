from fastapi import FastAPI, Body
from fastapi.responses import JSONResponse
import os
import traceback
from analytics.src.run_ingest import run_pipeline

app = FastAPI()

@app.get("/health")
def health():
	return {"status":"ok"}

@app.post("/run")
def run(user_id: str | None = Body(default=None, embed=True)):
	try:
		if user_id:
			os.environ["ANALYTICS_USER_FILTER"] = str(user_id)
		batch_id = run_pipeline()
		return {"status":"ok","batchId":batch_id}
	except Exception as e:
		trace = traceback.format_exc()
		print(f"ANALYTICS_RUN_ERROR: {e}\n{trace}")
		return JSONResponse(status_code=500, content={"status":"error","message":str(e)})