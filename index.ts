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
};

type Register = keyof typeof registers;
type OperandInput = Register | ({} & string);

/** ARM instruction set */
export const is = {
  /** Rd := Rn + Op2 + Carry */
  ADC(Rd: Register, Rn: Register, Op2: OperandInput) {
    const result = registers[Rn] + parseOperand(Op2) + flags.carry;
    registers[Rd] = result >>> 0;
    flags.carry = result > 0xffffffff ? 1 : 0;
  },
  /** Rd := Rn + Op2 */
  ADD(Rd: Register, Rn: Register, Op2: OperandInput) {
    registers[Rd] = registers[Rn] + parseOperand(Op2);
  },
  /** Rd := Rn AND Op2 */
  AND(Rd: Register, Rn: Register, Op2: OperandInput) {
    registers[Rd] = registers[Rn] & parseOperand(Op2);
  },
  /** CPSR flags := Rn - Op2 */
  CMP(Rn: Register, Op2: OperandInput) {
    const result = registers[Rn] - parseOperand(Op2);
    flags.carry = result >= 0 ? 1 : 0;
  },
  /** Rd := (Rn AND NOT Op2) OR (Op2 AND NOT Rn) */
  EOR(Rd: Register, Rn: Register, Op2: OperandInput) {
    registers[Rd] = registers[Rn] ^ parseOperand(Op2);
  },
  /** Rd := Op2 */
  MOV(Rd: Register, Op2: OperandInput) {
    registers[Rd] = parseOperand(Op2);
  },
  /** Rd := Rm * Rs */
  MUL(Rd: Register, Rn: Register, Op2: OperandInput) {
    registers[Rd] = registers[Rn] * parseOperand(Op2);
  },
  /** Rd := Rn OR Op2 */
  ORR(Rd: Register, Rn: Register, Op2: OperandInput) {
    registers[Rd] = registers[Rn] | parseOperand(Op2);
  },
  /** Rd := Rn - Op2 - 1 + Carry */
  SBC(Rd: Register, Rn: Register, Op2: OperandInput) {
    const result = registers[Rn] - parseOperand(Op2) - 1 + flags.carry;
    registers[Rd] = result >>> 0;
    flags.carry = result >= 0 ? 1 : 0;
  },
  /** Rd := Rn - Op2 */
  SUB(Rd: Register, Rn: Register, Op2: OperandInput) {
    registers[Rd] = registers[Rn] - parseOperand(Op2);
  },
} as const;

function parseOperand(op: Register | ({} & string)) {
  if (op.startsWith("#")) return parseInt(op.slice(1));
  return registers[op as Register];
}

export function run(asm: string) {
  const lines = asm.split("\n").filter(Boolean);
  for (const line of lines) {
    const [instr, ...rest] = line.replaceAll(",", "").split(/\s+/) as [string, ...string[]];
    const instruction = is[instr.toUpperCase() as keyof typeof is];
    if (instruction) {
      // @ts-expect-error
      instruction(...rest);
    } else {
      console.error("Unknown instruction:", instr);
    }
  }
}

// Example ASM
// run(`
// MOV R0, #3
// MOV R1, #4
// ADD R2, R0, R1
// MUL R3, R0, R1
// ADD R4, R2, R3
// `);
// console.log(registers);
