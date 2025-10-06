import { Hashmap } from "./common.ts";

export interface Rehash {
  [K: string]: string | Rehash;
}

export interface BulkCircuit {
  __hub: Hashmap;
  __inputs: Hashmap;
  __outputs: Rehash;
}

export type CircuitDef<
  H extends Hashmap,
  I extends Hashmap,
  O extends Rehash,
> = {
  __hub: H;
  __inputs: I;
  __outputs: O;
};

interface CircuitOptions<I extends Hashmap, O extends Hashmap> {
  inputs?: { __inputs: I };
  outputs?: O;
}

export function defineCircuit<
  const H extends Hashmap,
  I extends Hashmap,
  O extends Rehash,
>(mainBlock: H, options?: CircuitOptions<I, O>): CircuitDef<H, I, O> {
  return {
    __hub: mainBlock,
    __outputs: options?.outputs || {},
  } as CircuitDef<H, I, O>;
}

export function defineInputs<Deps extends Hashmap>() {
  return {} as { __inputs: Deps };
}
