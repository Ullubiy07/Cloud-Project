import resource
import sys
from loguru import logger

logger.remove()
logger.add(
    sys.stdout, 
    format="<green>{time:HH:mm:ss}</green> | <level>{level: ^7}</level> | <blue>{name}:{function}:{line}</blue> - <yellow>{message}</yellow>", 
    level="DEBUG",
    colorize=True
)

SCAN_TIME_LIMIT = 3
BUILD_TIME_LIMIT = 7
RUN_TIME_LIMIT = 5
MEM_LIMIT = 256
OUTPUT_LIMIT = 16 * 1024

TEST_PATH = "/tests"
WEBHOOK_URL = "https://webhook.site/1f6e6cc7-5da7-4392-9801-ec84f58d4cea"
SCAN_CMD = ["ast-grep", "scan", "--config", "/code/sgconfig.yml", "."]

config = {
    "python": {
        "type": "script",
        "build": "",
        "run": "python"
    },
    "javascript": {
        "type": "script",
        "build": "",
        "run": "node"
    },
    "c++": {
        "type": "compile",
        "build": "g++ *.cpp -o main",
        "run": "./main"
    },
    "c": {
        "type": "compile",
        "build": "gcc *.c -o main",
        "run": "./main"
    },
    "go": {
        "type": "compile",
        "build": "go build -ldflags='-s -w' -gcflags='all=-N -l' -o main *.go",
        "run": "./main"
    },
    "assembler": {
        "type": "compile",
        "build": """bash -c 'for f in *.asm; do nasm -f elf64 "$f" -o "${f%.asm}.o"; done && gcc -c /include/macro.c -o __macro__.o && gcc -m64 -no-pie *.o -o main'""",
        "run": "./main"
    },
    "sql": {
        "type": "script",
        "build": "",
        "run": "sqlite3 ':memory:'"
    }
}

def set_cpu_limit():
    resource.setrlimit(resource.RLIMIT_CPU, (RUN_TIME_LIMIT, RUN_TIME_LIMIT))

def build_cmd(lang, stats_file):
    time_wrap = f"/usr/bin/time -f '%e %M' -o {stats_file}"
    cmd = ""
    if config[lang]["type"] == "compile":
        cmd = f"{time_wrap} {config[lang]['build']}"
    return ["/bin/bash", "-c", cmd]

def run_cmd(lang, stats_file, entry_file):
    time_wrap = f"/usr/bin/time -f '%e %M' -o {stats_file}"
    cmd = f"{time_wrap} {config[lang]['run']}"
    if config[lang]["type"] == "script":
        cmd += (" " if lang != "sql" else " < ") + entry_file
    return ["/bin/bash", "-c", cmd]
    