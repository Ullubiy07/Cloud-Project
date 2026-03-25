export const LANGUAGES = {
    python: "3.12",
    javascript: "18.19.0",
    c: "",
    asm: "NASM",
    sql: "",
    cpp: "C++20",
};

export const SNIPPETS = {
    javascript: `// Here you can write your code\nconsole.log("Hello, Cloud Computing!");`,
    python: `# Here you can write your code\nprint("Hello, Cloud Comptuting!")\n`,
    cpp: `// Here you can write your code\n#include <iostream>\n\nint main() {\n\tstd::cout << "Hello, Cloud Computing!";\n\treturn 0;\n}`,
    c: `// Here you can write your code\n#include <stdio.h>\n\nint main(void) {\n\tprintf("Hello, Cloud Computing!");\n\treturn 0;\n}`,
    asm: `; Here you can write your code\n\nsection .text\nglobal main\nmain:\n\txor eax, eax\n\tret\n`,
    sql: ``,
}

export const DEFAULT_FILES = {
    python: "main.py",
    javascript: "main.js",
    cpp: "main.cpp",
    c: "main.c",
    asm: "main.asm",
    sql: "main.sql",
};