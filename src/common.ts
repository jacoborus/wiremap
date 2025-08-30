export const unitSymbol = Symbol("UnitSymbol");
export const blockSymbol = Symbol("BlockSymbol");

export type Hashmap = Record<string, unknown>;
export type Func = (...args: unknown[]) => unknown;
export type AsyncFunc = (...args: unknown[]) => Promise<unknown>;

export function isFunction(unit: unknown): unit is Func {
  return typeof unit === "function";
}

export interface Wcache {
  unit: Map<string, unknown>;
  wire: Map<string, unknown>;
  proxy: Map<string, Hashmap>;
  localProxy: Map<string, Hashmap>;
}
