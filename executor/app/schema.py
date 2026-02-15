from pydantic import BaseModel
from typing import List

class File(BaseModel):
    name: str
    content: str

class Metrics(BaseModel):
    time: str
    memory: str
    cpu_usage: str

class Request(BaseModel):
    command: str
    files: List[File]
    stdin: str
    
class Response(BaseModel):
    return_code: int
    stdout: str
    stderr: str
    timeout: bool
    metrics: Metrics
