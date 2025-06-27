import type { Instruction, Operand } from ".";
import { is } from "./instructions";

export function parseASM(asm: string): Instruction[] {
  const lines = asm
    .replaceAll(/,|;.+/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const nodes: Instruction[] = [];
  const labelMap = new Map();

  for (let i = 0; i < lines.length; ++i) {
    const line = lines[i]!;
    if (!/:$/.test(line)) continue;
    labelMap.set(line.slice(0, -1), i);
    lines.splice(i, 1);
    --i;
  }

  for (let i = 0; i < lines.length; ++i) {
    function parseArg(arg: Operand): Operand | Operand[] {
      switch (arg as string) {
        case "PC":
          return "R15";
        case "LR":
          return "R14";
        case "SP":
          return "R13";
      }
      if (labelMap.has(arg)) return `#${labelMap.get(arg) - i}`;
      if (/{.+}/.test(arg)) {
        if (arg.includes("-")) {
          const [startReg = "R0", endReg = "R0"] = arg.slice(1, -1).split("-");
          const startNum = parseInt(startReg.slice(1), 10);
          const endNum = parseInt(endReg.slice(1), 10);
          return Array.from({ length: endNum - startNum }, (_, i) => `R${i + startNum}` as Operand);
        } else {
          return arg.slice(1, -1).split(/,\s+/) as Operand[];
        }
      }
      return arg;
    }
    const [instr, ...args] = lines[i]!.split(/\s+/) as [string, ...Operand[]];
    const key = instr.toUpperCase();
    const node: Instruction = {
      operands: args.map(parseArg),
      conditions: [],
      mnemonic: "" as Instruction["mnemonic"],
    };
    for (const instruction of Object.keys(is)) {
      if (!key.startsWith(instruction)) continue;
      node.mnemonic = key.slice(0, instruction.length) as Instruction["mnemonic"];
      const str = key.slice(instruction.length);
      const conditions = (() => {
        if (str.length % 2 === 0) {
          return str.match(/.{2}/g) ?? [];
        } else {
          return [str[0], ...(str.slice(1).match(/.{2}/g) ?? [])];
        }
      })();

      for (const condition of conditions) {
        switch (condition) {
          case "IA":
          case "IB":
          case "DA":
          case "DB":
          case "H":
          case "B":
            node.mode = condition;
            break;
          case "EQ":
            node.conditions = [{ v: "Z", eq: 1 }];
            break;
          case "NE":
            node.conditions = [{ v: "Z", eq: 0 }];
            break;
          case "CS":
            node.conditions = [{ v: "C", eq: 1 }];
            break;
          case "CC":
            node.conditions = [{ v: "C", eq: 0 }];
            break;
          case "MI":
            node.conditions = [{ v: "N", eq: 1 }];
            break;
          case "PL":
            node.conditions = [{ v: "N", eq: 0 }];
            break;
          case "VS":
            node.conditions = [{ v: "V", eq: 1 }];
            break;
          case "VC":
            node.conditions = [{ v: "V", eq: 0 }];
            break;
          case "HI":
            node.conditions = [
              { v: "C", eq: 1 },
              { v: "Z", eq: 0 },
            ];
            break;
          case "LS":
            node.conditions = [
              [
                { v: "C", eq: 0 },
                { v: "Z", eq: 1 },
              ],
            ];
            break;
          case "GE":
            node.conditions = [{ v: "N", eq: "V" }];
            break;
          case "LT":
            node.conditions = [{ v: "N", ne: "V" }];
            break;
          case "GT":
            node.conditions = [
              { v: "Z", eq: 0 },
              { v: "N", eq: "V" },
            ];
            break;
          case "LE":
            node.conditions = [
              [
                { v: "Z", eq: 1 },
                { v: "N", ne: "V" },
              ],
            ];
            break;
          case "AL":
            break;
        }
      }
    }
    nodes.push(node);
  }
  return nodes;
}
