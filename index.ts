import { displayStats } from "./stats";

export type Mnemonic = keyof typeof is;
export type Register = keyof typeof registers;
export type Operand = Register | `#${number}`;
interface Condition {
  v: "N" | "Z" | "C" | "V";
  eq?: Condition["v"] | 0 | 1;
  ne?: Condition["v"] | 0 | 1;
}
export interface Instruction {
  mnemonic: Mnemonic;
  operands: Operand[];
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
  R13: 0,
  R14: 0,
  R15: 0,
};
export const flags = {
  carry: 0,
  tbit: 0,
  cpsr: {
    N: 0,
    Z: 0,
    C: 0,
    V: 0,
  },
};
export const memory = new Uint32Array(0x1000);

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

function checkCondition(condition: Condition[] | Condition): boolean {
  if (Array.isArray(condition)) {
    return condition.some(checkCondition);
  }

  const { v, eq, ne } = condition;
  const val = flags.cpsr[v];

  if (eq !== undefined) {
    return typeof eq === "number" ? val === eq : val === flags.cpsr[eq];
  }
  if (ne !== undefined) {
    return typeof ne === "number" ? val === ne : val === flags.cpsr[ne];
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
      if (registers.R15 >= instructions.length) return true;
      const { mnemonic, operands, conditions } = instructions[registers.R15]!;
      if (conditions.every(checkCondition)) {
        const operation = is[mnemonic];
        if (operation) {
          // @ts-expect-error
          operation(...operands);
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
      flags.cpsr.C = 0;
      flags.cpsr.N = 0;
      flags.cpsr.V = 0;
      flags.cpsr.Z = 0;
      memory.fill(0);
    },
  };
  return runner;
}
