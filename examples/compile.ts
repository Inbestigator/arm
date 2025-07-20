import { $ } from "bun";
import { tmpdir } from "node:os";
import { join } from "node:path";

export async function compile(address: string) {
  const tmpPath = join(tmpdir(), `${address}.elf`);
  await $`riscv64-unknown-elf-gcc -march=rv32i -mabi=ilp32 -nostdlib -o ${tmpPath} ${address}`;
  const result =
    await $`riscv64-unknown-elf-objdump -d ${tmpPath} | awk '/^[[:space:]]*[0-9a-f]+:/ { print $2 }'`.text();
  return result.replaceAll("\n", "");
}
