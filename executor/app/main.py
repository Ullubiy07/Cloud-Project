from fastapi import FastAPI
import subprocess

from schema import Request, Response
from manager import FileManager, FileNameError
from stats import parseTime
from config import commands, TIME_LIMIT, MEM_LIMIT


app = FastAPI(
    title="Executor",
    docs_url=None,
    redoc_url=None,
    openapi_url=None
)


@app.post("/run", response_model=Response)
def run_code(request: Request):

    return_code = 1
    stdout, stderr = "", ""
    time, memory = 0, 0
    timeout = False
    TEST_PATH = "/home/user/tests"

    try:
        with FileManager(directory=TEST_PATH, files=request.files, language=request.language) as manager:
            process = subprocess.run(
                ["/usr/bin/time", "-f", "STATS=%e=%M",
                "/bin/bash", "-c", commands[request.language]],
                user="user",
                input=request.stdin,
                capture_output=True,
                text=True,
                timeout=TIME_LIMIT,
                cwd=manager.session_dir
            )
            return_code = process.returncode
            time, memory, stderr = parseTime(process.stderr)
            stdout = process.stdout

    except subprocess.TimeoutExpired as e:
        timeout = True
        time = TIME_LIMIT
        stderr = "Time limit exceeded"
        stdout = e.stdout.decode() if e.stdout else ""
    except FileNameError as e:
        stderr = str(e)
    except Exception as e:
        stderr = "Internal server error"
    
    return {
        "return_code": return_code,
        "stdout": stdout,
        "stderr": stderr,
        "flags": {
            "timeout": timeout,
            "mem_out": memory > MEM_LIMIT,
        },
        "metrics": {
            "time": f"{time}s",
            "phys_mem": f"{memory}M"
        }
    }
