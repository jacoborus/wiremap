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
  S extends Record<keyof C["__inputs"], string>,
>(circuit: C, schema: S): Plugin<C, S> {
  return {
    __isPlugin: true,
    __circuit: circuit,
    __connector: schema,
  };
}
