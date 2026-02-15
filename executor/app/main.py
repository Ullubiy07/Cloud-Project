from fastapi import FastAPI
from scalar_fastapi import get_scalar_api_reference, Layout
import asyncio
from asyncio.subprocess import PIPE
import resource

from schema import Request, Response
from manager import FileManager
from limits import watch, parseStats

CPU_TIME_LIMIT = 5


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

def set_limits():
    resource.setrlimit(resource.RLIMIT_CPU, (CPU_TIME_LIMIT, CPU_TIME_LIMIT))


@app.post("/run", response_model=Response)
async def run_code(request: Request):

    return_code = 1
    stdout, stderr = b"", b""
    time, memory, cpu_usage = "", "", ""
    timeout, mem_out = False, False
    TEST_PATH = "/home/user/tests"
    try:
        async with FileManager(directory=TEST_PATH, files=request.files) as manager:
            process = await asyncio.create_subprocess_exec(
                "/usr/bin/time", "-f", "==STATS== %e %M %P", *(request.command.split()),
                user="user",
                stdin=PIPE,
                stdout=PIPE,
                stderr=PIPE,
                cwd=manager.session_dir,
                preexec_fn=set_limits
            )
            context = dict()
            asyncio.create_task(watch(process, context))

            stdout, stderr = await process.communicate(input=request.stdin.encode())
            return_code = process.returncode
        
            time, _, cpu_usage, stderr = parseStats(stderr.decode())
            memory = context["memory"] + "M"
            mem_out = context["mem_out"]
            stdout = stdout.decode()

    except ValueError as e:
        stderr = str(e)
    except Exception as e:
        stderr = "Internal server error"
        print(e)

    if return_code == 137:
        timeout = True

    return {
        "return_code": return_code,
        "stdout": stdout,
        "stderr": stderr,
        "flags": {
            "timeout": timeout,
            "mem_out": mem_out,
        },
        "metrics": {
            "time": f"{time}",
            "memory": f"{memory}",
            "cpu_usage": cpu_usage
        }
    }
