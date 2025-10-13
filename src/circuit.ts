import type { Rehashmap } from "./block.ts";
import type { Hashmap } from "./common.ts";

export interface StringsHashmap {
  [K: string]: string | StringsHashmap;
}

export interface BulkCircuitDef {
  __hub: Hashmap;
  __inputs: Hashmap;
  __outputs: StringsHashmap;
}

export type CircuitDef<
  H extends Hashmap,
  I extends Hashmap,
  O extends StringsHashmap,
> = {
  __hub: H;
  __inputs: I;
  __outputs: O;
};

export interface BulkCircuitFull {
  __hub: Rehashmap;
  __inputs: Rehashmap;
  __outputs: StringsHashmap;
}

export type CircuitFull<
  H extends Rehashmap,
  I extends Hashmap,
  O extends StringsHashmap,
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
  O extends StringsHashmap,
  C extends CircuitDef<H, I, O>,
>(mainBlock: H, options?: CircuitOptions<I, O>): C {
  return {
    __hub: mainBlock,
    __outputs: options?.outputs || {},
  } as C;
}

export function defineInputs<Deps extends Hashmap>() {
  return {} as { __inputs: Deps };
}
