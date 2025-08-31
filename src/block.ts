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

export function defineBlock<T extends Hashmap>(defs: T): BlockDef<T> {
  return {
    ...defs,
    $: tagBlock(),
  };
}

interface BlockTag {
  [blockSymbol]: true;
}

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

export function getWire<Defs extends BlocksMap, P extends keyof Defs>(
  localPath: Extract<P, string>,
  blockDefs: Defs,
  cache: Wcache,
) {
  if (cache.wire.has(localPath)) {
    return cache.wire.get(localPath);
  }

  const wire = function getBlockProxy(key = "") {
    if (cache.proxy.has(key)) {
      return cache.proxy.get(key);
    }

    if (key === ".") {
      if (cache.localProxy.has(localPath)) {
        return cache.localProxy.get(localPath);
      }

      const localProxy = createBlockProxy(localPath, true, blockDefs, cache);

      cache.localProxy.set(localPath, localProxy);

      return localProxy;
    }

    const blockPaths = Object.keys(blockDefs);
    const k = String(key);

    let proxy;

    if (k === "") {
      // root block resolution
      proxy = createBlockProxy("", false, blockDefs, cache);
    } else if (blockPaths.includes(k)) {
      // external block resolution, uses absolute path of the block
      proxy = createBlockProxy(k, false, blockDefs, cache);
    } else {
      throw new Error(`Unit ${k} not found from block "${String(localPath)}"`);
    }

    cache.proxy.set(k, proxy);
    return proxy;
  };

  cache.wire.set(localPath, wire);

  return wire;
}
