#include <cstdint>

int main()
{
    int i = 32;

    uint32_t *ptr = (uint32_t *)0xa00;
    int a = 0;
    int b = 1;

    *ptr++ = a;
    *ptr++ = b;

    while (i > 2)
    {
        int next = a + b;
        *ptr++ = next;

        a = b;
        b = next;

        --i;
    }

    return 0;
}
