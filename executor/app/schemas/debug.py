from pydantic import BaseModel


class File(BaseModel):
    name: str
    content: str
    

class DebugRequest(BaseModel):
    language: str
    file: File