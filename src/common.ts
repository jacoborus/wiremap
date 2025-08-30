export const unitSymbol = Symbol("UnitSymbol");
export const blockSymbol = Symbol("BlockSymbol");

export type Hashmap = Record<string, unknown>;
export type Func = (...args: unknown[]) => unknown;
export type AsyncFunc = (...args: unknown[]) => Promise<unknown>;
export type IsFn<T> = T extends (...args: infer _A) => unknown ? true : false;
export type IsAsyncFn<T> = T extends (...args: infer _A) => Promise<unknown>
  ? true
  : false;

export function isFunction(unit: unknown): unit is Func {
  return typeof unit === "function";
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

// function factoryFn(w: () => { keyName: 5 }) {
//   const theKey = w().keyName;
//   return new Promise((resolve) => {
//     resolve(theKey);
//   });
// }
// factoryFn.isFactory = true as const;
// factoryFn.isAsync = true as const;
//
// type X = AsyncFunc extends typeof factoryFn ? true : false;
// const x = factoryFn;
//
// export type Func = (...args: unknown[]) => unknown;
// const f = (a: 1) => a;
// type Y = typeof f extends Func ? true : false;
// type YY = Func extends typeof f ? true : false;
//
// type Z = typeof f extends CallableFunction ? true : false;
//
// type FuncNever = (...args: unknown[]) => never;
// type ZZ = FuncNever extends typeof f ? true : false;
