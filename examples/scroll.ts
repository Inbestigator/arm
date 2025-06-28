import { readFileSync } from "node:fs";
import { parseASM } from "../asm";
import { createRunner, writeMemory } from "..";

const runner = createRunner(parseASM(readFileSync("scroll.s", "utf8")));
const message = new TextEncoder().encode("Hello, World!;");
for (let i = 0; i < message.length; ++i) {
  writeMemory(i, message[i]!, "B");
}
runner.execute();
