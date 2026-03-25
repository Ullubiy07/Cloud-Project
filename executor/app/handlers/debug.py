import gdb

gdb.execute("set confirm off")
gdb.execute("set debuginfod enabled off")


gdb.execute("delete")
gdb.execute("break main", to_string=True)
gdb.execute("run main > output.txt", to_string=True)


def read_output(pos):
    with open("output.txt", "r") as f:
        f.seek(pos)
        out = f.read()
        return [f.tell(), out]


def debug():
    data = []

    pos = 0

    for i in range(1, 80):

        step = {
            "step": i,
            "function": "",
            "line": 0,
            "stdout": "",
            "vars": {}
        }

        gdb.execute("step", to_string=True)

        pos, stdout = read_output(pos)
        step["stdout"] = stdout 

        frame = gdb.selected_frame()
        block = frame.block()
        name = frame.name()

        if name and name.startswith("__libc_start_call_main"):
            return data

        step["function"] = name
        step["line"] = frame.find_sal().line

        while block:
            for symbol in block:
                if symbol.is_variable:
                    step["vars"][symbol.name] = str(symbol.value(frame))
            if block.function:
                break
            block = block.superblock

        data.append(step)
    return data

data = debug()

import json
for i in data:
    print(json.dumps(i, indent=2))



# for development
# gdb --batch -x debug.py ./main
# g++ -g -include main.h main.cpp -o main