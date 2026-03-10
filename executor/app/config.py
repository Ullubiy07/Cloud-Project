import resource

RUN_TIME_LIMIT = 5
BUILD_TIME_LIMIT = 15
MEM_LIMIT = 256

TEST_PATH = "/home/user/tests"

build = {
    "python": "",
    "c++": "g++ *.cpp -o main",
    "javascript": "",
    "go": "go build -ldflags='-s -w' -gcflags='all=-N -l' -o main *.go"
}

run = {
    "python": "python *.py",
    "c++": "./main",
    "javascript": "node *.js",
    "go": "./main"
}

def set_cpu_limit():
    resource.setrlimit(resource.RLIMIT_CPU, (RUN_TIME_LIMIT, RUN_TIME_LIMIT))


def build_cmd(lang, stats):
    cmd = ""
    if build[lang]:
        cmd = f"/usr/bin/time -f '%e %M' -o {stats} {build[lang]}"
    return ["/bin/bash", "-c", cmd]

def run_cmd(lang, stats, entry_file):
    tmp = run[lang]
    if lang in ["python", "javascript"]:
        tmp += " " + entry_file
    cmd = f"/usr/bin/time -f '%e %M' -o {stats} {tmp}"
    return ["/bin/bash", "-c", cmd]