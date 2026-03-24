import uuid
from pathlib import Path
from typing import List
from subprocess import TimeoutExpired
import os

from schemas.execute import File, Metrics, RunResponse
from config.config import env, logger


class FileNameError(Exception):
    pass


class FileManager:
    def __init__(self, directory: str, data: Metrics, files: List[File], language: str):
        self.base_dir = Path(directory)
        self.build_stats = self.base_dir / str(uuid.uuid4())
        self.run_stats = self.base_dir / str(uuid.uuid4())
        self.data = data
        self.files = files
        self.lang = language
    
    def parse_stats(self, path: Path):
        time, memory = "0.00 s", "0.00 Mb"
        try:
            file = open(path, mode='r').readlines()
            stats = []
            if file:
                stats = file[0].split()
            if len(file) == 2:
                stats = file[1].split()
            if len(stats) == 2:
                time = f"{float(stats[0]):.2f} s"
                memory = f"{round(int(stats[1]) / 1024, 2)} Mb"
        except Exception as e:
            logger.debug(e)
        return [time, memory]

    def __enter__(self):
        self.build_stats.touch(exist_ok=True)
        self.run_stats.touch(exist_ok=True)

        for file in self.files:
            file_path = self.base_dir / file.name

            if not file.name or '..' in file.name or file_path.parent.resolve() != self.base_dir:
                raise FileNameError(f"Invalid file name: {file.name}")
            
            with open(file_path, mode='w') as f:
                f.write(file.content)

        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.data.build_time, self.data.build_memory = self.parse_stats(self.build_stats)
        self.data.run_time, self.data.run_memory = self.parse_stats(self.run_stats)
        os.system(f"rm -rf {env.TEST_PATH}/*")


class Execution:
    def __init__(self, type: str, res: RunResponse):
        self.type = type
        self.res = res
    
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type == None:
            return
        if isinstance(exc_val, TimeoutExpired):
            self.res.time_limit(self.type)
        elif isinstance(exc_val, FileNameError):
            self.res.set_error(str(exc_val), self.type, 1)
        else:
            self.res.set_error("Internal server error", self.type, 124)
            logger.debug(exc_val)
        return True
    