from pydantic import BaseModel
from typing import List

from config import RUN_TIME_LIMIT
from subprocess import CompletedProcess


class File(BaseModel):
    name: str
    content: str

class Flags(BaseModel):
    timeout: bool = False
    mem_out: bool = False
    build_error: bool = False
    run_error: bool = False

class Metrics(BaseModel):
    build_time: str = "0.00 s"
    build_memory: str = "0.00 Mb"
    run_time: str = "0.00 s"
    run_memory: str = "0.00 Mb"

class Request(BaseModel):
    language: str
    entry_file: str
    files: List[File]
    stdin: str
    
class Response(BaseModel):
    rc: int = 1
    stdout: str = ""
    stderr: str = ""
    flags: Flags = Flags()
    metrics: Metrics = Metrics()

    def set_flag(self, type: str):
        if self.rc != 0:
            if type == "run":
                self.flags.run_error = True
            else:
                self.flags.build_error = True

    def set_error(self, message: str, type: str, rc: int):
        self.stderr = message
        self.rc = rc
        self.set_flag(type)

    def time_limit(self, type: str, error=None):
        self.flags.timeout = True
        # self.metrics.run_time = f"{TIME_LIMIT:.2f} s"
        self.set_error("Time limit exceeded", type, 124)
        if error:
            self.stdout = error.stdout.decode() if error.stdout else ""
    
    def memory_limit(self, type: str):
        self.flags.mem_out = True
        self.set_error("Memory limit exceeded", type, 137)

    def set_output(self, process: CompletedProcess, type: str):
        self.rc = process.returncode
        self.stderr = process.stderr
        self.stdout = process.stdout

        self.set_flag(type)

        if self.rc == 137:
            self.memory_limit(type)
        if self.rc == 143:
            self.time_limit(type)
