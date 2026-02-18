from fastapi import FastAPI
from scalar_fastapi import get_scalar_api_reference, Layout
import asyncio
from asyncio.subprocess import PIPE

from schema import Request, Response
from manager import FileManager, FileNameError
from resources import ProcessTracker, parseTime
from config import commands, set_limits, CPU_TIME_LIMIT


app = FastAPI(
    swagger_ui_parameters={ 
        "displayRequestDuration": True
    },
    title="Executor"
)


@app.get("/scalar", include_in_schema=False)
async def scalar_html():
    return get_scalar_api_reference(
        openapi_url=app.openapi_url,
        title=app.title,
        layout=Layout.MODERN,
        dark_mode=True
    )


@app.post("/run", response_model=Response)
async def run_code(request: Request):

    return_code = 1
    stdout, stderr = b"", b""
    time = ""
    timeout = False
    TEST_PATH = "/home/user/tests"

    watcher = ProcessTracker()
    watch_task = None

    try:
        async with FileManager(directory=TEST_PATH, files=request.files, language=request.language) as manager:
            process = await asyncio.create_subprocess_exec(
                "/usr/bin/time", "-f", "STATS=%e",
                "/bin/bash", "-c", commands[request.language],
                user="user",
                stdin=PIPE,
                stdout=PIPE,
                stderr=PIPE,
                cwd=manager.session_dir,
                preexec_fn=set_limits
            )
            
            watcher = ProcessTracker(process)
            watch_task = asyncio.create_task(watcher.watch())

            stdout, stderr = await asyncio.wait_for(
                process.communicate(input=request.stdin.encode()), 
                timeout=CPU_TIME_LIMIT
            )
            return_code = process.returncode
            time, stderr = parseTime(stderr.decode())
            stdout = stdout.decode()

    except asyncio.TimeoutError:
        timeout = True
        stderr = "Time limit exceeded"
        time = "5.00"
    except FileNameError as e:
        stderr = str(e)
    except Exception as e:
        stderr = "Internal server error"
        print(e)
    finally:
        watcher.killProcess()
        if watch_task and not watch_task.done():
            watch_task.cancel()

    if watcher.mem_out:
        stderr = "Memory limit exceeded"
    if return_code == 137:
        timeout = True
        stderr = "Time limit exceeded"
        
    return {
        "return_code": return_code,
        "stdout": stdout,
        "stderr": stderr,
        "flags": {
            "timeout": timeout,
            "mem_out": watcher.mem_out,
        },
        "metrics": {
            "time": f"{time}s",
            "phys_mem": f"{watcher.phys_mem}M",
            "virt_mem": f"{watcher.virt_mem}M"
        }
    }
