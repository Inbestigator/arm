import { readFileSync } from "node:fs";

const registers = {
  R0: 0,
  R1: 0,
  R2: 0,
  R3: 0,
  R4: 0,
  R5: 0,
  R6: 0,
  R7: 0,
  R8: 0,
  R9: 0,
  R10: 0,
  R11: 0,
  R12: 0,
  R13: 0,
  R14: 0,
  R15: 0,
};
const flags = {
  carry: 0,
  tbit: 0,
  cpsr: {
    N: 0,
    Z: 0,
    C: 0,
    V: 0,
  },
};
const memory = new Uint32Array(0x2000);

const WIDTH = 27;
const HEIGHT = 4;
const VRAM_BASE = 0x1000;

function renderFramebuffer() {
  let output = "";
  for (let y = 0; y < HEIGHT; ++y) {
    for (let x = 0; x < WIDTH; ++x) {
      const addr = VRAM_BASE + y * WIDTH + x;
      output += memory[addr] ? String.fromCharCode(memory[addr]) : " ";
    }
    output += "\n";
  }
  console.clear();
  console.log(output);
}

type Register = keyof typeof registers;
type Operand = Register | `#${number}`;

/** ARM instruction set */
export const is = {
  /** Rd := Rn + Op2 + Carry */
  ADC(Rd: Register, Rn: Register, Op2: Operand) {
    const result = registers[Rn] + parseOperand(Op2) + flags.carry;
    registers[Rd] = result >>> 0;
    flags.carry = result > 0xffffffff ? 1 : 0;
  },
  /** Rd := Rn + Op2 */
  ADD(Rd: Register, Rn: Register, Op2: Operand) {
    registers[Rd] = registers[Rn] + parseOperand(Op2);
  },
  /** Rd := Rn AND Op2 */
  AND(Rd: Register, Rn: Register, Op2: Operand) {
    registers[Rd] = registers[Rn] & parseOperand(Op2);
  },
  /** R15 := address */
  B(address: Operand) {
    registers.R15 = registers.R15 + parseOperand(address) - 1;
  },
  /** Rd := Rn AND NOT Op2 */
  BIC(Rd: Register, Rn: Register, Op2: Operand) {
    registers[Rd] = registers[Rn] & ~parseOperand(Op2);
  },
  /** R14 := R15, R15 := address */
  BL(address: Operand) {
    registers.R14 = registers.R15 + 1;
    registers.R15 = registers.R15 + parseOperand(address) - 1;
  },
  /** R15 := Rn, T bit := Rn[0] */
  BX(Rn: Register) {
    registers.R15 = registers[Rn] - 1;
    flags.tbit = registers[Rn] & 1;
  },
  /** CPSR flags := Rn - Op2 */
  CMP(Rn: Register, Op2: Operand) {
    const result = (registers[Rn] - parseOperand(Op2)) | 0;
    flags.cpsr.N = (result >>> 31) & 1;
    flags.cpsr.Z = result === 0 ? 1 : 0;
    flags.cpsr.C = registers[Rn] >>> 0 >= parseOperand(Op2) >>> 0 ? 1 : 0;
    flags.cpsr.V = ((registers[Rn] ^ parseOperand(Op2)) & (registers[Rn] ^ result)) >>> 31;
  },
  /** Rd := (Rn AND NOT Op2) OR (Op2 AND NOT Rn) */
  EOR(Rd: Register, Rn: Register, Op2: Operand) {
    registers[Rd] = registers[Rn] ^ parseOperand(Op2);
  },
  /** Rd := [address]  */
  LDR(Rd: Register, address: Operand) {
    registers[Rd] = memory[parseOperand(address)] ?? 0;
  },
  /** Rd := Op2 */
  MOV(Rd: Register, Op2: Operand) {
    registers[Rd] = parseOperand(Op2);
  },
  /** Rd := Rn * Rm */
  MUL(Rd: Register, Rn: Register, Rm: Register) {
    registers[Rd] = registers[Rn] * registers[Rm];
  },
  /** Rd := Rn OR Op2 */
  ORR(Rd: Register, Rn: Register, Op2: Operand) {
    registers[Rd] = registers[Rn] | parseOperand(Op2);
  },
  /** Rd := Rn - Op2 - 1 + Carry */
  SBC(Rd: Register, Rn: Register, Op2: Operand) {
    const result = registers[Rn] - parseOperand(Op2) - 1 + flags.carry;
    registers[Rd] = result >>> 0;
    flags.carry = result >= 0 ? 1 : 0;
  },
  /** [address] := Rd  */
  STR(Rd: Register, address: Operand) {
    memory[parseOperand(address)] = registers[Rd];
  },
  /** Rd := Rn - Op2 */
  SUB(Rd: Register, Rn: Register, Op2: Operand) {
    registers[Rd] = registers[Rn] - parseOperand(Op2);
  },
  /** Rd := [Rn], [Rn] := Rm */
  SWP(Rd: Register, Rm: Register, Rn: Register) {
    registers[Rd] = memory[registers[Rn]] ?? 0;
    memory[registers[Rn]] = registers[Rm];
  },
} as const;

function parseOperand(op: Operand) {
  if (op.startsWith("#")) return parseInt(op.slice(1));
  return registers[op as Register];
}

export function createRunner(asm: string) {
  const lines = asm
    .replaceAll(/,|;.+/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    step() {
      if (registers.R15 >= lines.length) return false;
      const line = lines[registers.R15]!;
      const [instr, ...rest] = line.split(/\s+/) as [string, ...string[]];
      const key = instr.toUpperCase();
      function run(key: keyof typeof is) {
        const instruction = is[key];
        if (instruction) {
          // @ts-expect-error
          instruction(...rest);
        } else {
          console.error("Unknown instruction:", instr);
        }
      }
      switch (key.slice(-2)) {
        case "EQ":
          if (flags.cpsr.Z) {
            run(key.slice(0, -2) as keyof typeof is);
          }
          break;
        case "NE":
          if (!flags.cpsr.Z) {
            run(key.slice(0, -2) as keyof typeof is);
          }
          break;
        default:
          run(key as keyof typeof is);
      }

      ++registers.R15;
      return true; // still running
    },
    reset() {
      registers.R15 = 0;
    },
  };
}

// Example ASM
// run(`
// MOV R0, #3
// MOV R1, #4
// ADD R2, R0, R1
// MUL R3, R0, R1
// ADD R4, R2, R3
// B #2
// MOV R5, #999 ; skipped due to B
// MOV R6, #123
// `);
const message = "Hello, World!;";
for (let i = 0; i < message.length; ++i) {
  memory[i] = message.charCodeAt(i);
}
const runner = createRunner(readFileSync("scroll.asm", "utf8"));

function run() {
  const running = runner.step();
  renderFramebuffer();
  console.log(registers);
  if (running) {
    setTimeout(run);
  }
}

run();
