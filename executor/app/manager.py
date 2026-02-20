import uuid
from pathlib import Path
import os

class FileNameError(Exception):
    pass

class FileManager:
    def __init__(self, directory: str, files, language: str):
        self.base_dir = Path(directory)
        self.files = files
        self.session_dir = (self.base_dir / str(uuid.uuid4())).resolve()
        self.lang = language

    def __enter__(self):
        self.session_dir.mkdir(parents=True, exist_ok=True)

        for file in self.files:
            file_path = self.session_dir / file.name

            if not file.name or '..' in file.name or file_path.parent.resolve() != self.session_dir:
                raise FileNameError(f"Invalid file name: {file.name}")
            
            with open(file_path, mode='w') as f:
                f.write(file.content)

        if self.lang == "golang":
            cache = Path("/tmp/.go_cache")
            cache.mkdir(exist_ok=True)
            os.environ["GOCACHE"] = str(cache)
            os.system(f"chown user {cache}")
        
        os.chown(self.session_dir, 1001, -1)
        # os.system(f"chown user {self.session_dir}")
        
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        import shutil
        shutil.rmtree(self.session_dir)
    
