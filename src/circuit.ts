import { Hashmap } from "./common.ts";

export interface Rehash {
  [K: string]: string | Rehash;
}

export interface BulkCircuit {
  __circuit: Hashmap;
  __inputs: Hashmap;
  __outputs: Rehash;
}

export type Circuit<C extends Hashmap, I extends Hashmap, O extends Rehash> = {
  __circuit: C;
  __inputs: I;
  __outputs: O;
};

interface CircuitOptions<I extends Hashmap, O extends Hashmap> {
  inputs?: { __inputs: I };
  outputs?: O;
}

export function defineCircuit<
  const T extends Hashmap,
  I extends Hashmap,
  O extends Rehash,
>(mainBlock: T, options?: CircuitOptions<I, O>): Circuit<T, I, O> {
  return {
    __circuit: mainBlock,
    __outputs: options?.outputs || {},
  } as Circuit<T, I, O>;
}

export function defineInputs<Deps extends Hashmap>() {
  return {} as { __inputs: Deps };
}
