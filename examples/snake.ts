import { readFileSync } from "node:fs";
import { parseASM } from "../asm";
import { createRunner } from "..";

createRunner(parseASM(readFileSync("snake.s", "utf8"))).execute();
