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

/**
 * Factory function interface. Factories are functions that return configured instances.
 * They're called once and their result is cached.
 */
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

/**
 * Type that checks if a factory is async (returns a Promise or is marked as async).
 */
export type IsAsyncFactory<T> =
  true extends IsAsyncFactoryFunc<T>
    ? true
    : true extends IsAsyncFactoryDef<T>
      ? true
      : false;

type IsAsyncFactoryFunc<T> = T extends AsyncFunc
  ? T extends AsyncFactoryUnitOptions
    ? true
    : false
  : false;

type IsAsyncFactoryDef<T> = T extends UnitDef
  ? T["opts"] extends AsyncFactoryUnitOptions
    ? true
    : false
  : false;

type PlainDef<T, P extends boolean> = {
  [unitSymbol]: T;
  opts: {
    isPrivate?: P;
    isBound?: false;
    isFactory?: false;
    isAsync?: false;
  };
};

type BoundDef<T extends Func, P extends boolean> = {
  [unitSymbol]: T;
  opts: {
    isPrivate?: P;
    isBound: true;
    isFactory?: false;
    isAsync?: false;
  };
};

type FactoryDef<T extends Func, P extends boolean> = {
  [unitSymbol]: T;
  opts: {
    isPrivate?: P;
    isBound?: false;
    isFactory: true;
    isAsync?: false;
  };
};

type AsyncFactoryDef<F extends AsyncFunc, P extends boolean> = {
  [unitSymbol]: F;
  opts: {
    isPrivate?: P;
    isBound?: false;
    isFactory: true;
    isAsync: true;
  };
};

export function isBoundDef(def: unknown): def is BoundDef<Func, boolean> {
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

export function isFactoryDef(def: unknown): def is FactoryDef<Func, boolean> {
  if (!isUnitDef(def)) return false;

  const unit = def[unitSymbol];
  if (!isFunction(unit)) {
    return false;
  }

  return "isFactory" in def.opts && def.opts.isFactory === true;
}

export function isAsyncFactoryDef(
  def: unknown,
): def is AsyncFactoryDef<AsyncFunc, boolean> {
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

interface UnitDef {
  [unitSymbol]: unknown;
  opts: UnitOptions;
}

interface PlainUnitOptions {
  isPrivate?: boolean;
  isBound?: false;
  isFactory?: false;
  isAsync?: false;
}

interface BoundUnitOptions {
  isPrivate?: boolean;
  isBound: true;
  isFactory?: false;
  isAsync?: false;
}

interface FactoryUnitOptions {
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

export function defineUnit<const T, const O extends UnitOptions>(
  def: T,
  opts = {} as O,
): UnitDefinition<T, O> {
  if (opts.isBound || opts.isFactory || opts.isAsync) {
    if (typeof def !== "function")
      throw new Error("Wrong unit definition value");
  }
  return { [unitSymbol]: def, opts };
}

export function isUnitDef(def: unknown): def is UnitDef {
  return typeof def === "object" && def !== null && unitSymbol in def;
}

/**
 * Infers the actual value type of a unit, resolving factories to their return types.
 */
export type InferUnitValue<D> =
  D extends AsyncFactoryDef<infer T, boolean>
    ? Awaited<ReturnType<T>>
    : D extends FactoryDef<infer T, boolean>
      ? ReturnType<T>
      : D extends BoundDef<infer T, boolean>
        ? OmitThisParameter<T>
        : D extends PlainDef<infer T, boolean>
          ? T
          : D extends AsyncFactoryFunc<Func>
            ? Awaited<ReturnType<D>>
            : D extends FactoryFunc<Func>
              ? ReturnType<D>
              : D extends BoundFunc<Func>
                ? OmitThisParameter<D>
                : D extends Func
                  ? OmitThisParameter<D>
                  : D;

/**
 * Like InferUnitValue but excludes private units from the type.
 */
export type InferPublicUnitValue<Def> = Def extends PrivateUnitFunc
  ? never
  : Def extends UnitDefinition<unknown, { isPrivate: true }>
    ? never
    : InferUnitValue<Def>;
