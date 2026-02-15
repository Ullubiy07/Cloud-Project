import psutil
import asyncio

MEM_LIMIT = 64


async def watch(process, context):
    context["mem_out"] = False
    try:
        p = psutil.Process(process.pid)
        while process.returncode is None:

            current_mem = p.memory_info().rss
            children = p.children(recursive=True)
            for child in children:
                current_mem += child.memory_info().rss
            
            mem = current_mem / (1024 * 1024)
            context["memory"] = str(mem)
            
            if mem > MEM_LIMIT:
                context["mem_out"] = True

                for child in children:
                    try:
                        child.kill()
                    except psutil.NoSuchProcess:
                        pass
                process.kill() 
                break
            await asyncio.sleep(0.1)
    except psutil.NoSuchProcess:
        pass


def parseStats(stderr: str) -> list[str]:
    start = stderr.find("==STATS==")
    end   = stderr.find("\n", start)
    if start != -1 and end != -1:
        stats = stderr[start:end].split()
        stderr = stderr[:start] + stderr[end + 1:]
        if stats[2] and len(stats) == 4:
            return [stats[1] + "s", str(int(stats[2]) / 1024) + "M", stats[3], stderr]
    return ["", "", "", stderr]