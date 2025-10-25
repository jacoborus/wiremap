import { BlockDef, defineBlock, mapBlocks, type Rehashmap } from "./block.ts";
import type { Hashmap } from "./common.ts";
import { BlockPaths, PathValue } from "./wiremap.ts";

export interface StringHashmap {
  [K: string]: string | StringHashmap;
}

export interface BulkCircuitDef {
  __hub: Rehashmap;
  __inputs: Hashmap;
  __outputs: StringHashmap;
}

export type CircuitDef<
  H extends Rehashmap,
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

type MappedHub<H extends Hashmap> = {
  [K in BlockPaths<H>]: PathValue<H, K & string>;
};

type EnsureBlock<D extends Hashmap> = D & { "": BlockDef<D> };

export function defineCircuit<
  const H extends Hashmap,
  I extends Hashmap,
  O extends StringHashmap,
  E extends EnsureBlock<H>,
  C extends CircuitDef<MappedHub<E>, I, O>,
>(mainBlock: H, options?: CircuitOptions<I, O>): C {
  const target = { ...mainBlock, "": defineBlock(mainBlock) };

  return {
    __hub: mapBlocks(target),
    __inputs: {} as I,
    __outputs: options?.outputs || {},
  } as C;
}

export function defineInputs<Deps extends Hashmap>() {
  return {} as { __inputs: Deps };
}
