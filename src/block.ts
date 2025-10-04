import {
  unitSymbol,
  blockSymbol,
  type Hashmap,
  type Wcache,
} from "./common.ts";
import type { InferUnitValue } from "./unit.ts";
import {
  isPrivate,
  isUnitDef,
  isFactoryDef,
  isFactoryFunc,
  isBoundFunc,
  isBoundDef,
} from "./unit.ts";

/** A block is a Hashmap with a block tag in '$'. */
export type BlockDef<T extends Hashmap> = T & {
  $: BlockTag;
};

/** Map of block names to their block definitions. */
export type BlocksMap = Record<string, BlockDef<Hashmap>>;

/**
 * Creates a block definition by adding the required block tag to a definitions object.
 *
 * This function is useful when you want to define multiple blocks in the same file
 * or when you need explicit control over block structure. For single-block files,
 * the more common pattern is to use `tagBlock()` with `export const $ = tagBlock()`.
 *
 * @template T - The definitions object type extending Hashmap
 * @param defs - Object containing unit definitions and nested blocks
 * @returns Block definition with added `$` tag marker
 *
 * @example Multiple blocks in one file
 * ```typescript
 * import { defineBlock } from "wiremap";
 *
 * export const userService = defineBlock({
 *   getUser: userGetterFactory,
 *   createUser: userCreatorFactory,
 *   config: { maxUsers: 1000 }
 * });
 *
 * export const userController = defineBlock({
 *   handleGetUser: getUserHandler,
 *   handleCreateUser: createUserHandler
 * });
 * ```
 *
 * @see {@link tagBlock} For the more common file-based block pattern
 *
 * @public
 * @since 1.0.0
 */
export function defineBlock<T extends Hashmap>(defs: T): BlockDef<T> {
  if ("$" in defs) return defs as BlockDef<T>;
  return {
    ...defs,
    $: tagBlock(),
  } as BlockDef<T>;
}

interface BlockTag {
  [blockSymbol]: true;
}

/**
 * Creates a block tag marker used to identify objects as blocks in the dependency injection system.
 *
 * This function creates the special `$` marker that `wireUp` uses to identify which objects are blocks.
 *
 * @returns Block tag object with internal symbol
 *
 * @example File-based block pattern (most common)
 * ```typescript
 * // userService.ts
 * import { tagBlock } from "wiremap";
 *
 * export const $ = tagBlock();  // Mark entire file as block
 * export const getUser = userGetterFactory;
 * export const createUser = userCreatorFactory;
 * export const config = { maxUsers: 1000 };
 * ```
 *
 * @example Usage in application setup
 * ```typescript
 * // app.ts
 * import * as userMod from "./user/userMod.ts";
 * import * as postMod from "./post/postMod.ts";
 *
 * const appSchema = {
 *   user: userMod,    // userMod.$ identifies this as a block
 *   post: postMod,    // postMod.$ identifies this as a block
 *   config: { port: 3000 }
 * };
 *
 * const app = await wireUp(appSchema);
 * ```
 *
 * @example Nested block structure
 * ```typescript
 * // userMod.ts - Parent block
 * export const $ = tagBlock();
 * export const service = userService;  // userService.ts also has tagBlock()
 * export const repository = userRepo;
 * ```
 *
 * @see {@link defineBlock} For explicit block definition with multiple blocks per file
 *
 * @public
 * @since 1.0.0
 */
export function tagBlock(): BlockTag {
  return { [blockSymbol]: true };
}

export type IsBlock<T> = T extends { $: { [blockSymbol]: true } }
  ? true
  : false;

export function itemIsBlock(item: unknown): item is BlockDef<Hashmap> {
  return (
    item !== null &&
    typeof item === "object" &&
    "$" in item &&
    typeof item["$"] === "object" &&
    item["$"] !== null &&
    blockSymbol in item["$"] &&
    item["$"][blockSymbol] === true
  );
}

/** Extracts the paths of the units of a block, excluding sub-blocks. */
export function getBlockUnitKeys<B extends Hashmap, Local extends boolean>(
  blockDef: B,
  local: Local,
) {
  return Object.keys(blockDef).filter((key) => {
    if (key === "$") return false;
    const unit = blockDef[key];
    if (itemIsBlock(unit) || unit === unitSymbol) return false;
    return local ? true : !isPrivate(unit);
  });
}

/**
 * Block proxy type that provides access to units within a block.
 * Local proxies include private units, while public proxies exclude them.
 */
export type BlockProxy<B extends Hashmap> = {
  [K in keyof B]: InferUnitValue<B[K]>;
};

function createBlockProxy<B extends BlocksMap, Local extends boolean>(
  blockPath: string,
  local: Local,
  blockDefs: B,
  cache: Wcache,
): BlockProxy<B> {
  const blockDef = blockDefs[blockPath];
  const unitKeys = getBlockUnitKeys(blockDef, local);

  return new Proxy(
    {}, // used as a cache for the block
    {
      get: <K extends string>(cachedblock: Hashmap, prop: K) => {
        if (prop in cachedblock) {
          return cachedblock[prop];
        }

        if (prop === "$") {
          throw new Error(`Block '${blockPath}' has no unit named '${prop}'`);
        }

        if (unitKeys.includes(prop)) {
          const finalKey = blockPath === "" ? prop : `${blockPath}.${prop}`;

          if (cache.unit.has(finalKey)) {
            const unit = cache.unit.get(finalKey);
            cachedblock[prop] = unit;
            return unit;
          }

          const def = blockDef[prop];
          const wire = cache.wire.has(blockPath)
            ? cache.wire.get(blockPath)
            : getWire(blockPath, blockDefs, cache);

          const unit = isFactoryFunc(def)
            ? def(wire)
            : isBoundFunc(def)
              ? def.bind(wire)
              : isUnitDef(def)
                ? isFactoryDef(def)
                  ? def[unitSymbol](wire)
                  : isBoundDef(def)
                    ? def[unitSymbol].bind(wire)
                    : def[unitSymbol]
                : def;

          cachedblock[prop] = unit;
          cache.unit.set(finalKey, unit);
          return unit;
        }

        throw new Error(`Block '${blockPath}' has no unit named '${prop}'`);
      },

      ownKeys() {
        return unitKeys;
      },

      getOwnPropertyDescriptor() {
        return {
          writable: false,
          enumerable: true,
          // this is required to allow the proxy to be enumerable
          configurable: true,
        };
      },
    },
  ) as BlockProxy<B>;
}

export function extractParentPath(localPath: string): string | null {
  const parts = localPath.split(".");
  const hasParent = parts.length > 1;
  if (!hasParent) return null;
  const parentParts = parts.slice(0, parts.length - 1);
  return parentParts.join(".");
}

export function getWire<Defs extends BlocksMap, P extends keyof Defs>(
  localPath: P & string,
  blockDefs: Defs,
  cache: Wcache,
) {
  if (cache.wire.has(localPath)) {
    return cache.wire.get(localPath);
  }

  const blockPaths = Object.keys(blockDefs);
  const parentPath = extractParentPath(localPath);

  const wire = function getBlockProxy(key = "") {
    if (cache.proxy.has(key)) {
      return cache.proxy.get(key);
    }

    // Local block resolution, includes private units
    if (key === ".") {
      if (cache.localProxy.has(localPath)) {
        return cache.localProxy.get(localPath);
      }

      const localProxy = createBlockProxy(localPath, true, blockDefs, cache);
      cache.localProxy.set(localPath, localProxy);

      return localProxy;
    }

    // Parent block resolution
    if (key === "..") {
      if (cache.localProxy.has(parentPath)) {
        return cache.localProxy.get(parentPath);
      }

      if (parentPath === null) {
        throw new Error('Block ".." does not exist');
      }

      const parentProxy = createBlockProxy(parentPath, false, blockDefs, cache);
      cache.localProxy.set(parentPath, parentProxy);

      return parentProxy;
    }

    // Child block resolution
    if (key.startsWith(".")) {
      const blockPath = localPath + key;
      const proxy = createBlockProxy(blockPath, false, blockDefs, cache);
      cache.proxy.set(blockPath, proxy);
      return proxy;
    }

    // Root block resolution
    if (key === "") {
      const proxy = createBlockProxy("", false, blockDefs, cache);
      cache.proxy.set(key, proxy);
      return proxy;
    }

    // External block resolution, uses absolute path of the block
    if (blockPaths.includes(key)) {
      const proxy = createBlockProxy(key, false, blockDefs, cache);
      cache.proxy.set(key, proxy);
      return proxy;
    }

    throw new Error(`Unit ${key} not found from block "${localPath}"`);
  };

  cache.wire.set(localPath, wire);

  return wire;
}

export function mapBlocks<L extends Hashmap>(
  blocks: L,
  prefix?: string,
): BlocksMap {
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

function hasUnits(item: BlockDef<Hashmap>): boolean {
  return Object.keys(item).some((key) => {
    if (key === "$") return false;
    return !itemIsBlock(item[key]);
  });
}

function hasBlocks(item: Hashmap): boolean {
  if (item === null || typeof item !== "object") return false;
  return Object.keys(item).some((key) => itemIsBlock(item[key]));
}
