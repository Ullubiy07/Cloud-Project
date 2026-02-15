from fastapi import FastAPI
from scalar_fastapi import get_scalar_api_reference, Layout
import subprocess

from schema import Request, Response
from manager import FileManager

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
        try:
            stats = stderr[start:end].split()
            stderr = stderr[:start] + stderr[end + 1:]
            if stats[2] and len(stats) == 4:
                return [stats[1] + "s", str(int(stats[2]) / 1024) + "M", stats[3], stderr]
        except Exception:
            pass
    return ["", "", "", stderr]


@app.post("/run", response_model=Response)
async def run_code(request: Request):

    return_code = 1
    stdout, stderr = "", ""
    time, memory, cpu_usage = "", "", ""
    timeout = False
    TEST_PATH = "/home/user/tests"
    try:
        async with FileManager(directory=TEST_PATH, files=request.files) as manager:
            proc = subprocess.run(
                [
                 "/usr/bin/time","-f" "==STATS== %e %M %P"
                ] + request.command.split(),
                user="user",
                input=request.stdin,
                capture_output=True,
                text=True,
                cwd=manager.session_dir,
                timeout=5
            )
            return_code = proc.returncode
            stdout = proc.stdout
            stderr = proc.stderr
    except subprocess.TimeoutExpired:
        timeout = True
    except ValueError as e:
        stderr = str(e)
    except Exception as e:
        stderr = "Internal server error"
        print(e)
    
    time, memory, cpu_usage, clean_stderr = parseStats(stderr)

    return {
        "return_code": return_code,
        "stdout": stdout,
        "stderr": clean_stderr,
        "timeout": timeout,
        "metrics": {
            "time": f"{time}",
            "memory": f"{memory}",
            "cpu_usage": cpu_usage
        }
    }
