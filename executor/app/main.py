from fastapi import FastAPI
from scalar_fastapi import get_scalar_api_reference, Layout
import asyncio
from asyncio.subprocess import PIPE
import resource

from schema import Request, Response
from manager import FileManager

cpu_time_sec = 5
memory_byte = 64 * 1024 * 1024

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

def parseStats(stderr: str) -> list[str]:
    start = stderr.find("==STATS==")
    end   = stderr.find("\n", start)
    if start != -1 and end != -1:
        stats = stderr[start:end].split()
        stderr = stderr[:start] + stderr[end + 1:]
        if stats[2] and len(stats) == 4:
            return [stats[1] + "s", str(int(stats[2]) / 1024) + "M", stats[3], stderr]
    return ["", "", "", stderr]

def set_limits():
    resource.setrlimit(resource.RLIMIT_CPU, (cpu_time_sec, cpu_time_sec))
    resource.setrlimit(resource.RLIMIT_AS, (memory_byte, memory_byte))


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
            stdout, stderr = await process.communicate(input=request.stdin.encode())
            return_code = process.returncode

            time, memory, cpu_usage, stderr = parseStats(stderr.decode())
            stdout = stdout.decode()

    except ValueError as e:
        stderr = str(e)
    except Exception as e:
        stderr = "Internal server error"
        print(e)

    if return_code == 137:
        timeout = True
    if "MemoryError" in stderr:
        mem_out = True

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
