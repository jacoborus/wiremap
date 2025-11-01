import type { Hashmap, Wcache } from "./common.ts";
import type { IsAsyncFactory, IsPrivateUnit } from "./unit.ts";
import type { BlockDef, BlockProxy } from "./block.ts";

import { unitSymbol } from "./common.ts";
import { isAsyncFactoryDef, isAsyncFactoryFunc } from "./unit.ts";
import {
  defineBlock,
  filterOutBlocks,
  getWire,
  isHashmap,
  mapBlocks,
} from "./block.ts";
import type { BulkCircuitDef } from "./circuit.ts";

export { defineUnit } from "./unit.ts";
export { defineBlock, tagBlock } from "./block.ts";
export { defineCircuit, defineInputs } from "./circuit.ts";

/**
 * Determines the return type of wireUp - returns Promise<Wire> if any async factories exist.
 */
type WiredUp<Defs extends BulkCircuitDef> =
  AnyItemContainsAnyAsyncFactory<Defs["__hub"]> extends true
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
 * @template C - The blocks definitions type extending Hashmap
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
 * wire("user.service")   // → Absolute block path (user.service)
 * ```
 *
 * @public
 * @since 1.0.0
 */
export interface InferWire<
  C extends BulkCircuitDef,
  N extends keyof C["__hub"] = "",
> {
  // root block resolution
  (): BlockProxy<FilterPublicUnitValues<C["__hub"][""]>>;

  // local block resolution
  (blockPath: "."): BlockProxy<FilterUnitValues<C["__hub"][N]>>;

  // absolute block resolution
  <K extends keyof C["__hub"]>(
    blockPath?: K,
  ): BlockProxy<FilterPublicUnitValues<C["__hub"][K]>>;

  // input root block resolution
  (): FilterUnitValues<C["__inputs"][""]>;

  // input absolute block resolution
  <K extends keyof C["__inputs"]>(
    blockPath?: K,
  ): FilterUnitValues<C["__inputs"][K]>;
}

/** Filters an object excluding the block tag ($), and any nested blocks */
type FilterUnitValues<T extends Hashmap> = Omit<T, "$" | ExtractNonUnitKeys<T>>;

type FilterPublicUnitValues<T extends Hashmap> = Omit<
  T,
  "$" | ExtractPrivatePaths<T> | ExtractNonUnitKeys<T>
>;

type ExtractPrivatePaths<T extends Hashmap> = {
  [K in keyof T]: true extends IsPrivateUnit<T[K]> ? K : never;
}[keyof T];

/**
 * From an object, extract the keys that contain blocks.
 * This is used to filter out nested blocks when creating unit proxies.
 */
type ExtractNonUnitKeys<T> = {
  [K in keyof T]: K extends `$${string}`
    ? K
    : T[K] extends BlockDef<Hashmap>
      ? K
      : never;
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
export function wireUp<Defs extends BulkCircuitDef>(
  defs: Defs,
  inputs?: Defs["__inputs"],
): WiredUp<Defs> {
  inputs = inputs ?? {};

  const inputDefinitions = mapBlocks(
    Object.fromEntries(
      Object.keys(inputs).map((key) => [key, defineBlock(inputs[key])]),
    ),
  );

  const rootInputBlock = filterOutBlocks(inputs);

  if (Object.keys(rootInputBlock).length) {
    inputDefinitions[""] = rootInputBlock;
  }

  const cache = createCacheObject();
  const circuit = {
    __hub: defs["__hub"],
    __inputs: inputDefinitions,
    __outputs: {},
  };

  if (hasAsyncKeys(defs["__hub"])) {
    // This will cause wireUp to return a promise that resolves
    // when all async factories are resolved
    return resolveAsyncFactories(circuit, cache).then(() => {
      return getWire("", circuit, cache);
    }) as WiredUp<Defs>;
  }

  return getWire("", circuit, cache) as WiredUp<Defs>;
}

/** Check if any of the definitions are async factories */
function hasAsyncKeys(blockDefs: Hashmap): boolean {
  return Object.keys(blockDefs).some((blockKey) => {
    const block = blockDefs[blockKey];

    if (!isHashmap(block)) return false;

    return Object.keys(block).some((key) => {
      const item = block[key];
      return isAsyncFactoryFunc(item) || isAsyncFactoryDef(item);
    });
  });
}

async function resolveAsyncFactories(
  circuit: BulkCircuitDef,
  cache: Wcache,
): Promise<void> {
  const defs = circuit.__hub;
  const blockKeys = Object.keys(defs);

  for await (const blockKey of blockKeys) {
    const block = defs[blockKey];

    if (!isHashmap(block)) continue;

    const keys = Object.keys(block);

    for await (const key of keys) {
      const item = block[key];

      if (!isAsyncFactory(item)) continue;

      const wire = cache.wire.has(blockKey)
        ? cache.wire.get(blockKey)
        : getWire(blockKey, circuit, cache);

      let resolved;

      if (isAsyncFactoryFunc(item)) {
        resolved = await item(wire);
      } else if (isAsyncFactoryDef(item)) {
        resolved = await item[unitSymbol](wire);
      }

      const finalKey = blockKey === "" ? key : `${blockKey}.${key}`;
      cache.unit.set(finalKey, resolved);
    }
  }
}

function isAsyncFactory(item: unknown): boolean {
  return isAsyncFactoryDef(item) || isAsyncFactoryFunc(item);
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
