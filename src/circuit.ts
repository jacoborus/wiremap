import { BlockDef, defineBlock, mapBlocks, type Rehashmap } from "./block.ts";
import type { Hashmap } from "./common.ts";
import { blockSymbol } from "./common.ts";
import { UnitDef } from "./unit.ts";
import { InferWire } from "./wiremap.ts";

export interface StringHashmap {
  [K: string]: string | StringHashmap;
}

export interface BulkCircuitDef {
  __hub: Rehashmap;
  __inputs: Rehashmap;
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

interface CircuitOptions<I extends Hashmap, O extends Hashmap> {
  inputs?: I;
  outputs?: O;
}

export type MappedHub<H extends Hashmap> = {
  [K in BlockPaths<H>]: PathValue<H, K & string>;
};

/**
 * Extracts the dot composed paths of the blocks that contain units.
 * This generates all valid block paths that can be accessed via the wire function.
 *
 * @example
 * BlockPaths<{
 *   a: Block<{someUnit: string}>,
 *   b: {
 *     c: Block<{otherUnit: number}>,
 *     d: Block<{thirdUnit: boolean}>,
 *     other: 4
 *   },
 * }>
 * // Returns: "" | "a" | "b.c" | "b.d"
 */
type BlockPaths<T extends Hashmap, P extends string = ""> = {
  [K in keyof T]: T[K] extends UnitDef
    ? never
    : K extends `$${infer Key}`
      ? T[K] extends Hashmap
        ?
            | (HasUnits<T[K]> extends true
                ? P extends ""
                  ? Key
                  : `${P}.${Key}`
                : never)
            | (HasBlocks<T[K]> extends true
                ? BlockPaths<T[K], P extends "" ? Key : `${P}.${Key}`>
                : never)
        : never
      : T[K] extends BlockDef<Hashmap>
        ?
            | (HasUnits<T[K]> extends true
                ? P extends ""
                  ? `${Extract<K, string>}`
                  : `${P}.${Extract<K, string>}`
                : never)
            | (HasBlocks<T[K]> extends true
                ? BlockPaths<
                    T[K],
                    P extends ""
                      ? Extract<K, string>
                      : `${P}.${Extract<K, string>}`
                  >
                : never)
        : never;
}[keyof T];

/**
 * Determines whether an object contains items that are neither blocks nor blockTags.
 * Used to identify blocks that actually contain any unit
 */
type HasUnits<T extends Hashmap> = true extends {
  [K in keyof T]: K extends "$"
    ? false
    : K extends `$${string}`
      ? false
      : IsBlock<T[K]> extends true
        ? false
        : true;
}[keyof T]
  ? true
  : false;

/**
 * Determines whether an object contains items that are blocks.
 * Used to identify if we need to recursively process nested blocks.
 */
type HasBlocks<T extends Hashmap> = true extends {
  [K in keyof T]: T[K] extends BlockDef<Hashmap>
    ? true
    : K extends `$${string}`
      ? T[K] extends Hashmap
        ? true
        : false
      : false;
}[keyof T]
  ? true
  : false;

/**
 * Access type by a dot notated path.
 * Recursively traverses an object type following a dot-separated path.
 *
 * @example
 * PathValue<{ user: { service: { getUser: () => User } } }, "user.service">
 * // Returns: { getUser: () => User }
 */
type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : `$${K}` extends keyof T
      ? PathValue<T[`$${K}`], Rest>
      : never
  : P extends keyof T
    ? T[P] extends BlockDef<Hashmap>
      ? T[P]
      : never
    : `$${P}` extends keyof T
      ? T[`$${P}`] extends Hashmap
        ? T[`$${P}`]
        : never
      : never;

type EnsureBlock<D extends Hashmap> = D & { "": BlockDef<D> };

type IsBlock<T> = T extends { $: { [blockSymbol]: true } } ? true : false;

export function defineCircuit<
  const H extends Hashmap,
  I extends Hashmap,
  O extends StringHashmap,
  E extends EnsureBlock<H>,
  C extends CircuitDef<MappedHub<E>, MappedHub<I>, O>,
>(mainBlock: H, options?: CircuitOptions<I, O>): C {
  const target = { ...mainBlock, "": defineBlock(mainBlock) };

  return {
    __hub: mapBlocks(target),
    __inputs: {} as MappedHub<I>,
    __outputs: options?.outputs || {},
  } as C;
}

export function defineInputs<Deps extends Hashmap>() {
  return {} as Deps;
}

export type InferCircuit<C extends BulkCircuitDef> =
  C["__outputs"] extends Rehashmap ? C["__outputs"] : InferWire<C>;
