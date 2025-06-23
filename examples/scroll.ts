import { readFileSync } from "node:fs";
import { parseASM } from "../asm";
import { createRunner, memory } from "..";

const runner = createRunner(parseASM(readFileSync("scroll.s", "utf8")));
const message = "Hello, World!;";
for (let i = 0; i < message.length; ++i) {
  memory[i] = message.charCodeAt(i);
}
runner.execute();
