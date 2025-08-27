export const unitSymbol = Symbol("UnitSymbol");
export const blockSymbol = Symbol("BlockSymbol");

export type Hashmap = Record<string, unknown>;
export type Func = (...args: unknown[]) => unknown;

export function isFunction(unit: unknown): unit is Func {
  return typeof unit === "function";
}

export function isPromise(value: unknown): value is Promise<unknown> {
  return (
    value instanceof Promise ||
    (typeof value === "object" &&
      value !== null &&
      "then" in value &&
      typeof value.then == "function")
  );
}

/**
 * Cache structure for storing resolved units and proxies to avoid recomputation.
 */
export interface Wcache {
  unit: Map<string, unknown>;
  wire: Map<string, unknown>;
  proxy: Map<string, unknown>;
  localProxy: Map<string, unknown>;
}
