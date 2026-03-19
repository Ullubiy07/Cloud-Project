from fastapi import FastAPI
import httpx

from schemas.cloud import Requests, CloudTriggerRequest
from routers.execute import run_code
from config import *


app = FastAPI(
    title="Executor"
)


@app.post("/preview")
def preview(request: Requests):
    return


@app.post("/")
def handle_cloud_trigger(request: CloudTriggerRequest):
    try:
        body = request.messages[0].details.message.body

        if body.handle == "run":
            res = run_code(body.body)
            httpx.post(WEBHOOK_URL, json=res.dict())
        
        if body.handle == "debug":
            return

    except Exception as e:
        logger.debug(e)

