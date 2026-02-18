import resource

CPU_TIME_LIMIT = 5
MEM_LIMIT = 64

commands = {
    "python": "python main.py",
    "c++": "g++ main.cpp -o main; ./main",
    "node": "node main.js",
    "golang": "go build -o main main.go; ./main"
}


def set_limits():
    resource.setrlimit(resource.RLIMIT_CPU, (CPU_TIME_LIMIT, CPU_TIME_LIMIT))