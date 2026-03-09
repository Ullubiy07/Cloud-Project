from fastapi import FastAPI
import subprocess

from schema import Request, Response
from manager import FileManager, FileNameError
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
            
            build_process = subprocess.run(
                build_cmd(request.language, manager.build_stats),
                capture_output=True,
                text=True,
                timeout=TIME_LIMIT,
                preexec_fn=set_cpu_limit,
                cwd=manager.base_dir
            )
            if build_process.returncode != 0:
                res.set_output(build_process, "build")
                return res

            run_process = subprocess.run(
                run_cmd(request.language, manager.run_stats, request.entry_file),
                input=request.stdin,
                capture_output=True,
                text=True,
                timeout=TIME_LIMIT,
                preexec_fn=set_cpu_limit,
                cwd=manager.base_dir
            )
            res.set_output(run_process, "run")

    except subprocess.TimeoutExpired as e:
        res.time_limit(e)
    except FileNameError as e:
        res.set_error(str(e), 1)
    except Exception as e:
        res.set_error("Internal server error", 124)
        print(e)

    return res
