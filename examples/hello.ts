import { readFileSync } from "node:fs";
import { parseASM } from "../asm";
import { createRunner } from "..";

createRunner(parseASM(readFileSync("hello.asm", "utf8"))).execute();
