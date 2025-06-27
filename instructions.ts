import {
  flags,
  readMemory,
  registers,
  writeMemory,
  writeRegister,
  type Operand,
  type Register,
} from ".";

export type Mnemonic = keyof typeof is;

function setCPSRFlag(flag: "N" | "Z" | "C" | "V", value: number) {
  const shift = { N: 31, Z: 30, C: 29, V: 28 }[flag];
  if (value) {
    flags.cpsr |= 1 << shift;
  } else {
    flags.cpsr &= ~(1 << shift);
  }
}

function setCPSR(Rn: Register, Op2: Operand, value: number) {
  value |= 0;
  setCPSRFlag("N", (value >>> 31) & 1);
  setCPSRFlag("Z", value === 0 ? 1 : 0);
  setCPSRFlag("C", registers[Rn] >>> 0 >= parseOperand(Op2) >>> 0 ? 1 : 0);
  setCPSRFlag(
    "V",
    (((registers[Rn] ^ parseOperand(Op2)) & (registers[Rn] ^ value)) >>> 31) as 0 | 1
  );
}

function parseOperand(op: Operand) {
  if (op.startsWith("#")) return parseInt(op.slice(1));
  return registers[op as Register];
}

/** ARM instruction set */
export const is = {
  /** Rd := Rn + Op2 + Carry */
  ADC(Rd: Register, Rn: Register, Op2: Operand) {
    const result = registers[Rn] + parseOperand(Op2) + flags.carry;
    writeRegister(Rd, result);
    flags.carry = result > 0xffffffff ? 1 : 0;
  },
  /** Rd := Rn + Op2 */
  ADD(Rd: Register, Rn: Register, Op2: Operand) {
    writeRegister(Rd, registers[Rn] + parseOperand(Op2));
  },
  /** Rd := Rn AND Op2 */
  AND(Rd: Register, Rn: Register, Op2: Operand) {
    writeRegister(Rd, registers[Rn] & parseOperand(Op2));
  },
  /** R15 := address */
  B(address: Operand) {
    writeRegister("R15", registers.R15 + parseOperand(address) - 1);
  },
  /** Rd := Rn AND NOT Op2 */
  BIC(Rd: Register, Rn: Register, Op2: Operand) {
    writeRegister(Rd, registers[Rn] & ~parseOperand(Op2));
  },
  /** R14 := R15, R15 := address */
  BL(address: Operand) {
    registers.R14 = registers.R15 + 1;
    writeRegister("R15", registers.R15 + parseOperand(address) - 1);
  },
  /** R15 := Rn, T bit := Rn[0] */
  BX(Rn: Register) {
    writeRegister("R15", registers[Rn] - 1);
    flags.tbit = registers[Rn] & 1;
  },
  /** CPSR flags := Rn + Op2 */
  CMN(Rn: Register, Op2: Operand) {
    setCPSR(Rn, Op2, registers[Rn] + parseOperand(Op2));
  },
  /** CPSR flags := Rn - Op2 */
  CMP(Rn: Register, Op2: Operand) {
    setCPSR(Rn, Op2, registers[Rn] - parseOperand(Op2));
  },
  /** Rd := (Rn AND NOT Op2) OR (Op2 AND NOT Rn) */
  EOR(Rd: Register, Rn: Register, Op2: Operand) {
    writeRegister(Rd, registers[Rn] ^ parseOperand(Op2));
  },
  /** Stack manipulation (Pop)  */
  LDM(regs: Register[], mode: string = "IA") {
    for (const register of regs) {
      if (mode === "IB" || mode === "DB") {
        registers.R13 += mode.startsWith("I") ? 4 : -4;
      }
      is.LDR(register, "R13");
      if (mode === "IA" || mode === "DA") {
        registers.R13 += mode.startsWith("I") ? 4 : -4;
      }
    }
  },
  /** Rd := [address]  */
  LDR(Rd: Register, address: Operand, mode?: "B" | "H") {
    writeRegister(Rd, readMemory(parseOperand(address), mode));
  },
  /** Rd := (Rm * Rs) + Rn */
  MLA(Rd: Register, Rm: Register, Rs: Register, Rn: Register) {
    writeRegister(Rd, registers[Rm] * registers[Rs] + registers[Rn]);
  },
  /** Rd := Op2 */
  MOV(Rd: Register, Op2: Operand) {
    writeRegister(Rd, parseOperand(Op2));
  },
  /** Rd := Rn * Rm */
  MUL(Rd: Register, Rn: Register, Rm: Register) {
    writeRegister(Rd, registers[Rn] * registers[Rm]);
  },
  /** Rd := 0xFFFFFFFF EOR Op2 */
  MVN(Rd: Register, Op2: Operand) {
    writeRegister(Rd, 0xffffffff ^ parseOperand(Op2));
  },
  /** Rd := Rn OR Op2 */
  ORR(Rd: Register, Rn: Register, Op2: Operand) {
    writeRegister(Rd, registers[Rn] | parseOperand(Op2));
  },
  /** Rd := Op2 - Rn */
  RSB(Rd: Register, Rn: Register, Op2: Operand) {
    writeRegister(Rd, parseOperand(Op2) - registers[Rn]);
  },
  /** Rd := Op2 - Rn - 1 + Carry */
  RSC(Rd: Register, Rn: Register, Op2: Operand) {
    const result = parseOperand(Op2) - registers[Rn] - 1 + flags.carry;
    writeRegister(Rd, result);
    flags.carry = result >= 0 ? 1 : 0;
  },
  /** Rd := Rn - Op2 - 1 + Carry */
  SBC(Rd: Register, Rn: Register, Op2: Operand) {
    const result = registers[Rn] - parseOperand(Op2) - 1 + flags.carry;
    writeRegister(Rd, result);
    flags.carry = result >= 0 ? 1 : 0;
  },
  /** Stack manipulation (Push)  */
  STM(regs: Register[], mode: string = "IA") {
    for (const register of regs) {
      if (mode === "IB" || mode === "DB") {
        registers.R13 += mode.startsWith("I") ? 4 : -4;
      }
      is.STR(register, "R13");
      if (mode === "IA" || mode === "DA") {
        registers.R13 += mode.startsWith("I") ? 4 : -4;
      }
    }
  },
  /** [address] := Rd  */
  STR(Rd: Register, address: Operand, mode?: "B" | "H") {
    writeMemory(parseOperand(address), registers[Rd], mode);
  },
  /** Rd := Rn - Op2 */
  SUB(Rd: Register, Rn: Register, Op2: Operand) {
    writeRegister(Rd, registers[Rn] - parseOperand(Op2));
  },
  /** OS call */
  SWI(code: Operand) {
    throw new Error(`SWI interrupt: ${parseOperand(code)}`);
  },
  /** Rd := [Rn], [Rn] := Rm */
  SWP(Rd: Register, Rm: Register, Rn: Register, mode?: "B") {
    writeRegister(Rd, readMemory(registers[Rn], mode));
    writeMemory(registers[Rn], registers[Rm], mode);
  },
  /** CPSR flags := Rn EOR Op2 */
  TEQ(Rn: Register, Op2: Operand) {
    setCPSR(Rn, Op2, registers[Rn] ^ parseOperand(Op2));
  },
  /** CPSR flags := Rn AND Op2 */
  TST(Rn: Register, Op2: Operand) {
    setCPSR(Rn, Op2, registers[Rn] & parseOperand(Op2));
  },
} as const;
