import { readFileSync } from "node:fs";
import { parseASM } from "../asm";
import { createRunner, writeMemory } from "..";

const runner = createRunner(parseASM(readFileSync("scroll.s", "utf8")));
const message = "Hello, World!;";
for (let i = 0; i < message.length; ++i) {
  writeMemory(i, message.charCodeAt(i), "B");
}
runner.execute();
