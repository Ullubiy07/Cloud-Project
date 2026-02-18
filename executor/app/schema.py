from pydantic import BaseModel
from typing import List

class File(BaseModel):
    name: str
    content: str

class Flags(BaseModel):
    timeout: bool
    mem_out: bool

class Metrics(BaseModel):
    time: str
    phys_mem: str
    virt_mem: str

class Request(BaseModel):
    language: str
    files: List[File]
    stdin: str
    
class Response(BaseModel):
    return_code: int
    stdout: str
    stderr: str
    flags: Flags
    metrics: Metrics
