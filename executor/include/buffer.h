#include <cstdio>
__attribute__((constructor)) void disable_buffer() {
    setvbuf(stdout, NULL, _IONBF, 0);
}
