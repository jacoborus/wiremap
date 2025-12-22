import type { BlockDef, Rehashmap } from "./block.ts";
import type { AdaptersMap, Hashmap } from "./common.ts";
import type { UnitDef } from "./unit.ts";

import type { BulkPlugin } from "./plug.ts";
import { isPlugin } from "./plug.ts";
import { defineBlock, isHashmap, mapBlocks, isBlock } from "./block.ts";

// export interface StringHashmap {
//   [K: string]: string | StringHashmap;
// }

export interface BulkCircuitDef extends Hashmap {
  __hub: Rehashmap;
  __inputs: Rehashmap;
  __pluginAdapters: AdaptersMap;
  // __outputs: StringHashmap;
}

export type CircuitDef<
  H extends Rehashmap,
  I extends Rehashmap,
  // O extends StringHashmap,
> = {
  __isCircuit: true;
  __hub: H;
  __inputs: I;
  __pluginAdapters: AdaptersMap;
  // __outputs: O;
};

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
  [K in keyof T]: K extends string
    ? T[K] extends UnitDef
      ? never
      : K extends `$${infer Key}`
        ? T[K] extends Hashmap
          ?
              | (HasUnits<T[K]> extends true
                  ? P extends ""
                    ? Key
                    : `${P}.${Key}`
                  : never)
              | BlockPaths<T[K], P extends "" ? Key : `${P}.${Key}`>
          : never
        : T[K] extends BlockDef<Hashmap>
          ?
              | (HasUnits<T[K]> extends true
                  ? P extends ""
                    ? `${K}`
                    : `${P}.${K}`
                  : never)
              | BlockPaths<T[K], P extends "" ? K : `${P}.${K}`>
          : T[K] extends BulkCircuitDef
            ? never
            : T[K] extends BulkPlugin
              ? P extends ""
                ? `${K}.${string & keyof T[K]["__circuit"]["__hub"]}`
                : `${P}.${K}.${string & keyof T[K]["__circuit"]["__hub"]}`
              : never
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
 * Access type by a dot notated path.
 * Recursively traverses an object type following a dot-separated path.
 *
 * @example
 * PathValue<{ user: { service: { getUser: () => User } } }, "user.service">
 * // Returns: { getUser: () => User }
 */
type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? T[K] extends BulkCircuitDef
      ? never
      : T[K] extends BulkPlugin
        ? PathValue<T[K]["__circuit"]["__hub"], Rest>
        : PathValue<T[K], Rest>
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

type IsBlock<T> = T extends { $: { __isBlock: unknown } } ? true : false;

export function defineCircuit<
  const H extends Hashmap,
  I extends InputsFromHub<H>,
  // O extends StringHashmap,
  E extends EnsureBlock<H>,
  // C extends CircuitDef<MappedHub<E>, MappedHub<I>, O>,
  C extends CircuitDef<MappedHub<E>, MappedHub<I>>,
>(mainBlock: H, inputs: I): C {
  const target = { ...mainBlock, "": defineBlock(mainBlock) };

  const adapters = extractPluginAdapters(mainBlock);

  return {
    __isCircuit: true,
    __hub: mapBlocks(target),
    __inputs: inputs as MappedHub<I>,
    __pluginAdapters: adapters,
    // __outputs: options?.outputs || {},
  } as C;
}

export function defineInputs<Deps extends Hashmap>(): Deps {
  return {} as Deps;
}

// export type InferCircuit<C extends BulkCircuitDef> =
//   C["__outputs"] extends Rehashmap ? C["__outputs"] : InferWire<C>;

export type ExtractPlugins<H extends Hashmap> = {
  [K in keyof H]: H[K] extends BulkPlugin ? H[K] : never;
}[keyof H];

export type InputsFromHub<H extends Hashmap> = BlocksDiff<
  MappedHub<H>,
  UnionToIntersection<ExtractPlugins<H>["__inputs"]>
>;

/**
 * Transforms `A | B | C` into `A & B & C`
 */
type UnionToIntersection<U> = (
  U extends unknown ? (x: U) => void : never
) extends (x: infer I) => void
  ? I
  : never;

export type KeysDiff<A, B> = {
  [K in keyof B]: K extends keyof A ? (A[K] extends B[K] ? never : K) : K;
}[keyof B];

export type GetFlatDiff<A, B> = {
  [K in KeysDiff<A, B>]: K extends keyof B ? B[K] : never;
};

export type BlocksDiff<A, B> = {
  [K in KeysDiff<A, B>]: K extends keyof A ? GetFlatDiff<A[K], B[K]> : B[K];
};

export function isCircuit(target: unknown): target is BulkCircuitDef {
  if (typeof target !== "object" || target === null) return false;

  if (!("__isCircuit" in target)) return false;
  if (target["__isCircuit"] !== true) return false;

  if (!("__hub" in target)) return false;
  if (!isHashmap(target["__hub"])) return false;

  if (!("__inputs" in target)) return false;
  if (!isHashmap(target["__inputs"])) return false;

  return true;
}

export function extractPluginAdapters<B extends Hashmap>(
  block: B,
  adapters = new Map<string, Record<string, string | Record<string, string>>>(),
  parentKey = "",
) {
  Object.keys(block).forEach((key) => {
    if (key === "$") return;

    const item = block[key];
    if (!isHashmap(item)) return;

    const isPrefixed = key.startsWith("$");
    const finalKey = isPrefixed ? key.slice(1) : key;

    if (isPlugin(item)) {
      if (parentKey) {
        adapters.set(`${parentKey}.${finalKey}`, item.__adapter);
      } else {
        adapters.set(finalKey, item.__adapter);
      }

      item.__circuit.__pluginAdapters.forEach((adapter, path) => {
        if (parentKey) {
          adapters.set(`${parentKey}.${finalKey}.${path}`, adapter);
        } else {
          adapters.set(`${finalKey}.${path}`, adapter);
        }
      });

      return;
    }

    if (isPrefixed || isBlock(item)) {
      extractPluginAdapters(item, adapters, finalKey);
    }
  });

  return adapters;
}
