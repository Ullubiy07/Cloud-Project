from fastapi import FastAPI
import subprocess

from schema import Request, Response
from manager import FileManager, ExecManager
from config import *


app = FastAPI(
    title="Executor",
    # docs_url=None,
    # redoc_url=None,
    # openapi_url=None
)

@app.post("/run", response_model=Response)
def run_code(request: Request):

    res = Response()

    try:
        with FileManager(directory=TEST_PATH, data=res.metrics, files=request.files, language=request.language) as manager:
            
            with ExecManager("build", res):
                build_process = subprocess.run(
                    build_cmd(request.language, manager.build_stats),
                    capture_output=True,
                    text=True,
                    timeout=BUILD_TIME_LIMIT,
                    preexec_fn=set_cpu_limit,
                    cwd=manager.base_dir
                )

            if build_process.returncode != 0:
                res.set_output(build_process, "build")
                return res
            
            with ExecManager("run", res):
                run_process = subprocess.run(
                    run_cmd(request.language, manager.run_stats, request.entry_file),
                    input=request.stdin,
                    capture_output=True,
                    text=True,
                    timeout=RUN_TIME_LIMIT,
                    preexec_fn=set_cpu_limit,
                    cwd=manager.base_dir
                )

            res.set_output(run_process, "run")

    except Exception as e:
        print(e)

    return res
