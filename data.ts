export const X = new Proxy(
  // prettier-ignore
  { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, },
  {
    set: (o, k, v) => (Number(k) === 0 ? true : Reflect.set(o, k, v)),
  }
);
export let pc = 0;
export const setPC = (v: number) => (pc = v);
const memoryBuffer = new ArrayBuffer(0xffffff);
export const memView = new DataView(memoryBuffer);
export const memory = new Uint8Array(memoryBuffer);
