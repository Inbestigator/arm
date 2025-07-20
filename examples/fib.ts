import { $ } from "bun";
import { readFileSync } from "node:fs";
import { run } from "..";
import { displayStats } from "../stats";
import { memory, X } from "../data";

await $`riscv64-unknown-elf-gcc -march=rv32i -mabi=ilp32 -nostdlib -o fib.elf fib.cpp`;
await $`riscv64-unknown-elf-objcopy -O binary fib.elf fib.bin`;

const buffer = new Uint8Array(readFileSync("fib.bin"));

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
  console.clear();
  displayStats(memory, X);
}, 50);
