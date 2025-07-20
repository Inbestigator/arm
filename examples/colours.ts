import { $, stdout } from "bun";
import { readFileSync } from "node:fs";
import { run } from "..";
import { memView } from "../data";

await $`riscv64-unknown-elf-gcc -march=rv32i -mabi=ilp32 -nostdlib -o colours.elf colours.cpp`;
await $`riscv64-unknown-elf-objcopy -O binary colours.elf colours.bin`;

const buffer = new Uint8Array(readFileSync("colours.bin"));

const words = [];
for (let i = 0; i < buffer.length; i += 4) {
  const word =
    (buffer[i] ?? 0) |
    ((buffer[i + 1] ?? 0) << 8) |
    ((buffer[i + 2] ?? 0) << 16) |
    ((buffer[i + 3] ?? 0) << 24);
  words.push(`${(word >>> 0).toString(16).padStart(8, "0")}`);
}

run(words);

setInterval(() => {
  function colour(v: number) {
    return `\x1b[48;5;${v}m `;
  }
  stdout.write("\x1b[H");
  for (let i = 0; i < 432; ++i) {
    stdout.write(colour(memView.getUint8(0xa00000 + i)) + ((i + 1) % 36 === 0 ? "\n" : ""));
  }
  stdout.write("\x1b[0m");
}, 50);
