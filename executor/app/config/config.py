import resource
import sys
import os
import yaml
from dotenv import load_dotenv
from loguru import logger


# logging
logger.remove()
logger.add(
    sys.stdout, 
    format="<green>{time:HH:mm:ss}</green> | <level>{level: ^7}</level> | <blue>{name}:{function}:{line}</blue> - <yellow>{message}</yellow>", 
    level="DEBUG",
    colorize=True,
    backtrace=True,
    diagnose=True
)

# environment
load_dotenv()

class Settings:
    SCAN_TIME_LIMIT  = int(os.getenv("SCAN_TIME_LIMIT"))
    BUILD_TIME_LIMIT = int(os.getenv("BUILD_TIME_LIMIT"))
    RUN_TIME_LIMIT   = int(os.getenv("RUN_TIME_LIMIT"))
    MEM_LIMIT        = int(os.getenv("MEM_LIMIT"))
    OUTPUT_LIMIT     = int(os.getenv("OUTPUT_LIMIT"))
    TEST_PATH        = os.getenv("TEST_PATH")
    WEBHOOK_URL      = os.getenv("WEBHOOK_URL")
    INTERNAL_SECRET  = os.getenv("INTERNAL_SECRET")

env = Settings()

os.environ.pop("SCAN_TIME_LIMIT", None)
os.environ.pop("BUILD_TIME_LIMIT", None)
os.environ.pop("RUN_TIME_LIMIT", None)
os.environ.pop("MEM_LIMIT", None)
os.environ.pop("OUTPUT_LIMIT", None)
os.environ.pop("TEST_PATH", None)
os.environ.pop("WEBHOOK_URL", None)
os.environ.pop("INTERNAL_SECRET", None)

# command
with open("./config/languages.yml", "r") as file:
    config = yaml.safe_load(file)

SCAN_CMD = ["ast-grep", "scan", "--config", "/code/sgconfig.yml", "."]


# functions
def set_cpu_limit():
    resource.setrlimit(resource.RLIMIT_CPU, (env.RUN_TIME_LIMIT, env.RUN_TIME_LIMIT + 1))

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
    