import { emitKeypressEvents, type Key } from "node:readline";
import { memory, memView, pc, setPC, X } from "./data";
import { is } from "./instruction-set";
import { displayStats } from "./stats";
import { stdout } from "bun";

type EncodedVar = `${number}` | `${number}:${number}`;

const xd = "11:7";
const xs1 = "19:15";
const xs2 = "24:20";

type Encoding = Record<string, EncodedVar | { bits: EncodedVar[]; shift: number }>;
export type EncodingType = keyof typeof encodings;

export const encodings = {
  R: { xd, xs1, xs2 },
  I: { imm: "31:20", xd, xs1 },
  S: {
    imm: { bits: ["31:25", "11:7"], shift: 0 },
    xs1,
    xs2,
  },
  B: {
    imm: { bits: ["31", "7", "30:25", "11:8"], shift: 1 },
    xs1,
    xs2,
  },
  U: {
    imm: { bits: ["31:12"], shift: 12 },
    xd,
  },
  J: { imm: { bits: ["31", "19:12", "20", "30:21"], shift: 1 }, xd },
} satisfies Record<string, Encoding>;

function decode(binary: string, encoded: EncodedVar) {
  return encoded.includes(":")
    ? binary.slice(...encoded.split(":").map((v, i) => 31 * (1 - i) - Number(v)))
    : binary[31 - Number(encoded)]!;
}

function parse(instrNum: number) {
  const binary = instrNum.toString(2).padStart(32, "0");
  const opcode = binary.slice(25);
  const instruction = is.find(
    (i) =>
      i.opcode === opcode &&
      (!i.funct3 || (i.funct3 && i.funct3 === decode(binary, "14:12"))) &&
      (!i.funct7 || (i.funct7 && i.funct7 === decode(binary, "31:25"))) &&
      (!i.funct12 || (i.funct12 && i.funct12 === decode(binary, "31:20")))
  );
  if (!instruction) throw `Unknown instruction: ${instrNum.toString(16).padStart(8, "0")}`;
  const vars = Object.entries(encodings[instruction.type]).map(
    ([k, v]: [string, Encoding[string]]) => {
      if (typeof v === "string") {
        return [k, decode(binary, v)] as const;
      }
      return [k, v.bits.map((b) => decode(binary, b)).join("") + "0".repeat(v.shift)] as const;
    }
  );
  return {
    instruction,
    vars: Object.fromEntries(
      vars.map(([k, v]) => [k, Object.assign(parseInt(v, 2), { length: v.length })])
    ),
  };
}

const trace: { instruction: string; code: string }[] = [];

export function run(strings: TemplateStringsArray | string | string[]) {
  const stringified = strings.toString().replaceAll(/[^a-fAF0-9]/g, "");

  for (let i = 0; i < stringified.length / 8; ++i) {
    const instr = parseInt(stringified.slice(i * 8, i * 8 + 8), 16);
    memView.setUint32(i * 4, instr, true);
  }

  emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  stdout.write("\x1b[?25l");

  process.stdin.on("data", async (data) => {
    if (data.length === 1 && data[0] === 0x03) {
      stdout.write("\x1b[?25h");
      process.exit();
    }
    const charcode = data[0];
    memView.setUint32(0x00ffff, charcode!, true);
  });

  setInterval(() => {
    try {
      const instr = memView.getUint32(pc, true);
      const currentPc = pc;
      const { instruction, vars } = parse(instr);
      trace.unshift({
        instruction: instruction.mnemonic,
        code: instr.toString(16).padStart(8, "0"),
      });

      instruction.execute(vars as never);
      X[0] = 0;

      if (pc === currentPc) setPC(pc + 4);
    } catch (e) {
      console.error(e);
      console.table(trace.slice(0, 10));
      process.exit();
    }
  });
}
