import { memView, pc, setPC, X, memory } from "./data";
import type { encodings, EncodingType } from ".";
import codes from "./codes";

export interface Instruction<T extends EncodingType> {
  execute: (args: {
    [K in keyof (typeof encodings)[T]]: K extends `x${string}`
      ? keyof typeof X
      : number & { length: number };
  }) => void;
  mnemonic: string;
  type: T;
  opcode: string;
  funct3?: string;
  funct7?: string;
  funct12?: string;
}

const i = <T extends EncodingType>(v: Instruction<T>) => v;

function jump(target_hw_addr: number) {
  setPC(target_hw_addr);
}

function jumpHalfword(target_hw_addr: number) {
  if ((target_hw_addr & 0x1) !== 0x0) throw "Expected halfword-aligned address in jumpHalfword";
  setPC(target_hw_addr);
}

const signed = Object.assign(
  (v: number & { length: number }) => (v << (32 - v.length)) >> (32 - v.length),
  { X: (x: keyof typeof X) => (X[x] << 0) >> 0 }
);

const wrapMem = (a: number) => ((a % memory.length) + memory.length) % memory.length;

export const is = [
  i({ ...codes.lui, execute: ({ imm, xd }) => (X[xd] = signed(imm)) }),
  i({ ...codes.auipc, execute: ({ imm, xd }) => (X[xd] = pc + signed(imm)) }),
  i({
    ...codes.jal,
    execute: ({ imm, xd }) => {
      const returnAddr = pc + 4;
      jumpHalfword(pc + signed(imm));
      X[xd] = returnAddr;
    },
  }),
  i({
    ...codes.jalr,
    execute: ({ imm, xd, xs1 }) => {
      const returnAddr = pc + 4;
      jump((X[xs1] + signed(imm)) & ~0xffffffff);
      X[xd] = returnAddr;
    },
  }),
  i({
    ...codes.beq,
    execute({ imm, xs1, xs2 }) {
      if (X[xs1] === X[xs2]) {
        jumpHalfword(pc + signed(imm));
      }
    },
  }),
  i({
    ...codes.bne,
    execute({ imm, xs1, xs2 }) {
      if (X[xs1] !== X[xs2]) {
        jumpHalfword(pc + signed(imm));
      }
    },
  }),
  i({
    ...codes.blt,
    execute({ imm, xs1, xs2 }) {
      if (signed.X(xs1) < signed.X(xs2)) {
        jumpHalfword(pc + signed(imm));
      }
    },
  }),
  i({
    ...codes.bge,
    execute({ imm, xs1, xs2 }) {
      if (signed.X(xs1) >= signed.X(xs2)) {
        jumpHalfword(pc + signed(imm));
      }
    },
  }),
  i({
    ...codes.bltu,
    execute({ imm, xs1, xs2 }) {
      if (X[xs1] < X[xs2]) {
        jumpHalfword(pc + signed(imm));
      }
    },
  }),
  i({
    ...codes.bgeu,
    execute({ imm, xs1, xs2 }) {
      if (X[xs1] >= X[xs2]) {
        jumpHalfword(pc + signed(imm));
      }
    },
  }),
  i({
    ...codes.lb,
    execute: ({ imm, xd, xs1 }) => (X[xd] = memView.getInt8(wrapMem(X[xs1] + signed(imm)))),
  }),
  i({
    ...codes.lh,
    execute: ({ imm, xd, xs1 }) => (X[xd] = memView.getInt16(wrapMem(X[xs1] + signed(imm)), true)),
  }),
  i({
    ...codes.lw,
    execute: ({ imm, xd, xs1 }) => (X[xd] = memView.getInt32(wrapMem(X[xs1] + signed(imm)), true)),
  }),
  i({
    ...codes.lbu,
    execute: ({ imm, xd, xs1 }) => (X[xd] = memView.getUint8(wrapMem(X[xs1] + signed(imm)))),
  }),
  i({
    ...codes.lhu,
    execute: ({ imm, xd, xs1 }) => (X[xd] = memView.getUint16(wrapMem(X[xs1] + signed(imm)), true)),
  }),
  i({
    ...codes.sb,
    execute: ({ imm, xs1, xs2 }) => memView.setInt8(wrapMem(X[xs1] + signed(imm)), X[xs2] & 0xff),
  }),
  i({
    ...codes.sh,
    execute: ({ imm, xs1, xs2 }) =>
      memView.setInt16(wrapMem(X[xs1] + signed(imm)), X[xs2] & 0xffff, true),
  }),
  i({
    ...codes.sw,
    execute: ({ imm, xs1, xs2 }) => memView.setInt32(wrapMem(X[xs1] + signed(imm)), X[xs2], true),
  }),
  i({ ...codes.addi, execute: ({ imm, xd, xs1 }) => (X[xd] = X[xs1] + signed(imm)) }),
  i({
    ...codes.slti,
    execute: ({ imm, xd, xs1 }) => (X[xd] = signed.X(xs1) < signed(imm) ? 1 : 0),
  }),
  i({ ...codes.sltiu, execute: ({ imm, xd, xs1 }) => (X[xd] = X[xs1] < signed(imm) ? 1 : 0) }),
  i({ ...codes.xori, execute: ({ imm, xd, xs1 }) => (X[xd] = X[xs1] ^ signed(imm)) }),
  i({ ...codes.ori, execute: ({ imm, xd, xs1 }) => (X[xd] = X[xs1] | signed(imm)) }),
  i({ ...codes.andi, execute: ({ imm, xd, xs1 }) => (X[xd] = X[xs1] & signed(imm)) }),
  i({ ...codes.slli, execute: ({ imm, xd, xs1 }) => (X[xd] = X[xs1] << (imm & 0xf)) }),
  i({ ...codes.srli, execute: ({ imm, xd, xs1 }) => (X[xd] = X[xs1] >> (imm & 0xf)) }),
  i({ ...codes.srai, execute: ({ imm, xd, xs1 }) => (X[xd] = X[xs1] >>> (imm & 0xf)) }),
  i({ ...codes.add, execute: ({ xd, xs1, xs2 }) => (X[xd] = X[xs1] + X[xs2]) }),
  i({ ...codes.sub, execute: ({ xd, xs1, xs2 }) => (X[xd] = X[xs1] - X[xs2]) }),
  i({ ...codes.sll, execute: ({ xd, xs1, xs2 }) => (X[xd] = X[xs1] << (X[xs2] & 0xf)) }),
  i({
    ...codes.slt,
    execute: ({ xd, xs1, xs2 }) => (X[xd] = signed.X(xs1) < signed.X(xs2) ? 1 : 0),
  }),
  i({ ...codes.sltu, execute: ({ xd, xs1, xs2 }) => (X[xd] = X[xs1] < X[xs2] ? 1 : 0) }),
  i({ ...codes.xor, execute: ({ xd, xs1, xs2 }) => (X[xd] = X[xs1] ^ X[xs2]) }),
  i({ ...codes.srl, execute: ({ xd, xs1, xs2 }) => (X[xd] = X[xs1] >> (X[xs2] & 0xf)) }),
  i({ ...codes.sra, execute: ({ xd, xs1, xs2 }) => (X[xd] = X[xs1] >>> (X[xs2] & 0xf)) }),
  i({ ...codes.or, execute: ({ xd, xs1, xs2 }) => (X[xd] = X[xs1] | X[xs2]) }),
  i({
    ...codes.ecall,
    execute: () => {
      throw "Ecall"; // TODO
    },
  }),
  i({
    ...codes.ebreak,
    execute: () => {
      throw "Ebreak"; // TODO
    },
  }),
] as const;
