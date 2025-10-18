import type { Rehashmap } from "./block.ts";
import type { Hashmap } from "./common.ts";

export interface StringHashmap {
  [K: string]: string | StringHashmap;
}

export interface BulkCircuitDef {
  __hub: Hashmap;
  __inputs: Hashmap;
  __outputs: StringHashmap;
}

export type CircuitDef<
  H extends Hashmap,
  I extends Hashmap,
  O extends StringHashmap,
> = {
  __hub: H;
  __inputs: I;
  __outputs: O;
};

export interface BulkCircuitFull {
  __hub: Rehashmap;
  __inputs: Rehashmap;
  __outputs: StringHashmap;
}

export type CircuitFull<
  H extends Rehashmap,
  I extends Hashmap,
  O extends StringHashmap,
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
  O extends StringHashmap,
  C extends CircuitDef<H, I, O>,
>(mainBlock: H, options?: CircuitOptions<I, O>): C {
  return {
    __hub: mainBlock,
    __inputs: {} as I,
    __outputs: options?.outputs || {},
  } as C;
}

export function defineInputs<Deps extends Hashmap>() {
  return {} as { __inputs: Deps };
}
