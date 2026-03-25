from pydantic import BaseModel
from typing import List

from config.config import env
from subprocess import CompletedProcess


class File(BaseModel):
    name: str
    content: str


class Flags(BaseModel):
    timeout: bool = False
    mem_out: bool = False


class Metrics(BaseModel):
    build_time: str = "0.00 s"
    build_memory: str = "0.00 Mb"
    run_time: str = "0.00 s"
    run_memory: str = "0.00 Mb"


class RunRequest(BaseModel):
    language: str
    entry_file: str
    files: List[File]
    stdin: str


class RunResponse(BaseModel):
    id: str = ""
    status: str = "internal error"
    stdout: str = ""
    stderr: str = ""
    flags: Flags = Flags()
    metrics: Metrics = Metrics()
    exit_code: int = 1

    def set_status(self, type: str):
        if self.exit_code != 0:
            if type == "scan":
                self.status = "scan error"
            elif type == "build":
                self.status = "build error"
            elif type == "run":
                self.status = "runtime error"
        else:
            self.status = "completed"

    def set_error(self, message: str, type: str, exit_code: int):
        self.stderr = message
        self.exit_code = exit_code
        self.set_status(type)
    
    def trunc_stdout(self, stdout):
        if len(stdout) > env.OUTPUT_LIMIT:
            hidden = len(stdout) - env.OUTPUT_LIMIT
            message = "char was" if hidden == 1 else "chars were"
            stdout = stdout[:env.OUTPUT_LIMIT] + (f"\n[Output truncated to {env.OUTPUT_LIMIT} chars, "
                                              f"{hidden} {message} hidden]")
        return stdout

    def time_limit(self, type: str):
        self.flags.timeout = True
        self.set_error("Time limit exceeded", type, 124)
    
    def memory_limit(self, type: str):
        self.flags.mem_out = True
        self.set_error("Memory limit exceeded", type, 137)

    def set_output(self, process: CompletedProcess, type: str):
        self.exit_code = process.returncode
        self.stderr = process.stderr
        self.stdout = self.trunc_stdout(process.stdout)

        if self.exit_code == 137:
            self.memory_limit(type)
        elif self.exit_code in (143, 124, 152):
            self.time_limit(type)
        else:
            self.set_status(type)
