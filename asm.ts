import type { Instruction, Mnemonic, Operand } from ".";

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
  }

  for (let i = 0; i < lines.length; ++i) {
    const [instr, ...args] = lines[i]!.split(/\s+/) as [string, ...string[]];
    const key = instr.toUpperCase();
    const [c1, c2, ...rest] = key.split("").toReversed();
    const condition = [c1, c2].toReversed().join("");
    const node: Instruction = {
      operands: args.map((a) => (labelMap.has(a) ? `#${labelMap.get(a) - i}` : a)) as Operand[],
      conditions: [],
      mnemonic: rest.toReversed().join("") as Mnemonic,
    };

    switch (condition) {
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
      default:
        node.mnemonic += condition;
    }
    nodes.push(node);
  }
  return nodes;
}
