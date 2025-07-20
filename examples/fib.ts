import { run } from "..";
import { displayStats } from "../stats";
import { memory, X } from "../data";
import { compile } from "./compile";

run(await compile("fib.cpp"));

setInterval(() => {
  displayStats(memory, X);
}, 50);
