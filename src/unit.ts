import { unitSymbol, isFunction, type Func, type AsyncFunc } from "./common.ts";

interface PrivateUnitFunc extends Func {
  isPrivate: true;
}

export type IsPrivateUnit<U> = U extends PrivateUnitFunc
  ? true
  : U extends UnitDef
    ? U["opts"]["isPrivate"] extends true
      ? true
      : false
    : false;

export function isPrivate(unit: unknown): unit is PrivateUnitFunc {
  if (unit === null) return false;
  if (isFunction(unit)) {
    return "isPrivate" in unit && unit.isPrivate === true;
  }
  if (isUnitDef(unit)) {
    return !!unit.opts.isPrivate;
  }
  return false;
}

type BoundFunc<T extends Func> = T & {
  isPrivate?: boolean;
  isBound: true;
  isFactory?: false;
  isAsync?: false;
};

type FactoryFunc<F extends Func> = F & {
  isPrivate?: boolean;
  isBound?: false;
  isFactory: true;
  isAsync?: false;
};

type AsyncFactoryFunc<F extends AsyncFunc> = F & {
  isPrivate?: boolean;
  isBound?: false;
  isFactory: true;
  isAsync: true;
};

export function isBoundFunc(unit: unknown): unit is BoundFunc<Func> {
  if (!isFunction(unit)) {
    return false;
  }
  return "isBound" in unit && unit.isBound === true;
}

export function isFactoryFunc(unit: unknown): unit is FactoryFunc<Func> {
  if (!isFunction(unit)) {
    return false;
  }
  return "isFactory" in unit && unit.isFactory === true;
}

export function isAsyncFactoryFunc(
  unit: unknown,
): unit is AsyncFactoryFunc<AsyncFunc> {
  if (!isFunction(unit)) {
    return false;
  }
  return (
    "isFactory" in unit &&
    unit.isFactory === true &&
    "isAsync" in unit &&
    unit.isAsync === true
  );
}

type IsAsyncFn<T> = T extends (...args: infer _A) => Promise<unknown>
  ? true
  : false;

/**
 * Type that checks if a factory is async (returns a Promise or is marked as async).
 */
export type IsAsyncFactory<T> = T extends UnitDef
  ? IsAsyncFn<T[typeof unitSymbol]>
  : T extends AsyncFactoryUnitOptions
    ? IsAsyncFn<T>
    : false;

// it's unused, but keep it anyway
// type PlainDef<T> = {
//   [unitSymbol]: T;
//   opts: {
//     isPrivate?: boolean;
//     isBound?: false;
//     isFactory?: false;
//     isAsync?: false;
//   };
// };

type BoundDef<T extends Func> = {
  [unitSymbol]: T;
  opts: {
    isPrivate?: boolean;
    isBound: true;
    isFactory?: false;
    isAsync?: false;
  };
};

type FactoryDef<T extends Func> = {
  [unitSymbol]: T;
  opts: {
    isPrivate?: boolean;
    isBound?: false;
    isFactory: true;
    isAsync?: false;
  };
};

type AsyncFactoryDef<F extends AsyncFunc> = {
  [unitSymbol]: F;
  opts: {
    isPrivate?: boolean;
    isBound?: false;
    isFactory: true;
    isAsync: true;
  };
};

export function isBoundDef(def: unknown): def is BoundDef<Func> {
  if (!isUnitDef(def)) return false;

  const unit = def[unitSymbol];
  if (!isFunction(unit)) {
    return false;
  }

  return (
    "isBound" in def.opts &&
    typeof def.opts.isBound === "boolean" &&
    def.opts.isBound === true
  );
}

export function isFactoryDef(def: unknown): def is FactoryDef<Func> {
  if (!isUnitDef(def)) return false;

  const unit = def[unitSymbol];
  if (!isFunction(unit)) {
    return false;
  }

  return "isFactory" in def.opts && def.opts.isFactory === true;
}

export function isAsyncFactoryDef(
  def: unknown,
): def is AsyncFactoryDef<AsyncFunc> {
  if (!isUnitDef(def)) return false;

  const unit = def[unitSymbol];
  if (!isFunction(unit)) {
    return false;
  }

  return (
    "isFactory" in def.opts &&
    def.opts.isFactory === true &&
    "isAsync" in def.opts &&
    def.opts.isAsync === true
  );
}

export interface UnitDef {
  [unitSymbol]: unknown;
  opts: UnitOptions;
}

export interface PlainUnitOptions {
  isPrivate?: boolean;
  isBound?: false;
  isFactory?: false;
  isAsync?: false;
}

export interface BoundUnitOptions {
  isPrivate?: boolean;
  isBound: true;
  isFactory?: false;
  isAsync?: false;
}

export interface FactoryUnitOptions {
  isPrivate?: boolean;
  isBound?: false;
  isFactory: true;
  isAsync?: false;
}

export interface AsyncFactoryUnitOptions {
  isPrivate?: boolean;
  isBound?: false;
  isFactory: true;
  isAsync: true;
}

type UnitOptions =
  | PlainUnitOptions
  | BoundUnitOptions
  | FactoryUnitOptions
  | AsyncFactoryUnitOptions;

type UnitDefinition<T, O extends UnitOptions> = {
  [unitSymbol]: T;
  opts: O;
};

export function defineUnit<const T, const O extends UnitOptions = {}>(
  def: T,
  options?: O,
): UnitDefinition<T, O> {
  const opts = options ?? ({} as UnitOptions);
  if (opts.isBound || opts.isFactory || opts.isAsync) {
    if (typeof def !== "function")
      throw new Error("Wrong unit definition value");
  }
  return { [unitSymbol]: def, opts } as UnitDefinition<T, O>;
}

export function isUnitDef(def: unknown): def is UnitDef {
  return typeof def === "object" && def !== null && unitSymbol in def;
}

/**
 * Infers the actual value type of a unit, resolving factories to their return types.
 */
export type InferUnitValue<D> = D extends UnitDef
  ? D["opts"] extends AsyncFactoryUnitOptions
    ? D[typeof unitSymbol] extends (...args: infer _A) => Promise<unknown>
      ? Awaited<ReturnType<D[typeof unitSymbol]>>
      : never
    : D["opts"] extends FactoryUnitOptions
      ? D[typeof unitSymbol] extends (...args: infer _A) => unknown
        ? ReturnType<D[typeof unitSymbol]>
        : never
      : D["opts"] extends BoundUnitOptions
        ? D[typeof unitSymbol] extends (...args: infer _A) => unknown
          ? OmitThisParameter<D[typeof unitSymbol]>
          : never
        : D["opts"] extends PlainUnitOptions
          ? D[typeof unitSymbol]
          : never
  : D extends AsyncFactoryUnitOptions
    ? D extends (...args: infer _A) => Promise<unknown>
      ? Awaited<ReturnType<D>>
      : never
    : D extends FactoryUnitOptions
      ? D extends (...args: infer _A) => unknown
        ? ReturnType<D>
        : never
      : D extends BoundUnitOptions
        ? D extends (...args: infer _A) => unknown
          ? OmitThisParameter<D>
          : never
        : D;
