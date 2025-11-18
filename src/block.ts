import type { InferWire } from "./wiremap.ts";
import type { BulkCircuitDef } from "./circuit.ts";
import type { Hashmap, Context } from "./common.ts";
import type { InferUnitValue, IsPrivateUnit } from "./unit.ts";
import { isCircuit } from "./circuit.ts";
import {
  isBoundDef,
  isBoundFunc,
  isFactoryDef,
  isFactoryFunc,
  isPrivate,
  isUnitDef,
} from "./unit.ts";

/** A block is a Hashmap with a block tag in '$'. */
export type BlockDef<T extends Hashmap> = T & {
  $: BlockTag;
};

/** Map of block names to their block definitions. */
export type Rehashmap = Record<string, Hashmap>;

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
  __isBlock: unknown;
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
  return { __isBlock: true };
}

export function isBlock(item: unknown): item is BlockDef<Hashmap> {
  return (
    item !== null &&
    typeof item === "object" &&
    "$" in item &&
    typeof item["$"] === "object" &&
    item["$"] !== null &&
    "__isBlock" in item["$"] &&
    item["$"]["__isBlock"] === true
  );
}

/** Extracts the paths of the units of a block, excluding sub-blocks. */
export function getBlockUnitKeys<B extends Hashmap, Local extends boolean>(
  blockDef: B,
  local: Local,
) {
  return Object.keys(blockDef).filter((key) => {
    if (key.startsWith("$")) return false;
    const unit = blockDef[key];
    if (isBlock(unit)) return false;
    return local ? true : !isPrivate(unit);
  });
}

type ExtractPublicUnitPaths<T extends Hashmap> = {
  [K in keyof T]: true extends IsPrivateUnit<T[K]> ? never : K;
}[keyof T];

export type InferBlockValue<B extends Hashmap> = {
  [K in ExtractPublicUnitPaths<B>]: InferUnitValue<B[K]>;
};

/**
 * Block proxy type that provides access to units within a block.
 * Local proxies include private units, while public proxies exclude them.
 */
export type BlockProxy<B extends Hashmap> = {
  [K in keyof B]: InferUnitValue<B[K]>;
};

function createBlockProxy<
  C extends BulkCircuitDef,
  K extends keyof C[P],
  Local extends boolean,
  P extends "__hub" | "__inputs",
>(
  blockPath: K & string,
  ctx: Context<C>,
  part: P,
  local: Local,
): BlockProxy<C[P][K]> {
  let circuitPath = "";

  ctx.circuit.__circuitPaths.forEach((path) => {
    if (blockPath.startsWith(path)) {
      if (path.length > circuitPath.length) {
        circuitPath = path;
      }
    }
  });

  const blockDef = ctx.circuit[part][blockPath];

  const unitKeys = getBlockUnitKeys(blockDef, local);

  return new Proxy(
    {}, // used as a cache for the block
    {
      get: <K extends string>(cachedblock: Hashmap, prop: K) => {
        if (prop in cachedblock) {
          return cachedblock[prop];
        }

        if (unitKeys.includes(prop)) {
          const finalKey = blockPath === "" ? prop : `${blockPath}.${prop}`;

          if (ctx.unit.has(finalKey)) {
            const unit = ctx.unit.get(finalKey);
            cachedblock[prop] = unit;
            return unit;
          }

          const def = blockDef[prop];
          const wire = ctx.wire.has(blockPath)
            ? ctx.wire.get(blockPath)
            : getBlockWire(blockPath, ctx);

          const unit = isFactoryFunc(def)
            ? def(wire)
            : isBoundFunc(def)
              ? def.bind(wire)
              : isUnitDef(def)
                ? isFactoryDef(def)
                  ? def.__unit(wire)
                  : isBoundDef(def)
                    ? def.__unit.bind(wire)
                    : def.__unit
                : def;

          cachedblock[prop] = unit;
          ctx.unit.set(finalKey, unit);
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
  ) as BlockProxy<C[P][K]>;
}

export function getBlockWire<
  C extends BulkCircuitDef,
  P extends keyof C["__hub"],
  I extends InferWire<C, P>,
>(blockPath: P & string, ctx: Context<C>): I {
  if (ctx.wire.has(blockPath)) {
    return ctx.wire.get(blockPath) as I;
  }

  let circuitPath = "";

  ctx.circuit.__circuitPaths.forEach((path) => {
    if (blockPath.startsWith(path)) {
      if (path.length > circuitPath.length) {
        circuitPath = path;
      }
    }
  });

  const wire = function getBlockProxy(key = "") {
    // Local block resolution, includes private units
    if (key === ".") {
      if (ctx.localProxy.has(blockPath)) {
        return ctx.localProxy.get(blockPath);
      }

      const localProxy = createBlockProxy(blockPath, ctx, "__hub", true);
      ctx.localProxy.set(blockPath, localProxy);

      return localProxy;
    }

    const proxyPath = !circuitPath ? key : `${circuitPath}.${key}`;

    if (ctx.proxy.has(proxyPath)) {
      return ctx.proxy.get(proxyPath);
    }

    // hub resolution, uses absolute path of the block
    if (Object.keys(ctx.circuit.__hub).includes(proxyPath)) {
      const proxy = createBlockProxy(proxyPath, ctx, "__hub", false);
      ctx.proxy.set(proxyPath, proxy);
      return proxy;
    }

    // input resolution
    if (circuitPath) {
      if (Object.keys(ctx.circuit.__hub).includes(key)) {
        const proxy = createBlockProxy(key, ctx, "__hub", false);
        ctx.proxy.set(key, proxy);
        return proxy;
      }
    } else {
      if (Object.keys(ctx.circuit.__inputs).includes(key)) {
        const proxy = createBlockProxy(key, ctx, "__inputs", false);
        ctx.proxy.set(key, proxy);
        return proxy;
      }
    }

    throw new Error(`Block "${key}" not found from block "${blockPath}"`);
  };

  ctx.wire.set(blockPath, wire);

  return wire as I;
}

export function mapBlocks<L extends Hashmap>(
  blocks: L,
  prefix?: string,
): Rehashmap {
  const mapped: Rehashmap = {};

  Object.keys(blocks).forEach((key) => {
    if (key === "$") return;

    // this is the key of the block given the path
    const block = blocks[key];

    if (!isHashmap(block)) return;

    const isDollarBlock = key.startsWith("$");
    const itemIsCircuit = isCircuit(block);
    const itemIsBlock = isDollarBlock || isBlock(block);

    if (key.startsWith("$")) {
      key = key.slice(1);
    } else if (!itemIsBlock && !itemIsCircuit) {
      return;
    }

    const finalKey = prefix ? `${prefix}.${key}` : key;

    if (itemIsCircuit) {
      const finalBlock = block["__hub"];

      Object.keys(finalBlock).forEach((prop) => {
        const finalProp = prop === "" ? finalKey : `${finalKey}.${prop}`;
        mapped[finalProp] = finalBlock[prop];
      });

      return;
    }

    const units = extractUnits(block);
    // only blocks with units are wireable
    if (Object.keys(units).length) {
      mapped[finalKey] = units;
    }

    // loop through sub-blocks
    if (hasBlocks(block)) {
      const subBlocks = mapBlocks(block, finalKey);
      Object.assign(mapped, subBlocks);
    }
  });

  return mapped;
}

/**
 * Filter out the blocks from an object of units and blocks
 */
export function extractUnits(block: Hashmap): Hashmap {
  return Object.fromEntries(
    Object.keys(block)
      .map((key) => [key, block[key]])
      .filter(([key]) => typeof key === "string" && !key.startsWith("$"))
      .filter(([_, item]) => !isBlock(item)),
  );
}

export function isHashmap(item: unknown): item is Hashmap {
  if (typeof item !== "object" || item === null) return false;
  return Object.keys(item).every((key) => {
    return typeof key === "string";
  });
}

export function hasBlocks(item: Hashmap): boolean {
  if (item === null || typeof item !== "object") return false;
  return Object.keys(item).some(
    (key) =>
      (key !== "$" && key.startsWith("$") && typeof item[key] === "object") ||
      isBlock(item[key]),
  );
}
