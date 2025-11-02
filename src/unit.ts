type Func = (...args: unknown[]) => unknown;
type AsyncFunc = (...args: unknown[]) => Promise<unknown>;

function isFunction(unit: unknown): unit is Func {
  return typeof unit === "function";
}

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
  is: "bound";
};

type FactoryFunc<F extends Func> = F & {
  isPrivate?: boolean;
  is: "factory";
};

type AsyncFactoryFunc<F extends AsyncFunc> = F & {
  isPrivate?: boolean;
  is: "asyncFactory";
};

export function isBoundFunc(unit: unknown): unit is BoundFunc<Func> {
  if (!isFunction(unit)) {
    return false;
  }
  return "is" in unit && unit.is === "bound";
}

export function isFactoryFunc(unit: unknown): unit is FactoryFunc<Func> {
  if (!isFunction(unit)) {
    return false;
  }
  return "is" in unit && unit.is === "factory";
}

export function isAsyncFactoryFunc(
  unit: unknown,
): unit is AsyncFactoryFunc<AsyncFunc> {
  if (!isFunction(unit)) {
    return false;
  }
  return "is" in unit && unit.is === "asyncFactory";
}

type IsAsyncFn<T> = T extends (...args: infer _A) => Promise<unknown>
  ? true
  : false;

/**
 * Type that checks if a factory is async (returns a Promise or is marked as async).
 */
export type IsAsyncFactory<T> = T extends UnitDef
  ? IsAsyncFn<T["__unit"]>
  : T extends AsyncFactoryUnitOptions
    ? IsAsyncFn<T>
    : false;

// it's unused, but keep it anyway
// type PlainDef<T> = {
//   __unit: T;
//   opts: {
//     isPrivate?: boolean;
//     is: undefined
//   };
// };

type BoundDef<T extends Func> = {
  __unit: T;
  opts: {
    isPrivate?: boolean;
    is: "bound";
  };
};

type FactoryDef<T extends Func> = {
  __unit: T;
  opts: {
    isPrivate?: boolean;
    is: "factory";
  };
};

type AsyncFactoryDef<F extends AsyncFunc> = {
  __unit: F;
  opts: {
    isPrivate?: boolean;
    is: "asyncFactory";
  };
};

export function isBoundDef(def: unknown): def is BoundDef<Func> {
  if (!isUnitDef(def)) return false;

  const unit = def["__unit"];
  if (!isFunction(unit)) {
    return false;
  }

  return def.opts.is === "bound";
}

export function isFactoryDef(def: unknown): def is FactoryDef<Func> {
  if (!isUnitDef(def)) return false;

  const unit = def.__unit;
  if (!isFunction(unit)) {
    return false;
  }

  return def.opts.is === "factory";
}

export function isAsyncFactoryDef(
  def: unknown,
): def is AsyncFactoryDef<AsyncFunc> {
  if (!isUnitDef(def)) return false;

  const unit = def.__unit;
  if (!isFunction(unit)) {
    return false;
  }

  return def.opts.is === "asyncFactory";
}

export interface UnitDef {
  __unit: unknown;
  opts: UnitOptions;
}

export interface PlainUnitOptions {
  isPrivate?: boolean;
  is?: "bound" | "factory" | "asyncFactory";
}

export interface BoundUnitOptions {
  isPrivate?: boolean;
  is: "bound";
}

export interface FactoryUnitOptions {
  isPrivate?: boolean;
  is: "factory";
}

export interface AsyncFactoryUnitOptions {
  isPrivate?: boolean;
  is: "asyncFactory";
}

type UnitOptions =
  | PlainUnitOptions
  | BoundUnitOptions
  | FactoryUnitOptions
  | AsyncFactoryUnitOptions;

type UnitDefinition<T, O extends UnitOptions> = {
  __unit: T;
  opts: O;
};

/**
 * Creates a unit definition with specific behavior options for dependency injection.
 *
 * Units are the smallest building blocks of your application. They can hold any value
 * and are resolved lazily (on demand) and cached. This function allows you to configure
 * how units behave within the dependency injection system.
 *
 * @template T - The unit value type
 * @template O - The unit options type extending UnitOptions
 * @param def - The unit value (can be any type, but functions have special behavior)
 * @param options - Configuration object controlling unit behavior
 * @param options.isPrivate - Makes unit accessible only within the same block (default: false)
 * @param options.is - 'bound': Binds function to the wire (this = wire)\
 *    'factory': Calls function with wire as parameter.\
 *    'asyncFactory': For async factory functions
 * @returns Unit definition object with specified behavior
 *
 * @example Plain unit (default behavior)
 * ```typescript
 * export const config = defineUnit({ port: 3000, dbUrl: "localhost" });
 * // or simply: export const config = { port: 3000, dbUrl: "localhost" };
 * ```
 *
 * @example Factory unit - lazy initialization with dependencies
 * ```typescript
 * export const userService = defineUnit(
 *   (wire) => new UserService(wire().database, wire().logger),
 *   { is: 'factory' }
 * );
 * ```
 *
 * @example Bound unit - function with wire as 'this'
 * ```typescript
 * export const getUsers = defineUnit(
 *   function(this: Wire) {
 *     return this().database.users.findAll();
 *   },
 *   { is: 'bound' }
 * );
 * ```
 *
 * @example Async factory unit - for async initialization
 * ```typescript
 * export const dbConnection = defineUnit(
 *   async (wire) => {
 *     const config = wire().config;
 *     return await connectToDatabase(config.dbUrl);
 *   },
 *   { is: 'asyncFactory' }
 * );
 * ```
 *
 * @example Private unit - only accessible within same block
 * ```typescript
 * export const internalHelper = defineUnit(
 *   () => ({ format: (str: string) => str.toUpperCase() }),
 *   { isPrivate: true, is: 'factory' }
 * );
 * ```
 *
 * @example Alternative syntax without helper
 * ```typescript
 * export function getUsers(this: Wire) {
 *   return this().database.users.findAll();
 * }
 * getUsers.is = 'bound' as const;
 * ```
 *
 * @throws {Error} When is equals 'bound', 'factory', or 'asyncFactory' but def is not a function
 *
 * @public
 * @since 1.0.0
 */
export function defineUnit<const T, const O extends UnitOptions = UnitOptions>(
  def: T,
  options?: O,
): UnitDefinition<T, O> {
  const opts = options ?? ({} as UnitOptions);
  if (
    opts.is === "bound" ||
    opts.is === "factory" ||
    opts.is === "asyncFactory"
  ) {
    if (typeof def !== "function")
      throw new Error("Wrong unit definition value");
  }
  return { __unit: def, opts } as UnitDefinition<T, O>;
}

export function isUnitDef(def: unknown): def is UnitDef {
  return typeof def === "object" && def !== null && "__unit" in def;
}

/**
 * Infers the actual value type of a unit, resolving factories to their return types.
 */
export type InferUnitValue<D> = D extends UnitDef
  ? D["opts"] extends AsyncFactoryUnitOptions
    ? D["__unit"] extends (...args: infer _A) => Promise<unknown>
      ? Awaited<ReturnType<D["__unit"]>>
      : never
    : D["opts"] extends FactoryUnitOptions
      ? D["__unit"] extends (...args: infer _A) => unknown
        ? ReturnType<D["__unit"]>
        : never
      : D["opts"] extends BoundUnitOptions
        ? D["__unit"] extends (...args: infer _A) => unknown
          ? OmitThisParameter<D["__unit"]>
          : never
        : D["opts"] extends PlainUnitOptions
          ? D["__unit"]
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
