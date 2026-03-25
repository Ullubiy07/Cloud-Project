import subprocess

from schemas.execute import RunRequest, RunResponse
from manager import FileManager, Execution
from config.config import *


def run_code(request: RunRequest) -> RunResponse:

    res = RunResponse()

    try:
        with FileManager(directory=env.TEST_PATH, data=res.metrics, files=request.files, language=request.language) as manager:

            with Execution("scan", res):
                scan_process = subprocess.run(
                    SCAN_CMD,
                    capture_output=True,
                    text=True,
                    timeout=env.SCAN_TIME_LIMIT,
                    cwd=manager.base_dir
                )

            if scan_process.returncode != 0:
                res.set_output(scan_process, "scan")
                return res
            
            with Execution("build", res):
                build_process = subprocess.run(
                    build_cmd(request.language, manager.build_stats),
                    capture_output=True,
                    text=True,
                    timeout=env.BUILD_TIME_LIMIT,
                    cwd=manager.base_dir
                )

            if build_process.returncode != 0:
                res.set_output(build_process, "build")
                return res
            
            with Execution("run", res):
                run_process = subprocess.run(
                    run_cmd(request.language, manager.run_stats, request.entry_file),
                    input=request.stdin,
                    capture_output=True,
                    text=True,
                    timeout=env.RUN_TIME_LIMIT + 0.5,
                    preexec_fn=set_cpu_limit,
                    cwd=manager.base_dir
                )

            res.set_output(run_process, "run")

    except Exception as e:
        logger.debug(e)

    return res
