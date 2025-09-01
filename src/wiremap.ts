import type { Hashmap, Wcache } from "./common.ts";
import type { IsAsyncFactory, IsPrivateUnit, UnitDef } from "./unit.ts";
import type { BlockDef, BlocksMap, IsBlock, BlockProxy } from "./block.ts";

import { unitSymbol, isFunction } from "./common.ts";
import { isAsyncFactoryDef, isAsyncFactoryFunc } from "./unit.ts";
import { itemIsBlock, getWire, tagBlock } from "./block.ts";

export { defineBlock, tagBlock } from "./block.ts";
export { defineUnit } from "./unit.ts";

/**
 * Determines the return type of wireUp - returns Promise<Wire> if any async factories exist.
 */
type WiredUp<Defs extends Hashmap> =
  AnyItemContainsAnyAsyncFactory<Defs> extends true
    ? Promise<Wire<Defs, "">>
    : Wire<Defs, "">;

/**
 * Recursively checks if any item in the definitions contains an async factory.
 * This determines whether wireUp should return a Promise or not.
 */
type AnyItemContainsAnyAsyncFactory<R extends Hashmap> = true extends {
  [K in keyof R]: R[K] extends Hashmap ? ContainsAsyncFactory<R[K]> : false;
}[keyof R]
  ? true
  : false;

/**
 * Checks if a specific object contains any async factory functions.
 */
type ContainsAsyncFactory<T extends Hashmap> = true extends {
  [K in keyof T]: IsAsyncFactory<T[K]>;
}[keyof T]
  ? true
  : false;

/**
 * The main wire function interface that provides different access patterns:
 * - () returns root block proxy
 * - (".") returns local block proxy (same block context, includes private units)
 * - (".child.path") returns the proxy of a descendent block
 * - ("path.of.the.block") returns specific block proxy
 */
export interface Wire<D extends Hashmap, N extends string> {
  // root block resolution
  (): BlockProxy<FilterUnitValues<D[""]>>;
  // local block resolution
  (blockPath: "."): BlockProxy<FilterUnitValues<D[N]>>;
  // child block resolution
  <K extends ExtractChildPaths<N, D>>(
    blockPath: K,
  ): BlockProxy<FilterPublicUnitValues<D[`${N}${K}`]>>;
  // parent block resolution
  <K extends N extends NoDots<N> ? never : "..">(
    blockPath: K,
  ): BlockProxy<FilterUnitValues<D[Join<ExtractParentPath<N, []>, ".">]>>;
  // absolute block resolution
  <K extends keyof D>(blockPath: K): BlockProxy<FilterPublicUnitValues<D[K]>>;
}

/**
 * Find the keys of a hashmap that match the beginning of another string,
 * then extract the resulting substrings and prefix them with a dot '.'
 */
type ExtractChildPaths<P extends string, H extends Hashmap> = {
  [K in keyof H]: K extends `${P}.${infer C}` ? `.${C}` : never;
}[keyof H];

/** Extract keys with no dots in them */
type NoDots<T extends string> = T extends `${string}.${string}` ? never : T;

type ExtractParentPath<
  N extends string,
  P extends string[],
> = N extends `${infer Parent}.${infer Child}`
  ? ExtractParentPath<Child, [...P, Parent]>
  : P;

/** Array.join but with types */
type Join<T extends string[], D extends string> = T extends []
  ? ""
  : T extends [infer F extends string]
    ? F
    : T extends [infer F extends string, ...infer R extends string[]]
      ? `${F}${D}${Join<R, D>}`
      : string;

/** Filters an object excluding the block tag ($), and any nested blocks */
type FilterUnitValues<T> = T extends Hashmap
  ? Omit<T, "$" | ExtractBlockKeys<T>>
  : never;

type FilterPublicUnitValues<T> = T extends Hashmap
  ? Omit<T, "$" | ExtractPrivatePaths<T> | ExtractBlockKeys<T>>
  : never;

type ExtractPrivatePaths<T> = T extends Hashmap //
  ? { [K in keyof T]: true extends IsPrivateUnit<T[K]> ? K : never }[keyof T]
  : never;

/**
 * From an object, extract the keys that contain blocks.
 * This is used to filter out nested blocks when creating unit proxies.
 */
type ExtractBlockKeys<T> = {
  [K in keyof T]: T[K] extends BlockDef<Hashmap> ? K : never;
}[keyof T];

/**
 * Wires up a set of unit definitions and blocks for dependency injection.
 *
 * To create a block, export a `$` variable from your module using `tagBlock("blockName")`.
 * All exported properties (except `$`) become units of the block.
 *
 * @param defs - Object containing unit definitions and imported blocks. Each block should export a `$` tag via `tagBlock`.
 * @returns Promise<Wire> if any async factory units exist, otherwise Wire for synchronous resolution.
 * @example
 * ```ts
 * // In app.ts:
 * import * as userMod from "./userMod.ts";
 * const defs = {
 *   config: { port: 3000 },
 *   userService: userMod
 * };
 * const app = wireUp(defs);
 *
 * // Access root units
 * console.log(app().config.port); // 3000
 *
 * // Access block units
 * app("user.service").addUser("name", "email");
 * ```
 */
export function wireUp<Defs extends Hashmap>(
  defs: Defs,
): WiredUp<InferBlocks<Defs>> {
  const finalDefinitions: BlockDef<Defs> =
    "$" in defs
      ? (defs as BlockDef<Defs>)
      : (Object.assign(defs, { $: tagBlock() }) as BlockDef<Defs>);

  const blockDefinitions = mapBlocks(finalDefinitions);
  blockDefinitions[""] = finalDefinitions;

  const cache = createCacheObject();

  if (hasAsyncKeys(blockDefinitions)) {
    // This will cause wireUp to return a promise that resolves
    // when all async factories are resolved
    return resolveAsyncFactories(blockDefinitions, cache).then(() => {
      return getWire("", blockDefinitions, cache);
    }) as WiredUp<InferBlocks<Defs>>;
  }

  return getWire("", blockDefinitions, cache) as WiredUp<InferBlocks<Defs>>;
}

/**
 * Infers the structure of all blocks and units from a definitions object.
 *
 * Use this type to get the correct typings for your wired app.
 *
 * @example
 * const defs = { user: userMod, config: { port: 3000 } };
 * export type Defs = InferBlocks<typeof defs>;
 */
export type InferBlocks<R extends Hashmap> = {
  [K in BlockPaths<R>]: K extends "" ? R : PathValue<R, K>;
};

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
    : never
  : P extends keyof T
    ? T[P] extends BlockDef<Hashmap>
      ? T[P]
      : never
    : never;

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
export type BlockPaths<T extends Hashmap, P extends string = ""> =
  | ""
  | {
      [K in keyof T]: T[K] extends UnitDef
        ? never
        : T[K] extends Hashmap
          ?
              | (HasUnits<T[K]> extends true
                  ? P extends ""
                    ? `${Extract<K, string>}`
                    : `${P}.${Extract<K, string>}`
                  : never)
              | (T[K] extends BlockDef<T[K]>
                  ? HasBlocks<T[K]> extends true
                    ? BlockPaths<
                        T[K],
                        P extends ""
                          ? Extract<K, string>
                          : `${P}.${Extract<K, string>}`
                      >
                    : never
                  : never)
          : never;
    }[keyof T];

function mapBlocks<L extends Hashmap>(blocks: L, prefix?: string): BlocksMap {
  const mapped: BlocksMap = {};

  Object.keys(blocks).forEach((key) => {
    const block = blocks[key];

    if (itemIsBlock(block)) {
      // this is the key of the block given the path
      const finalKey = prefix ? `${prefix}.${key}` : key;

      // only blocks with units are wireable
      if (hasUnits(block)) {
        mapped[finalKey] = block;
      }

      // loop through sub-blocks
      if (hasBlocks(block)) {
        const subBlocks = mapBlocks(block, finalKey);
        Object.assign(mapped, subBlocks);
      }
    }
  });

  return mapped;
}

/**
 * Determines whether an object contains items that are neither blocks nor blockTags.
 * Used to identify blocks that actually contain any unit
 */
type HasUnits<T extends Hashmap> = true extends {
  [K in keyof T]: K extends "$"
    ? false
    : IsBlock<T[K]> extends true
      ? false
      : true;
}[keyof T]
  ? true
  : false;

function hasUnits(item: BlockDef<Hashmap>): boolean {
  return Object.keys(item).some((key) => {
    if (key === "$") return false;
    return !itemIsBlock(item[key]);
  });
}

/**
 * Determines whether an object contains items that are blocks.
 * Used to identify if we need to recursively process nested blocks.
 */
type HasBlocks<T extends Hashmap> = true extends {
  [K in keyof T]: T[K] extends BlockDef<Hashmap> ? true : false;
}[keyof T]
  ? true
  : false;

function hasBlocks(item: Hashmap): boolean {
  if (item === null || typeof item !== "object") return false;
  return Object.keys(item).some((key) => itemIsBlock(item[key]));
}

/** Check if any of the definitions are async factories */
function hasAsyncKeys(blockDefs: BlocksMap): boolean {
  return Object.keys(blockDefs).some((blockKey) => {
    const block = blockDefs[blockKey];

    return Object.keys(block).some((key) => {
      const item = block[key];
      return isAsyncFactoryFunc(item) || isAsyncFactoryDef(item);
    });
  });
}

async function resolveAsyncFactories(
  defs: BlocksMap,
  cache: Wcache,
): Promise<void> {
  const blockKeys = Object.keys(defs);

  for await (const blockKey of blockKeys) {
    const block = defs[blockKey];
    const keys = Object.keys(block);

    for await (const key of keys) {
      const item = block[key];

      if (isFunction(item) && isAsyncFactoryFunc(item)) {
        const wire = cache.wire.has(blockKey)
          ? cache.wire.get(blockKey)
          : getWire(blockKey, defs, cache);
        const resolved = await item(wire);

        const finalKey = blockKey === "" ? key : `${blockKey}.${key}`;
        cache.unit.set(finalKey, resolved);
      } else if (isAsyncFactoryDef(item)) {
        const wire = cache.wire.has(blockKey)
          ? cache.wire.get(blockKey)
          : getWire(blockKey, defs, cache);
        const resolved = await item[unitSymbol](wire);
        const finalKey = blockKey === "" ? key : `${blockKey}.${key}`;
        cache.unit.set(finalKey, resolved);
      }
    }
  }
}

function createCacheObject(): Wcache {
  return {
    unit: new Map(),
    wire: new Map(),
    proxy: new Map(),
    localProxy: new Map(),
  };
}
