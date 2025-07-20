import { stdout } from "bun";
import { memory as defaultMem, X as defaultRegs } from "./data";

export function displayStats(memory = defaultMem, registers: Record<string, number> = defaultRegs) {
  const termWidth = process.stdout.columns || 80;
  const termHeight = process.stdout.rows || 24;

  const regNames = Object.keys(registers) as (keyof typeof registers)[];

  const maxRegNameWidth = Math.max(4, ...regNames.map((r) => r.length));
  const maxRegValueWidth = Math.max(5, ...regNames.map((r) => registers[r]!.toString(16).length));
  const regWidth = maxRegNameWidth + maxRegValueWidth;

  const brailleWidth = Math.floor(termWidth - regWidth - 2);
  const memoryBytesPerRow = brailleWidth * 8;
  const totalRows = termHeight - 1;

  const brailleRows = Math.ceil(memory.length / memoryBytesPerRow);

  const lines: string[] = [];

  lines.push(
    `\x1b[4m${"Reg ".padEnd(maxRegNameWidth)}${"| Val ".padStart(
      maxRegValueWidth + 1
    )}│${" Memory".padEnd(brailleWidth)}\x1b[0m`
  );

  for (let row = 0; row < totalRows; ++row) {
    const regName = regNames[row];
    const regText = regName
      ? regName.padEnd(maxRegNameWidth) +
        registers[regName]!.toString(16).padStart(maxRegValueWidth).toUpperCase()
      : " ".repeat(regWidth);

    const memOffset = row * memoryBytesPerRow;

    let memoryColumn = "";

    if (row < brailleRows) {
      const braille = [];
      for (let i = 0; i < brailleWidth; ++i) {
        let byte = 0;
        for (let b = 0; b < 8; ++b) {
          const addr = memOffset + i * 8 + b;
          if (addr < memory.length && memory[addr]) {
            byte |= 1 << b;
          }
        }
        braille.push(String.fromCharCode(0x2800 + byte));
      }
      memoryColumn = braille.join("");
    } else {
      const bytesPerHexRow = Math.floor(brailleWidth / 3);
      const memAddr = 0xa00 + (row - brailleRows) * bytesPerHexRow;
      const bytes = memory.slice(memAddr, memAddr + bytesPerHexRow);
      memoryColumn = Array.from(bytes)
        .map((b) => (b === 0 ? `\x1b[2m00\x1b[0m` : b.toString(16).padStart(2, "0").toUpperCase()))
        .join(" ");
    }

    lines.push(`${regText} │${memoryColumn}`);
  }

  stdout.write("\x1b[H" + lines.join("\n"));
}
