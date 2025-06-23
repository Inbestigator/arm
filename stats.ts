import { memory, registers, type Register } from ".";

const WIDTH = 27;
const HEIGHT = 8;
export const VRAM_BASE = 0x1000 - WIDTH * HEIGHT;

export function displayStats() {
  const termWidth = process.stdout.columns || 80;
  const termHeight = (process.stdout.rows || 24) - 1;

  const regNames = Object.keys(registers) as Register[];

  const maxRegNameWidth = Math.max(...regNames.map((r) => r.length));
  const regValueWidth = 5;
  const regWidth = maxRegNameWidth + 1 + regValueWidth;
  const fbWidth = WIDTH;
  const gap = 4;

  const brailleWidth = Math.floor((termWidth - regWidth - fbWidth - gap) / 1);
  const memoryBytesPerRow = brailleWidth * 8;
  const totalRows = termHeight - 1;

  const lines: string[] = [];
  const brailleBase = 0x2800;

  function getBrailleChar(byte: number): string {
    return String.fromCharCode(brailleBase + byte);
  }

  const framebufferLines: string[] = [];
  for (let y = 0; y < HEIGHT; ++y) {
    let line = "";
    for (let x = 0; x < WIDTH; ++x) {
      const addr = VRAM_BASE + y * WIDTH + x;
      line += memory[addr] ? String.fromCharCode(memory[addr]) : " ";
    }
    framebufferLines.push(line.padEnd(fbWidth, " "));
  }

  lines.push(
    `\x1b[4m${"Reg | Val".padEnd(regWidth, " ")} │${" Memory".padEnd(
      brailleWidth,
      " "
    )}│ ${"Frame buffer".padEnd(WIDTH, " ")}\x1b[0m`
  );
  for (let row = 0; row < totalRows; ++row) {
    const regName = regNames[row] ?? "";
    const regVal = regName
      ? String(registers[regName]).padStart(regValueWidth, " ")
      : "".padEnd(regValueWidth, " ");
    const regText = regName
      ? `${regName.padEnd(maxRegNameWidth, " ")} ${regVal}`
      : "".padEnd(regWidth, " ");

    const memOffset = row * memoryBytesPerRow;
    const braille = [];
    for (let i = 0; i < brailleWidth; ++i) {
      let byte = 0;
      for (let b = 0; b < 8; ++b) {
        const addr = memOffset + i * 8 + b;
        if (addr < memory.length && memory[addr]) {
          byte |= 1 << b;
        }
      }
      braille.push(getBrailleChar(byte));
    }

    const fbText = framebufferLines[row] ?? "".padEnd(fbWidth, " ");

    lines.push(`${regText} │${braille.join("")}│ ${fbText}`);
  }

  console.clear();
  console.log(lines.join("\n"));
}
