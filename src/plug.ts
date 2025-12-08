import type { BulkCircuitDef } from "./circuit.ts";

export interface BulkPlugin {
  __isPlugin: true;
  __circuit: BulkCircuitDef;
  __connector: Record<string, string | Record<string, string>>;
}

type Plugin<
  C extends BulkCircuitDef,
  S extends Record<keyof C["__inputs"], string | Record<string, string>>,
> = {
  __isPlugin: true;
  __circuit: C;
  __connector: S;
};

export function plug<
  C extends BulkCircuitDef,
  S extends Record<keyof C["__inputs"], string | Record<string, string>>,
>(circuit: C, schema: boolean | S): Plugin<C, S> {
  return {
    __isPlugin: true,
    __circuit: circuit,
    __connector: typeof schema === "boolean" ? ({} as S) : schema,
  };
}

export function isPlugin(item: unknown): item is BulkPlugin {
  if (typeof item !== "object" || item === null) return false;
  if (
    !("__isPlugin" in item) ||
    !("__circuit" in item) ||
    !("__connector" in item)
  )
    return false;

  if (item.__isPlugin !== true) return false;

  if (typeof item.__circuit !== "object" || item.__circuit === null)
    return false;

  if (typeof item.__connector !== "object" || item.__connector === null)
    return false;

  return true;
}
