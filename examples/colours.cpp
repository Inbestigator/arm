#include <cstdint>

int main()
{
    uint8_t palette[] = {0, 196, 46, 21, 226, 201, 51, 93, 244, 15};
    uint8_t *input = (uint8_t *)0x00ffff;
    uint8_t *output = (uint8_t *)0xa00000;

    while (true)
    {
        *output = 15;
        if (*input < '0' || *input > '9')
        {
            continue;
        }
        *output = palette[*input - '0'];
        ++output;
        *input = 0;
    }

    return 0;
}
