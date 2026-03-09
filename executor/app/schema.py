from pydantic import BaseModel
from typing import List

from config import TIME_LIMIT
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

    def set_error(self, message: str, rc: int):
        self.stderr = message
        self.rc = rc

    def time_limit(self, error=None):
        self.flags.timeout = True
        self.metrics.run_time = f"{TIME_LIMIT:.2f} s"
        self.set_error("Time limit exceeded", 124)
        if error:
            self.stdout = error.stdout.decode() if error.stdout else ""
    
    def memory_limit(self):
        self.flags.mem_out = True
        self.set_error("Memory limit exceeded", 137)

    def set_output(self, process: CompletedProcess, type: str):
        self.rc = process.returncode
        self.stderr = process.stderr
        self.stdout = process.stdout

        if self.rc != 0:
            match type:
                case "run":
                    self.flags.run_error = True
                case "build":
                    self.flags.build_error = True
        if self.rc == 137:
            self.memory_limit()
        if self.rc == 143:
            self.time_limit()