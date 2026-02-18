import psutil
import asyncio

from config import MEM_LIMIT


class ProcessTracker:
    def __init__(self, proc: asyncio.subprocess.Process = None):
        self.proc = proc
        self.watcher: psutil.Process = None

        self.phys_mem = 0
        self.virt_mem = 0
        self.mem_out = False
        
    async def watch(self):
        try:
            self.watcher = psutil.Process(self.proc.pid)
            while self.proc.returncode is None:

                self.updateState()

                if self.phys_mem > MEM_LIMIT:
                    self.mem_out = True
                    self.killProcess()
                    break
                await asyncio.sleep(0.01)

        except Exception:
            pass

    def updateState(self):
        try:
            with self.watcher.oneshot():
                phys_mem = self.watcher.memory_info().rss
                virt_mem = self.watcher.memory_info().vms
                children = self.watcher.children(recursive=True)

            for child in children:
                try:
                    with child.oneshot():
                        phys_mem += child.memory_info().rss
                        virt_mem += child.memory_info().vms
                except Exception:
                    continue

            self.phys_mem = phys_mem / (1024 * 1024)
            self.virt_mem = virt_mem / (1024 * 1024)
        except Exception:
            pass

    def killProcess(self):
        try:
            self.proc.kill()
            children = self.watcher.children(recursive=True)
            for child in children:
                try:
                    child.kill()
                except psutil.NoSuchProcess:
                    pass
        except Exception:
            pass


def parseTime(stderr: str) -> list[str]:
    start = stderr.find("STATS=")
    end   = stderr.find("\n", start)
    if start != -1 and end != -1:
        stats = stderr[start:end].split("=")
        stderr = stderr[:start] + stderr[end + 1:]
        if stats[1] and len(stats) == 2:
            return [stats[1], stderr]
    return ["0", stderr]