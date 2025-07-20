import { stdout } from "bun";
import { run } from "..";
import { memView } from "../data";
import { compile } from "./compile";

run(await compile("colours.cpp"));

console.clear();

setInterval(() => {
  stdout.write("\x1b[H");
  for (let i = 0; i < 432; ++i) {
    stdout.write(`\x1b[48;5;${memView.getUint8(0xa00000 + i)}m ${(i + 1) % 36 === 0 ? "\n" : ""}`);
  }
  stdout.write("\x1b[0m");
}, 50);
