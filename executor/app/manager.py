import asyncio
import uuid
import shutil
from pathlib import Path
from typing import List
import aiofiles

from schema import File


class FileManager:
    def __init__(self, directory: str, files: List[File]):
        self.base_dir = Path(directory)
        self.files = files
        self.session_dir = (self.base_dir / str(uuid.uuid4())).resolve()

    async def __aenter__(self):
        self.session_dir.mkdir(parents=True, exist_ok=True)
        
        for file in self.files:
            file_path = self.session_dir / file.name

            if not file.name or '..' in file.name or file_path.parent.resolve() != self.session_dir:
                raise ValueError(f"Invalid file name: {file.name}")
            
            async with aiofiles.open(file_path, mode='w') as f:
                await f.write(file.content)

        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session_dir.exists():
            await asyncio.to_thread(shutil.rmtree, self.session_dir, ignore_errors=True)