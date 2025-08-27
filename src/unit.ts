import { unitSymbol, isFunction, isPromise, type Func } from "./common.ts";

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
  if (isFunction(unit) || isPromise(unit)) {
    return "isPrivate" in unit && unit.isPrivate === true;
  }
  if (isUnitDef(unit)) {
    return !!unit.opts.isPrivate;
  }
  return false;
}

type BoundFunc<T> = {
  (...args: unknown[]): T;
  isPrivate?: boolean;
  isBound: true;
  isFactory?: false;
  isAsync?: false;
};

export function isBoundFunc<T>(unit: unknown): unit is BoundFunc<T> {
  if (!isFunction(unit)) {
    return false;
  }
  return "isBound" in unit && unit.isBound === true;
}

/**
 * Factory function interface. Factories are functions that return configured instances.
 * They're called once and their result is cached.
 */
type FactoryFunc<T> = {
  (...args: unknown[]): T;
  isPrivate?: boolean;
  isBound?: false;
  isFactory: true;
  isAsync?: false;
};

export function isFactoryFunc<T>(unit: unknown): unit is FactoryFunc<T> {
  if (!isFunction(unit) && !isPromise(unit)) {
    return false;
  }
  return "isFactory" in unit && unit.isFactory === true;
}

type AsyncFactoryFunc<T> = {
  (...args: unknown[]): Promise<T>;
  isPrivate?: boolean;
  isBound?: false;
  isFactory: true;
  isAsync: true;
};

export function isAsyncFactoryFunc<T>(
  unit: unknown,
): unit is AsyncFactoryFunc<T> {
  if (!isFunction(unit) && !isPromise(unit)) {
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
  T extends AsyncFactoryFunc<unknown>
    ? true
    : T extends AsyncFactoryDef<unknown, boolean>
      ? true
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

type BoundDef<T, P extends boolean> = {
  [unitSymbol]: T;
  opts: {
    isPrivate?: P;
    isBound: true;
    isFactory?: false;
    isAsync?: false;
  };
};

export function isBoundDef<T extends Func>(
  def: unknown,
): def is BoundDef<T, boolean> {
  if (!isUnitDef(def)) return false;
  const unit = def[unitSymbol];
  if (!isFunction(unit)) {
    return false;
  }
  return "isBound" in def && def.isBound === true;
}

type FactoryDef<T extends Func, P extends boolean> = {
  [unitSymbol]: T;
  opts: {
    isPrivate?: P;
    isBound?: false;
    isFactory: true;
    isAsync?: false;
  };
};

export type AsyncFactoryDef<T, P extends boolean> = {
  [unitSymbol]: Promise<T>;
  opts: {
    isPrivate?: P;
    isBound?: false;
    isFactory: true;
    isAsync: true;
  };
};

export function isFactoryDef<T extends Func>(
  def: unknown,
): def is FactoryDef<T, boolean> {
  if (!isUnitDef(def)) return false;
  const unit = def[unitSymbol];
  if (!isFunction(unit)) {
    return false;
  }
  return "isFactory" in def && def.isFactory === true;
}

export function isAsyncFactoryDef<T>(
  def: unknown,
): def is AsyncFactoryDef<T, boolean> {
  if (!isUnitDef(def)) return false;
  const unit = def[unitSymbol];
  if (!isFunction(unit) && !isPromise(unit)) {
    return false;
  }
  return (
    "isFactory" in def &&
    def.isFactory === true &&
    "isAsync" in def &&
    def.isAsync === true
  );
}

export interface UnitDef {
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
  isBound?: false;
  isFactory?: false;
  isAsync?: false;
}

interface FactoryUnitOptions {
  isPrivate?: boolean;
  isBound?: false;
  isFactory: true;
  isAsync?: false;
}

interface AsyncFactoryUnitOptions {
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

type UnitDefinition<
  T,
  O extends UnitOptions,
> = O extends AsyncFactoryUnitOptions
  ? AsyncFactoryDef<
      () => Promise<T>,
      O["isPrivate"] extends true ? true : false
    >
  : O extends FactoryUnitOptions
    ? FactoryDef<() => T, O["isPrivate"] extends true ? true : false>
    : O extends BoundUnitOptions
      ? BoundDef<T, O["isPrivate"] extends true ? true : false>
      : O extends PlainUnitOptions
        ? PlainDef<T, O["isPrivate"] extends true ? true : false>
        : never;

export function defineUnit<const T, const O extends PlainUnitOptions>(
  def: T,
  opts?: O,
): PlainDef<T, O["isPrivate"] extends true ? true : false>;

export function defineUnit<const T, const O extends BoundUnitOptions>(
  def: T,
  opts: O,
): BoundDef<T, O["isPrivate"] extends true ? true : false>;

export function defineUnit<
  const T extends Func,
  const O extends FactoryUnitOptions,
>(
  def: (...args: unknown[]) => T,
  opts: O,
): FactoryDef<T, O["isPrivate"] extends true ? true : false>;

export function defineUnit<const T, const O extends AsyncFactoryUnitOptions>(
  def: (...args: unknown[]) => Promise<T>,
  opts: O,
): AsyncFactoryDef<T, O["isPrivate"] extends true ? true : false>;

export function defineUnit<const T, const O extends UnitOptions>(
  def: T | ((...args: unknown[]) => T) | ((...args: unknown[]) => Promise<T>),
  opts = {} as O,
): UnitDefinition<T, O> {
  return { [unitSymbol]: def, opts } as UnitDefinition<T, O>;
}

export function isUnitDef(def: unknown): def is UnitDef {
  return typeof def === "object" && def !== null && unitSymbol in def;
}

/**
 * Infers the actual value type of a unit, resolving factories to their return types.
 */
export type InferUnitValue<D> =
  D extends AsyncFactoryDef<infer T, boolean>
    ? T
    : D extends FactoryDef<infer T, boolean>
      ? T
      : D extends BoundDef<infer T, boolean>
        ? T
        : D extends PlainDef<infer T, boolean>
          ? T
          : D extends AsyncFactoryFunc<infer T>
            ? T
            : D extends FactoryFunc<infer T>
              ? T
              : D extends BoundFunc<infer T>
                ? T
                : D;

/**
 * Like InferUnitValue but excludes private units from the type.
 */
export type InferPublicUnitValue<Def> = Def extends PrivateUnitFunc
  ? never
  : Def extends UnitDefinition<unknown, { isPrivate: true }>
    ? never
    : InferUnitValue<Def>;
