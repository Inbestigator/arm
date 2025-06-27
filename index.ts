import { is, type Mnemonic } from "./instructions";
import { displayStats } from "./stats";

const MEM_SIZE = 0x1000;

export type Register = keyof typeof registers;
export type Operand = Register | `#${number}`;
interface Condition {
  v: "N" | "Z" | "C" | "V";
  eq?: Condition["v"] | 0 | 1;
  ne?: Condition["v"] | 0 | 1;
}
export interface Instruction {
  mnemonic: Mnemonic;
  operands: (Operand | Operand[])[];
  mode?: "IA" | "IB" | "DA" | "DB" | "B" | "H";
  conditions: (Condition[] | Condition)[];
}

export const registers = {
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
  R13: MEM_SIZE,
  R14: 0,
  R15: 0,
};
export const flags = {
  carry: 0,
  tbit: 0,
  cpsr: 0x60000013,
};
export const memory = new Uint8Array(MEM_SIZE);

export function writeRegister(register: Register, value: number) {
  registers[register] = value >>> 0;
}

export function writeMemory(address: number, value: number, mode?: "B" | "H") {
  value >>>= 0;
  memory[address] = value & 0xff;
  if (mode === "B") return;
  memory[address + 1] = (value >>> 8) & 0xff;
  if (mode === "H") return;
  memory[address + 2] = (value >>> 16) & 0xff;
  memory[address + 3] = (value >>> 24) & 0xff;
}

export function readMemory(address: number, mode?: "B" | "H"): number {
  switch (mode) {
    case "B":
      return memory[address]! >>> 0;
    case "H":
      return (memory[address]! | (memory[address + 1]! << 8)) >>> 0;
    default:
      return (
        (memory[address]! |
          (memory[address + 1]! << 8) |
          (memory[address + 2]! << 16) |
          (memory[address + 3]! << 24)) >>>
        0
      );
  }
}

function getCPSRFlag(flag: "N" | "Z" | "C" | "V") {
  const shift = { N: 31, Z: 30, C: 29, V: 28 }[flag];
  return (flags.cpsr >>> shift) & 1;
}

function checkCondition(condition: Condition[] | Condition): boolean {
  if (Array.isArray(condition)) {
    return condition.some(checkCondition);
  }

  const { v, eq, ne } = condition;
  const val = getCPSRFlag(v);

  if (eq !== undefined) {
    return typeof eq === "number" ? val === eq : val === getCPSRFlag(eq);
  }
  if (ne !== undefined) {
    return typeof ne === "number" ? val !== ne : val !== getCPSRFlag(ne);
  }

  return false;
}

export function createRunner(instructions: Instruction[]) {
  const runner = {
    execute() {
      const intervalId = setInterval(() => {
        const done = runner.step();
        displayStats();
        if (done) {
          clearInterval(intervalId);
        }
      });
    },
    step() {
      if (registers.R15 >= instructions.length || !instructions[registers.R15]) return true;
      const { mnemonic, operands, conditions, mode } = instructions[registers.R15]!;
      if (conditions.every(checkCondition)) {
        const operation = is[mnemonic];
        if (operation) {
          // @ts-expect-error
          operation(...operands, mode);
        } else {
          console.error("Unknown mnemonic:", mnemonic);
        }
      }
      ++registers.R15;
    },
    reset() {
      for (const key of Object.keys(registers)) {
        registers[key as Register] = 0;
      }
      flags.carry = 0;
      flags.tbit = 0;
      flags.cpsr = 0x60000013;
      memory.fill(0);
    },
  };
  return runner;
}
