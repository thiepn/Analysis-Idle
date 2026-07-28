export interface RngState {
  algorithm: "xoshiro128ss";
  words: [number, number, number, number];
  draws: number;
}

const rotateLeft = (value: number, shift: number): number =>
  ((value << shift) | (value >>> (32 - shift))) >>> 0;

function mix(value: number): number {
  let result = value >>> 0;
  result = Math.imul(result ^ (result >>> 16), 0x21f0aaad);
  result = Math.imul(result ^ (result >>> 15), 0x735a2d97);
  return (result ^ (result >>> 15)) >>> 0;
}

export function createRng(seed: number): RngState {
  if (!Number.isInteger(seed) || !Number.isFinite(seed))
    throw new TypeError("RNG seed must be a finite integer");
  const words: [number, number, number, number] = [
    mix(seed),
    mix(seed + 0x9e3779b9),
    mix(seed + 0x3c6ef372),
    mix(seed + 0xdaa66d2b),
  ];
  if (words.every((word) => word === 0)) words[0] = 1;
  return { algorithm: "xoshiro128ss", words, draws: 0 };
}

export function validateRngState(state: RngState): void {
  if (state.algorithm !== "xoshiro128ss")
    throw new TypeError("Unsupported RNG algorithm");
  if (!Number.isSafeInteger(state.draws) || state.draws < 0)
    throw new TypeError("Invalid RNG draw count");
  if (
    state.words.length !== 4 ||
    state.words.some(
      (word) => !Number.isInteger(word) || word < 0 || word > 0xffffffff,
    )
  )
    throw new TypeError("Invalid RNG words");
  if (state.words.every((word) => word === 0))
    throw new TypeError("All-zero RNG state is invalid");
}

export function drawUint32(state: RngState): {
  value: number;
  state: RngState;
} {
  validateRngState(state);
  const [s0, s1, s2, s3] = state.words;
  const result = Math.imul(rotateLeft(Math.imul(s1, 5) >>> 0, 7), 9) >>> 0;
  const temporary = (s1 << 9) >>> 0;
  const n2 = (s2 ^ s0) >>> 0;
  const n3 = (s3 ^ s1) >>> 0;
  const n1 = (s1 ^ n2) >>> 0;
  const n0 = (s0 ^ n3) >>> 0;
  const words: [number, number, number, number] = [
    n0,
    n1,
    (n2 ^ temporary) >>> 0,
    rotateLeft(n3, 11),
  ];
  return {
    value: result,
    state: { algorithm: "xoshiro128ss", words, draws: state.draws + 1 },
  };
}

export function drawUnitInterval(state: RngState): {
  value: number;
  state: RngState;
} {
  const draw = drawUint32(state);
  return { value: draw.value / 0x100000000, state: draw.state };
}

export function cloneRng(state: RngState): RngState {
  validateRngState(state);
  return {
    algorithm: state.algorithm,
    words: [...state.words],
    draws: state.draws,
  };
}
