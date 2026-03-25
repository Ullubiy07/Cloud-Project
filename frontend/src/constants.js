export const LANGUAGES = {
    python: "3.12",
    javascript: "18.19.0",
    c: "latest",
    assembly: "NASM",
    sql: "latest",
    cpp: "C++20",
};

export const SNIPPETS = {
    javascript: `// Here you can write your code\nconsole.log("Hello, Cloud Computing!");`,
    python: `# Here you can write your code\nprint("Hello, Cloud Comptuting!")\n`,
    cpp: `// Here you can write your code\n#include <iostream>\n\nint main() {\n\tstd::cout << "Hello, Cloud Computing!";\n\treturn 0;\n}`,
    c: `// Here you can write your code\n#include <stdio.h>\n\nint main(void) {\n\tprintf("Hello, Cloud Computing!");\n\treturn 0;\n}`,
    assembly: `; Here you can write your code\nsection .data\n\tmsg db 'Hello, World!', 0\n\nsection .text\n\textern io_print_string\n\textern io_newline\n\tglobal main\n\nmain:\n\tpush rbp\n\tmov rbp, rsp\n\t\n\n\tmov rdi, msg\n\tcall io_print_string\n\tcall io_newline\n\n\tmov rsp, rbp\n\tpop rbp\n\txor eax, eax\n\tret\n`,
    sql: `CREATE TABLE users (\n\tid INTEGER PRIMARY KEY AUTOINCREMENT,\n\tname TEXT NOT NULL,\n\temail TEXT UNIQUE,\n\tcreated_at DATETIME DEFAULT CURRENT_TIMESTAMP\n);\n\nINSERT INTO users (name, email)\nVALUES\n\t('Alice', 'alice@example.com'),\n\t('Bob', 'bob@example.com'),\n\t('Charlie', 'charlie@example.com');\n\nSELECT * FROM users;\n`,
}

export const DEFAULT_FILES = {
    python: "main.py",
    javascript: "main.js",
    cpp: "main.cpp",
    c: "main.c",
    assembly: "main.asm",
    sql: "main.sql",
};