import type { Hashmap, Wcache } from "./common.ts";
import type { IsAsyncFactory, IsPrivateUnit, UnitDef } from "./unit.ts";
import type { BlockDef, BlockProxy, BlocksMap, IsBlock } from "./block.ts";

import { unitSymbol } from "./common.ts";
import { isAsyncFactoryDef, isAsyncFactoryFunc } from "./unit.ts";
import { defineBlock, getWire, mapBlocks, mapInputBlocks } from "./block.ts";
import type { BulkCircuitFull, CircuitDef, Rehash } from "./circuit.ts";

export { defineUnit } from "./unit.ts";
export { defineBlock, tagBlock } from "./block.ts";
export {
  defineCircuit,
  defineCircuit as circuit,
  defineInputs,
} from "./circuit.ts";

/**
 * Determines the return type of wireUp - returns Promise<Wire> if any async factories exist.
 */
type WiredUp<Defs extends Hashmap> =
  AnyItemContainsAnyAsyncFactory<Defs> extends true
    ? Promise<InferWire<Defs, "">>
    : InferWire<Defs, "">;

/**
 * Recursively checks if any item in the definitions contains an async factory.
 * This determines whether wireUp should return a Promise or not.
 */
type AnyItemContainsAnyAsyncFactory<R extends Hashmap> = true extends {
  [K in keyof R]: R[K] extends Hashmap ? ContainsAsyncFactory<R[K]> : false;
}[keyof R]
  ? true
  : false;

type InferDef<T extends Hashmap> =
  T extends CircuitDef<infer C, Hashmap, Rehash> ? C : T;

/**
 * Checks if a specific object contains any async factory functions.
 */
type ContainsAsyncFactory<T extends Hashmap> = true extends {
  [K in keyof T]: IsAsyncFactory<T[K]>;
}[keyof T]
  ? true
  : false;

/**
 * The main wire function interface that provides different access patterns for
 * blocks and units with full type safety.
 *
 * This interface ensures type safety when navigating between blocks using the wire function.
 * It provides overloaded signatures for different block resolution patterns, enabling
 * both relative and absolute path navigation through your application's dependency graph.
 *
 * @template D - The blocks definitions type extending Hashmap
 * @template N - The current block path context as a string
 *
 * @example Basic wire usage in a service
 * ```typescript
 * import type { InferWire } from "wiremap";
 * import type { Blocks } from "../app.ts";
 *
 * type Wire = InferWire<Blocks, "user.service">;
 *
 * export function addUser(this: Wire, name: string, email: string) {
 *   // Local block access (includes private units)
 *   const getUserByEmail = this(".").getUserByEmail;
 *
 *   // Parent block access
 *   const repo = this("user").repo;
 *
 *   // Cross-module absolute access
 *   const logger = this("shared.logger");
 *
 *   // Root block access
 *   const config = this().config;
 * }
 * ```
 *
 * @example Different access patterns
 * ```typescript
 * // From context "post.service":
 * wire()                 // → Root block proxy
 * wire(".")              // → Local block proxy (post.service, includes private units)
 * wire("..")             // → Parent block proxy (post)
 * wire(".repository")    // → Child block proxy (post.service.repository)
 * wire("user.service")   // → Absolute block path (user.service)
 * ```
 *
 * @public
 * @since 1.0.0
 */
export interface InferWire<D extends Hashmap, N extends string> {
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
 * This is the main bootstrap function that creates the dependency injection container
 * and returns a wire function for accessing units across your application. It handles
 * both synchronous and asynchronous factory initialization automatically.
 *
 * @template Defs - The definitions object type
 * @param defs - Object containing unit definitions and imported blocks. Each block should export a `$` tag via `tagBlock`.
 * @returns Promise<Wire> if any async factory units exist, otherwise Wire for synchronous resolution.
 *
 * @example Basic application setup
 * ```typescript
 * // app.ts
 * import * as userMod from "./user/userMod.ts";
 * import * as postMod from "./post/postMod.ts";
 *
 * const appSchema = {
 *   user: userMod,
 *   post: postMod,
 *   config: { port: 3000, dbUrl: "localhost:5432" }
 * };
 *
 * const app = await wireUp(appSchema);
 *
 * // Access root units
 * console.log(app().config.port); // 3000
 *
 * // Access nested block units
 * const userId = app("user.service").addUser("John", "john@example.com");
 * app("post.service").addPost("Hello World", "Content", userId);
 * ```
 *
 * @example Synchronous vs Asynchronous
 * ```typescript
 * // Synchronous - no async factories
 * const syncApp = wireUp({ config: { port: 3000 } });
 * syncApp().config.port; // Available immediately
 *
 * // Asynchronous - contains async factories
 * const asyncApp = await wireUp({
 *   database: defineUnit(async () => await connectToDb(), { is: 'asyncFactory' })
 * });
 * asyncApp().database.query("SELECT * FROM users");
 * ```
 *
 * @public
 * @since 1.0.0
 */
export function wireUp<Defs extends CircuitDef<Hashmap, Hashmap, Rehash>>(
  defs: Defs,
): WiredUp<InferCircuitBlocks<InferDef<Defs>>> {
  const finalDefinitions = defineBlock(defs.__hub);

  const blockDefinitions = mapBlocks(finalDefinitions);
  blockDefinitions[""] = finalDefinitions;

  const inputDefinitions = mapInputBlocks(defs.__inputs || {});
  inputDefinitions[""] = defs.__inputs;

  const cache = createCacheObject();
  const circuit = {
    __hub: blockDefinitions,
    __inputs: inputDefinitions,
    __outputs: {},
  };

  if (hasAsyncKeys(blockDefinitions)) {
    // This will cause wireUp to return a promise that resolves
    // when all async factories are resolved
    return resolveAsyncFactories(circuit, cache).then(() => {
      return getWire("", circuit, cache);
    }) as WiredUp<InferCircuitBlocks<InferDef<Defs>>>;
  }

  return getWire("", circuit, cache) as WiredUp<
    InferCircuitBlocks<InferDef<Defs>>
  >;
}

/**
 * Infers the structure of all blocks and units from a definitions object.
 *
 * This utility type analyzes your definitions object and generates a mapped type
 * containing all block paths and their corresponding unit structures. It's essential
 * for getting proper TypeScript support when working with wire functions across
 * your application.
 *
 * @template R - The definitions object type extending Hashmap
 *
 * @example Basic usage
 * ```typescript
 * const appSchema = {
 *   user: userMod,
 *   post: postMod,
 *   config: { port: 3000 }
 * };
 *
 * export type Blocks = InferCircuitBlocks<typeof appSchema>;
 * // Result: Blocks contains paths like "", "user", "user.service", "post", "post.service"
 * ```
 *
 * @example Using with wire types
 * ```typescript
 * import type { InferCircuitBlocks, InferWire } from "wiremap";
 *
 * const defs = { user: userMod, post: postMod };
 * export type Blocks = InferCircuitBlocks<typeof defs>;
 *
 * // Now use in your services
 * type Wire = InferWire<Blocks, "user.service">;
 * ```
 *
 * @public
 * @since 1.0.0
 */
export type InferCircuitBlocks<R extends Hashmap> =
  R extends CircuitDef<infer C, Hashmap, Rehash>
    ? {
        [K in BlockPaths<C>]: K extends "" ? C : PathValue<C, K>;
      }
    : {
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
type BlockPaths<T extends Hashmap, P extends string = ""> =
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

/**
 * Determines whether an object contains items that are blocks.
 * Used to identify if we need to recursively process nested blocks.
 */
type HasBlocks<T extends Hashmap> = true extends {
  [K in keyof T]: T[K] extends BlockDef<Hashmap> ? true : false;
}[keyof T]
  ? true
  : false;

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
  circuit: BulkCircuitFull,
  cache: Wcache,
): Promise<void> {
  const defs = circuit.__hub;
  const blockKeys = Object.keys(defs);

  for await (const blockKey of blockKeys) {
    const block = defs[blockKey];
    const keys = Object.keys(block);

    for await (const key of keys) {
      const item = block[key];

      if (isAsyncFactoryFunc(item)) {
        const wire = cache.wire.has(blockKey)
          ? cache.wire.get(blockKey)
          : getWire(blockKey, circuit, cache);
        const resolved = await item(wire);

        const finalKey = blockKey === "" ? key : `${blockKey}.${key}`;
        cache.unit.set(finalKey, resolved);
      } else if (isAsyncFactoryDef(item)) {
        const wire = cache.wire.has(blockKey)
          ? cache.wire.get(blockKey)
          : getWire(blockKey, circuit, cache);
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
    input: new Map(),
    wire: new Map(),
    proxy: new Map(),
    localProxy: new Map(),
  };
}
