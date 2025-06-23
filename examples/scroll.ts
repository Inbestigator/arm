import { readFileSync } from "node:fs";
import { parseASM } from "../asm";
import { createRunner, memory, registers } from "..";
import { VRAM_BASE } from "../stats";

const runner = createRunner(parseASM(readFileSync("scroll.asm", "utf8")));
const message = "Hello, World!;";
for (let i = 0; i < message.length; ++i) {
  memory[i] = message.charCodeAt(i);
}
registers.R1 = VRAM_BASE;
runner.execute();
